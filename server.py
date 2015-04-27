from datetime import date
import tornado.escape
import tornado.ioloop
from tornado import gen
import tornado.web
import tornado.websocket
import json
from tornado.escape import to_unicode, json_decode, json_encode

from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe import settings
from openframe.handlers.base import BaseHandler
from openframe.handlers.api.content import ContentHandler, ContentByUserHandler
from openframe.handlers.api.users import UsersHandler
from openframe.handlers.websockets.admin import AdminConnectionHandler
from openframe.handlers.websockets.frame import FrameConnectionHandler

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
class UpdateFrameHandler(BaseHandler):
    def get(self, username, content_id):
        if username in self.frames:
            print("username " + username + " connected")
            content = self.db.content
            content_item = content.find_one({'_id': ObjectId(content_id)})
            print(content_item)
            self.frames[username].write_message(dumps(content_item))
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
            (r'/ws/(\w+)', FrameConnectionHandler),
            (r'/client/ws/(\w+)', FrameConnectionHandler),
            (r'/admin/ws/(\w+)', AdminConnectionHandler),
        ]

        config = {
            "template_path": settings.TEMPLATE_PATH,
            "static_path": settings.STATIC_PATH,
            "db": db,
            "debug": True
        }

        self._frames = {}

        self._admins = {}

        self._db = db
        
        tornado.web.Application.__init__(self, handlers, **config)

    @property
    def frames(self):
        return self._frames
    
    @property
    def admins(self):
        return self._admins

    @property
    def db(self):
        return self._db
    
    

def main():
	application = Application()
	application.listen(8888)

	tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
	main()