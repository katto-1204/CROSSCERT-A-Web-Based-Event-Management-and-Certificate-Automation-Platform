"""
Event models for CROSSCERT.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Q
import uuid
import os
from datetime import datetime
from django.core.mail import EmailMessage, send_mail
from markdownx.models import MarkdownxField
from certificates.validators import validate_landscape_certificate, validate_certificate_image_format


def default_certificate_coordinates():
    """Provide sane defaults so admins can preview overlays immediately."""
    # Centered on standard 2000×1414 premade templates
    return {
        'name': {'x': 1000, 'y': 720},
        'event_title': {'x': 900, 'y': 538},
        'date': {'x': 1230, 'y': 538},
    }


def default_certificate_sample_text():
    return {
        'name': 'Juan Dela Cruz',
        'event_title': 'Sample Event Title',
        'date': 'January 01, 2025',
    }


class Event(models.Model):
    """Event model for managing seminars and workshops."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]

    CATEGORY_CHOICES = [
        ('HCDC', 'HCDC Wide Event'),
        ('department', 'Department Event'),
        ('outside', 'Outside Event'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    capacity = models.IntegerField(default=50, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    speakers = models.JSONField(default=list, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Manila')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='HCDC')
    department = models.CharField(max_length=120, blank=True)
    semester = models.CharField(max_length=20, blank=True)
    school_year = models.CharField(max_length=20, blank=True)
    departmental_details = MarkdownxField(blank=True, null=True, help_text="Markdown supported for departmental events")
    theme = models.CharField(max_length=50, default='Professional Blue')
    cover_image = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    require_approval = models.BooleanField(default=False)
    is_paid_event = models.BooleanField(default=False)
    ticket_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    code_prefix = models.CharField(max_length=16, blank=True)
    registration_url = models.URLField(blank=True)
    event_qr_code = models.TextField(blank=True)
    certificate_template_image = models.TextField(
        blank=True,
        validators=[validate_landscape_certificate, validate_certificate_image_format],
        help_text="Upload a landscape-oriented certificate template (PNG, JPG, JPEG, GIF, BMP, or WEBP). Any size is supported."
    )
    certificate_coordinates = models.JSONField(default=default_certificate_coordinates, blank=True)
    certificate_sample_text = models.JSONField(default=default_certificate_sample_text, blank=True)
    certificate_font_styles = models.JSONField(default=dict, blank=True, help_text="Stores font sizes and colors for certificate text fields")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.title
        
    def get_certificate_template(self):
        """Return the URL of the certificate template if it exists."""
        if self.certificate_template_image:
            return self.certificate_template_image
        return None

    def can_issue_certificate(self):
        """Check if the event has all required certificate information."""
        return bool(self.certificate_template_image and self.certificate_coordinates)
        
    def get_status_badge(self):
        """Return the appropriate Bootstrap badge class for the event status."""
        status_classes = {
            'draft': 'secondary',
            'scheduled': 'info',
            'live': 'success',
            'completed': 'dark',
            'cancelled': 'danger',
        }
        return status_classes.get(self.status, 'secondary')

    def generate_code_prefix(self):
        """Generate the 3-letter prefix derived from the event title."""
        if self.code_prefix:
            return self.code_prefix

        parts = [word[0].upper() for word in self.title.split() if word]
        prefix = ''.join(parts[:3])
        prefix = (prefix + 'EVT')[:3] if len(prefix) < 3 else prefix[:3]
        self.code_prefix = prefix
        return self.code_prefix

    def build_registration_link(self):
        """Generate the canonical registration URL for QR linking."""
        base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
        slug = slugify(self.title) or uuid.uuid4().hex[:6]
        return f"{base_url}/event/{self.id or slug}"


class EventRegistration(models.Model):
    """Event registration model for participants."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    affiliation = models.CharField(max_length=100)
    registered_at = models.DateTimeField(auto_now_add=True)
    qr_code = models.TextField(blank=True)
    qr_code_value = models.CharField(max_length=64, unique=True, null=True, blank=True)
    barcode_image = models.TextField(blank=True)
    is_present = models.BooleanField(default=False)
    has_evaluated = models.BooleanField(default=False)
    is_eligible_for_certificate = models.BooleanField(default=False)

    class Meta:
        unique_together = ('event', 'email')

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.event.title}"
        
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
        
    def mark_as_present(self):
        """Mark participant as present and create a check-in record."""
        self.is_present = True
        self.save()
        CheckIn.objects.get_or_create(registration=self)
        return True
        
    def mark_evaluation_complete(self):
        """Mark that the participant has completed the evaluation."""
        self.has_evaluated = True
        self.is_eligible_for_certificate = True
        self.save()
        return True


class CheckIn(models.Model):
    """Check-in model for attendance tracking."""
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='check_in')
    checked_in_at = models.DateTimeField(auto_now_add=True)
    check_out_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.registration.first_name} - {self.registration.event.title}"


class Certificate(models.Model):
    """Certificate model for event participants."""
    registration = models.OneToOneField(
        'EventRegistration', 
        on_delete=models.CASCADE, 
        related_name='certificate'
    )
    certificate_file = models.FileField(
        upload_to='certificates/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'png', 'jpg', 'jpeg'])],
        help_text="Generated certificate file",
        max_length=500,
        null=True,
        blank=True
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    is_emailed = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-issued_at']
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'

    def __str__(self):
        return f"Certificate for {self.registration.full_name} - {self.registration.event.title}"
        
    def get_certificate_url(self):
        """Return the URL of the generated certificate file."""
        if self.certificate_file:
            return self.certificate_file.url
        return None

    def generate_certificate(self):
        """Generate the certificate using the event's template."""
        from .services import CertificateService
        
        if not self.registration.event.can_issue_certificate():
            raise ValueError("Event is not properly configured for certificate generation")
            
        service = CertificateService()
        return service.generate_certificate(
            registration=self.registration,
            template_url=self.registration.event.get_certificate_template(),
            coordinates=self.registration.event.certificate_coordinates
        )

    def send_certificate_email(self, request=None):
        """Send certificate via email to the participant."""
        if not self.certificate_file:
            return False
            
        subject = f"Your Certificate for {self.registration.event.title}"
        # Simple plain-text email with PDF attachment using Django's configured backend (Gmail SMTP)
        message = f"""
Dear {self.registration.full_name},

Congratulations! Your certificate for {self.registration.event.title} is ready.

Event Date: {self.registration.event.date}

Your certificate is attached as a PDF to this email. You can also access it in your CROSSCERT account.

Best regards,
CROSSCERT Team
        """.strip()
        
        try:
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'crosscert.dvo@gmail.com'),
                to=[self.registration.email],
            )
            # Attach the certificate file
            try:
                email.attach_file(self.certificate_file.path)
            except Exception as attach_err:
                print(f"Failed to attach certificate file: {attach_err}")

            email.send(fail_silently=False)
            self.is_emailed = True
            self.email_sent_at = datetime.now()
            self.save()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False


class Notification(models.Model):
    """Notification model for user alerts."""
    TYPE_CHOICES = [
        ('registration', 'Registration'),
        ('check_in', 'Check In'),
        ('check_out', 'Check Out'),
        ('certificate', 'Certificate'),
        ('general', 'General'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='general')
    related_event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"


# Signals for Auto-Notifications
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=EventRegistration)
def notify_on_registration(sender, instance, created, **kwargs):
    """Notify user on registration and evaluation."""
    if created:
        try:
            user = User.objects.get(email=instance.email)
            Notification.objects.create(
                user=user,
                title="Registration Confirmed",
                message=f"You have successfully registered for {instance.event.title}.",
                notification_type='registration',
                related_event=instance.event
            )
        except User.DoesNotExist:
            pass
    
    # Check for evaluation completion update
    if not created and instance.has_evaluated and instance.is_eligible_for_certificate:
        # Check if we noticed this change (using a simple check or just allow duplicate for now, 
        # ideally we should check if notification already exists but for simplicity we assume state change logic is handled elsewhere or user won't spam save)
        # To avoid duplicates, we can check date or recent. For now, simple create.
        # Actually signals fire on every save. We should check if field changed. 
        # But `post_save` doesn't give 'updated_fields' reliably unless specified in save().
        # We'll rely on the frontend flow calling specific endpoints or checking uniqueness.
        pass

@receiver(post_save, sender=CheckIn)
def notify_on_attendance(sender, instance, created, **kwargs):
    """Notify user on check-in and check-out."""
    try:
        user = User.objects.get(email=instance.registration.email)
        
        # Check-in
        if created:
            Notification.objects.create(
                user=user,
                title="Checked In",
                message=f"You have successfully checked in to {instance.registration.event.title}.",
                notification_type='check_in',
                related_event=instance.registration.event
            )
        
        # Check-out (update)
        if not created and instance.check_out_at:
            # Prevent duplicate check-out notifications if saved multiple times
            # Check if a check-out notification already exists for this check-in recently? 
            # Or just check if specific logic triggered it. 
            # For simplicity, we create it.
            # Ideally, limit duplication.
            exists = Notification.objects.filter(
                user=user, 
                notification_type='check_out', 
                related_event=instance.registration.event,
                created_at__date=datetime.now().date()
            ).exists()
            if not exists:
                Notification.objects.create(
                    user=user,
                    title="Checked Out",
                    message=f"You have checked out of {instance.registration.event.title}. Don't forget to evaluate!",
                    notification_type='check_out',
                    related_event=instance.registration.event
                )

    except User.DoesNotExist:
        pass

@receiver(post_save, sender=Certificate)
def notify_on_certificate(sender, instance, created, **kwargs):
    """Notify user when certificate is generated."""
    if created:
        try:
            user = User.objects.get(email=instance.registration.email)
            Notification.objects.create(
                user=user,
                title="Certificate Ready",
                message=f"Your certificate for {instance.registration.event.title} is now available.",
                notification_type='certificate',
                related_event=instance.registration.event
            )
        except User.DoesNotExist:
            pass


# Mapping for robust department matching
DEPARTMENT_MAPPING = {
    'CCJE': 'College of Criminal Justice Education',
    'CET': 'College of Engineering and Technology',
    'CHATME': 'College of Hospitality & Tourism Management',
    'HUSOCOM': 'College of Humanities, Social Sciences and Communication',
    'COME': 'College of Maritime Education',
    'SBME': 'School of Business & Management',
    'STE': 'School of Teacher Education',
}

def get_department_q_filters(department_name):
    """Build Q filters to match department by abbreviation or full name."""
    from django.db.models import Q
    
    # Reverse mapping for full names
    REVERSE_MAPPING = {v: k for k, v in DEPARTMENT_MAPPING.items()}
    
    dept_query = Q(department__iexact=department_name)
    
    # If name is an Abbr (e.g., CCJE), add Full Name filter
    if department_name in DEPARTMENT_MAPPING:
        dept_query |= Q(department__iexact=DEPARTMENT_MAPPING[department_name])
        
    # If name is a Full Name, add Abbr filter
    if department_name in REVERSE_MAPPING:
        dept_query |= Q(department__iexact=REVERSE_MAPPING[department_name])
        
    return dept_query

@receiver(post_save, sender=Event)
def notify_on_new_event(sender, instance, created, **kwargs):
    """Notify users when a new event is created/published."""
    # Trigger on creation if not draft
    if created and instance.status != 'draft':
        _send_event_notifications(instance)
        
    # Trigger on status change from draft to something else
    elif not created and hasattr(instance, '_old_status'):
        if instance._old_status == 'draft' and instance.status != 'draft':
            _send_event_notifications(instance)

    # Logic for Event Start (Status change to 'live')
    if hasattr(instance, '_old_status'):
        if instance._old_status != 'live' and instance.status == 'live':
             try:
                _send_event_started_notifications(instance)
             except Exception as e:
                print(f"[ERROR] Failed to send start notifications: {e}")


def _send_event_started_notifications(event):
    """Send notifications when event starts."""
    from participants.models import UserProfile
    
    users_to_notify = []
    
    if event.category == 'HCDC':
        profiles = UserProfile.objects.all()
        users_to_notify = [p.user for p in profiles]
        
    elif event.category == 'department' and event.department:
        dept_query = get_department_q_filters(event.department)
        profiles = UserProfile.objects.filter(dept_query)
        users_to_notify = [p.user for p in profiles]
    
    notifications = []
    for user in users_to_notify:
        notifications.append(Notification(
            user=user,
            title="Event Started! 🚀",
            message=f"Happening Now: {event.title} has started! You may now proceed to the venue or check in.",
            notification_type='general', 
            related_event=event
        ))
    
    if notifications:
        Notification.objects.bulk_create(notifications)


# Signal to track state change
from django.db.models.signals import pre_save

@receiver(pre_save, sender=Event)
def track_event_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


def _send_event_notifications(event):
    """Send notifications when a new event is published."""
    from participants.models import UserProfile
    
    users_to_notify = []
    
    if event.category == 'HCDC':
        # Notify ALL participants
        profiles = UserProfile.objects.all()
        users_to_notify = [p.user for p in profiles]
        
    elif event.category == 'department' and event.department:
        # Notify specific department (robust matching)
        dept_query = get_department_q_filters(event.department)
        profiles = UserProfile.objects.filter(dept_query)
        users_to_notify = [p.user for p in profiles]
    
    # Bulk create notifications
    notifications = []
    for user in users_to_notify:
        notifications.append(Notification(
            user=user,
            title="New Event Available",
            message=f"New event: {event.title} is now available for registration.",
            notification_type='general',
            related_event=event
        ))
    
    if notifications:
        Notification.objects.bulk_create(notifications)
