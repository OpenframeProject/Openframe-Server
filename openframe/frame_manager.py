from bson.objectid import ObjectId
from bson.json_util import dumps

from openframe.db.frames import Frames
from openframe.db.content import Content
from openframe.handlers.util import _unify_ids


class FrameManager():

    def __init__(self, application):
        self.frames = {}
        self._application = application

        # Frame events
        self.pubsub.subscribe(
            'frame:connected', self.handle_add_frame_connection)

        self.pubsub.subscribe(
            'frame:disconnected', self.handle_remove_frame_connection)

        self.pubsub.subscribe(
            'frame:update_frame', self.handle_update_frame)

        self.pubsub.subscribe(
            'frame:mirror_frame', self.handle_mirror_frame)

        # Admin events
        self.pubsub.subscribe(
            'admin:connected', self.handle_admin_connected)

    @property
    def application(self):
        return self._application

    @property
    def pubsub(self):
        return self.application.pubsub

    def handle_add_frame_connection(self, frame_ws):
        """
        Handles frame:connected event. Should add the new frame connection
        to the in-memory connected frame list.

        @param frame_ws - a reference to the websocket connection object
        """
        print('FrameManager::handle_add_frame_connection: ' +
              frame_ws.frame_id)

        # mark frame "connected" in DB then attach the frame object to
        # the websocket connection object for easy access later
        frame_ws.frame = Frames.update_by_id(frame_ws.frame_id,
                                             {"connected": True})

        frame_ws.frame = Frames.get_by_id(frame_ws.frame_id)

        # add the frame websocket connection to the in-memory list of frames
        self.frames[frame_ws.frame_id] = frame_ws

        # If the connected frame has current content set, send it along
        if 'current_content' in frame_ws.frame:
            # send content to frame if frame connected
            self.frames[frame_ws.frame_id].send(
                'frame:update_content',
                frame_ws.frame['current_content'])

    def handle_remove_frame_connection(self, frame_ws):
        """
        Handles frame:disconnected event. Should remove the frame
        from the in-memory connected frame list.
        """
        print('FrameManager::handle_remove_frame_connection: ' +
              frame_ws.frame_id)

        # mark frame "connected: false" in DB then attach the frame object to
        # the websocket connection object for easy access later
        frame_ws.frame = Frames.update_by_id(frame_ws.frame_id,
                                             {"connected": False})

        del self.frames[frame_ws.frame_id]

    def handle_update_frame(self, frame):
        """
        Persist the frame, publish the update out to connected
        frames (the frame and all mirroring) and admins
        """
        frame = Frames.update_by_id(frame['_id'], frame)

        # if the mirroring frame was mirroring a different frame,
        # update the previous frame's mirror count
        previous_mirroring_id = None
        if 'mirroring' in frame and frame['mirroring'] is not None:
            previous_mirroring_id = frame['mirroring']

        # set the current content for updating frame
        doc = {
            'current_content': frame['current_content']
        }

        # kick off the recursive content updates down the mirror graph
        self.update_mirroring_frames(frame, doc, root=True)

        # if the frame was mirroring a different frame,
        # update the previous frame's mirroring count
        if previous_mirroring_id:
            Frames.update_mirroring_count(previous_mirroring_id)
            self.pubsub.publish(
                'frame:frame_updated', frame_id=previous_mirroring_id)

    def handle_mirror_frame(self, frame_id, mirrored_frame_id):
        """
        Set a frame to mirror another frame.

        Returns the from which is mirroring the other.
        """

        # if the mirroring frame was mirroring a different frame,
        # update the previous frame's mirror count
        previous_mirroring_id = None
        frame = Frames.get_by_id(frame_id)
        if 'mirroring' in frame and frame['mirroring'] is not None:
            previous_mirroring_id = frame['mirroring']

        mirrored_frame = Frames.get_by_id(mirrored_frame_id)
        content = mirrored_frame['current_content']

        doc = {
            'mirroring': mirrored_frame_id,
            'mirror_meta': {
                'name': mirrored_frame['name'],
                'owner': mirrored_frame['owner']
            },
            'current_content': content
        }

        # update this frame to mirror mirrored_frame_id
        frame = Frames.update_by_id(frame_id, doc)

        # if set, update the previously mirrored frame
        if previous_mirroring_id:
            Frames.update_mirroring_count(previous_mirroring_id)
            self.pubsub.publish(
                'frame:frame_updated', frame_id=previous_mirroring_id)

        # update the mirroring_count on the newly mirrored frame
        Frames.update_mirroring_count(mirrored_frame_id)
        self.pubsub.publish(
            'frame:frame_updated', frame_id=mirrored_frame_id)

        # kick off the recursive content updates down the mirror graph
        self.update_mirroring_frames(frame, doc)

    def update_mirroring_frames(self, frame, doc, root=False):
        # if this is a content update, it should become the root.
        # i.e we want to reset its mirroring data
        if (root):
            doc['mirroring'] = None
            doc['mirror_meta'] = {}
            # if root, update frame in db
            frame = Frames.update_by_id(frame['_id'], doc)

        # aside from the root save, make sure we're not changing any
        # mirroring settings on the frames -- just content
        if 'mirroring' in doc:
            del doc['mirroring']
        if 'mirror_meta' in doc:
            del doc['mirror_meta']

        # publish frame:frame_updated event, handled in admin_manager
        # (sends changes out to connected admins who are users of this frame)
        self.pubsub.publish(
            'frame:frame_updated', frame=frame)

        # if this frame is connected, push out the new content to it
        self.update_frame_content(frame, doc['current_content'])

        # update all frames which are mirroring this one in batch fashion
        mirroring_frames = Frames.update_mirroring_frames(
            frame['_id'], doc)

        # for each frame that was mirrored, do it all again
        # at each leaf on the tree mirroring_frames should be
        # an empty list, halting recursion
        for frame in mirroring_frames:
            self.update_mirroring_frames(frame, doc)

    def update_frame_content(self, frame, content):
        if frame['_id'] in self.frames:
            self.frames[frame['_id']].send('frame:update_content',
                                           content)

    def handle_admin_connected(self, admin_ws):
        """
        When a new admin connects, clean up the 'connected' statuses of
        the user's frames.
        """
        user_frames = Frames.get_by_username(admin_ws.user['username'])
        # iterate through all user's frames and update the connected flag
        for frame in user_frames:
            if frame['_id'] in self.frames:
                # the frame is connected
                if 'connected' not in frame or frame['connected'] is False:
                    # but isn't marked so in the db, set it.
                    frame = Frames.update_by_id(
                        frame['_id'], {'connected': True})
            else:
                # the frame is NOT connected
                if 'connected' not in frame or frame['connected'] is True:
                    # but is marked so in the db, set it.
                    frame = Frames.update_by_id(
                        frame['_id'], {'connected': False})
