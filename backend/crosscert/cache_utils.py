"""
Cache helpers for frequently accessed CROSSCERT data.
Uses Redis when REDIS_URL is set; falls back to in-memory cache locally.
"""
import hashlib
import json
from django.core.cache import cache

EVENT_LIST_TTL = 120          # 2 minutes
EVENT_DETAIL_TTL = 300        # 5 minutes — includes certificate template fields
USER_PROFILE_TTL = 60           # 1 minute


def event_list_key(*, is_authenticated: bool, query_string: str = '') -> str:
    auth = 'auth' if is_authenticated else 'public'
    qhash = hashlib.md5(query_string.encode()).hexdigest()[:8] if query_string else 'all'
    return f'crosscert:events:list:{auth}:{qhash}'


def event_detail_key(event_id) -> str:
    return f'crosscert:events:detail:{event_id}'


def user_profile_key(user_id) -> str:
    return f'crosscert:user:profile:{user_id}'


def get_cached(key: str):
    return cache.get(key)


def set_cached(key: str, value, ttl: int):
    cache.set(key, value, timeout=ttl)


def invalidate_event_caches(event_id=None):
    """Clear event detail and all list caches after mutations."""
    if event_id is not None:
        cache.delete(event_detail_key(event_id))
    # Pattern delete not supported on all backends — clear known list variants
    for auth in ('auth', 'public'):
        cache.delete(event_list_key(is_authenticated=(auth == 'auth')))


def invalidate_user_profile(user_id):
    cache.delete(user_profile_key(user_id))
