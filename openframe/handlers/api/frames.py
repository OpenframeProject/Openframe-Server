from tornado.escape import json_decode
from tornado.web import authenticated

from bson.json_util import dumps

from openframe.handlers.base import BaseHandler
from openframe.db.frames import Frames
from openframe.handlers.util import _unify_ids


class FramesHandler(BaseHandler):

    """
    endpoints for managing frames
    """
    @authenticated
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

    @authenticated
    def delete(self, frame_id):
        res = Frames.delete_by_id(frame_id)
        self.write(dumps(res.acknowledged))


class FramesByUserHandler(BaseHandler):

    """
    Get frames by username
    """
    @authenticated
    def get(self, username):
        connected = self.get_argument('connected', None)
        if username:
            resp = Frames.get_by_username(username, connected)
        else:
            print('username missing')
            resp = {'error': 'username required'}
        _unify_ids(resp)
        self.write(dumps(resp))


class FramesByOwnerHandler(BaseHandler):

    """
    Get frames by owner
    """
    @authenticated
    def get(self, owner):
        connected = self.get_argument('connected', None)
        resp = Frames.get_by_owner(owner, connected)
        _unify_ids(resp)
        self.write(dumps(resp))


class VisibleFramesHandler(BaseHandler):

    """
    endpoints for visible frames
    """
    @authenticated
    def get(self, frame_id=None):
        # frames = Frames.get_public(username=self.current_user)
        frames = Frames.get_public()
        _unify_ids(frames)
        self.write(dumps(frames))


class UpdateFrameContentHandler(BaseHandler):

    """
    Push content item to frame
    """
    @authenticated
    def get(self, frame_id, content_id):
        # publish an update content event, handled by the frame manager
        self.pubsub.publish(
            'frame:update_content', frame_id=frame_id, content_id=content_id)
