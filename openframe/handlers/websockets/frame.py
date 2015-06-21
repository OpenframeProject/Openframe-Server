from tornado.escape import to_unicode, json_decode, json_encode
from bson.objectid import ObjectId

from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.frames import Frames
from openframe.db.content import Content
from openframe.handlers.util import _unify_ids


class FrameWebSocketHandler(BaseWebSocketHandler):
    """
    Connect a client via websockets
    when the connection is opened, add the reference to the connection list
    """

    def check_origin(self, origin):
        """
        Allow connection from any origin.
        """
        return True

    def open(self, frame_id):
        print("Frame connected: " + frame_id)
        # store the frame_id on this connection instance
        self.frame_id = frame_id
        # set this frame to active in the db
        self._handle_frame_connected()

        self.on('frame:frame_updated', self._handle_frame_updated)

        self.on('frame:setup', self._handle_setup)

    def on_close(self):
        """
        when the connection is closed, remove the reference from the connection
        list
        """
        print("WebSocket closed")
        # deactivate frame in database
        self._handle_frame_disconnected()

    def _handle_frame_connected(self):
        """
        Update this frame object in the db, then publish event to the system
        """
        # publish this event, handled in frame and admin managers
        self.pubsub.publish("frame:connected", frame_ws=self)

        # self._updateUsers(frame, event="frame:connected")

    def _handle_frame_disconnected(self):
        """
        Update this frame object in the db, then publish event to the system
        """
        print('_handle_frame_disconnected')
        # publish the disconnection event, handled in frame and admin managers
        self.pubsub.publish("frame:disconnected", frame_ws=self)

    def _handle_frame_updated(self, data):
        """
        Content on the frame is updated with the initial
        frame:update_content WS event.

        This handles a notification from the frame that its content
        has been updated.
        """
        print('_handle_frame_updated')

        # publish frame:updated event
        # self.pubsub.publish(
        #     'frame:frame_updated',
        #     frame_id=data['frame_id'],
        #     content_id=data['content_id'])

    def _handle_setup(self, data):
        print('_handle_setup')
        settings = {
            'settings.width': data['width'],
            'settings.height': data['height'],
            'settings.w_h_ratio': data['width'] / data['height']
        }

        # update frame in db to reflect current content
        frame = Frames.update_by_id(
            self.frame_id, settings)

        # notify
        self.pubsub.publish(
            'frame:setup', frame=frame)
