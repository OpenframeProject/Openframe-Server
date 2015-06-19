from tornado.escape import json_decode
from bson.json_util import dumps

from openframe.handlers.base import BaseHandler
from openframe.db.frames import Frames
from openframe.handlers.util import _unify_ids


class FramesHandler(BaseHandler):

    """
    endpoints for managing frames
    """

    def get(self, frame_id=None):
        frames = self.db.frames
        if frame_id:
            print('get frame: ' + frame_id)
            frame_resp = Frames.getById(frame_id)
        else:
            frame_resp = frames.find()
        _unify_ids(frame_resp)
        self.write(dumps(frame_resp))

    def post(self):
        print('create frame item')
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Frames.insert(doc)
        if not result:
            print('Problem inserting new frame')
        _unify_ids(doc)
        self.write(dumps(doc))

    def put(self, frame_id):
        print('update frame: ' + frame_id)
        doc = json_decode(self.request.body.decode('utf-8'))
        result = Frames.updateById(frame_id, doc)
        if not result:
            print('Problem updating frame')
        _unify_ids(result)
        self.write(dumps(result))

    def delete(self, frame_id):
        res = Frames.deleteById(frame_id)
        self.write(dumps(res.acknowledged))


class FramesByUserHandler(BaseHandler):

    """
    Get frames by username
    """

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


class FramesByOwnerHandler(BaseHandler):

    """
    Get frames by owner
    """

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


class VisibleFramesHandler(BaseHandler):

    """
    endpoints for visible frames
    """

    def get(self):
        frames = Frames.getVisible()
        print(frames)
        _unify_ids(frames)
        self.write(dumps(frames))


class UpdateFrameContentHandler(BaseHandler):

    """
    Push content item to frame
    """

    def get(self, frame_id, content_id):
        # publish an update content event, handled by the frame manager
        self.pubsub.publish(
            'frame:update_content', frame_id=frame_id, content_id=content_id)
