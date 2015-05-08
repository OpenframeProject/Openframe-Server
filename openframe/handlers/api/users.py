from openframe.handlers.base import BaseHandler

from tornado.escape import to_unicode, json_decode, json_encode
from bson.json_util import dumps
import tornado.web

# User REST Api
class UsersHandler(BaseHandler):
    def get(self, username=None):
        users = self.db.users
        if username:
            users_resp = users.find_one({"username": username})
        else:
            users_resp = users.find()
        self.write(dumps(users_resp))

    def post(self):
        print('create user')
        users = self.db.users
        doc = json_decode(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        user_id = users.insert(doc)
        if not user_id:
            res.success = False
        self.write(dumps(res))

    def put(self, username):
        print('NOT YET IMPLEMENTED')
        print('update user: ' + username)