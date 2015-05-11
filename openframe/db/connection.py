from openframe import settings
from pymongo import MongoClient

# global db reference
mongo_client = MongoClient(settings.MONGO_HOST, settings.MONGO_PORT)
db = mongo_client.openframe