"""
An extremely tiny pubsub module.
"""


class MicroPubSub():
    # A dictionary containing lists of callbacks subscribed to a given event.

    def __init__(self):
        self._subscribers = {}

    def subscribe(self, event, callback):
        """
        Subscribe the callback to the event.
        """
        if event in self._subscribers:
            self._subscribers[event].append(callback)
        else:
            self._subscribers[event] = [callback]

    def unsubscribe(self, event, callback):
        """
        Remove the subscription for the callback to the event.
        """
        if event in self._subscribers:
            self._subscribers[event] = [
                x for x in self._subscribers[event] if x != callback]

    def publish(self, event, *args, **kwargs):
        """
        Publish an event, passing positional and keyword arguments along to the callback.
        """
        if event in self._subscribers:
            for subscriber in self._subscribers[event]:
                subscriber(*args, **kwargs)
