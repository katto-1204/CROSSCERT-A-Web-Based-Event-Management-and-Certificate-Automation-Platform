"""
Request logging middleware — tracks response time, status, and slow requests.
"""
import logging
import time

api_logger = logging.getLogger('crosscert.api')

SLOW_REQUEST_MS = 2000


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        path = request.path
        if path.startswith('/api/') or path.startswith('/admin/'):
            user_id = getattr(getattr(request, 'user', None), 'pk', None)
            log_data = {
                'method': request.method,
                'path': path,
                'status': response.status_code,
                'ms': elapsed_ms,
                'user_id': user_id,
            }
            if elapsed_ms >= SLOW_REQUEST_MS:
                api_logger.warning('Slow request', extra={'crosscert': log_data})
            elif response.status_code >= 500:
                api_logger.error('Server error', extra={'crosscert': log_data})
            elif response.status_code >= 400:
                api_logger.info('Client error', extra={'crosscert': log_data})
            else:
                api_logger.debug('Request', extra={'crosscert': log_data})

        response['X-Response-Time-Ms'] = str(elapsed_ms)
        return response
