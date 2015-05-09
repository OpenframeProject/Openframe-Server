from tornado.escape import to_unicode, json_decode, json_encode
from bson.json_util import dumps

from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.frames import Frames


class FrameConnectionHandler(BaseWebSocketHandler):
    # Connect a client via websockets
    # when the connection is opened, add the reference to the connection list

    def open(self, frame_id):
        print("Frame connected: " + frame_id)
        # store the frame_id on this connection instance
        self.frame_id = frame_id
        # add this connection instance to the active frames dictionary
        self.frames[frame_id] = self
        # set this frame to active in the db
        self._activateFrame()
        # respond to the WS client
        self.write_message(u'{"connected": true}')

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket closed")
        self._deactivateFrame()
        del self.frames[self.frame_id]
        # self.update_admins(frame_id)

    def check_origin(self, origin):
        return True

    def _activateFrame(self):
        frame = Frames.updateById(self.frame_id, {"active": True});
        self._updateUsers(frame, event="frame:connected")

    def _deactivateFrame(self):
        frame = Frames.updateById(self.frame_id, {"active": False});
        self._updateUsers(frame, event="frame:disconnected")

    def _updateUsers(self, frame, event=None):
        frame_users = frame['users']
        active_users = list(self.admins.keys())
        print(frame_users)
        print(active_users)

        intersection = list(set(frame_users) & set(active_users))
        for key in intersection:
            print(key)
            self.admins[key].write_message(dumps({'name': event, 'data': frame}))