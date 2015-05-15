
class FrameManager():

    def __init__(self):
        self.frames = {}

    def addFrameConnection(self, frame_ws):
        print('FrameManager::addFrameConnection: ' + frame_ws.frame_id)
        # frame_conn = FrameConnection(frame_ws)
        # No need for wrapper object, just store ref to websocket connection
        self.frames[frame_ws.frame_id] = frame_ws

    def removeFrameConnection(self, frame_ws):
        print('FrameManager::removeFrameConnection: ' + frame_ws.frame_id)
        del self.frames[frame_ws.frame_id]
