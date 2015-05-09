from tornado.escape import to_unicode, json_decode, json_encode
from pymongo.collection import ReturnDocument
from openframe.handlers.base import BaseWebSocketHandler



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
        del self.frames[self.frame_id]
        self.update_admins(frame_id)

    def check_origin(self, origin):
        return True

    def _activateFrame(self):
        frames = self.db.frames
        frame = frames.find_and_update_one({"_id": self.frame_id}, {"$set": {"active": True}}, return_document=ReturnDocument.AFTER)
        self._updateUsers(frame)

    def _deactivateFrame(self):
        frames = self.db.frames
        frames.update_one({"_id": self.frame_id}, {"$set": {"active": False}})

    def _updateUsers(self, frame):
        frame_users = frame['users']
        active_users = self.admins.keys
        intersection = users & active_users
        for key in intersection:
            print(key)
            self.admins[key].write_message(json_encode({'active_frames': list(self.frames.keys())}))