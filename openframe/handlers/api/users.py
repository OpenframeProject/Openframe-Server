import tornado.web
from tornado.escape import json_decode
from tornado.web import authenticated

from bson.json_util import dumps
from openframe.handlers.base import BaseHandler
from openframe.db.users import Users


# User REST Api
class UsersHandler(BaseHandler):

    @authenticated
    def get(self, username=None):
        if username:
            users_resp = Users.get_by_username(username)
        else:
            users_resp = Users.getAll()
        if users_resp is not None:
            self.write(dumps(users_resp))
        else:
            raise tornado.web.HTTPError(404)

    @authenticated
    def post(self):
        print('create user')
        doc = json_decode(self.request.body.decode('utf-8'))
        user_id = Users.insert(doc)
        if not user_id:
            print('Problem inserting new user')
        self.write(dumps(res))

    @authenticated
    def put(self, username):
        print('update user: ' + username)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Users.updateById(username, doc)
        if not result:
            print('Problem updating user')
        self.write(dumps(result))

    @authenticated
    def delete(self, username):
        res = Users.deleteById(username)
        self.write(dumps(res.acknowledged))
