from functools import wraps
import os


def enforce_current_user(f):
    @wraps(f)
    def wrapper(self, request):
        try:
            key = request.META['HTTP_X_KEY']
        except KeyError:
            key = None
        if key and key == os.environ.get('KEY'):
            # Process the request
            f(self, request)
            return None
        # Redirect to Home Page
        return HttpResponsePermanentRedirect('http://google.com', status=301)
    return wrapper
