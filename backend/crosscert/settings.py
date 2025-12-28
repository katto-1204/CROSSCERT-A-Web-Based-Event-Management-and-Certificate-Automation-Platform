"""
Django settings for CROSSCERT project.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Apply runtime monkeypatches (safe no-op if Django not available yet)
# REQUIRED: Django 5.1's native __copy__ is broken on Python 3.14
# This patch fixes the "'super' object has no attribute 'dicts'" error
try:
    from . import patch_template_context  # noqa: F401
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'markdownx',
    'events',
    'participants',
    'certificates',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Added for static files in production
    'django.middleware.gzip.GZipMiddleware',  # Added for response compression
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'crosscert.urls'

# Build paths inside the project like this: BASE_DIR / 'subdir'.
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [TEMPLATE_DIR],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'crosscert.wsgi.application'


DATABASES = {
# NEON DB (Commented out)
    # 'default': {
    #     'ENGINE': 'django.db.backends.postgresql',
    #     'NAME': 'neondb',
    #     'USER': 'neondb_owner',
    #     'PASSWORD': 'npg_eTZK5ghob4zC',
    #     'HOST': 'ep-round-surf-a1af8ypj-pooler.ap-southeast-1.aws.neon.tech',
    #     'PORT': '5432',
    #     # Optimization: Keep connection open for 10 minutes to reduce SSL handshake overhead
    #     'CONN_MAX_AGE': 600,
    #     'OPTIONS': {
    #         'sslmode': 'require',
    #         'channel_binding': 'require',
    #     },
    # }

    # SUPABASE DB
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('SUPABASE_DB_NAME', 'postgres'),
        'USER': os.getenv('SUPABASE_DB_USER', 'postgres'),
        'PASSWORD': os.getenv('SUPABASE_DB_PASSWORD'),
        'HOST': os.getenv('SUPABASE_DB_HOST'),
        'PORT': os.getenv('SUPABASE_DB_PORT', '6543'), # Default to 6543 for pooling
        # Supabase Transaction Pooler (Port 6543) requires disabling persistent connections
        # CONN_MAX_AGE must be 0 to allow the pooler to manage connections efficiently
        'CONN_MAX_AGE': 0, 
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Default primary key field type (Django 3.2+)
# Using BigAutoField for better scalability and to avoid warnings
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Enable WhiteNoise compression and caching
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Certificate settings
CERTIFICATE_UPLOAD_TO = 'certificates/'
CERTIFICATE_TEMPLATE_UPLOAD_TO = 'certificate_templates/'
DEFAULT_FONT = os.path.join(BASE_DIR, 'static/fonts/OpenSans-Regular.ttf')

# Create required directories
os.makedirs(os.path.join(MEDIA_ROOT, CERTIFICATE_UPLOAD_TO), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, CERTIFICATE_TEMPLATE_UPLOAD_TO), exist_ok=True)
os.makedirs(os.path.dirname(DEFAULT_FONT), exist_ok=True)

# Email Configuration (Gmail SMTP)
# Prefer environment variables, but fall back to the provided Gmail app password for local/dev
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('SENDER_EMAIL', 'crosscert.dvo@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('SENDER_PASSWORD', 'bpoj jamo wdzh ewui')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS Configuration
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', os.getenv('FRONTEND_URL', 'http://localhost:3000')).rstrip('/')

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_BASE_URL,
]

CORS_ALLOW_CREDENTIALS = True

# CSRF Configuration for CORS
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_BASE_URL,
    'https://crosscert-production.up.railway.app',
]

# Security Settings
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'

CSRF_COOKIE_HTTPONLY = False  # Must be False to access via JavaScript
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

