from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument

from openframe.db.connection import db
from openframe.handlers.util import _unify_ids


class Content():
    collection = db.content

    @staticmethod
    def get_all():
        """
        Get all content
        """
        return Content.collection.find()

    @staticmethod
    def get_by_id(content_id):
        """
        Get content by id
        """
        cid = content_id
        # if content_id is valid ObjectId, assume it is one
        # and find using an ObjectId
        if ObjectId.is_valid(content_id):
            cid = ObjectId(content_id)
        resp = Content.collection.find_one({'_id': cid})
        return _unify_ids(resp)

    @staticmethod
    def get_by_username(username):
        """
        Get a list of content which user has access to
        """
        query = {'users': username}
        resp = list(Content.collection.find(query))
        return _unify_ids(resp)

    @staticmethod
    def insert(doc):
        """
        Insert a doc into the content collection
        """
        resp = Content.collection.insert_one(doc)
        return _unify_ids(resp)

    @staticmethod
    def update_by_id(content_id, doc):
        """
        Update content by id, returning the updated doc
        """
        cid = content_id
        # if content_id is valid ObjectId, assume it is one
        # and find using an ObjectId
        if ObjectId.is_valid(content_id):
            cid = ObjectId(content_id)
        resp = Content.collection.find_one_and_update(
            {"_id": cid}, {"$set": doc}, return_document=ReturnDocument.AFTER)
        return _unify_ids(resp)

    @staticmethod
    def delete_by_id(content_id):
        """
        delete content by id, returning the updated doc
        """
        cid = content_id
        # if content_id is valid ObjectId, assume it is one
        # and find using an ObjectId
        if ObjectId.is_valid(content_id):
            cid = ObjectId(content_id)
        return Content.collection.delete_one({"_id": cid})
