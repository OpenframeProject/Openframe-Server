from tornado.escape import to_unicode, json_decode, json_encode
from openframe.handlers.base import BaseWebSocketHandler

# Connect an admin via websockets
class AdminConnectionHandler(BaseWebSocketHandler):
    # when the connection is opened, add the reference to the connection list
    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        of_admins[username] = self
        self.write_message(u'{"connected": true}')
        update_admins()

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection list
    def on_close(self):
        print("WebSocket closed")
        del of_admins[self.username]

    def check_origin(self, origin):
        return True