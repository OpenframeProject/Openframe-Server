from tornado.escape import to_unicode, json_decode, json_encode
from bson.json_util import dumps

from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.frames import Frames


class FrameWebSocketHandler(BaseWebSocketHandler):
    # Connect a client via websockets
    # when the connection is opened, add the reference to the connection list

    def open(self, frame_id):
        print("Frame connected: " + frame_id)
        # store the frame_id on this connection instance
        self.frame_id = frame_id
        # set this frame to active in the db
        self._activateFrame()

    def on_message(self, message):
        print(message)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket closed")
        # deactivate frame in database
        self._deactivateFrame()

    def check_origin(self, origin):
        return True

    def _activateFrame(self):
        """
        Update this frame object in the db, then publish event to the system
        """
        frame = Frames.updateById(self.frame_id, {"active": True})
        self.frame = frame
        # publish this event, handled in frame and admin managers
        self.pubsub.publish("frame:connected", frame_ws=self)

        # self._updateUsers(frame, event="frame:connected")

    def _deactivateFrame(self):
        """
        Update this frame object in the db, then publish event to the system
        """
        print('_deactivateFrame')
        frame = Frames.updateById(self.frame_id, {"active": False})
        # publish the disconnection event, handled in frame and admin managers
        self.pubsub.publish("frame:disconnected", frame_ws=self)
