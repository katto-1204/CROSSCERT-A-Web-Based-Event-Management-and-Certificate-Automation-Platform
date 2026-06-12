"""
URL configuration for CROSSCERT project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from events.views import EventViewSet, EventRegistrationViewSet, CheckInViewSet, NotificationViewSet
from participants.views import ParticipantViewSet, EvaluationViewSet
from participants.bookmark_views import BookmarkViewSet
from certificates.views import CertificateViewSet, QRCodeViewSet
from auth_endpoints import login_endpoint, logout_endpoint, csrf_token_endpoint, current_user_endpoint, forgot_password_endpoint, verify_otp_endpoint, reset_password_endpoint

# General API router for public/participant endpoints
api_router = DefaultRouter()
api_router.register(r'events', EventViewSet, basename='event')
api_router.register(r'registrations', EventRegistrationViewSet, basename='registration')
api_router.register(r'check-ins', CheckInViewSet, basename='check-in')
api_router.register(r'notifications', NotificationViewSet, basename='notification')
api_router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
api_router.register(r'certificates', CertificateViewSet, basename='certificate')
api_router.register(r'qr-code', QRCodeViewSet, basename='qr-code')
api_router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
api_router.register(r'participants', ParticipantViewSet, basename='participant')

# Admin API router for admin-specific endpoints
admin_router = DefaultRouter()
admin_router.register(r'events', EventViewSet, basename='admin-event')
admin_router.register(r'participants', ParticipantViewSet, basename='admin-participant')
admin_router.register(r'check-ins', CheckInViewSet, basename='admin-check-in')
admin_router.register(r'evaluations', EvaluationViewSet, basename='admin-evaluation')
admin_router.register(r'certificates', CertificateViewSet, basename='admin-certificate')

urlpatterns = [
    # Expose JSON API auth endpoints at /api/auth/ and /api/admin/auth/
    # (Keep these before the admin path so they return JSON and are not redirected to HTML)
    path('api/auth/login/', login_endpoint, name='api_login'),
    path('api/auth/logout/', logout_endpoint, name='api_logout'),
    path('api/auth/csrf-token/', csrf_token_endpoint, name='api_csrf_token'),
    path('api/auth/me/', current_user_endpoint, name='api_current_user'),
    path('api/auth/forgot-password/', forgot_password_endpoint, name='api_forgot_password'),
    path('api/auth/verify-otp/', verify_otp_endpoint, name='api_verify_otp'),
    path('api/auth/reset-password/', reset_password_endpoint, name='api_reset_password'),

    # Also accept admin-prefixed versions in case frontend uses relative /admin/ paths
    path('api/admin/auth/login/', login_endpoint, name='api_admin_login'),
    path('api/admin/auth/logout/', logout_endpoint, name='api_admin_logout'),
    path('api/admin/auth/csrf-token/', csrf_token_endpoint, name='api_admin_csrf_token'),
    path('api/admin/auth/me/', current_user_endpoint, name='api_admin_current_user'),
    path('api/', include(api_router.urls)),
    path('api/admin/', include(admin_router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    
    # Django admin (after api so it doesn't interfere)
    path('admin/', admin.site.urls),
    
    # Markdownx URLs for markdown editor
    path('markdownx/', include('markdownx.urls')),

    # Redirect root
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
]
