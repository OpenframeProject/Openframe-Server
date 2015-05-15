from openframe.handlers.base import BaseHandler
from openframe.db.frames import Frames
from openframe.db.content import Content


class SplashHandler(BaseHandler):

    def get(self):
        self.render("splash.html")


class MainHandler(BaseHandler):

    def get(self, username=None):
        frames = []
        content = []
        if username:
            frames = Frames.getByUser(username, active=True)
            content = Content.getByUser(username)
        self.render(
            "index.html", user=username, frames=frames, content=content)


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
