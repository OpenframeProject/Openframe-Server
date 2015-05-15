from tornado.escape import to_unicode, json_decode, json_encode
from openframe.handlers.base import BaseWebSocketHandler

# Connect an admin via websockets


class AdminWebSocketHandler(BaseWebSocketHandler):
    # when the connection is opened, add the reference to the connection list

    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:connected", admin_ws=self)

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket connection closed")

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:disconnected", admin_ws=self)

    def check_origin(self, origin):
        return True
