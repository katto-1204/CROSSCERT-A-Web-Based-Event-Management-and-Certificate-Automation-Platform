"""
Custom views for the CROSSCERT project.
"""
from django.http import JsonResponse

def csrf_failure(request, reason=""):
    """
    Custom CSRF failure view that returns JSON instead of default HTML.
    This ensures SPA clients can parse the error cleanly.
    """
    return JsonResponse({
        'detail': f'CSRF verification failed: {reason}.'
    }, status=403)
