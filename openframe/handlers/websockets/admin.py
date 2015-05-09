from tornado.escape import to_unicode, json_decode, json_encode
from openframe.handlers.base import BaseWebSocketHandler
from openframe.events import EventBus
from openframe.db.frames import Frames

# Connect an admin via websockets
class AdminConnectionHandler(BaseWebSocketHandler):
    # when the connection is opened, add the reference to the connection list
    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        self.admins[username] = self

        # EventBus.subscribe("frame:connected", callback=self.update_frames)

        self.write_message(u'{"connected": true}')
        
        self.update_frame_list()

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection list
    def on_close(self):
        print("WebSocket closed")
        del self.admins[self.username]

    def check_origin(self, origin):
        return True

    def update_frame_list(self):
        active_frames = Frames.getByUser(self.username, active=True)
        print(active_frames)
