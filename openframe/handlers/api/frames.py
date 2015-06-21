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
        if frame_id:
            print('get frame: ' + frame_id)
            frame_resp = Frames.get_by_id(frame_id)
        else:
            frame_resp = Frames.get_all()
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
        result = Frames.update_by_id(frame_id, doc)
        if not result:
            print('Problem updating frame')
        _unify_ids(result)
        self.write(dumps(result))

    def delete(self, frame_id):
        res = Frames.delete_by_id(frame_id)
        self.write(dumps(res.acknowledged))


class FramesByUserHandler(BaseHandler):

    """
    Get frames by username
    """

    def get(self, username):
        active = self.get_argument('active', None)
        if username:
            resp = Frames.get_by_username(username, active)
        else:
            print('username missing')
            resp = {'error': 'username required'}
        _unify_ids(resp)
        self.write(dumps(resp))


class FramesByOwnerHandler(BaseHandler):

    """
    Get frames by owner
    """

    def get(self, owner):
        active = self.get_argument('active', None)
        if owner:
            resp = Frames.get_by_owner(owner, active)
        else:
            print('owner missing')
            resp = {'error': 'owner required'}
        _unify_ids(resp)
        self.write(dumps(resp))


class VisibleFramesHandler(BaseHandler):

    """
    endpoints for visible frames
    """

    def get(self):
        frames = Frames.get_public()
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
