import Settings
from datetime import date
import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado import gen

@gen.coroutine
def start_ws(url):
    print("hello...")
    conn = yield tornado.websocket.websocket_connect(url, tornado.ioloop.IOLoop.instance())
    while True:
        msg = yield conn.read_message()
        if msg is None: break
        print(msg)



def main():
    start_ws("ws://localhost:8888/ws")
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()