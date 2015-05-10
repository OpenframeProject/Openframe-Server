from openframe.handlers.base import BaseHandler

from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe.db.content import Content

# endpoints for managing frame content
class ContentHandler(BaseHandler):
    def get(self, content_id=None):
        content = self.db.content
        if content_id:
            print('get content: ' + content_id)
            content_resp = content.find_one({'_id': ObjectId(content_id)})
        else:
            content_resp = content.find()
        self.write(dumps(content_resp))
    
    def post(self):
        print('create content item')
        content = self.db.content
        doc = json_decode(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        content_id = content.insert(doc)
        if not content_id:
            res.success = False
        self.write(dumps(res))

    def put(self, content_id):
        print('NOT YET IMPLEMENTED')
        print('update content: ' + content_id)

    def delete(self, content_id=None):
        content = self.db.content
        res = {'success': True}
        if content_id:
            print('get content: ' + content_id)
            content_resp = content.remove({'_id': ObjectId(content_id)})
        else:
            res.success = False
        self.write(dumps(res))

# Get content by username
class ContentByUserHandler(BaseHandler):
    def get(self, username):
        resp = Content.getByUser(username)
        self.write(dumps(resp))