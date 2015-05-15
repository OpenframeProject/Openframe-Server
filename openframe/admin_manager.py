from openframe.db.frames import Frames


class AdminManager():

    def __init__(self):
        self.admins = {}

    def addAdminConnection(self, admin_ws):
        print('AdminManager::addAdminConnection: ' + admin_ws.username)
        self.admins[admin_ws.username] = admin_ws

    def removeAdminConnection(self, admin_ws):
        print('AdminManager::removeAdminConnection: ' + admin_ws.username)
        del self.admins[admin_ws.username]

    def addFrameConnection(self, frame_ws):
        print('AdminManager::addFrameConnection: ' + frame_ws.frame_id)
        # get frame object, update corresponding users
        frame = Frames.getById(frame_ws.frame_id)
        # get users for this frame
        users = frame['users']
        # for each user, if the user is connected, send frame:connected event to
        # websocket client (i.e. to admin page)
        for user in users:
            print('user: ' + user)
            if user in self.admins:
                print('logged in user: ' + user)
                self.admins[user].send('frame:connected', frame)

    def removeFrameConnection(self, frame_ws):
        print('AdminManager::removeFrameConnection: ' + frame_ws.frame_id)
        # get frame object, update corresponding users
        frame = Frames.getById(frame_ws.frame_id)
        # get users for this frame
        users = frame['users']
        # for each user, if the user is connected, send frame:disconnected to the
        # websocket client
        for user in users:
            if user in self.admins:
                self.admins[user].send('frame:disconnected', frame)
