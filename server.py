import Settings
from datetime import date
from tornado.escape import json_encode, json_decode
import tornado.ioloop
from tornado import gen
import tornado.web
import tornado.websocket
import json

from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps

# global db reference
mongo_client = MongoClient('localhost', 27017)
db = mongo_client.openframe


# dictionary containing refs to connected of_clients and of_admins
of_clients = {}
of_admins = {}


def update_admins():
    print('updating admins ', of_admins)
    for key in of_admins:
        print(key)
        active_frames = []

        for client in of_clients:
            active_frame = {
                'username': client,
                'screen_width': of_clients[client].screen_width,
                'screen_height': of_clients[client].screen_height,
            }
            active_frames.append(active_frame)

        message = {
            'event': 'update-frames',
            'active_frames': active_frames
        }
        print('emitting event', message)
        emit_ws_event(of_admins[key], 'update-active-frames', message)
        # of_admins[key].write_message(dumps(message))


def emit_ws_event(ws_connection, event, message):
    message['event'] = event
    ws_connection.write_message(json_encode(message))

# Handlers


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("index.html")


class TestHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("openframe.html")


class FrameHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("frame.html")


# endpoint for updating frame content
class UpdateFrameHandler(tornado.web.RequestHandler):

    def get(self, username, content_id):
        if username in of_clients:
            print("username " + username + " connected")
            content = db.content
            content_item = content.find_one({'_id': ObjectId(content_id)})
            print(content_item)
            of_clients[username].write_message(dumps(content_item))
            self.write("{'success': true }")
        else:
            print("username " + username + " not connected")
            self.write("{'success': false }")

# User REST Api


class UsersHandler(tornado.web.RequestHandler):

    def get(self, username=None):
        users = db.users
        if username:
            users_resp = users.find_one({"username": username})
        else:
            users_resp = users.find()
        self.write(dumps(users_resp))

    def post(self):
        print('create user')
        users = db.users
        doc = json.loads(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        user_id = users.insert(doc)
        if not user_id:
            res.success = False
        self.write(dumps(res))

    def put(self, username):
        print('NOT YET IMPLEMENTED')
        print('update user: ' + username)

# endpoints for managing frame content


class ContentHandler(tornado.web.RequestHandler):

    def get(self, content_id=None):
        content = db.content
        if content_id:
            print('get content: ' + content_id)
            content_resp = content.find_one({'_id': ObjectId(content_id)})
        else:
            content_resp = content.find()
        self.write(dumps(content_resp))

    def post(self):
        print('create content item')
        content = db.content
        doc = json.loads(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        content_id = content.insert(doc)
        if not content_id:
            res.success = False
        self.write(dumps(res))

    def put(self, content_id):
        print('NOT YET IMPLEMENTED')
        print('update content: ' + content_id)

    def delete(self, content_id=None):
        content = db.content
        res = {'success': True}
        if content_id:
            print('get content: ' + content_id)
            content_resp = content.remove({'_id': ObjectId(content_id)})
        else:
            res.success = False
        self.write(dumps(res))

# Get content by username


class ContentByUserHandler(tornado.web.RequestHandler):

    def get(self, username):
        content = db.content
        if not username:
            print('username missing')
            resp = {'error': 'username required'}
        else:
            resp = content.find({'username': username})
        self.write(dumps(resp))


# Connect a client via websockets
class ClientConnectionHandler(tornado.websocket.WebSocketHandler):
    screen_width = None
    screen_height = None
    # when the connection is opened, add the reference to the connection list

    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        of_clients[username] = self
        message = {
            'connected': True
        }
        emit_ws_event(self, 'connect', message)
        # update_admins()

    def on_message(self, message):
        message_dict = json_decode(message)
        if 'event' in message_dict:
            if message_dict['event'] == 'setup':
                self.screen_width = message_dict['screen_width']
                self.screen_height = message_dict['screen_height']
                print('settings', message_dict)
                update_admins()
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket closed")
        del of_clients[self.username]
        update_admins()

    def check_origin(self, origin):
        return True

# Connect an admin via websockets


class AdminConnectionHandler(tornado.websocket.WebSocketHandler):
    # when the connection is opened, add the reference to the connection list

    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        of_admins[username] = self
        message = {
            'connected': True
        }
        emit_ws_event(self, 'connect', message)
        update_admins()

    def on_message(self, message):

        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection
    # list
    def on_close(self):
        print("WebSocket closed")
        del of_admins[self.username]

    def check_origin(self, origin):
        return True


class Application(tornado.web.Application):

    def __init__(self):
        handlers = [

            # Static files
            (r"/", MainHandler),
            (r"/of", TestHandler),
            (r"/frame", FrameHandler),


            # RPC calls
            (r"/update/(\w+)/(\w+)", UpdateFrameHandler),


            # RESTish calls
            (r"/content", ContentHandler),
            (r"/content/(\w+)", ContentHandler),
            (r"/content/user/(\w+)", ContentByUserHandler),

            (r"/users/(\w+)", UsersHandler),
            (r"/users", UsersHandler),

            # WebSocket
            (r'/ws/(\w+)', ClientConnectionHandler),
            (r'/client/ws/(\w+)', ClientConnectionHandler),
            (r'/admin/ws/(\w+)', AdminConnectionHandler),
        ]

        settings = {
            "template_path": Settings.TEMPLATE_PATH,
            "static_path": Settings.STATIC_PATH,
            "db": db,
            "debug": True
        }

        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    application = Application()
    application.listen(8888)

    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
)
