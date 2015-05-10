from openframe.db.connection import db
from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument


class Content():
	collection = db.content

	@staticmethod
	def getAll():
		"""
		Get all content
		"""
		return Content.collection.find()

	@staticmethod
	def getById(content_id):
		"""
		Get content by id
		"""
		cid = content_id if not ObjectId.is_valid(content_id) else ObjectId(content_id)
		return Content.collection.find_one({'_id': cid})

	@staticmethod
	def getByUser(username):
		"""
		Get a list of content which user has access to
		"""
		query = {'users': username}
		return list(Content.collection.find(query))

	@staticmethod
	def insert(doc):
		"""
		Insert a doc into the content collection
		"""
		return Content.collection.insert_one(doc)

	@staticmethod
	def updateById(content_id, doc):
		"""
		Update content by id, returning the updated doc
		"""
		cid = content_id if not ObjectId.is_valid(content_id) else ObjectId(content_id)
		return Content.collection.find_one_and_update({"_id": cid}, {"$set": doc}, return_document=ReturnDocument.AFTER)

	@staticmethod
	def deleteById(content_id):
		"""
		Update content by id, returning the updated doc
		"""
		cid = content_id if not ObjectId.is_valid(content_id) else ObjectId(content_id)
		return Content.collection.delete_one({"_id": cid})
