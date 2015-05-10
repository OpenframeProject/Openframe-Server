from tornado.escape import to_unicode, json_decode, json_encode
import tornado.web
from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe.handlers.base import BaseHandler
from openframe.db.frames import Frames

# endpoints for managing frames
class FramesHandler(BaseHandler):
    def get(self, frame_id=None):
        frames = self.db.frames
        if frame_id:
            print('get frame: ' + frame_id)
            frame_resp = Frames.getById(frame_id)
        else:
            frame_resp = frames.find()
        self.write(dumps(frame_resp))
    
    def post(self):
        print('create frame item')
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Frames.insert(doc)
        if not result:
            print('Problem inserting new frame')
        self.write(dumps(doc))

    def put(self, frame_id):
        print('update frame: ' + frame_id)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Frames.updateById(frame_id, doc)
        if not result:
            print('Problem updating frame')
        self.write(dumps(result))

    def delete(self, frame_id):
        res = Frames.deleteById(frame_id)
        self.write(dumps(res.acknowledged))

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