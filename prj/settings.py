# coding=utf-8
"""
Django settings for prj project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
from __future__ import unicode_literals
import os
from django.contrib.messages import constants as messages

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ENTRY_FEATURES = ['geonote.GeoFeatures',]

# Регистрировать динамические модели в админке
DYNAMIT_IN_ADMIN = False

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '*t(e^bu9nylcx3)1p9vrim@nlb9v9e1np3l97jo!md1*bq7n=h'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

JS_DEBUG = False

ALLOWED_HOSTS = []

SITE_ID = 1

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.gis',

    'comments',
    'easy_thumbnails',
    'rest_framework',
    'rest_framework_gis',
    'rest_framework.authtoken',
    'djoser',

    'compressor',

    'uploader',
    'dynamit',
    'entry'
)

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    #
    # 'django.contrib.sessions.middleware.SessionMiddleware',
    # 'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    # 'django.contrib.auth.middleware.AuthenticationMiddleware',
    # 'django.contrib.messages.middleware.MessageMiddleware',
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'prj.middleware.MinifyHTMLMiddleware',
]

ROOT_URLCONF = 'prj.urls'


WSGI_APPLICATION = 'prj.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'ru'

TIME_ZONE = 'UTC'

USE_I18N = False

USE_L10N = False

# USE_TZ = True

STATIC_ROOT = os.path.join(BASE_DIR, 'static')

STATIC_URL = '/static/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

MEDIA_URL = '/media/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'client/dist/'),
    os.path.join(BASE_DIR, 'client/node_modules/'),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
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

AUTH_PASSWORD_VALIDATORS = [
    # {
    #     'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    # },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# TEMPLATE_CONTEXT_PROCESSORS = (
#     'django.contrib.auth.context_processors.auth',
#     'django.core.context_processors.debug',
#     'django.core.context_processors.i18n',
#     'django.core.context_processors.media',
#     'django.core.context_processors.static',
#     'django.core.context_processors.tz',
#     'django.core.context_processors.request',
#     'django.contrib.messages.context_processors.messages',
# )

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    # 'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    # 'PAGE_SIZE': 100
}

DJOSER = {
    'DOMAIN': 'geonote.ru',
    'SITE_NAME': 'Geonote',
    'PASSWORD_RESET_CONFIRM_URL': '#/password/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': '#/activate/{uid}/{token}',
    'LOGIN_AFTER_REGISTRATION': True,
    'LOGIN_AFTER_ACTIVATION': True,
    'SEND_ACTIVATION_EMAIL': False,
}

CONTENT_TYPES = ['application/json', 'application/octet-stream',
                 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
MAX_UPLOAD_SIZE = 20971520

MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

MESSAGE_TAGS = {
    messages.ERROR: 'danger',
    messages.INFO: 'info',
    50: 'critical',
}

NAMES = {
    'title': 'Geonote',
    'site': 'Geonote',
    'entry': {
      'name': 'запись',
      'verbose_name': 'записи',
      'short_name': '',
      'create': 'Добавить новую запись',
      'create_short': 'Добавить запись'
    }
}

COMPRESS_OUTPUT_DIR = ''


# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'file': {
#             'level': 'DEBUG',
#             'class': 'logging.FileHandler',
#             'filename': os.path.join(BASE_DIR, 'debug.log'),
#         },
#     },
#     'loggers': {
#         'default': {
#             'handlers': ['file'],
#             'level': 'DEBUG',
#             'propagate': True,
#         },
#     },
# }

try:
    from prj.local_settings import *
except ImportError:
    pass