"""
IP/user rate limiting using Django cache (Redis in production, locmem in dev).
"""
import functools
import hashlib
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status


def _client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def _rate_limit_key(scope: str, identifier: str) -> str:
    digest = hashlib.sha256(f'{scope}:{identifier}'.encode()).hexdigest()[:16]
    return f'ratelimit:{scope}:{digest}'


def rate_limit(scope: str, limit: int, window_seconds: int, *, by_user: bool = False):
    """
    Decorator for function-based views.
    limit = max requests per window_seconds per IP (or per user if by_user=True).
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if by_user and getattr(request, 'user', None) and request.user.is_authenticated:
                identifier = f'user:{request.user.pk}'
            else:
                identifier = f'ip:{_client_ip(request)}'

            key = _rate_limit_key(scope, identifier)
            count = cache.get(key, 0)
            if count >= limit:
                return JsonResponse(
                    {
                        'success': False,
                        'error': 'Too many requests. Please wait a moment and try again.',
                        'retry_after_seconds': window_seconds,
                    },
                    status=429,
                )
            cache.set(key, count + 1, timeout=window_seconds)
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator


def drf_rate_limit(scope: str, limit: int, window_seconds: int, *, by_user: bool = True):
    """Decorator for DRF viewset action methods (self, request, ...)."""
    def decorator(method):
        @functools.wraps(method)
        def wrapped(self, request, *args, **kwargs):
            if by_user and request.user.is_authenticated:
                identifier = f'user:{request.user.pk}'
            else:
                identifier = f'ip:{_client_ip(request)}'

            key = _rate_limit_key(scope, identifier)
            count = cache.get(key, 0)
            if count >= limit:
                return Response(
                    {
                        'error': 'Too many requests. Please wait a moment and try again.',
                        'retry_after_seconds': window_seconds,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cache.set(key, count + 1, timeout=window_seconds)
            return method(self, request, *args, **kwargs)
        return wrapped
    return decorator
