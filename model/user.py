from motorengine.document import Document
from motorengine.fields import StringField, DateTimeField

class User(Document):
    username = StringField(required=True)
    email = StringField(required=False)