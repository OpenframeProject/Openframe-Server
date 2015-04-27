import openframe.settings
from datetime import date
import tornado.escape
import tornado.ioloop
from tornado import gen
import tornado.web
import tornado.websocket
import json
from tornado.escape import to_unicode, json_decode, json_encode

from openframe.handlers.api.content import ContentHandler, ContentByUserHandler
from openframe.handlers.api.users import UsersHandler

# global db reference
mongo_client = MongoClient('localhost', 27017)
db = mongo_client.openframe


# Handlers
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("frame.html")


# endpoint for updating frame content
class UpdateFrameHandler(tornado.web.RequestHandler):
    def get(self, username, content_id):
        if username in of_clients:
            print("username " + username + " connected")
            content = self.db.content
            content_item = content.find_one({'_id': ObjectId(content_id)})
            print(content_item)
            of_clients[username].write_message(json_encode(content_item))
            self.write("{'success': true }")
        else:
            print("username " + username + " not connected")
            self.write("{'success': false }")

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [

            # Static files
            (r"/", MainHandler),
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
            "frames": {},
            "admins": {},
            "debug": True
        }
        
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
	application = Application()
	application.listen(8888)

	tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
	main()