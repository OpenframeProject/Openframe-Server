from tornado.escape import to_unicode, json_decode, json_encode
from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.frames import Frames
from openframe.db.content import Content

# Connect an admin via websockets


class AdminWebSocketHandler(BaseWebSocketHandler):
    # when the connection is opened, add the reference to the connection list

    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:connected", admin_ws=self)

        # listen for 'frame:update_content' events via websockets
        self.on('frame:update_content', self._updateContent)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket connection closed")

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:disconnected", admin_ws=self)

    def check_origin(self, origin):
        return True

    def _updateContent(self, data):
        content_id = data['content_id']
        frame_id = data['frame_id']
        self.pubsub.publish(
            'frame:update_content', content_id=content_id, frame_id=frame_id)
