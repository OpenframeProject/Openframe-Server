import Settings
from datetime import date
import tornado.escape
import tornado.ioloop
from tornado import gen
import tornado.web
import tornado.websocket
import json
from motorengine import connect
from bson.objectid import ObjectId
from bson.json_util import dumps

from model.user import User
from model.contentitem import ContentItem

# global db reference
# db = motor.MotorClient().of_db

# dictionary containing refs to connected clients
clients = {}



# Handlers
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("openframe.html")

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("frame.html")


# endpoint for updating frame content
# class UpdateFrameHandler(tornado.web.RequestHandler):
#     # @tornado.web.asynchronous
#     @gen.coroutine
#     def get(self, username, content_id):
#         if username in clients:
#             print("username " + username + " connected")
#             db = self.settings['db']
#             content = yield db.content.find_one({'_id': ObjectId(content_id)})
#             print(content)
#             clients[username].write_message(dumps(content))
#             self.write("{'success': true }");
#         else:
#             print("username " + username + " not connected")
#             self.write("{'success': false }")


# # endpoints for managing frame content
# class ContentHandler(tornado.web.RequestHandler):
#     def get(self, content_id):
#         print('get content: ' + content_id)
#         content = do_find_by_id("content", content_id)
#         print(content)

#     @gen.coroutine
#     def post(self):
#         print('create content')
#         db = self.settings['db']
#         # print(self.request.body.decode('utf-8'))
#         doc = json.loads(self.request.body.decode('utf-8'))
#         print(doc)
#         # do_insert('content', doc)
#         result = yield db.content.insert(doc)
#         # print(result)
#         self.write(dumps(result))

#     def put(self, content_id):
#         print('update content: ' + content_id)
#         doc = json.loads(self.request.body.decode('utf-8'))
#         do_update('content', content_id, doc)
#         print(doc)

# # endpoints for managing frame content
# class UserContentHandler(tornado.web.RequestHandler):
#     @gen.coroutine
#     def get(self, username):
#         print('get content by username: ' + username)
#         db = self.settings['db']
#         cursor = db.content.find({'username': username})
#         content = yield cursor.to_list(length=100)
#         print(content)
#         self.write(dumps(content))


class UserHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, username):
        User.objects.filter(username=username).limit(1).find_all(callback=self.handle_user_fetched)

    @tornado.web.asynchronous
    def post(self):
        # print('create user')
        user_json = json.loads(self.request.body.decode('utf-8'))
        print(user_json);
        user = User.from_son(user_json)
        user.save(self.handle_user_saved)
    
    def handle_user_saved(self, user):
        self.write(user.to_son())
        self.finish()

    def handle_user_fetched(self, user):
        self.write(user[0].to_son())
        self.finish()

class ContentHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, id):
        ContentItem.objects.get(id, callback=self.handle_content_fetched)

    @tornado.web.asynchronous
    def post(self):
        content_json = json.loads(self.request.body.decode('utf-8'))
        print(content_json);
        content = ContentItem.from_son(content_json)
        content.save(self.handle_content_saved)
    
    def handle_content_saved(self, content):
        self.write(content.to_son())
        self.finish()

    def handle_content_fetched(self, content):
        self.write(content.to_son())
        self.finish()


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
        clients[username] = self
        self.write_message(u'{"connected": true}')

    def on_message(self, message):
        print(message)
        # self.write_message(u"You said: " + message)

    # when the connection is closed, remove the reference from the connection list
    def on_close(self):
        print("WebSocket closed")
        del clients[self.username]

    def check_origin(self, origin):
    	return True

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/frame", FrameHandler),
            # (r"/update/(\w+)/(\w+)", UpdateFrameHandler),
            (r"/content/(\w+)", ContentHandler),
            (r"/content", ContentHandler),
            # (r"/content/(\w+)", ContentHandler),
            # (r"/user/content/(\w+)", UserContentHandler),
            (r"/user/(\w+)", UserHandler),
            (r"/user", UserHandler),
            (r'/ws/(\w+)', ClientConnectionHandler),
            (r"/version", VersionHandler),
        ]

        settings = {
            "template_path": Settings.TEMPLATE_PATH,
            "static_path": Settings.STATIC_PATH,
            # "db": db,
            "debug": True
        }
        
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    application = Application()
    application.listen(8888)

    ioloop = tornado.ioloop.IOLoop.instance();
    connect("openframe", host="localhost", port=27017, io_loop=ioloop)
    ioloop.start()

if __name__ == "__main__":
	main()