from tornado.escape import to_unicode, json_decode, json_encode
from bson.objectid import ObjectId

from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.frames import Frames
from openframe.db.content import Content


class FrameWebSocketHandler(BaseWebSocketHandler):
    # Connect a client via websockets
    # when the connection is opened, add the reference to the connection list

    def open(self, frame_id):
        print("Frame connected: " + frame_id)
        # store the frame_id on this connection instance
        self.frame_id = frame_id
        # set this frame to active in the db
        self._activateFrame()

        self.on('frame:content_updated', self._handleContentUpdated)

        self.on('frame:setup', self._handleSetup)

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

    def _handleContentUpdated(self, data):
        print('_handleContentUpdated')
        content_id = data['content_id']
        frame_id = data['frame_id']

        # update frame in db to reflect current content
        frame = Frames.updateById(
            frame_id, {'current_content_id': ObjectId(content_id)})
        # get content
        content = Content.getById(content_id)
        # publish frame:updated event
        self.pubsub.publish(
            'frame:content_updated', frame=frame, content=content)

    def _handleSetup(self, data):
        print('_handleSetup')
        settings = {
            'width': data['width'],
            'height': data['height'],
            'w_h_ratio': data['width']/data['height']
        }

        # update frame in db to reflect current content
        frame = Frames.updateById(
            self.frame_id, {'settings': settings})

        self.pubsub.publish(
            'frame:setup', frame=frame)
