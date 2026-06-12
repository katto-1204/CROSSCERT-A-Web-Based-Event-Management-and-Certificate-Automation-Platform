"""
Custom DRF authentication for cross-origin SPA clients.

The frontend (Vercel) and API (Render) run on different origins. Browsers often
block third-party CSRF cookies, so header+cookie CSRF validation fails even when
the client sends X-CSRFToken. CORS + session cookies still protect against
untrusted origins making credentialed requests.
"""
from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session auth without DRF CSRF enforcement for trusted SPA origins."""

    def enforce_csrf(self, request):
        return
