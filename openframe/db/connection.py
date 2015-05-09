from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps

# global db reference
mongo_client = MongoClient('localhost', 27017)
db = mongo_client.openframe