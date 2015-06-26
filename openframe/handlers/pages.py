import hashlib
import time
from tornado.web import authenticated

from openframe.handlers.base import BaseHandler
from openframe.db.frames import Frames
from openframe.db.content import Content
from openframe.db.users import Users


class SplashHandler(BaseHandler):

    def get(self):
        self.render("splash.html")


class LoginHandler(BaseHandler):

    def get(self):
        if self.current_user:
            self.logout()
        self.render("login.html", error=None)

    def post(self):
        print('posting to login')
        username = self.get_argument('username', '')
        password = self.get_argument('password', '')
        if self._check_password(username, password):
            self.login(username, '/' + username)
        else:
            self.render("login.html", error="Incorrect username or password.")

    def _check_password(self, username, password):
        user = Users.get_by_username(username, ['password', 'salt'])
        if not user:
            return False
        stored_pass = user['password']
        password_bytes = password.encode('utf-8')
        salt_bytes = user['salt']
        hashed_password = hashlib.sha512(
            password_bytes + salt_bytes).hexdigest()
        return stored_pass == hashed_password


class LogoutHandler(BaseHandler):

    def get(self):
        self.logout()


class CreateAccountHandler(BaseHandler):

    def get(self):
        self.render("create_account.html", error=None)

    def post(self):
        username = self.get_argument('username', '')
        password = self.get_argument('password', '')
        password_confirm = self.get_argument('password_confirm', '')
        if not password == password_confirm:
            print('passwords do not match')
            self.render('create_account.html',
                        error="Passwords do not match.")
            return
        user_id = Users.create_user(username, password)
        if user_id:
            # LOGIN
            self.login(username, '/' + username)
        else:
            self.render('create_account.html',
                        error="Problem creating account.")


class MainHandler(BaseHandler):

    @authenticated
    def get(self, username=None):
        if self.current_user != username:
            self.redirect('/login')
        frames = []
        content = []
        timestamp = time.time()
        if username:
            frames = Frames.get_by_username(username, active=True)
            content = Content.get_by_username(username)
        self.render(
            "index.html", user=username, frames=frames,
            content=content, timestamp=timestamp
        )


class FrameHandler(BaseHandler):

    def get(self, frame_id, username, framename):
        frame = Frames.get_by_id(frame_id)
        print(frame)
        if not frame:
            print("No frame, create it.")
            Frames.insert({
                "_id": frame_id,
                "owner": username,
                "name": framename,
                "users": [
                    username
                ],
                "settings": {
                    "visible": True
                }
            })
        self.render("frame.html", frame_id=frame_id)


class TestHandler(BaseHandler):

    def get(self):
        self.render("test.html")
