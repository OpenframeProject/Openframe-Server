import Settings
from datetime import date
import tornado.escape
import tornado.ioloop
from tornado import gen
import tornado.web
import tornado.websocket
import json
import motor
from bson.objectid import ObjectId
from bson.json_util import dumps

# global db reference
db = motor.MotorClient().of_db

# dictionary containing refs to connected clients
clients = {}




# DB actions
@gen.coroutine
def do_insert(collection, doc):
    yield db[collection].insert(doc)

@gen.coroutine
def do_find_by_id(collection, id):
    yield db[collection].find_one({'_id': id})

@gen.coroutine
def do_find(collection, query):
    cursor = db[collection].find(query)
    for document in (yield cursor.to_list(length=100)):
        print(document)

@gen.coroutine
def do_update(collection, id, doc):
    coll = db[collection]
    result = yield coll.update({'_id': id}, {'$set': doc})
    print('updated', result['n'], 'document')
    new_document = yield coll.find_one({'_id': id})
    print('document is now', new_document)

@gen.coroutine
def do_remove(collection, id):
    coll = db[collection]
    n = yield coll.count()
    print(n, 'documents before calling remove()')
    result = yield coll.remove({'_id': id})
    print((yield coll.count()), 'documents after')




# Handlers
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("frame.html")


# endpoint for updating frame content
class UpdateFrameHandler(tornado.web.RequestHandler):
    # @tornado.web.asynchronous
    @gen.coroutine
    def get(self, username, content_id):
        if username in clients:
            print("username " + username + " connected")
            db = self.settings['db']
            content = yield db.content.find_one({'_id': ObjectId(content_id)})
            print(content)
            clients[username].write_message(dumps(content))
        else:
            print("username " + username + " not connected")


# endpoints for managing frame content
class ContentHandler(tornado.web.RequestHandler):
    def get(self, content_id):
        print('get content: ' + content_id)
        content = do_find_by_id("content", content_id)
        print(content)
    def post(self):
        print('create content')
        doc = json.loads(self.request.body.decode('utf-8'))
        do_insert('content', doc)
    def put(self, content_id):
        print('update content: ' + content_id)
        doc = json.loads(self.request.body.decode('utf-8'))
        do_update('content', content_id, doc)
        print(doc)


class VersionHandler(tornado.web.RequestHandler):
    def get(self):
        response = { 'version': '3.5.1',
                     'last_build':  date.today().isoformat() }
        self.write(response)


# Connect a client via websockets
class ClientConnectionHandler(tornado.websocket.WebSocketHandler):
    def open(self, username):
        print("WebSocket opened " + username)
        self.username = username
        clients[username] = self
        self.write_message("connected")

    def on_message(self, message):
        self.write_message(u"You said: " + message)

    def on_close(self):
        print("WebSocket closed")
        del clients[self.username]

    def check_origin(self, origin):
    	return True

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/frame", FrameHandler),
            (r"/update/(\w+)/(\w+)", UpdateFrameHandler),
            (r"/content", ContentHandler),
            (r"/content/(\w+)", ContentHandler),
            (r'/ws/(\w+)', ClientConnectionHandler),
            (r"/version", VersionHandler),
        ]

        settings = {
            "template_path": Settings.TEMPLATE_PATH,
            "static_path": Settings.STATIC_PATH,
            "db": db
        }
        
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
	application = Application()
	application.listen(8888)

	tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
	main()