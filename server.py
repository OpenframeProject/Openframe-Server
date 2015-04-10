import Settings
from datetime import date
import tornado.escape
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

content = db.content

# dictionary containing refs to connected of_clients
of_clients = {}


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
    # @tornado.web.asynchronous
    @gen.coroutine
    def get(self, username, content_id):
        if username in of_clients:
            print("username " + username + " connected")
            db = self.settings['db']
            content = yield db.content.find_one({'_id': ObjectId(content_id)})
            print(content)
            of_clients[username].write_message(dumps(content))
            self.write("{'success': true }");
        else:
            print("username " + username + " not connected")
            self.write("{'success': false }")

# User REST Api
class UsersHandler(tornado.web.RequestHandler):
    def get(self, username=None):
        users = db.users
        if id:
            users = users.find_one({"username": username})
        else:
            users = users.find()
        self.write(dumps(users))

    @gen.coroutine
    def post(self):
        print('create user')
        users = db.users
        doc = json.loads(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        user_id = users.insert(doc).inserted_id
        if not user_id:
            res.success = False
        self.write(dumps(res))

    def put(self, content_id):
        print('update content: ' + content_id)
        doc = json.loads(self.request.body.decode('utf-8'))
        do_update('content', content_id, doc)
        print(doc)

# endpoints for managing frame content
class ContentHandler(tornado.web.RequestHandler):
    def get(self, content_id):
        print('get content: ' + content_id)
        content = do_find_by_id("content", content_id)
        print(content)

    @gen.coroutine
    def post(self):
        print('create content')
        db = self.settings['db']
        # print(self.request.body.decode('utf-8'))
        doc = json.loads(self.request.body.decode('utf-8'))
        print(doc)
        # do_insert('content', doc)
        result = yield db.content.insert(doc)
        # print(result)
        self.write(dumps(result))

    def put(self, content_id):
        print('update content: ' + content_id)
        doc = json.loads(self.request.body.decode('utf-8'))
        do_update('content', content_id, doc)
        print(doc)

# endpoints for managing frame content
class UserContentHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self, username):
        print('get content by username: ' + username)
        db = self.settings['db']
        cursor = db.content.find({'username': username})
        content = yield cursor.to_list(length=100)
        print(content)
        self.write(dumps(content))


class VersionHandler(tornado.web.RequestHandler):
    def get(self):
        response = { 'version': '3.5.1',
                     'last_build':  date.today().isoformat() }
        self.write(response)


# Connect a client via websockets
class ClientConnectionHandler(tornado.websocket.WebSocketHandler):
    # when the connection is opened, add the reference to the connection list
    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        of_clients[username] = self
        self.write_message(u'{"connected": true}')

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection list
    def on_close(self):
        print("WebSocket closed")
        del of_clients[self.username]

    def check_origin(self, origin):
    	return True

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/of", TestHandler),
            (r"/frame", FrameHandler),
            (r"/update/(\w+)/(\w+)", UpdateFrameHandler),
            (r"/content", ContentHandler),
            (r"/content/(\w+)", ContentHandler),
            (r"/user/content/(\w+)", UserContentHandler),
            (r"/users/(\w+)", UsersHandler),
            (r"/users", UsersHandler),
            (r'/ws/(\w+)', ClientConnectionHandler),
            (r"/version", VersionHandler),
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