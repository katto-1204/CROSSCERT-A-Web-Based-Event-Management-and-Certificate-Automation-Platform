"""
Structured logging for CROSSCERT operations.
Wire to Sentry via SENTRY_DSN in settings for production monitoring.
"""
import logging
import time
from functools import wraps

logger = logging.getLogger('crosscert')
api_logger = logging.getLogger('crosscert.api')
security_logger = logging.getLogger('crosscert.security')
cert_logger = logging.getLogger('crosscert.certificates')


def log_certificate_action(action: str, *, user_id=None, event_id=None, success: bool = True, error=None, extra=None):
    payload = {
        'action': action,
        'user_id': user_id,
        'event_id': event_id,
        'success': success,
        **(extra or {}),
    }
    if success:
        cert_logger.info('Certificate action: %s', action, extra={'crosscert': payload})
    else:
        cert_logger.error(
            'Certificate action failed: %s — %s',
            action,
            error or 'unknown',
            extra={'crosscert': payload},
            exc_info=bool(error),
        )


def log_auth_action(action: str, *, email=None, ip=None, success: bool = True):
    payload = {'action': action, 'email': email, 'ip': ip, 'success': success}
    if success:
        security_logger.info('Auth: %s', action, extra={'crosscert': payload})
    else:
        security_logger.warning('Auth failed: %s', action, extra={'crosscert': payload})


def timed_operation(name: str):
    """Log duration of expensive operations (certificate generation, etc.)."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                logger.info('%s completed in %sms', name, elapsed_ms, extra={'crosscert': {'operation': name, 'ms': elapsed_ms}})
                return result
            except Exception as exc:
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                logger.error(
                    '%s failed after %sms: %s',
                    name,
                    elapsed_ms,
                    exc,
                    extra={'crosscert': {'operation': name, 'ms': elapsed_ms}},
                    exc_info=True,
                )
                raise
        return wrapper
    return decorator
