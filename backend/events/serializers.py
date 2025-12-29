"""
Serializers for Event app.
"""
from rest_framework import serializers
from .models import Event, EventRegistration, CheckIn, Notification


class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event model."""

    registration_count = serializers.SerializerMethodField()
    attended_count = serializers.SerializerMethodField()
    certificates_count = serializers.SerializerMethodField()
    organizer_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'date',
            'start_time',
            'end_time',
            'location',
            'capacity',
            'status',
            'speakers',
            'timezone',
            'category',
            'department',
            'semester',
            'school_year',
            'theme',
            'cover_image',
            'is_public',
            'require_approval',
            'is_paid_event',
            'ticket_price',
            'code_prefix',
            'registration_url',
            'event_qr_code',
            'certificate_template_image',
            'certificate_coordinates',
            'certificate_sample_text',
            'certificate_font_styles',
            'created_at',
            'updated_at',
            'registration_count',
            'attended_count',
            'certificates_count',
            'organizer_name',
        ]
        read_only_fields = [
            'code_prefix',
            'registration_url',
            'event_qr_code',
            'created_at',
            'updated_at',
        ]

    def get_registration_count(self, obj):
        return getattr(obj, 'registration_count_annotated', obj.registrations.count())

    def get_attended_count(self, obj):
        return getattr(obj, 'attended_count_annotated', obj.registrations.filter(is_present=True).count())

    def get_certificates_count(self, obj):
        # Count certificates related to this event's registrations
        from certificates.models import Certificate
        return Certificate.objects.filter(registration__event=obj, status='generated').count()

    def get_organizer_name(self, obj):
        return obj.organizer.get_full_name() or obj.organizer.username


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for EventRegistration model."""

    is_checked_out = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event',
            'email',
            'first_name',
            'last_name',
            'affiliation',
            'registered_at',
            'is_present',
            'has_evaluated',
            'is_checked_out',
            'qr_code',
            'qr_code_value',
            'barcode_image',
        ]
        read_only_fields = [
            'qr_code',
            'qr_code_value',
            'barcode_image',
            'registered_at',
            'is_present',
            'has_evaluated',
            'is_checked_out',
        ]

    def validate(self, data):
        """
        Check that the event is accepting registrations and user is not already registered.
        """
        event = data['event']
        email = data.get('email')

        # Check existing registration
        if EventRegistration.objects.filter(event=event, email=email).exists():
            raise serializers.ValidationError("You are already registered for this event.")

        if event.status == 'paused':
            raise serializers.ValidationError("Registration is currently paused for this event.")
        if event.status == 'draft':
            raise serializers.ValidationError("This event is not yet open for registration.")
        if event.status == 'completed':
            raise serializers.ValidationError("This event has already ended.")
        return data

    def get_is_checked_out(self, obj):
        """Return True if the participant has a check-in record with a check_out_at timestamp."""
        try:
            check_in = obj.check_in
            return bool(check_in.check_out_at)
        except CheckIn.DoesNotExist:
            return False


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for CheckIn model."""
    participant_name = serializers.SerializerMethodField()
    event_title = serializers.SerializerMethodField()

    class Meta:
        model = CheckIn
        fields = ['id', 'registration', 'checked_in_at', 'check_out_at', 'participant_name', 'event_title']

    def get_participant_name(self, obj):
        return f"{obj.registration.first_name} {obj.registration.last_name}"

    def get_event_title(self, obj):
        return obj.registration.event.title


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'related_event', 'is_read', 'created_at']
        read_only_fields = ['user', 'created_at']
