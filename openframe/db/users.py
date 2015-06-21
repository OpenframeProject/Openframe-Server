import hashlib
import uuid

from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument

from openframe.db.connection import db
from openframe.db.frames import Frames


class Users():
    collection = db.users

    default_projection = ['_id', 'username']

    @staticmethod
    def get_all():
        """
        Get all users
        """
        return Users.collection.find(projection=Users.default_projection)

    @staticmethod
    def get_by_id(user_id):
        """
        Get user by id
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.find_one({'_id': cid},
                                         projection=Users.default_projection)

    @staticmethod
    def get_by_username(username, projection=None):
        """
        Get a user by username
        """
        query = {'username': username}
        projection = projection if projection else Users.default_projection
        return Users.collection.find_one(query,
                                         projection=projection)

    @staticmethod
    def get_by_frame_id(frame_id):
        """
        Get a list of users which have access this frame
        """
        frame = Frames.get_by_id(frame_id)
        users = Users.collection.find({'username': {'$in': frame['users']}})
        return users

    @staticmethod
    def create_user(username, password):
        """
        Given a username and password, hash the password and insert it.
        """
        if Users._check_existing(username):
            return False

        password_bytes = password.encode('utf-8')
        salt_bytes = uuid.uuid4().bytes
        hashed_password = hashlib.sha512(
            password_bytes + salt_bytes).hexdigest()
        user = {
            "username": username,
            "salt": salt_bytes,
            "password": hashed_password
        }
        return Users.insert(user)

    @staticmethod
    def insert(doc):
        """
        Insert a doc into the users collection
        """
        return Users.collection.insert_one(doc)

    @staticmethod
    def update_by_id(user_id, doc):
        """
        Update user by id, returning the updated doc
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.find_one_and_update(
            {"_id": cid}, {"$set": doc}, return_document=ReturnDocument.AFTER)

    @staticmethod
    def delete_by_id(user_id):
        """
        Update user by id, returning the updated doc
        """
        cid = user_id if not ObjectId.is_valid(user_id) else ObjectId(user_id)
        return Users.collection.delete_one({"_id": cid})

    @staticmethod
    def _check_existing(username):
        """
        Check if a user exists
        """
        user = Users.get_by_username(username)
        if user:
            return True
        else:
            return False
