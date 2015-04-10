from motorengine.document import Document
from motorengine.fields import StringField, DateTimeField, URLField
from motorengine.fields.reference_field import ReferenceField
from model.user import User

class ContentItem(Document):
    url = URLField(required=True)
    user = ReferenceField(reference_document_type=User)
    email = StringField(required=False)