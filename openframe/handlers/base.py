"""Base handler classes and utility functions."""
import datetime
from collections.abc import Callable
import functools
from pprint import pformat

from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
import tornado.websocket

from openframe import settings


class BaseHandler(tornado.web.RequestHandler):
    """Common handler functions here (e.g. user auth, template helpers)"""

    @property
    def db(self):
        """A connection to the MongoDB database."""
        return self.application.db

    @property
    def admins(self):
        """A dictionary of admin WS connection."""
        return self.application.admins

    @property
    def frames(self):
        """A dictionary of frame WS connection."""
        return self.application.frames

    def prepare(self):
        """
        This method runs before the HTTP-handling methods. It sets the XSRF
        token cookie.

        """
        self.xsrf_token  # accessing this property sets the cookie on the page

    def get(self, *args, **kwargs):
        """
        The default behavior is to raise a 404 (hiding the existence of the
        endpoint). Override this method to render something instead.

        :param args: positional arguments
        :param kwargs: keyword arguments
        :raise tornado.web.HTTPError: 404, always
        """
        raise tornado.web.HTTPError(404)

    def get_current_user(self) -> str:
        """
        See http://tornado.readthedocs.org/en/latest/guide/security.html
        #user-authentication

        :return: the current user's e-mail address
        """
        try:
            user = settings.TEST_USER
        except AttributeError:
            user = self.get_secure_cookie('user')
        if user:
            return to_unicode(user)

    def get_json_request_body(self: tornado.web.RequestHandler) -> dict:
        """
        Get a JSON dict from a request body
        :param self: the Handler
        :return: the body as a JSON dict
        :raise tornado.web.HTTPError: 400 if the body cannot be parsed as JSON
        """
        try:
            return json_decode(to_unicode(self.request.body))
        except ValueError:
            raise tornado.web.HTTPError(400, reason=json_encode(
                {'message': 'Problems parsing JSON'}))

    def get_template_namespace(self):
        """Template globals"""
        namespace = super().get_template_namespace()
        namespace.update({
            'iso_date_str_to_fmt_str': self.iso_date_str_to_fmt_str
        })
        return namespace

    def update_admins(self):
        print('updating admins ', self.admins)
        for key in self.admins:
            print(key)
            self.admins[key].write_message(json_encode({'active_users': list(self.frames.keys())}))


    @staticmethod
    def iso_date_str_to_fmt_str(iso_date_str, fmt_str):
        """ Takes an ISO date string and returns a new string formated by fmt_str """
        date = datetime.datetime.strptime(iso_date_str, '%Y-%m-%dT%H:%M:%S.%f+00:00')
        date_formatted = date.strftime(fmt_str)
        return date_formatted



class BaseWebSocketHandler(tornado.websocket.WebSocketHandler):

    @property
    def db(self):
        """A connection to the PostgreSQL database."""
        return self.application.db

    @property
    def frames(self):
        """A connection to the PostgreSQL database."""
        return self.application.frames

    @property
    def admins(self):
        """A connection to the PostgreSQL database."""
        return self.application.admins

    def update_admins(self):
        print('updating admins ', self.admins)
        for key in self.admins:
            print(key)
            self.admins[key].write_message(json_encode({'active_users': list(self.frames.keys())}))