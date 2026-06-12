"""Crosscert core tests."""
from django.test import TestCase
from django.core.cache import cache

from crosscert.otp_store import save_otp, get_otp, delete_otp


class HealthEndpointTests(TestCase):
    def test_health_returns_ok(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')


class AuthEndpointTests(TestCase):
    def test_csrf_token(self):
        response = self.client.get('/api/auth/csrf-token/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('csrf_token', response.json())

    def test_me_anonymous(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['authenticated'])

    def test_login_invalid_credentials(self):
        response = self.client.post(
            '/api/auth/login/',
            data={'email': 'nobody@hcdc.edu.ph', 'password': 'wrongpassword123'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)


class OTPStoreTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_save_and_get_otp(self):
        save_otp('test@hcdc.edu.ph', {'otp': '123456', 'verified': False}, ttl=60)
        data = get_otp('test@hcdc.edu.ph')
        self.assertIsNotNone(data)
        self.assertEqual(data['otp'], '123456')

    def test_delete_otp(self):
        save_otp('del@hcdc.edu.ph', {'otp': '999999'}, ttl=60)
        delete_otp('del@hcdc.edu.ph')
        self.assertIsNone(get_otp('del@hcdc.edu.ph'))
