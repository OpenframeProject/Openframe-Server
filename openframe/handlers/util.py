from bson.objectid import ObjectId


def _unify_ids(docs):
    """
    Turn all ObjectIds into strings.
    """

    def replace_id(doc):
        if '_id' in doc:
            if isinstance(doc['_id'], ObjectId):
                doc['_id'] = str(doc['_id'])

    # If this is a list
    if isinstance(docs, list):
        print('is list')
        for doc in docs:
            replace_id(doc)
    # If this is a single doc
    if isinstance(docs, dict):
        print('is dict')
        replace_id(docs)
