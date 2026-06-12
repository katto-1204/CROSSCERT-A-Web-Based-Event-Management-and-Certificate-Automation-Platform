"""
Views for Event app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db.models import Count, Q
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import CreateView, UpdateView, ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from .models import Event, EventRegistration, CheckIn, Certificate, Notification
from .serializers import EventSerializer, EventRegistrationSerializer, CheckInSerializer, NotificationSerializer

from .forms import EventForm
from django.contrib import messages
from crosscert.email_utils import (
    send_registration_confirmation,
    send_attendance_confirmation,
    send_post_event_evaluation_email,
    send_event_created_notification,
)
import uuid

from crosscert.rate_limit import drf_rate_limit
from crosscert.cache_utils import (
    event_list_key,
    event_detail_key,
    get_cached,
    set_cached,
    invalidate_event_caches,
    EVENT_LIST_TTL,
    EVENT_DETAIL_TTL,
)
from crosscert.logging_utils import logger


def _build_registration_code(registration: EventRegistration) -> str:
    """
    Build a per-participant code that encodes the event prefix and
    the participant's registration ID so each user has their own ID.
    Example: CBC-000123
    """
    event = registration.event
    prefix = event.generate_code_prefix()
    return f"{prefix}-{registration.id:06d}"


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for Event CRUD operations."""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    
    def get_permissions(self):
        """
        Allow public read access (list, retrieve) for public events.
        Require authentication for write operations (create, update, delete).
        """
        if self.action in ['list', 'retrieve']:
            # Public can view events
            return []
        # All other actions require authentication
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Return all events for authenticated users.
        Return only public events for anonymous users.
        """
        queryset = Event.objects.select_related('organizer').annotate(
            registration_count_annotated=Count('registrations'),
            attended_count_annotated=Count('registrations', filter=Q(registrations__is_present=True))
        )

        if self.request.user.is_authenticated:
            return queryset
        # Anonymous users can only see public events
        return queryset.filter(is_public=True)

    def list(self, request, *args, **kwargs):
        """List events with Redis/in-memory cache for public catalog."""
        cache_key = event_list_key(
            is_authenticated=request.user.is_authenticated,
            query_string=request.META.get('QUERY_STRING', ''),
        )
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            set_cached(cache_key, response.data, EVENT_LIST_TTL)
        return response

    def retrieve(self, request, *args, **kwargs):
        """Retrieve single event — caches template + public info."""
        pk = kwargs.get('pk')
        cache_key = event_detail_key(pk)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            set_cached(cache_key, response.data, EVENT_DETAIL_TTL)
        return response

    @drf_rate_limit('events_create', limit=20, window_seconds=3600)
    def create(self, request, *args, **kwargs):
        """Create an event."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        invalidate_event_caches()
        headers = self.get_success_headers(serializer.data)
        logger.info('Event created', extra={'crosscert': {'event_id': serializer.data.get('id'), 'user_id': request.user.pk}})
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        event = serializer.save()
        invalidate_event_caches(event.id)

    def perform_destroy(self, instance):
        event_id = instance.id
        instance.delete()
        invalidate_event_caches(event_id)

    def perform_create(self, serializer):
        """Attach organizer and bootstrap event QR metadata."""
        user_model = get_user_model()
        organizer = self.request.user if self.request.user.is_authenticated else user_model.objects.first()
        event = serializer.save(organizer=organizer)

        event.generate_code_prefix()
        registration_url = event.build_registration_link()
        event.registration_url = registration_url
        # Event QR code image generation moved to frontend
        # Frontend can generate QR code from registration_url if needed
        event.event_qr_code = ""  # Empty - frontend will generate if needed
        event.save(update_fields=['code_prefix', 'registration_url', 'event_qr_code'])

        # Notify organizer that event has been created
        organizer_email = getattr(organizer, "email", None)
        send_event_created_notification(
            event_title=event.title,
            event_date=str(event.date),
            organizer_email=organizer_email,
        )

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all registrations for an event."""
        event = self.get_object()
        registrations = event.registrations.all()
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def conclude(self, request, pk=None):
        """Conclude an event - change status to 'completed'."""
        event = self.get_object()
        
        # Only allow staff/admin to conclude events
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can conclude events.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.status = 'completed'
        event.save(update_fields=['status'])
        invalidate_event_caches(event.id)
        
        serializer = self.get_serializer(event)
        return Response({
            'message': 'Event concluded successfully.',
            'event': serializer.data
        }, status=status.HTTP_200_OK)


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for Event Registration management."""
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer

    def get_queryset(self):
        """Filter registrations by email and event if provided in query params."""
        queryset = EventRegistration.objects.all()
        
        # Filter by email if provided
        email = self.request.query_params.get('email', None)
        if email:
            queryset = queryset.filter(email=email)
        
        # Filter by event if provided
        event_id = self.request.query_params.get('event', None)
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Register a participant for an event."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registration = serializer.save()
        # Ensure the registration has a primary key before building the code
        registration.refresh_from_db()
        code_value = _build_registration_code(registration)
        registration.qr_code_value = code_value
        # QR code image is now generated on the frontend from qr_code_value
        # No need to store base64 image in database
        registration.qr_code = ""  # Empty - frontend will generate
        registration.barcode_image = ""  # Empty - not used
        
        registration.save(update_fields=['qr_code_value', 'qr_code', 'barcode_image'])

        # Send registration confirmation email
        event = registration.event
        event_time = f"{event.start_time.strftime('%I:%M %p')} - {event.end_time.strftime('%I:%M %p')}"
        participant_name = f"{registration.first_name} {registration.last_name}".strip()
        send_registration_confirmation(
            participant_name=participant_name or "Participant",
            event_title=event.title,
            event_date=event.date.strftime('%B %d, %Y'),
            event_time=event_time,
            venue=event.location,
            to_email=registration.email,
        )

        response_serializer = self.get_serializer(registration)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class EventCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    success_url = reverse_lazy('event-list')

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        form.instance.organizer = self.request.user
        response = super().form_valid(form)
        messages.success(self.request, 'Event created successfully!')
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_update'] = False
        return context


class EventUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    success_url = reverse_lazy('event-list')

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Event updated successfully!')
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_update'] = True
        return context


class EventListView(LoginRequiredMixin, ListView):
    model = Event
    template_name = 'events/event_list.html'
    context_object_name = 'events'
    paginate_by = 10

    def get_queryset(self):
        if self.request.user.is_staff:
            return Event.objects.all().order_by('-date', '-start_time')
        return Event.objects.filter(is_public=True).order_by('-date', '-start_time')


class EventDetailView(LoginRequiredMixin, DetailView):
    model = Event
    template_name = 'events/event_detail.html'
    context_object_name = 'event'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_participant'] = self.object.registrations.filter(
            email=self.request.user.email
        ).exists()
        return context


class CheckInViewSet(viewsets.ModelViewSet):
    """ViewSet for Check-In management."""
    queryset = CheckIn.objects.all()
    queryset = CheckIn.objects.all()
    serializer_class = CheckInSerializer

    def get_queryset(self):
        """Filter check-ins by event or registration if provided."""
        queryset = CheckIn.objects.select_related('registration', 'registration__event').all()
        
        # Filter by event ID (registration__event)
        event_id = self.request.query_params.get('registration__event', None)
        if event_id:
            queryset = queryset.filter(registration__event_id=event_id)
            
        # Filter by registration ID
        registration_id = self.request.query_params.get('registration', None)
        if registration_id:
            queryset = queryset.filter(registration_id=registration_id)
            
        return queryset

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Check in a participant using registration ID."""
        registration_id = request.data.get('registration_id')

        try:
            registration = EventRegistration.objects.get(id=registration_id)
            check_in, created = CheckIn.objects.get_or_create(registration=registration)
            
            if not created:
                return Response(
                    {'message': 'Already checked in'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(check_in)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Registration not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='check-in-by-code')
    def check_in_by_code(self, request):
        """Check in using the participant QR/barcode value (CBC-XXXXXX)."""
        code_value = request.data.get('code')
        if not code_value:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=code_value)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

        check_in, created = CheckIn.objects.get_or_create(registration=registration)
        # Keep EventRegistration.is_present in sync with CheckIn
        if not registration.is_present:
            registration.is_present = True
            registration.save(update_fields=['is_present'])

        if not created and check_in.check_out_at is None:
            serializer = self.get_serializer(check_in)
            data = serializer.data
            data['message'] = 'Already checked in'
            data['already_checked_in'] = True
            return Response(data, status=status.HTTP_200_OK)

        # Attendance confirmation email (first time only)
        if created:
            event = registration.event
            participant_name = f"{registration.first_name} {registration.last_name}".strip()
            send_attendance_confirmation(
                participant_name=participant_name or "Participant",
                event_title=event.title,
                event_date=event.date.strftime('%B %d, %Y'),
                venue=event.location,
                to_email=registration.email,
            )

        serializer = self.get_serializer(check_in)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='check-out-by-code')
    def check_out_by_code(self, request):
        """Check out a participant using the same QR/barcode value."""
        from django.utils import timezone

        code_value = request.data.get('code')
        if not code_value:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=code_value)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce that check-out is only allowed once the event is concluded/completed
        event = registration.event
        if (event.status or '').lower() != 'completed':
            return Response(
                {'error': 'Event must be concluded before participants can be checked out.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            check_in = CheckIn.objects.get(registration=registration)
        except CheckIn.DoesNotExist:
            return Response({'error': 'Participant has not checked in yet'}, status=status.HTTP_400_BAD_REQUEST)

        if check_in.check_out_at is not None:
            serializer = self.get_serializer(check_in)
            data = serializer.data
            data['message'] = 'Already checked out'
            data['already_checked_out'] = True
            return Response(data, status=status.HTTP_200_OK)

        check_in.check_out_at = timezone.now()
        check_in.save(update_fields=['check_out_at'])

        # Send post-event evaluation email with link
        event = registration.event
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
        eval_url = f"{frontend_base}/participant/event/{event.id}/evaluation"
        participant_name = f"{registration.first_name} {registration.last_name}".strip()
        send_post_event_evaluation_email(
            participant_name=participant_name or "Participant",
            event_title=event.title,
            evaluation_url=eval_url,
            to_email=registration.email,
        )

        serializer = self.get_serializer(check_in)
        return Response(serializer.data, status=status.HTTP_200_OK)
class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})
