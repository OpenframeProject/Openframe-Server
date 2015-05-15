from openframe.db.frames import Frames


class AdminManager():

    def __init__(self, application):
        self.admins = {}
        self._application = application

        self.pubsub.subscribe(
            'frame:connected', self.add_frame_connection)

        self.pubsub.subscribe(
            'frame:disconnected', self.remove_frame_connection)

        self.pubsub.subscribe(
            'admin:connected', self.add_admin_connection)

        self.pubsub.subscribe(
            'admin:disconnected', self.remove_admin_connection)

        self.pubsub.subscribe('frame:updated_content', self.update_admin_frame)

    @property
    def application(self):
        return self._application

    @property
    def pubsub(self):
        return self.application.pubsub

    def add_admin_connection(self, admin_ws):
        print('AdminManager::add_admin_connection: ' + admin_ws.username)
        self.admins[admin_ws.username] = admin_ws

    def remove_admin_connection(self, admin_ws):
        print('AdminManager:remove_admin_connection: ' + admin_ws.username)
        del self.admins[admin_ws.username]

    def add_frame_connection(self, frame_ws):
        print('AdminManager::add_frame_connection: ' + frame_ws.frame_id)
        # get frame object from websocket object
        frame = frame_ws.frame
        # get users for this frame
        users = frame['users']
        # for each user, if the user is connected, send frame:connected event to
        # websocket client (i.e. to admin page)
        for user in users:
            print('user: ' + user)
            if user in self.admins:
                print('logged in user: ' + user)
                self.admins[user].send('frame:connected', frame)

    def remove_frame_connection(self, frame_ws):
        print('AdminManager::remove_frame_connection: ' + frame_ws.frame_id)
        # get frame object from websocket object
        frame = frame_ws.frame
        # get users for this frame
        users = frame['users']
        # for each user, if the user is connected, send frame:disconnected to the
        # websocket client
        for user in users:
            if user in self.admins:
                self.admins[user].send('frame:disconnected', frame)

    def update_admin_frame(self, frame, content):
        print('AdminManager::update_admin_frame')
        users = frame['users']
        # for each user, if the user is connected, send frame:updated event to
        # websocket client (i.e. to admin page)
        for user in users:
            if user in self.admins:
                data = {'frame': frame, 'content': content}
                self.admins[user].send('frame:updated_content', data)
