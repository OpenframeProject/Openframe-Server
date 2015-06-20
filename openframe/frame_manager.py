from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe.db.frames import Frames
from openframe.db.content import Content
from openframe.handlers.util import _unify_ids


class FrameManager():

    def __init__(self, application):
        self.frames = {}
        self._application = application

        self.pubsub.subscribe(
            'frame:connected', self.add_frame_connection)

        self.pubsub.subscribe(
            'frame:disconnected', self.remove_frame_connection)

        self.pubsub.subscribe(
            'frame:update_content', self.update_frame_content)

        self.pubsub.subscribe(
            'frame:mirror_frame', self.mirror_frame)

    @property
    def application(self):
        return self._application

    @property
    def pubsub(self):
        return self.application.pubsub

    def add_frame_connection(self, frame_ws):
        print('FrameManager::add_frame_connection: ' + frame_ws.frame_id)
        self.frames[frame_ws.frame_id] = frame_ws

        # If the connected frame has current content set, send it along
        # TODO: eventually the frame will store its own latest content state
        if 'current_content' in frame_ws.frame:
            content_id = frame_ws.frame['current_content']['_id']
            self.update_frame_content(
                frame_ws.frame_id,
                content_id,
                cancel_mirroring=False)

    def remove_frame_connection(self, frame_ws):
        print('FrameManager::remove_frame_connection: ' + frame_ws.frame_id)
        del self.frames[frame_ws.frame_id]

    def update_frame_content(self, frame_id, content_id, cancel_mirroring=True):
        print(content_id)

        # update the current_content on the frame in the db

        # get content
        content = Content.getById(content_id)
        _unify_ids(content)

        doc = {
            'current_content': content
        }

        if (cancel_mirroring):
            doc['mirroring'] = None
            doc['mirror_meta'] = {}

        # update frame in db to reflect current content
        frame = Frames.updateById(
            frame_id, doc)

        # update all frames which mirror this one
        Frames.updateMirroredContent(frame_id, {'current_content': content})

        # publish frame:content_updated event, handled in admin_manager
        self.pubsub.publish(
            'frame:content_updated', frame=frame)

        # get all frames mirroring frame_id
        mirroring_frames = Frames.getMirroring(frame_id)

        # push the new content out to admins (handled in admin_manager)
        for mirroring_frame in mirroring_frames:
            self.pubsub.publish(
                'frame:content_updated', frame=mirroring_frame)

        # get a list of the mirroring frames' _ids
        _unify_ids(mirroring_frames)
        mirroring_ids = [o['_id'] for o in mirroring_frames]

        # push the content out to any connected mirroring frames
        for _id in mirroring_ids:
            if _id in self.frames:
                self.frames[_id].send('frame:update_content', content)

        # send content to frame if frame connected
        if frame_id in self.frames:
            self.frames[frame_id].send('frame:update_content', content)

    def mirror_frame(self, frame_id, mirrored_frame_id):
        """
        Set a frame to mirror another frame.

        Returns the from which is mirroring the other.
        """
        mirrored_frame = Frames.getById(mirrored_frame_id)
        content = mirrored_frame['current_content']

        doc = {
            'mirroring': mirrored_frame_id,
            'mirror_meta': {
                'name': mirrored_frame['name'],
                'owner': mirrored_frame['owner']
            },
            'current_content': content
        }

        frame = Frames.updateById(frame_id, doc)

        # publish frame:content_updated event
        self.pubsub.publish(
            'frame:content_updated', frame=frame)

        # send content to frame if frame connected
        if frame_id in self.frames:
            self.frames[frame_id].send('frame:update_content', content)
