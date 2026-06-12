"""
Password-reset OTP storage backed by Django cache (Redis in production).
"""
from datetime import datetime, timedelta
from typing import Any

from django.core.cache import cache

OTP_PREFIX = 'crosscert:otp:'
OTP_TTL_SECONDS = 900  # 15 minutes max window


def _key(email: str) -> str:
    return f'{OTP_PREFIX}{email.strip().lower()}'


def save_otp(email: str, data: dict[str, Any], ttl: int = 600) -> None:
    cache.set(_key(email), data, timeout=min(ttl, OTP_TTL_SECONDS))


def get_otp(email: str) -> dict[str, Any] | None:
    return cache.get(_key(email))


def delete_otp(email: str) -> None:
    cache.delete(_key(email))


def cleanup_expired_tokens() -> None:
    """No-op with cache TTL; kept for API compatibility."""
    return
