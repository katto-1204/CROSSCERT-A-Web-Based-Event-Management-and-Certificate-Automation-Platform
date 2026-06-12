"""
Views for Certificates app.
"""
import logging
import uuid as uuid_lib

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from events.models import Event, EventRegistration
from certificates.models import Certificate
from .serializers import CertificateSerializer, CertificateListSerializer, CertificateDetailSerializer
from .generator import generate_certificate, CertificateGenerator, CertificateService
from crosscert.rate_limit import drf_rate_limit
from crosscert.logging_utils import log_certificate_action

logger = logging.getLogger('crosscert.certificates')


class CertificateViewSet(viewsets.ModelViewSet):
    """ViewSet for Certificate management."""
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('list', 'my_certificates', 'event_certificates'):
            return CertificateListSerializer
        return CertificateDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Certificate.objects.select_related(
                'registration',
                'registration__event',
                'registration__event__organizer',
            ).all()
        return Certificate.objects.select_related(
            'registration',
            'registration__event',
        ).filter(registration__email__iexact=user.email)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_certificates(self, request):
        """Get all certificates for the authenticated user."""
        try:
            certificates = Certificate.objects.select_related(
                'registration',
                'registration__event',
            ).filter(
                registration__email__iexact=request.user.email,
            ).order_by('-created_at')
            serializer = CertificateListSerializer(certificates, many=True)
            return Response(serializer.data)
        except Exception as exc:
            logger.exception('my_certificates failed')
            return Response({'error': 'Unable to load certificates.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def event_certificates(self, request):
        event_id = request.query_params.get('event_id')
        queryset = Certificate.objects.select_related(
            'registration',
            'registration__event',
            'registration__event__organizer',
        )
        if event_id:
            queryset = queryset.filter(registration__event_id=event_id)
        serializer = CertificateListSerializer(queryset.order_by('-created_at'), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def download(self, request, pk=None):
        certificate = self.get_object()
        serializer = CertificateDetailSerializer(certificate)
        return Response(serializer.data)

    @drf_rate_limit('cert_preview', limit=30, window_seconds=3600)
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='preview-sample')
    def preview_sample(self, request):
        template_image = request.data.get('certificate_template_image')
        if not template_image:
            return Response({'error': 'certificate_template_image is required'}, status=status.HTTP_400_BAD_REQUEST)

        coordinates = request.data.get('certificate_coordinates') or {}
        font_styles = request.data.get('certificate_font_styles') or {}
        sample_text = request.data.get('certificate_sample_text') or {}

        try:
            generator = CertificateGenerator()
            pdf_base64 = generator.generate_certificate(
                participant_data={'name': sample_text.get('name', 'Juan Dela Cruz')},
                event_data={
                    'title': sample_text.get('event_title', 'Sample Event Title'),
                    'date': sample_text.get('date', 'January 01, 2025'),
                },
                template_image=template_image,
                coordinates=coordinates,
                font_styles=font_styles,
                sample_text=sample_text,
                return_base64=True,
            )
            log_certificate_action('preview_sample', user_id=request.user.pk, success=True)
            return Response({'pdf_base64': pdf_base64})
        except Exception as exc:
            log_certificate_action('preview_sample', user_id=request.user.pk, success=False, error=str(exc))
            return Response(
                {'error': f'Failed to generate certificate sample: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @drf_rate_limit('cert_generate', limit=10, window_seconds=3600)
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_certificate(self, request, pk=None):
        registration = get_object_or_404(EventRegistration, pk=pk, is_present=True)

        if hasattr(registration, 'certificate_record'):
            return Response(
                {'error': 'Certificate already exists for this registration'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            certificate = generate_certificate(registration)
            serializer = self.get_serializer(certificate)
            log_certificate_action(
                'generate_single',
                user_id=request.user.pk,
                event_id=registration.event_id,
                success=True,
                extra={'registration_id': registration.pk},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            log_certificate_action(
                'generate_single',
                user_id=request.user.pk,
                event_id=registration.event_id,
                success=False,
                error=str(exc),
                extra={'registration_id': registration.pk},
            )
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def send_email(self, request, pk=None):
        certificate = self.get_object()
        try:
            if certificate.send_certificate_email():
                return Response({'status': 'Email sent successfully'}, status=status.HTTP_200_OK)
            return Response({'error': 'Failed to send email'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @drf_rate_limit('cert_bulk_generate', limit=5, window_seconds=3600)
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_generate(self, request):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({'error': 'event_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        event = get_object_or_404(Event, pk=event_id)
        service = CertificateService()
        registrations = event.registrations.filter(is_present=True)

        generated = 0
        errors = []

        for registration in registrations:
            if hasattr(registration, 'certificate_record'):
                continue
            try:
                pdf_base64 = service.generate_for_participant(registration, event, save_to_disk=False)
                Certificate.objects.create(
                    registration=registration,
                    certificate_number=f"CERT-{event.id}-{uuid_lib.uuid4().hex[:8].upper()}",
                    pdf_base64=pdf_base64,
                    status='generated',
                    issue_date=timezone.now().date(),
                )
                generated += 1
            except Exception as exc:
                errors.append(f"{registration.email}: {exc}")

        log_certificate_action(
            'bulk_generate',
            user_id=request.user.pk,
            event_id=event_id,
            success=len(errors) == 0,
            error='; '.join(errors[:3]) if errors else None,
            extra={'generated': generated, 'error_count': len(errors)},
        )
        return Response({'generated': generated, 'errors': errors}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_send_emails(self, request):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({'error': 'event_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        certificates = Certificate.objects.filter(
            registration__event_id=event_id,
        ).select_related('registration')

        sent = 0
        errors = []

        for certificate in certificates:
            if certificate.status == 'sent':
                continue
            try:
                if certificate.send_certificate_email():
                    sent += 1
            except Exception as exc:
                errors.append(f"{certificate.registration.email}: {exc}")

        return Response({'sent': sent, 'errors': errors}, status=status.HTTP_200_OK)


class QRCodeViewSet(viewsets.ViewSet):
    """ViewSet for QR code scanning and validation."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def scan(self, request):
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response({'error': 'QR code value is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            return Response({
                'valid': True,
                'registration_id': registration.id,
                'name': registration.full_name,
                'event': registration.event.title,
                'is_present': registration.is_present,
            })
        except EventRegistration.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid QR code'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def mark_present(self, request):
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response({'error': 'QR code value is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            if registration.is_present:
                return Response({
                    'message': 'Participant is already marked as present',
                    'registration_id': registration.id,
                    'name': registration.full_name,
                })
            registration.mark_as_present()
            return Response({
                'message': 'Participant marked as present',
                'registration_id': registration.id,
                'name': registration.full_name,
            })
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Invalid QR code'}, status=status.HTTP_404_NOT_FOUND)
