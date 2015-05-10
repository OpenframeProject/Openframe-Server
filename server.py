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
from openframe.handlers.api.frames import FramesHandler, FramesByUserHandler, FramesByOwnerHandler
from openframe.handlers.api.users import UsersHandler
from openframe.handlers.websockets.admin import AdminConnectionHandler
from openframe.handlers.websockets.frame import FrameConnectionHandler
from openframe.db.connection import db
from openframe.db.frames import Frames

# global db reference
# mongo_client = MongoClient('localhost', 27017)
# db = mongo_client.openframe

# Handlers
class SplashHandler(BaseHandler):
    def get(self):
        self.render("splash.html")

class MainHandler(BaseHandler):
    def get(self, username=None):
        frames = []
        if username:
            frames = Frames.getByUser(username, active=True)
        self.render("index.html", user=username, frames=frames)

class FrameHandler(BaseHandler):
    def get(self, frame_id, username, framename):
        frame = Frames.getById(frame_id)
        print(frame)
        if not frame:
            print("No frame, create it.")
            result = Frames.insert({
                "_id": frame_id,
                "owner": username,
                "name": framename,
                "users": [
                        username
                    ]
                })
        self.render("frame.html", frame_id=frame_id)


# endpoint for updating frame content
class UpdateFrameHandler(BaseHandler):
    def get(self, frame_id, content_id):
        if frame_id in self.frames:
            print("frame_id " + frame_id + " connected")
            content = self.db.content
            content_item = content.find_one({'_id': ObjectId(content_id)})
            print(content_item)
            self.frames[frame_id].write_message(dumps(content_item))
            self.write("{'success': true }")
        else:
            print("frame_id " + frame_id + " not connected")
            self.write("{'success': false }")

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [

            # RPC calls
            (r"/update/(\w+)/(\w+)", UpdateFrameHandler),
            

            # RESTish calls
            (r"/content/?", ContentHandler),
            (r"/content/(\w+)/?", ContentHandler),
            (r"/content/user/(\w+)/?", ContentByUserHandler),

            (r"/users/(\w+)/?", UsersHandler),
            (r"/users", UsersHandler),

            (r"/frames/?", FramesHandler),
            (r"/frames/(\w+)/?", FramesHandler),
            (r"/frames/user/(\w+)/?", FramesByUserHandler),
            (r"/frames/owner/(\w+)/?", FramesByOwnerHandler),
            



            # WebSocket
            (r'/ws/(\w+)/?', FrameConnectionHandler),
            (r'/client/ws/(\w+)/?', FrameConnectionHandler),
            (r'/admin/ws/(\w+)/?', AdminConnectionHandler),




            # Static files
            # /frame/[id]/[username]/[framename]
            (r"/frame/(\w+)/(\w+)/(\w+)/?", FrameHandler),
            (r"/(\w+)/?", MainHandler),
            (r"/", SplashHandler),
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