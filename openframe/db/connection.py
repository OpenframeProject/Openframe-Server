from openframe import settings
from pymongo import MongoClient

# global db reference
mongo_client = MongoClient(settings.MONGO_HOST, settings.MONGO_PORT)
if settings.MONGO_AUTH:
    mongo_client.openframe.authenticate(
        settings.MONGO_USER, settings.MONGO_PASS, mechanism='MONGODB-CR')
db = mongo_client.openframe
