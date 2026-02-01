"""
Authentication endpoints for frontend-backend integration.
"""
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from participants.models import UserProfile
import json
import random
import string
from datetime import datetime, timedelta
import hashlib

# In-memory storage for OTP tokens (for production, use database or cache like Redis)
# Structure: {email: {'otp': '123456', 'expires_at': datetime, 'verified': False, 'reset_token': str}}
_password_reset_tokens = {}


def generate_otp():
    """Generate a 6-digit OTP code."""
    return ''.join(random.choices(string.digits, k=6))


def generate_reset_token(email):
    """Generate a secure reset token."""
    random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    token_string = f"{email}{random_string}{datetime.now().isoformat()}"
    return hashlib.sha256(token_string.encode()).hexdigest()[:32]


def cleanup_expired_tokens():
    """Remove expired tokens from memory."""
    now = datetime.now()
    expired = [email for email, data in _password_reset_tokens.items() 
               if data['expires_at'] < now]
    for email in expired:
        del _password_reset_tokens[email]


@require_http_methods(["POST"])
@csrf_exempt
def forgot_password_endpoint(request):
    """
    Request password reset OTP.
    
    Expected JSON body:
    {
        "email": "user@example.com"
    }
    """
    try:
        cleanup_expired_tokens()
        
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        
        if not email:
            return JsonResponse({
                'success': False,
                'error': 'Email is required',
            }, status=400)
        
        # Check if user exists
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # For security, don't reveal if email exists
            # But we'll return success anyway
            return JsonResponse({
                'success': True,
                'message': 'If an account with that email exists, an OTP has been sent.',
            })
        
        # Generate OTP
        otp = generate_otp()
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Store the OTP
        _password_reset_tokens[email] = {
            'otp': otp,
            'expires_at': expires_at,
            'verified': False,
            'reset_token': None,
            'user_id': user.id,
        }
        
        # Send email with OTP
        try:
            subject = 'CROSSCERT - Password Reset Code'
            
            # Plain text fallback
            text_message = f"""Hello,

You have requested to reset your password for CROSSCERT.

Your OTP code is: {otp}

This code will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
CROSSCERT Team"""
            
            # HTML email template
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8B0000 0%, #dc2626 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                CROSSCERT
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                Password Reset Request
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Use the verification code below to complete the process:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%); border: 2px solid #fecaca; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                    Your Verification Code
                                </p>
                                <p style="margin: 0; color: #8B0000; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    {otp}
                                </p>
                            </div>
                            
                            <!-- Timer warning -->
                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    ⏱️ This code expires in <strong>10 minutes</strong>
                                </p>
                            </div>
                            
                            <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                                Need help? Contact us at <a href="mailto:crosscert.dvo@gmail.com" style="color: #8B0000; text-decoration: none;">crosscert.dvo@gmail.com</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                © 2026 CROSSCERT - HCDC Event Management System
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Security notice -->
                <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center; max-width: 480px;">
                    🔒 This is an automated message. Please do not reply to this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""
            
            from django.core.mail import EmailMultiAlternatives
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)
        except Exception as e:
            print(f"Error sending email: {e}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to send email. Please try again later.',
            }, status=500)
        
        return JsonResponse({
            'success': True,
            'message': 'OTP has been sent to your email.',
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def verify_otp_endpoint(request):
    """
    Verify OTP code.
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "otp": "123456"
    }
    """
    try:
        cleanup_expired_tokens()
        
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        
        if not email or not otp:
            return JsonResponse({
                'success': False,
                'error': 'Email and OTP are required',
            }, status=400)
        
        # Check if we have a token for this email
        token_data = _password_reset_tokens.get(email)
        
        if not token_data:
            return JsonResponse({
                'success': False,
                'error': 'No password reset request found. Please request a new OTP.',
            }, status=400)
        
        # Check if OTP is expired
        if token_data['expires_at'] < datetime.now():
            del _password_reset_tokens[email]
            return JsonResponse({
                'success': False,
                'error': 'OTP has expired. Please request a new one.',
            }, status=400)
        
        # Check if OTP matches
        if token_data['otp'] != otp:
            return JsonResponse({
                'success': False,
                'error': 'Invalid OTP code.',
            }, status=400)
        
        # OTP is valid - generate reset token
        reset_token = generate_reset_token(email)
        _password_reset_tokens[email]['verified'] = True
        _password_reset_tokens[email]['reset_token'] = reset_token
        # Extend expiry for password reset step
        _password_reset_tokens[email]['expires_at'] = datetime.now() + timedelta(minutes=15)
        
        return JsonResponse({
            'success': True,
            'message': 'OTP verified successfully.',
            'reset_token': reset_token,
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def reset_password_endpoint(request):
    """
    Reset password after OTP verification.
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "reset_token": "abc123...",
        "new_password": "newpassword123"
    }
    """
    try:
        cleanup_expired_tokens()
        
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        reset_token = data.get('reset_token', '').strip()
        new_password = data.get('new_password', '')
        
        if not email or not reset_token or not new_password:
            return JsonResponse({
                'success': False,
                'error': 'Email, reset token, and new password are required',
            }, status=400)
        
        if len(new_password) < 8:
            return JsonResponse({
                'success': False,
                'error': 'Password must be at least 8 characters long',
            }, status=400)
        
        # Check if we have a verified token for this email
        token_data = _password_reset_tokens.get(email)
        
        if not token_data:
            return JsonResponse({
                'success': False,
                'error': 'No password reset request found. Please start over.',
            }, status=400)
        
        if not token_data.get('verified'):
            return JsonResponse({
                'success': False,
                'error': 'OTP not verified. Please verify your OTP first.',
            }, status=400)
        
        if token_data.get('reset_token') != reset_token:
            return JsonResponse({
                'success': False,
                'error': 'Invalid reset token.',
            }, status=400)
        
        if token_data['expires_at'] < datetime.now():
            del _password_reset_tokens[email]
            return JsonResponse({
                'success': False,
                'error': 'Reset token has expired. Please start over.',
            }, status=400)
        
        # Get user and update password
        try:
            user = User.objects.get(id=token_data['user_id'])
            user.set_password(new_password)
            user.save()
            
            # Clear the token
            del _password_reset_tokens[email]
            
            return JsonResponse({
                'success': True,
                'message': 'Password reset successfully. You can now login with your new password.',
            })
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'User not found.',
            }, status=404)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def login_endpoint(request):
    """
    Login endpoint that authenticates user and sets session cookie.
    CSRF exempt because we rely on CORS and origin validation for security.
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "password": "password"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Try to authenticate using email or username
        user = None
        try:
            user = User.objects.get(email=email)
            user = authenticate(request, username=user.username, password=password)
        except User.DoesNotExist:
            user = authenticate(request, username=email, password=password)
        
        if user is not None:
            login(request, user)
            # Set CSRF token in response
            csrf_token = get_token(request)
            
            # Get user profile if it exists
            profile_data = {}
            try:
                profile = user.profile
                profile_data = {
                    'department': profile.department,
                    'program': profile.program,
                    'birthday': profile.birthday.isoformat() if profile.birthday else None,
                }
            except UserProfile.DoesNotExist:
                pass
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': user.get_full_name() or user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                    **profile_data,
                },
                'csrf_token': csrf_token,
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email or password',
            }, status=401)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def logout_endpoint(request):
    """Logout endpoint that clears session."""
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully',
    })


@require_http_methods(["GET"])
def csrf_token_endpoint(request):
    """Get CSRF token endpoint. Ensures CSRF cookie is set."""
    csrf_token = get_token(request)
    return JsonResponse({
        'csrf_token': csrf_token,
    })


@require_http_methods(["GET"])
def current_user_endpoint(request):
    """Get current authenticated user info."""
    if request.user.is_authenticated:
        user = request.user
        # Get user profile if it exists
        profile_data = {}
        try:
            profile = user.profile
            profile_data = {
                'department': profile.department,
                'program': profile.program,
                'birthday': profile.birthday.isoformat() if profile.birthday else None,
            }
        except UserProfile.DoesNotExist:
            pass
        
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                **profile_data,
            },
        })
    else:
        return JsonResponse({
            'authenticated': False,
        })
