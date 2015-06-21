from openframe.db.frames import Frames
from openframe.db.users import Users


class AdminManager():

    def __init__(self, application):
        self.admins = {}
        self._application = application

        # Frame events
        self.pubsub.subscribe(
            'frame:connected', self.add_frame_connection)
        self.pubsub.subscribe(
            'frame:disconnected', self.remove_frame_connection)
        self.pubsub.subscribe(
            'frame:frame_updated', self.update_admin_frame)
        self.pubsub.subscribe(
            'frame:frame_mirrored', self.update_admin_frame)
        self.pubsub.subscribe(
            'frame:setup', self.setup_frame)

        # Admin events
        self.pubsub.subscribe(
            'admin:connected', self.add_admin_connection)
        self.pubsub.subscribe(
            'admin:disconnected', self.remove_admin_connection)

    @property
    def application(self):
        return self._application

    @property
    def pubsub(self):
        return self.application.pubsub

    def add_admin_connection(self, admin_ws):
        print('AdminManager::add_admin_connection: ' +
              str(admin_ws.user['_id']))
        if admin_ws.user['_id'] in self.admins:
            self.admins[admin_ws.user['_id']][admin_ws.uuid] = admin_ws
        else:
            self.admins[admin_ws.user['_id']] = {admin_ws.uuid: admin_ws}

    def remove_admin_connection(self, admin_ws):
        print('AdminManager:remove_admin_connection: ' +
              str(admin_ws.user['_id']))
        if admin_ws.user['_id'] in self.admins:
            del self.admins[admin_ws.user['_id']][admin_ws.uuid]

    def add_frame_connection(self, frame_ws):
        print('AdminManager::add_frame_connection: ' + frame_ws.frame_id)
        # get frame object from websocket object
        frame = frame_ws.frame
        # get users for this frame
        users = Users.get_by_frame_id(frame['_id'])
        # for each user, if the user is connected,
        # send frame:connected event to each
        # websocket client they have open (i.e. to admin page)
        for user in users:
            user_id = user['_id']
            if user_id in self.admins:
                for ws_uuid in self.admins[user_id]:
                    self.admins[user_id][ws_uuid].send(
                        'frame:connected', frame)

    def remove_frame_connection(self, frame_ws):
        print('AdminManager::remove_frame_connection: ' + frame_ws.frame_id)
        # get frame object from db
        frame = Frames.get_by_id(frame_ws.frame_id)
        # get users for this frame
        users = Users.get_by_frame_id(frame_ws.frame_id)
        # for each user, if the user is connected,
        # send frame:disconnected to the
        # websocket client
        for user in users:
            user_id = user['_id']
            if user_id in self.admins:
                for ws_uuid in self.admins[user_id]:
                    self.admins[user_id][ws_uuid].send(
                        'frame:disconnected', frame)

    def update_admin_frame(self, frame=None, frame_id=None):
        print('AdminManager::update_admin_frame')
        print(frame)
        if frame_id is not None:
            frame = Frames.get_by_id(frame_id)
        # get users for this frame
        users = Users.get_by_frame_id(frame['_id'])
        # for each user, if the user is connected, send frame:updated event to
        # websocket client (i.e. to admin page)
        for user in users:
            user_id = user['_id']
            if user_id in self.admins:
                for ws_uuid in self.admins[user_id]:
                    self.admins[user_id][ws_uuid].send(
                        'frame:frame_updated', frame)

    def setup_frame(self, frame):
        print('AdminManager::setup_frame')
        users = Users.get_by_frame_id(frame['_id'])
        # for each user, if the user is connected, send frame:updated event to
        # websocket client (i.e. to admin page)
        for user in users:
            user_id = user['_id']
            if user_id in self.admins:
                for ws_uuid in self.admins[user_id]:
                    data = {'frame': frame}
                    self.admins[user_id][ws_uuid].send('frame:setup', data)
