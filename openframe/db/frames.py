from openframe.db.connection import db
from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument
from openframe.handlers.util import _unify_ids

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
		resp = Frames.collection.find_one({'_id': fid})
		_unify_ids(resp)
		return resp

	@staticmethod
	def getByUser(username, active=None):
		"""
		Get a list of frames which user has access to
		"""
		query = {'users': username}
		if active != None:
			query['active'] = active
		resp = list(Frames.collection.find(query))
		_unify_ids(resp)
		return resp

	@staticmethod
	def getByOwner(username, active=None):
		"""
		Get a list of frames which user owns
		"""
		query = {'owner': username}
		if active != None:
			query['active'] = active
		resp = list(Frames.collection.find(query))
		_unify_ids(resp)
		return resp

	@staticmethod
	def getVisible(active=None):
		"""
		Get a list of frames which user owns
		"""
		query = {'settings.visible': True}
		if active != None:
			query['active'] = active
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
	def updateById(frame_id, doc):
		"""
		Update a frame by id, returning the updated doc
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
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
	def updateByIds(frame_ids, doc):
		"""
		Update a group of frames, returning the updated list
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		# do not update the _id, ever.
		if '_id' in doc:
			del doc['_id']

		resp = Frames.collection.find_one_and_update(
			{"_id": fid},
			{"$set": doc},
			return_document=ReturnDocument.AFTER)
		_unify_ids(resp)
		return resp

	def updateMirroredContent(mirrored_frame_id, doc):
		"""
		Update a group of frames, returning the updated list
		"""
		#fid = mirrored_frame_id if not ObjectId.is_valid(mirrored_frame_id) else ObjectId(mirrored_frame_id)
		# do not update the _id, ever.

		resp = Frames.collection.update(
			{"mirroring": mirrored_frame_id},
			{"$set": doc},
			multi=True)
		_unify_ids(resp)
		return resp

	@staticmethod
	def deleteById(frame_id):
		"""
		Update a frame by id, returning the updated doc
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		resp = Frames.collection.delete_one({"_id": fid})
		_unify_ids(resp)
		return resp

	@staticmethod
	def updateMirroring(frame_id, mirroring_id):
		"""
		Set a frame to mirror another by id
		"""
		fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		mid = frame_id if not ObjectId.is_valid(mirroring_id) else ObjectId(mirroring_id)

		doc = {
			'mirroring': mid
		}

		resp = Frames.collection.find_one_and_update(
			{"_id": fid},
			{"$set": doc},
			return_document=ReturnDocument.AFTER)
		_unify_ids(resp)
		return resp

	def getMirroring(frame_id):
		"""
		Get a list of all the frames that are mirroring frame_id
		"""
		# fid = frame_id if not ObjectId.is_valid(frame_id) else ObjectId(frame_id)
		query = {'mirroring': frame_id}
		resp = list(Frames.collection.find(query))
		_unify_ids(resp)
		return resp