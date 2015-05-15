from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument

from openframe.db.connection import db
from openframe.db.frames import Frames


class Users():
    collection = db.users

    @staticmethod
    def getAll():
        """
        Get all users
        """
        return Users.collection.find()

    @staticmethod
    def getById(user_id):
        """
        Get user by id
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.find_one({'_id': cid})

    @staticmethod
    def getByUsername(username):
        """
        Get a user by username
        """
        query = {'username': username}
        return list(Users.collection.find(query))

    @staticmethod
    def getByFrameId(frame_id):
        """
        Get a list of users which have access this frame
        """
        frame = Frames.getById(frame_id)
        return frame.users

    @staticmethod
    def insert(doc):
        """
        Insert a doc into the users collection
        """
        return Users.collection.insert_one(doc)

    @staticmethod
    def updateById(user_id, doc):
        """
        Update user by id, returning the updated doc
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.find_one_and_update(
            {"_id": cid}, {"$set": doc}, return_document=ReturnDocument.AFTER)

    @staticmethod
    def deleteById(user_id):
        """
        Update user by id, returning the updated doc
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.delete_one({"_id": cid})
