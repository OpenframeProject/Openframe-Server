from openframe.handlers.base import BaseHandler
from openframe.db.content import Content

from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
from bson.objectid import ObjectId
from bson.json_util import dumps


# endpoints for managing frame content
class ContentHandler(BaseHandler):
    def get(self, content_id=None):
        if content_id:
            print('get content: ' + content_id)
            content_resp = content = Content.getById(content_id)
        else:
            content_resp = Content.getAll()
        self.write(dumps(content_resp))
    
    def post(self):
        print('create content item')
        doc = json_decode(self.request.body.decode('utf-8'))
        content_id = Content.insert(doc)
        if not content_id:
            print('problem inserting new content')
        self.write(dumps(doc))

    def put(self, content_id):
        print('update content: ' + content_id)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Content.updateById(content_id, doc)
        if not result:
            print('Problem updating content')
        self.write(dumps(result))

    def delete(self, content_id):
        res = Content.deleteById(content_id)
        self.write(dumps(res.acknowledged))

# Get content by username
class ContentByUserHandler(BaseHandler):
    def get(self, username):
        resp = Content.getByUser(username)
        self.write(dumps(resp))