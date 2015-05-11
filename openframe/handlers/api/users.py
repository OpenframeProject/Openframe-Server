from openframe.handlers.base import BaseHandler
from openframe.db.users import Users

from tornado.escape import to_unicode, json_decode, json_encode
from bson.json_util import dumps
import tornado.web

# User REST Api
class UsersHandler(BaseHandler):
    def get(self, username=None):
        if username:
            users_resp = Users.getByUsername(username)
        else:
            users_resp = Users.getAll()
        self.write(dumps(users_resp))

    def post(self):
        print('create user')
        doc = json_decode(self.request.body.decode('utf-8'))
        user_id = Users.insert(doc)
        if not user_id:
            print('Problem inserting new user')
        self.write(dumps(res))

    def put(self, username):
        print('update user: ' + username)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Users.updateById(username, doc)
        if not result:
            print('Problem updating user')
        self.write(dumps(result))

    def delete(self, username):
        res = Users.deleteById(username)
        self.write(dumps(res.acknowledged))