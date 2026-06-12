"""
Views for Certificates app.
"""
import os
from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from events.models import Event, EventRegistration
from certificates.models import Certificate
from .serializers import CertificateSerializer, CertificateListSerializer, CertificateDetailSerializer
from .generator import generate_certificate, CertificateGenerator
from crosscert.rate_limit import drf_rate_limit
from crosscert.logging_utils import log_certificate_action, timed_operation


class CertificateViewSet(viewsets.ModelViewSet):
    """ViewSet for Certificate management."""
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use list serializer for list actions to exclude base64."""
        if self.action == 'list' or self.action == 'my_certificates' or self.action == 'event_certificates':
            return CertificateListSerializer
        return CertificateDetailSerializer

    def get_queryset(self):
        """Filter certificates based on user role."""
        user = self.request.user
        if user.is_staff:
            return Certificate.objects.select_related(
                'registration', 
                'registration__event',
                'registration__event__organizer'
            ).all()
        # For regular users, only show their own certificates
        return Certificate.objects.select_related(
            'registration',
            'registration__event'
        ).filter(registration__email__iexact=user.email)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_certificates(self, request):
        """Get all certificates for the authenticated user."""
        try:
            print(f"DEBUG: my_certificates requested by {request.user} (email: {request.user.email})")
            certificates = Certificate.objects.select_related(
                'registration',
                'registration__event'
            ).filter(
                registration__email__iexact=request.user.email
            ).order_by('-created_at')
            
            print(f"DEBUG: Found {certificates.count()} certificates for {request.user.email}")
            
            serializer = CertificateListSerializer(certificates, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: Error in my_certificates: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e), 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def event_certificates(self, request):
        """Get all certificates grouped by event (admin only)."""
        event_id = request.query_params.get('event_id')
        
        queryset = Certificate.objects.select_related(
            'registration',
            'registration__event',
            'registration__event__organizer'
        )
        
        if event_id:
            queryset = queryset.filter(registration__event_id=event_id)
        
        queryset = queryset.order_by('-created_at')
        serializer = CertificateListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def download(self, request, pk=None):
        """Download certificate with full base64 data."""
        certificate = self.get_object()
        serializer = CertificateDetailSerializer(certificate)
        return Response(serializer.data)

    @drf_rate_limit('cert_preview', limit=30, window_seconds=3600)
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='preview-sample')
    def preview_sample(self, request):
        """Generate a sample certificate PDF from mapping settings (no event required)."""
        template_image = request.data.get('certificate_template_image')
        if not template_image:
            return Response(
                {'error': 'certificate_template_image is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        coordinates = request.data.get('certificate_coordinates') or {}
        font_styles = request.data.get('certificate_font_styles') or {}
        sample_text = request.data.get('certificate_sample_text') or {}

        participant_data = {
            'name': sample_text.get('name', 'Juan Dela Cruz'),
        }
        event_data = {
            'title': sample_text.get('event_title', 'Sample Event Title'),
            'date': sample_text.get('date', 'January 01, 2025'),
        }

        try:
            generator = CertificateGenerator()
            pdf_base64 = generator.generate_certificate(
                participant_data=participant_data,
                event_data=event_data,
                template_image=template_image,
                coordinates=coordinates,
                font_styles=font_styles,
                sample_text=sample_text,
                return_base64=True,
            )
            log_certificate_action(
                'preview_sample',
                user_id=request.user.pk,
                success=True,
            )
            return Response({'pdf_base64': pdf_base64})
        except Exception as exc:
            log_certificate_action(
                'preview_sample',
                user_id=request.user.pk,
                success=False,
                error=str(exc),
            )
            return Response(
                {'error': f'Failed to generate certificate sample: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @drf_rate_limit('cert_generate', limit=10, window_seconds=3600)
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_certificate(self, request, pk=None):
        """Generate a certificate for a registration."""
        registration = get_object_or_404(EventRegistration, pk=pk, is_present=True)
        
        # Check if certificate already exists
        if hasattr(registration, 'certificate'):
            return Response(
                {'error': 'Certificate already exists for this registration'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate certificate file
            certificate_path = generate_certificate(registration)
            
            # Create certificate record
            certificate = EventCertificate.objects.create(
                registration=registration,
                certificate_file=certificate_path
            )
            
            serializer = self.get_serializer(certificate)
            log_certificate_action(
                'generate_single',
                user_id=request.user.pk,
                event_id=registration.event_id,
                success=True,
                extra={'registration_id': registration.pk},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            log_certificate_action(
                'generate_single',
                user_id=request.user.pk,
                event_id=registration.event_id,
                success=False,
                error=str(e),
                extra={'registration_id': registration.pk},
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def send_email(self, request, pk=None):
        """Send certificate via email."""
        certificate = self.get_object()
        try:
            if certificate.send_certificate_email():
                return Response(
                    {'status': 'Email sent successfully'},
                    status=status.HTTP_200_OK
                )
            return Response(
                {'error': 'Failed to send email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @drf_rate_limit('cert_bulk_generate', limit=5, window_seconds=3600)
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_generate(self, request):
        """Generate certificates for all eligible participants of an event."""
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'error': 'event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        event = get_object_or_404(Event, pk=event_id)
        registrations = event.registrations.filter(
            is_present=True,
            is_eligible_for_certificate=True
        )
        
        generated = 0
        errors = []
        
        for registration in registrations:
            if not hasattr(registration, 'certificate'):
                try:
                    certificate_path = generate_certificate(registration)
                    EventCertificate.objects.create(
                        registration=registration,
                        certificate_file=certificate_path
                    )
                    generated += 1
                except Exception as e:
                    errors.append(f"Failed to generate certificate for {registration.email}: {str(e)}")
        
        log_certificate_action(
            'bulk_generate',
            user_id=request.user.pk,
            event_id=event_id,
            success=len(errors) == 0,
            error='; '.join(errors[:3]) if errors else None,
            extra={'generated': generated, 'error_count': len(errors)},
        )
        return Response({
            'generated': generated,
            'errors': errors
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_send_emails(self, request):
        """Send certificates via email to all participants of an event."""
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'error': 'event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        event = get_object_or_404(Event, pk=event_id)
        certificates = EventCertificate.objects.filter(registration__event=event)
        
        sent = 0
        errors = []
        
        for certificate in certificates:
            try:
                if not certificate.is_emailed:
                    if certificate.send_certificate_email():
                        sent += 1
            except Exception as e:
                errors.append(f"Failed to send email to {certificate.registration.email}: {str(e)}")
        
        return Response({
            'sent': sent,
            'errors': errors
        }, status=status.HTTP_200_OK)


class QRCodeViewSet(viewsets.ViewSet):
    """ViewSet for QR code scanning and validation."""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Scan and validate a QR code."""
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response(
                {'error': 'QR code value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            return Response({
                'valid': True,
                'registration_id': registration.id,
                'name': registration.full_name,
                'event': registration.event.title,
                'is_present': registration.is_present
            })
        except EventRegistration.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Invalid QR code'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def mark_present(self, request):
        """Mark a participant as present using QR code."""
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response(
                {'error': 'QR code value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            if registration.is_present:
                return Response({
                    'message': 'Participant is already marked as present',
                    'registration_id': registration.id,
                    'name': registration.full_name
                })
                
            registration.mark_as_present()
            return Response({
                'message': 'Participant marked as present',
                'registration_id': registration.id,
                'name': registration.full_name
            })
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Invalid QR code'},
                status=status.HTTP_404_NOT_FOUND
            )
