import os
dirname = os.path.dirname(__file__)

STATIC_PATH = os.path.join(dirname, 'static')
TEMPLATE_PATH = os.path.join(dirname, 'templates')

MONGO_HOST = 'localhost'
MONGO_PORT = 27017

COOKIE_SECRET = "here is a super secret that you don't know."

try:
    from openframe.settings_local import *  # flake8: noqa
except ImportError:  # pragma: no cover
    pass