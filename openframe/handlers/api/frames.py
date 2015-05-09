from openframe.handlers.base import BaseHandler

from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
from bson.objectid import ObjectId
from bson.json_util import dumps

# endpoints for managing frames
class FramesHandler(BaseHandler):
    def get(self, frame_id=None):
        frames = self.db.frames
        if frame_id:
            print('get frame: ' + frame_id)
            frame_resp = frames.find_one({'_id': ObjectId(frame_id)})
        else:
            frame_resp = frames.find()
        self.write(dumps(frame_resp))
    
    def post(self):
        print('create frame item')
        frames = self.db.frames
        doc = json_decode(self.request.body.decode('utf-8'))
        print(doc)
        res = {'success': True}
        frame_id = frames.insert(doc)
        if not frame_id:
            res.success = False
        self.write(dumps(res))

    def put(self, frame_id):
        print('NOT YET IMPLEMENTED')
        print('update frame: ' + frame_id)

    def delete(self, frame_id=None):
        frames = self.db.frames
        res = {'success': True}
        if frame_id:
            print('get frames: ' + frame_id)
            frame_resp = frames.remove({'_id': ObjectId(frame_id)})
        else:
            res.success = False
        self.write(dumps(res))

# Get frames by username
class FramesByUserHandler(BaseHandler):
    def get(self, username):
        active = self.get_argument('active', None)
        query = {'users': username}
        if active:
            query['active'] = True if active == "true" else False
        frames = self.db.frames
        if not username:
            print('username missing')
            resp = {'error': 'username required'}
        else:
            resp = frames.find(query)
        self.write(dumps(resp))

# Get frames by owner
class FramesByOwnerHandler(BaseHandler):
    def get(self, username):
        frames = self.db.frames
        active = self.get_argument('active', None)
        query = {'owner': username}
        if active:
            query['active'] = True if active == "true" else False
        if not username:
            print('username missing')
            resp = {'error': 'username required'}
        else:
            resp = frames.find(query)
        self.write(dumps(resp))