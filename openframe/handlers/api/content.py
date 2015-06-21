from tornado.escape import json_decode
from bson.json_util import dumps

from openframe.handlers.base import BaseHandler
from openframe.db.content import Content
from openframe.handlers.util import _unify_ids


# endpoints for managing frame content


class ContentHandler(BaseHandler):

    def get(self, content_id=None):
        if content_id:
            print('get content: ' + content_id)
            content_resp = Content.get_by_id(content_id)

        else:
            content_resp = Content.get_all()
        _unify_ids(content_resp)
        self.write(dumps(content_resp))

    def post(self):
        print('create content item')
        doc = json_decode(self.request.body.decode('utf-8'))
        content_id = Content.insert(doc)
        if not content_id:
            print('problem inserting new content')
        _unify_ids(doc)
        self.write(dumps(doc))

    def put(self, content_id):
        print('update content: ' + content_id)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Content.update_by_id(content_id, doc)
        if not result:
            print('Problem updating content')
        _unify_ids(result)
        self.write(dumps(result))

    def delete(self, content_id):
        res = Content.delete_by_id(content_id)
        self.write(dumps(res.acknowledged))

# Get content by username


class ContentByUserHandler(BaseHandler):

    def get(self, username):
        content_resp = Content.get_by_username(username)
        #_unify_ids(content_resp)
        print(username)
        print(content_resp)
        self.write(dumps(content_resp))
