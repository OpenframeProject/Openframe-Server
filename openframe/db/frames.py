from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument

from openframe.db.connection import db
from openframe.handlers.util import _unify_ids


class Frames():
    collection = db.frames

    @staticmethod
    def get_all():
        """
        Get all frames
        """
        return Frames.collection.find()

    @staticmethod
    def get_by_id(frame_id):
        """
        Get a frame by id
        """
        fid = frame_id if not ObjectId.is_valid(
            frame_id) else ObjectId(frame_id)
        resp = Frames.collection.find_one({'_id': fid})
        _unify_ids(resp)
        return resp

    @staticmethod
    def get_by_username(username, connected=None):
        """
        Get a list of frames which user has access to
        """
        query = {'users': username}
        if connected is not None:
            query['connected'] = connected
        resp = list(Frames.collection.find(query))
        _unify_ids(resp)
        return resp

    @staticmethod
    def get_by_owner(username, connected=None):
        """
        Get a list of frames which user owns
        """
        query = {'owner': username}
        if connected is not None:
            query['connected'] = connected
        resp = list(Frames.collection.find(query))
        _unify_ids(resp)
        return resp

    @staticmethod
    def get_public(connected=None, username=None):
        """
        Get a list of frames which are publicly visible (for mirroring)
        """
        # Only return frames that are not mirroring another frame.
        query = {
            'settings.visible': True,
            '$or': [
                {
                    'mirroring': {
                        '$exists': False
                    }
                },
                {
                    'mirroring': None
                }
            ]
        }
        if username is not None:
            # don't include public frames for the supplied username
            query['users'] = {'$ne': username}
        if connected is not None:
            # only select connected frames
            query['connected'] = connected
        resp = list(Frames.collection.find(query))
        _unify_ids(resp)
        return resp

    @staticmethod
    def insert(doc):
        """
        Insert a doc into the frames collection
        """
        return Frames.collection.insert_one(doc)

    @staticmethod
    def update_by_id(frame_id, doc):
        """
        Update a frame by id, returning the updated doc
        """
        fid = frame_id if not ObjectId.is_valid(
            frame_id) else ObjectId(frame_id)
        # do not update the _id, ever.
        if '_id' in doc:
            del doc['_id']

        resp = Frames.collection.find_one_and_update(
            {"_id": fid},
            {"$set": doc},
            return_document=ReturnDocument.AFTER)
        _unify_ids(resp)
        return resp

    @staticmethod
    def update_mirroring_frames(mirrored_frame_id, doc):
        """
        Update a group of frames, returning the updated list
        """
        print('Frames::update_mirroring_frames')
        # batch update all frames mirroring `mirrored_frame_id`
        Frames.collection.update(
            {"mirroring": mirrored_frame_id},
            {"$set": doc},
            multi=True)

        # fetch the corresponding frames and return them.
        return Frames.get_mirroring(mirrored_frame_id)

    @staticmethod
    def delete_by_id(frame_id):
        """
        Update a frame by id, returning the updated doc
        """
        fid = frame_id if not ObjectId.is_valid(
            frame_id) else ObjectId(frame_id)
        resp = Frames.collection.delete_one({"_id": fid})
        return _unify_ids(resp)

    @staticmethod
    def update_mirroring(frame_id, mirroring_id):
        """
        Set a frame to mirror another by id
        """
        fid = frame_id if not ObjectId.is_valid(
            frame_id) else ObjectId(frame_id)
        mid = frame_id if not ObjectId.is_valid(
            mirroring_id) else ObjectId(mirroring_id)

        doc = {
            'mirroring': mid
        }

        resp = Frames.collection.find_one_and_update(
            {"_id": fid},
            {"$set": doc},
            return_document=ReturnDocument.AFTER)

        return _unify_ids(resp)

    @staticmethod
    def get_mirroring(frame_id):
        """
        Get a list of all the frames that are mirroring frame_id
        """
        query = {'mirroring': frame_id}
        resp = list(Frames.collection.find(query))
        return _unify_ids(resp)

    @staticmethod
    def get_mirroring_count(frame_id):
        """
        Get a count of all the frames that are mirroring frame_id
        """
        query = {'mirroring': frame_id}
        return Frames.collection.count(query)

    @staticmethod
    def update_mirroring_count(frame_id):
        """
        Update the count of all the frames that are mirroring frame_id
        """
        count = Frames.get_mirroring_count(frame_id)
        doc = {
            'mirroring_count': count
        }
        return Frames.update_by_id(frame_id, doc)
