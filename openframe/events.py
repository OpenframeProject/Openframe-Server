# import tornado.websocket

class EventBus:
	subscribers = {}

	def subscribe(self, event, callback):
		if event in subscribers:
			subscribers[event].append(callback)
		else:
			subscribers[event] = [callback]

	def publish(self, event, *args):
		for subscriber in subscribers[event]:
			print("publishing " + event + " to subscriber")
			callback(*args)
