import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.websocket

from openframe import settings
from openframe.handlers.pages import SplashHandler, MainHandler, \
    FrameHandler, CreateAccountHandler, LoginHandler, LogoutHandler, \
    TestHandler
from openframe.handlers.api.content import ContentHandler, ContentByUserHandler
from openframe.handlers.api.frames import FramesHandler, \
    FramesByUserHandler, FramesByOwnerHandler, UpdateFrameContentHandler, \
    VisibleFramesHandler
from openframe.handlers.api.users import UsersHandler
from openframe.handlers.websockets.admin import AdminWebSocketHandler
from openframe.handlers.websockets.frame import FrameWebSocketHandler
from openframe.db.connection import db
from openframe.micropubsub import MicroPubSub
from openframe.frame_manager import FrameManager
from openframe.admin_manager import AdminManager


class Application(tornado.web.Application):

    def __init__(self):
        handlers = [
            # Test
            (r"/test", TestHandler),

            # Login, Logout
            (r"/login", LoginHandler),
            (r"/logout", LogoutHandler),

            # RPC calls
            (r"/update/(\w+)/(\w+)", UpdateFrameContentHandler),


            # RESTish calls
            (r"/content/?", ContentHandler),
            (r"/content/(\w+)/?", ContentHandler),
            (r"/content/user/(\w+)/?", ContentByUserHandler),

            (r"/users/(\w+)/?", UsersHandler),
            (r"/users", UsersHandler),

            (r"/frames/?", FramesHandler),
            (r"/frames/visible/?", VisibleFramesHandler),
            (r"/frames/(\w+)/?", FramesHandler),
            (r"/frames/user/(\w+)/?", FramesByUserHandler),
            (r"/frames/owner/(\w+)/?", FramesByOwnerHandler),




            # WebSocket
            (r'/ws/(\w+)/?', FrameWebSocketHandler),
            (r'/client/ws/(\w+)/?', FrameWebSocketHandler),
            (r'/admin/ws/(\w+)/?', AdminWebSocketHandler),




            # Static files
            # /frame/[id]/[username]/[framename]
            (r"/frame/(\w+)/(\w+)/(\w+)/?", FrameHandler),
            (r"/(\w+)/?", MainHandler),
            (r"/", SplashHandler),
            (r"/create-account", CreateAccountHandler),
        ]

        config = {
            "template_path": settings.TEMPLATE_PATH,
            "static_path": settings.STATIC_PATH,
            "db": db,
            "debug": True,
            "cookie_secret": settings.COOKIE_SECRET,
            "login_url": "/login",
        }

        self._db = db

        self._pubsub = MicroPubSub()

        self._frame_manager = FrameManager(self)

        self._admin_manager = AdminManager(self)

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

    @property
    def pubsub(self):
        return self._pubsub

    @property
    def frame_manager(self):
        return self._frame_manager

    @property
    def admin_manager(self):
        return self._admin_manager


def main():
    application = Application()
    application.listen(8888)

    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
