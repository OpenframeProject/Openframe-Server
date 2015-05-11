import os
dirname = os.path.dirname(__file__)

STATIC_PATH = os.path.join(dirname, 'static')
TEMPLATE_PATH = os.path.join(dirname, 'templates')

TEST_USER = False

MONGO_HOST = 'localhost'
MONGO_PORT = 27017

try:
    from openframe.settings_local import *  # flake8: noqa
except ImportError:  # pragma: no cover
    pass