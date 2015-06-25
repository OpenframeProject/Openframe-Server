import uuid
from openframe.handlers.base import BaseWebSocketHandler
from openframe.db.users import Users

# Connect an admin via websockets


class AdminWebSocketHandler(BaseWebSocketHandler):
    # when the connection is opened, add the reference to the connection list

    def open(self, username):
        print("WebSocket opened " + username)
        self.user = Users.get_by_username(username)

        # admin websocket connections get a uuid since an admin user
        # might have multiple admin devices open
        self.uuid = uuid.uuid4()

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:connected", admin_ws=self)

        # listen for 'frame:update_frame' events via websockets
        self.on('frame:update_frame', self._update_frame)
        # listen for 'frame:update_content' events via websockets
        self.on('frame:mirror_frame', self._mirror_frame)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket connection closed")

        # publish this event, handled in AdminManager
        self.pubsub.publish("admin:disconnected", admin_ws=self)

    def check_origin(self, origin):
        return True

    def _update_content(self, data):
        content_id = data['content_id']
        frame_id = data['frame_id']

        # handled in frame_manager
        self.pubsub.publish(
            'frame:update_content',
            content_id=content_id,
            frame_id=frame_id)

    def _update_frame(self, data):
        frame = data['frame']

        # handled in frame_manager
        self.pubsub.publish(
            'frame:update_frame',
            frame=frame)

    def _mirror_frame(self, data):
        frame_id = data['frame_id']
        mirrored_frame_id = data['mirrored_frame_id']

        # handled in frame_manager
        self.pubsub.publish(
            'frame:mirror_frame',
            mirrored_frame_id=mirrored_frame_id,
            frame_id=frame_id)
