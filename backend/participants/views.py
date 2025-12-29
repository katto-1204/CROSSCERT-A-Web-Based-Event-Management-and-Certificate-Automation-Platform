"""
Views for Participants app.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Evaluation, UserProfile
from .serializers import EvaluationSerializer, ParticipantSerializer
from events.models import CheckIn, Notification
from certificates.generator import CertificateService
from certificates.models import Certificate
from django.utils import timezone
import uuid


class ParticipantViewSet(viewsets.ViewSet):
    """ViewSet for Participant management."""
    
    def list(self, request):
        """
        List/search participants by email. Auth required.
        Returns minimal user info merged with profile.
        """
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
        email = request.query_params.get("email", "").strip()
        User = get_user_model()
        users = []
        if email:
            try:
                user = User.objects.get(email=email)
                users = [user]
            except User.DoesNotExist:
                users = []
        serializer = ParticipantSerializer(users, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """
        Get a single participant by user ID. Auth required.
        Returns minimal user info merged with profile.
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        User = get_user_model()
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ParticipantSerializer(user)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """
        PATCH a participant user and profile by user ID.
        Accepts first_name, last_name, birthday, department, program.
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        User = get_user_model()
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user.is_staff or request.user.is_superuser) and request.user.id != user.id:
            return Response({"detail": "You can only update your own profile"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ParticipantSerializer(instance=user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update(user, serializer.validated_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register a participant as a Django user.
        Enforces @hcdc.edu.ph emails.
        """
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        full_name = request.data.get('name', '').strip()
        department = request.data.get('department', '').strip()
        program = request.data.get('program', '').strip()

        if not email or not password or not full_name:
            return Response({'detail': 'Name, email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not email.endswith('@hcdc.edu.ph'):
            return Response({'detail': 'Only @hcdc.edu.ph emails are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'You are already registered with this email. Please sign in instead.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name, *rest = full_name.split(' ')
        last_name = ' '.join(rest)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Create user profile with department and program
        UserProfile.objects.create(
            user=user,
            department=department,
            program=program,
        )

        return Response({
            'id': user.id,
            'email': user.email,
            'name': user.get_full_name() or full_name,
            'department': department,
            'program': program,
        }, status=status.HTTP_201_CREATED)


class EvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet for Evaluation management."""
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer

    def perform_create(self, serializer):
        """
        Create an evaluation only if the participant has checked in AND checked out.
        Also ensure we don't create duplicate evaluations for the same registration.
        """
        registration = serializer.validated_data.get("registration")
        if not registration:
            raise ValidationError("Registration is required for evaluation.")

        # Prevent duplicate evaluations for the same registration
        if Evaluation.objects.filter(registration=registration).exists():
            raise ValidationError("You have already submitted an evaluation for this event.")

        # Require both check-in and check-out before accepting evaluation
        try:
            check_in = registration.check_in
        except CheckIn.DoesNotExist:
            raise ValidationError("You must check in and check out before submitting an evaluation.")

        if not check_in.check_out_at:
            raise ValidationError("You must check out before submitting an evaluation.")

        # All good – now save the evaluation
        evaluation = serializer.save()

        # Mark evaluation as complete on the registration
        registration.mark_evaluation_complete()

        # Auto-generate certificate if not already present
        certificate = None
        if not hasattr(registration, "certificate_record"):
            try:
                service = CertificateService()
                # Generate base64 PDF for now (no disk write required)
                pdf_base64 = service.generate_for_participant(
                    registration, registration.event, save_to_disk=False
                )
                cert_number = f"CERT-{registration.event.id}-{uuid.uuid4().hex[:8].upper()}"
                certificate = Certificate.objects.create(
                    registration=registration,
                    certificate_number=cert_number,
                    status="generated",
                    pdf_base64=pdf_base64,
                    issue_date=timezone.now().date(),
                )
            except Exception as e:
                # Log error but don't fail the evaluation submission
                print(f"[Evaluation] Error generating certificate: {e}")
        else:
            certificate = registration.certificate_record

        # Automatically send certificate email after evaluation submission
        if certificate:
            try:
                if certificate.send_certificate_email():
                    # Create notification for the user
                    user = registration.event.organizer # Fallback if user model not easily accessible, but we have registration.email
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    try:
                        participant_user = User.objects.get(email=registration.email)
                        Notification.objects.create(
                            user=participant_user,
                            title="Certificate Ready! 🎓",
                            message=f"Your certificate for {registration.event.title} is now available. You can view it in your email or download it from the Certificates tab.",
                            notification_type='certificate',
                            related_event=registration.event
                        )
                    except User.DoesNotExist:
                        pass
            except Exception as e:
                # Log error but don't fail the evaluation submission
                print(f"[Evaluation] Error sending certificate email: {e}")
