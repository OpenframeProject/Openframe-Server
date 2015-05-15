"""Base handler classes and utility functions."""
import datetime
from collections.abc import Callable
import functools
from pprint import pformat

from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
import tornado.websocket

from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe import settings
from openframe.micropubsub import MicroPubSub


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

    @property
    def pubsub(self):
        """Access to the application-wide pubsub system."""
        return self.application.pubsub

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
        # user-authentication

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
            self.admins[key].write_message(
                json_encode({'active_frames': list(self.frames.keys())}))

    @staticmethod
    def iso_date_str_to_fmt_str(iso_date_str, fmt_str):
        """
        Takes an ISO date string and returns a new string formated by fmt_str
        """
        date = datetime.datetime.strptime(
            iso_date_str, '%Y-%m-%dT%H:%M:%S.%f+00:00')
        date_formatted = date.strftime(fmt_str)
        return date_formatted


class BaseWebSocketHandler(tornado.websocket.WebSocketHandler):

    def __init__(self, application, request, **kwargs):
        tornado.websocket.WebSocketHandler.__init__(self, application, request,
                                                    **kwargs)
        """
        Instantiate an instance-scoped pubsub to handle websocket
        event subscriptions. Should allow websocket handlers to do something like:

        self.on_event('frame:update', self.handle_event)

        Which would get triggered when an evented 'frame:update' message comes over the pipe
        """
        self.ps = MicroPubSub()

    @property
    def db(self):
        """A connection to the PostgreSQL database."""
        return self.application.db

    @property
    def pubsub(self):
        """Access to the application-wide pubsub system."""
        return self.application.pubsub

    def on_message(self, message):
        """
        Extract event name and data from message, call corresponding event handler
        """
        message = json_decode(message)
        event = message.name
        data = message.data
        self.ps.publish(event, data=data)

    def on_event(self, event, callback):
        """
        Subscribe to some event, presumably coming from the websocket message
        """
        self.ps.subscribe(event, callback)

    def send(self, event, data=None):
        """
        Send an "evented" message out to the websocket client, i.e. in the form:
        {
            'name': 'some:event',
            'data': {
                'some': 'data',
                'thinga': 'mabob'
            }
        }
        """
        message = dumps({'name': event, 'data': data})
        print('sending: ' + message)
        self.write_message(message)
