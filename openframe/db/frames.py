from openframe.db.connection import db
from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument


class Frames():
	collection = db.frames

	@staticmethod
	def getAll():
		"""
		Get all frames
		"""
		return Frames.collection.find()

	@staticmethod
	def getById(frame_id):
		"""
		Get a frame by id
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		return Frames.collection.find_one({'_id': fid})

	@staticmethod
	def getByUser(username, active=None):
		"""
		Get a list of frames which user has access to
		"""
		query = {'users': username}
		if active != None:
			query['active'] = active
		return list(Frames.collection.find(query))

	@staticmethod
	def getByOwner(username, active=None):
		"""
		Get a list of frames which user owns
		"""
		query = {'owner': username}
		if active != None:
			query['active'] = active
		return list(Frames.collection.find(query))

	@staticmethod
	def getVisible(active=None):
		"""
		Get a list of frames which user owns
		"""
		query = {'settings.visible': True}
		if active != None:
			query['active'] = active
		return list(Frames.collection.find(query))

	@staticmethod
	def insert(doc):
		"""
		Insert a doc into the frames collection
		"""
		return Frames.collection.insert_one(doc)

	@staticmethod
	def updateById(frame_id, doc):
		"""
		Update a frame by id, returning the updated doc
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		return Frames.collection.find_one_and_update({"_id": fid}, {"$set": doc}, return_document=ReturnDocument.AFTER)

	@staticmethod
	def deleteById(frame_id):
		"""
		Update a frame by id, returning the updated doc
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		return Frames.collection.delete_one({"_id": fid})
