(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/keymirror/index.js":[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict";

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('keyMirror(...): Argument must be an object.');
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
	Socker = require('../api/Socker');

var endpoints = {
	all_content: '/content/user/' + OF_USERNAME
}

var ContentActions = {

	/**
	 * Fetch the content asynchronously from the server.
	 */
	loadContent: function() {
		console.log('ContentActions.loadContents()');
		// dispatch an action indicating that we're loading the content
		AppDispatcher.handleViewAction({
			actionType: OFConstants.CONTENT_LOAD
		});

		// fetch the content
		$.getJSON(endpoints.all_content)
			.done(function(content) {
				// load success, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.CONTENT_LOAD_DONE,
					content: content
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.CONTENT_LOAD_FAIL,
					err: err
				});
			});
	},

	/**
	 * Add a new content item. Performs server request.
	 * @param  {object} content
	 */
	addContent: function(content) {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.CONTENT_ADD,
			content: content
		});
		$.ajax({
            url: '/content',
            method: 'POST',
            data: JSON.stringify(content),
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            AppDispatcher.handleServerAction({
				actionType: OFConstants.CONTENT_ADD_DONE,
				content: resp
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.handleServerAction({
				actionType: OFConstants.CONTENT_ADD_FAIL,
				content: content
			});
        });
	},

	/**
	 * Remove a content item. Performs server request.
	 * @param  {object} content
	 */
	removeContent: function(content) {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.CONTENT_REMOVE,
			content: content
		});
		$.ajax({
            url: '/content/' + content._id,
            method: 'DELETE',
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            AppDispatcher.handleViewAction({
				actionType: OFConstants.CONTENT_REMOVE_DONE
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.handleViewAction({
				actionType: OFConstants.CONTENT_REMOVE_FAIL,
				content: content
			});
        });
	},

	slideChanged: function(content_id) {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.CONTENT_SLIDE_CHANGED,
			content_id: content_id
		});
	}


}

module.exports = ContentActions;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
	Socker = require('../api/Socker'),
	FrameStore = require('../stores/FrameStore'),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var endpoints = {
	users_frames: '/frames/user/' + OF_USERNAME,
	visible_frames: '/frames/visible?v=1'
}

var FrameActions = {

	/**
	 * Fetch the frames asynchronously from the server.
	 * @return {[type]} [description]
	 */
	loadFrames: function() {
		console.log('FrameActions.loadFrames()');
		// dispatch an action indicating that we're loading the frames
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_LOAD
		});

		// fetch the frames
		$.getJSON(endpoints.users_frames)
			.done(function(frames) {
				console.log('frames: ', frames);
				// load success, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.FRAME_LOAD_DONE,
					frames: frames
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.FRAME_LOAD_FAIL,
					err: err
				});
			});
	},

	/**
	 * Fetch all frames marked 'visible'
	 * @return {[type]} [description]
	 */
	loadVisibleFrames: function() {
		// dispatch an action indicating that we're loading the visible frames
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_LOAD_VISIBLE
		});

		// fetch the visible frames
		$.getJSON(endpoints.visible_frames)
			.done(function(frames) {
				console.log('frames: ', frames);
				// load success, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.FRAME_LOAD_VISIBLE_DONE,
					frames: frames
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.FRAME_LOAD_VISIBLE_FAIL,
					err: err
				});
			});
	},

	/**
	 * Select a frame.
	 * @param  {object} frame
	 */
	select: function(frame) {
		console.log('select', frame);
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SELECT,
			frame: frame
		});
	},

	/**
	 * Update the content on the selected frame.
	 * @param  {object} content
	 */
	updateContent: function(content) {
		var frame = FrameStore.getSelectedFrame();
        frame.current_content = content;
        var data = {
            frame: frame
        };
        Socker.send('frame:update_frame', data);
	},

    mirrorFrame: function(mirrored_frame) {
        var frame = FrameStore.getSelectedFrame();
        var data = {
            frame_id: frame._id,
            mirrored_frame_id: mirrored_frame._id
        };
        Socker.send('frame:mirror_frame', data)
    },

	saveFrame: function(frame) {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SAVE,
			frame: frame
		});

        // hack so that selected doesn't get persisted
        frame.selected = false;
		$.ajax({
            url: '/frames/'+frame._id,
            method: 'PUT',
            data: JSON.stringify(frame),
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            AppDispatcher.handleServerAction({
				actionType: OFConstants.FRAME_SAVE_DONE,
				frame: frame
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.handleServerAction({
				actionType: OFConstants.FRAME_SAVE_FAIL,
				frame: frame
			});
        }).always(function() {
            frame.selected = true;
        });
	},

	frameConnected: function(frame) {
		console.log('Frame Connected: ', frame);
		AppDispatcher.handleServerAction({
			actionType: OFConstants.FRAME_CONNECTED,
			frame: frame
		});
	},

	frameDisconnected: function(frame) {
		console.log('Frame disconnected: ', frame);
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_DISCONNECTED,
			frame: frame
		});
	},

	frameContentUpdated: function(frame) {
		console.log('Frame Content updated: ', frame);
		AppDispatcher.handleServerAction({
			actionType: OFConstants.FRAME_CONTENT_UPDATED,
			frame: frame
		});
	},

    frameUpdated: function(frame) {
        console.log('Frame Updated: ', frame);
        AppDispatcher.handleServerAction({
            actionType: OFConstants.FRAME_UPDATED,
            frame: frame
        });
    },

    frameMirrored: function(frame) {
        console.log('Frame mirrored: ', frame);
        AppDispatcher.handleServerAction({
            actionType: OFConstants.FRAME_MIRRORED,
            frame: frame
        });
    },

	setup: function(data) {
		var frame = data.frame;
        console.log('Frame Setup', frame);
        // this is a little weird -- why isn't setup just part of the initial
        // connected event?
        AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_CONNECTED,
			frame: frame
		});
    },

    /**
     * Really? Does the view dimension need to be part of the state?
     * Probable not. Not used presently.
     *
     * @param  {[type]} w [description]
     * @param  {[type]} h [description]
     * @return {[type]}   [description]
     */
    setupFrameView: function(w, h) {
    	AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SETUP_VIEW,
			w: w,
			h: h
		});
    },

    slideChanged: function(frame_id) {
        console.log('frame_id', frame_id);
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SLIDE_CHANGED,
			frame_id: frame_id
		});
	}

}

module.exports = FrameActions;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/PublicFrameActions.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

var endpoints = {
	users_frames: '/frames/user/' + OF_USERNAME,
	public_frames: '/frames/visible?v=1'
}

var PublicFrameActions = {

	/**
	 * Fetch all frames marked 'visible'
	 * @return {[type]} [description]
	 */
	loadPublicFrames: function() {
		// dispatch an action indicating that we're loading the visible frames
		AppDispatcher.handleViewAction({
			actionType: OFConstants.PUBLIC_FRAMES_LOAD
		});

		// fetch the visible frames
		$.getJSON(endpoints.public_frames)
			.done(function(frames) {
				console.log('frames: ', frames);
				// load success, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.PUBLIC_FRAMES_LOAD_DONE,
					frames: frames
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.handleServerAction({
					actionType: OFConstants.PUBLIC_FRAMES_LOAD_FAIL,
					err: err
				});
			});
	},

    /**
     * The selected public frame slide has changed.
     * @param  {String} frame_id
     */
    slideChanged: function(frame_id) {
        console.log('frame_id', frame_id);
		AppDispatcher.handleViewAction({
			actionType: OFConstants.PUBLIC_FRAMES_SLIDE_CHANGED,
			frame_id: frame_id
		});
	}

}

module.exports = PublicFrameActions;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    OFConstants = require('../constants/OFConstants'),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null)

var UIActions = {

    toggleMenu: function(open) {
        // if open true, open. if false, close.
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_MENU_TOGGLE,
            open: open
        });
    },

    toggleSettings: function(open) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_SETTINGS_TOGGLE,
            open: open
        });
    },

    setSelectionPanel: function(panel) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_SET_SELECTION_PANEL,
            panel: panel
        });
    },

    openAddContentModal: function() {
        console.log('openAddContentModal');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_ADD_CONTENT
        });
    },

    addContentModalClosed: function() {
        console.log('addContentModalClosed');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_ADD_CONTENT
        });
    },

    openSettingsModal: function() {
        console.log('openSettingsModal');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_SETTINGS
        });
    },

    settingsModalClosed: function() {
        console.log('settingsModalClosed');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_SETTINGS
        });
    },

    openPreview: function(frame) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_PREVIEW,
            frame: frame
        })
    },

    closePreview: function() {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_PREVIEW
        })
    }

}

module.exports = UIActions;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js":[function(require,module,exports){
Socker = (function() {
    var _self = {},
        _eventHandlers = {},
        _connected = false,
        _opts = {
            keepAlive: true,
            checkInterval: 10000
        },
        _url,
        _ws,
        _timer;

    /**
     * Create a websocket connection.
     * @param  {string} url  The server URL.
     * @param  {object} opts Optional settings
     */
    function _connect(url, opts) {
        _url = url;
        if (opts) _extend(_opts, opts);
        _ws = new WebSocket(url);

        _ws.onopen = function() {
            console.log('connection opened');
            _connected = true;
            if (_opts.onOpen) _opts.onOpen();
        };

        _ws.onclose = function() {
            console.log('connection closed');
            _connected = false;
            if (_opts.onClose) _opts.onClose();
        };

        _ws.onmessage = function(evt) {
            var message = JSON.parse(evt.data),
                name = message.name,
                data = message.data;

            console.log(message);

            if (_eventHandlers[name]) {
                // for each event handler, call the callback
                for (var i = 0; i < _eventHandlers[name].length; i++) {
                    _eventHandlers[name][i](data);
                }
            } else {
                console.log(name + " event not handled.");
            }
        };

        if (_opts.keepAlive) {
            clearInterval(_timer);
            _timer = setInterval(_checkConnection, _opts.checkInterval);
        }
    }

    /**
     * Add event handler
     * @param  {[type]}   name     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function _on(name, callback) {
        if (_eventHandlers[name]) {
            _eventHandlers[name].push(callback);
        } else {
            _eventHandlers[name] = [callback];
        }
    }

    /**
     * Remove event handler
     * @param  {[type]}   name     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function _off(name, callback) {
        if (_eventHandlers[name]) {
            var index = _eventHandlers[name].indexOf(callback);
            if (index > -1) {
                _eventHandlers[name].splice(index, 1);
            }
        } else {
            // do nothing
        }
    }

    /**
     * Send an event.
     * @param  {[type]} name [description]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    function _send(name, data) {
        var message = {
            name: name,
            data: data
        };

        _ws.send(JSON.stringify(message));
    }

    /**
     * Check if the connection is established. If not, try to reconnect.
     * @return {[type]} [description]
     */
    function _checkConnection() {
        if (!_connected) {
            _connect(_url, _opts);
        }
    }

    /**
     * Utility function for extending an object.
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    function _extend(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }


    _self.on = _on;
    _self.off = _off;
    _self.send = _send;
    _self.connect = _connect;
    return _self;
})();

// COMMON.JS
if (typeof module != 'undefined' && module.exports) module.exports = Socker;

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/browser_state_manager.js":[function(require,module,exports){
(function (global){
var ssm = (typeof window !== "undefined" ? window.ssm : typeof global !== "undefined" ? global.ssm : null)
	conf = require('./config');

function _initBrowserStateManagement() {
	console.log('_initBrowserStateManagement');

	_setupScreenSize();

	ssm.addState({
	    id: 'xs',
	    maxWidth: 767,
	    onEnter: function(){
	        console.log('enter xs');
	        conf.screen_size = 'xs';
	    }
	});

	ssm.addState({
	    id: 'sm',
	    minWidth: 768,
	    onEnter: function(){
	        console.log('enter sm');
	        conf.screen_size = 'sm';
	    }
	});

	ssm.addState({
	    id: 'md',
	    minWidth: 992,
	    onEnter: function(){
	        console.log('enter md');
	        conf.screen_size = 'md';
	    }
	});

	ssm.addState({
	    id: 'lg',
	    minWidth: 1200,
	    onEnter: function(){
	        console.log('enter lg');
	        conf.screen_size = 'lg';
	    }
	});	

	ssm.ready();
}

function _setupScreenSize() {
	conf.wW = window.innerWidth;
	conf.wH = window.innerHeight;
	console.log(conf);
}

module.exports = {
	init: _initBrowserStateManagement
}



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./config":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    ContentActions = require('../actions/ContentActions');

var AddContentForm = React.createClass({displayName: "AddContentForm",
    handleFormSubmit: function(e) {
        e.preventDefault();
        var url = React.findDOMNode(this.refs.URL).value;

        if (!url) return;

        var content = {
            url: url,
            users: [OF_USERNAME]
        };
        console.log('submitting content: ', content);
        ContentActions.addContent(content);

        React.findDOMNode(this.refs.URL).value = '';
        React.findDOMNode(this.refs.URL).focus();
    },
	render: function() {
		return (
			React.createElement("div", {className: "row hidden-xs add-content"}, 
                React.createElement("form", {className: "form-inline", id: "add-form", onSubmit: this.handleFormSubmit}, 
                    React.createElement("div", {className: "form-group"}, 
                        /* <label for="SendToUser">URL</label> */
                        React.createElement("div", {className: "col-md-10"}, 
                            React.createElement("input", {type: "text", className: "form-control", id: "URL", placeholder: "enter URL", ref: "URL"})
                        ), 
                        React.createElement("div", {className: "col-md-2"}, 
                            React.createElement("button", {className: "btn btn-default btn-add-content", href: "#add-content", id: "add-content-button"}, "Add Content")
                        )
                    )
                )
            )
		);
	}

});

module.exports = AddContentForm;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	UIActions = require('../actions/UIActions'),
	ContentActions = require('../actions/ContentActions'),
	UIStore = require('../stores/UIStore'),
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var AddContentModal = React.createClass({displayName: "AddContentModal",
	getInitialState: function() {
		return {
			addOpen: false
		}
	},

	getDefaultProps: function() {
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
        var that = this;
        $(this.refs.modal.getDOMNode()).on('hidden.bs.modal', function() {
        	console.log('hidden.bs.modal');
        	that._resetForm();
        	UIActions.addContentModalClosed();
        });

        // Vertically center modals
		/* center modal */
		function centerModals(){
		    $('.modal').each(function(i){
		        var $clone = $(this).clone().css('display', 'block').appendTo('body');
		        var top = Math.round(($clone.height() - $clone.find('.modal-content').height()) / 2);
		        top = top > 0 ? top : 0;
		        $clone.remove();
		        $(this).find('.modal-content').css("margin-top", top);
		    });
		}
		$(this.refs.modal.getDOMNode()).on('show.bs.modal', centerModals);
		// $(window).on('resize', centerModals);
    },

    componentWillUnount: function() {
        UIStore.removeChangeListener(this._onChange);
        $(this.refs.modal.getDOMNode()).off('hidden.bs.modal');
    },

	_handleAddContent: function() {
		var url = this.refs.url.getDOMNode().value,
			tags = this.refs.tags.getDOMNode().value;

		if (!url.trim()) {
			return;
		}

		tags = tags.trim().split('#');

		_.remove(tags, function(tag) {
			return tag.trim() == '';
		});

		_.each(tags, function(tag, i) {
			tags[i] = tag.trim();
		});

		console.log(tags);

		var content = {
            url: url,
            users: [OF_USERNAME],
            tags: tags
        };
		ContentActions.addContent(content);

	},

	_handleOnFocus: function(e) {
		var el = e.currentTarget;
		if (el.value.trim() == '') {
			el.value = '#';
		}
	},

	_handleTagsChange: function(e) {
		var el = e.currentTarget,
			val = el.value;

		if (el.value == '') {
			el.value = '#';
		}

		if (val[val.length-1] === ' ') {
			el.value += '#'
		}
	},

	_handleKeyDown: function(e) {
		var val = e.currentTarget.value;
		if (val[0] != '#') {
			e.currentTarget.value = val = '#' + val;

		}
		if (e.key === 'Backspace' && val !== '#') {
			if (val[val.length - 1] === '#') {
				e.currentTarget.value = val.substring(0, val.length - 1);
			}
		}
	},

	_resetForm: function() {
		this.refs.url.getDOMNode().value = '';
		this.refs.tags.getDOMNode().value = '';
	},

	_onChange: function() {
        this.setState(UIStore.getAddModalState(), function() {
	        if (this.state.addOpen) {
	        	$(this.refs.modal.getDOMNode()).modal();
	        } else {
	        	$(this.refs.modal.getDOMNode()).modal('hide');
	        }
        });
    },

	render: function() {
		return (
			React.createElement("div", {className: "modal fade modal-add-content", ref: "modal"}, 
				React.createElement("div", {className: "modal-dialog"}, 
					React.createElement("div", {className: "modal-content"}, 
				  		React.createElement("div", {className: "modal-header"}, 
				    		React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-label": "Close"}, 
				    			React.createElement("span", {className: "icon-close", "aria-hidden": "true"})
			    			), 
					    	React.createElement("h4", {className: "modal-title"}, "Add Content")
					  	), 
						React.createElement("div", {className: "modal-body"}, 
							React.createElement("div", {className: "row row-form-field"}, 
				    			React.createElement("div", {className: "col-xs-12"}, 
						    		React.createElement("div", {className: "form-label"}, "Enter URL"), 
						    		React.createElement("div", {className: "form-input"}, 
						    			React.createElement("input", {ref: "url", type: "url", autoCapitalize: "off", placeholder: "http://..."})
						    		)
						    	)
					    	), 

					    	React.createElement("div", {className: "row row-form-field"}, 
				    			React.createElement("div", {className: "col-xs-12"}, 
						    		React.createElement("div", {className: "form-label"}, "Enter description with tags"), 
						    		React.createElement("div", {className: "form-input"}, 
						    			React.createElement("input", {ref: "tags", type: "text", 
						    					autoCapitalize: "off", 
						    					placeholder: "#photo #Rodchenko #1941", 
						    					onFocus: this._handleOnFocus, 
						    					onChange: this._handleTagsChange, 
						    					onKeyDown: this._handleKeyDown})
				    				)
				    			)
			    			)
				  		), 
				  		React.createElement("div", {className: "modal-footer"}, 
				    		React.createElement("button", {onClick: this._handleAddContent, type: "button", className: "btn btn-primary btn-add-content"}, 
				    			"Add To Collection"
				    		)
				  		)
					)
				)
			)
		);
	}

});

module.exports = AddContentModal;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),

	Nav = require('./Nav.js'),
	SimpleNav = require('./SimpleNav.js'),
	Frame = require('./Frame.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),
	PublicFramesList = require('./PublicFramesList.js'),
	FooterNav = require('./FooterNav.js'),
	Drawer = require('./Drawer.js'),
	AddContentModal = require('./AddContentModal.js'),
	SettingsModal = require('./SettingsModal.js'),
	FramePreview = require('./FramePreview.js'),

	AppDispatcher = require('../dispatcher/AppDispatcher'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore'),
	UIStore = require('../stores/UIStore'),

	Socker = require('../api/Socker'),

	conf = require('../config');

/**
 * The App is the root component responsible for:
 * - setting up structure of child components
 *
 * Individual components register for Store state change events
 */
var App = React.createClass({displayName: "App",
	getInitialState: function() {
		return {
			selectionPanel: "collection",
			frames: [],
            selectedFrame: {
                name: '',
				description: '',
				settings: {
					visible: true,
					rotation: 0
				},
                mirroring: null,
                mirroring_count: null,
                mirror_meta: {
                    name: '',
                    owner: ''
                }
            }
		};
	},

	componentWillMount: function() {
		if (!global.OF_USERNAME) {
			console.log('OF_USERNAME not defined.');
			return;
		}

		Socker.connect("ws://" + window.location.host + "/admin/ws/" + OF_USERNAME);

		// TODO: these should move to the corresponding Actions creator (e.g. FrameActions)
		Socker.on('frame:connected', FrameActions.frameConnected);
        Socker.on('frame:disconnected', FrameActions.frameDisconnected);
        Socker.on('frame:frame_updated', FrameActions.frameContentUpdated);
        Socker.on('frame:setup', FrameActions.setup);
	},

	componentDidMount: function() {
		UIStore.addChangeListener(this._onChange);
		FrameStore.addChangeListener(this._onChange);
		// kick off frame loading
		FrameActions.loadFrames();
	},

	componentWillUnmount: function() {
		UIStore.removeChangeListener(this._onChange);
		FrameStore.removeChangeListener(this._onChange);
	},

	/**
	 * Triggered from within settings modal
	 * @param  {[type]} settings [description]
	 */
	_saveFrame: function(settings) {
		FrameActions.saveFrame(this.state.selectedFrame);
	},

	/**
	 * Triggered by changes within settings modal.
	 * @param  {[type]} frame [description]
	 */
	_onSettingsChange: function(frame) {
		this.setState({
			selectedFrame: frame
		});
	},

	_onChange: function() {
		console.log('SELECTED FRAME: ', FrameStore.getSelectedFrame());
		this.setState({
			selectionPanel: UIStore.getSelectionPanelState(),
            frames: FrameStore.getAllFrames(),
            selectedFrame: FrameStore.getSelectedFrame()
        });
	},

  	render: function(){
  		var contentList = React.createElement(ContentList, null),
  			frameList = React.createElement(PublicFramesList, null);
  		var selectionPanel = this.state.selectionPanel === 'collection' ? contentList : frameList;
	    return (
			React.createElement("div", {className: "container app"}, 
				React.createElement(SimpleNav, {frames: this.state.frames, selectedFrame: this.state.selectedFrame}), 
				React.createElement(Frame, {frame: this.state.selectedFrame}), 
				React.createElement(TransferButtons, {panelState: this.state.selectionPanel}), 
				React.createElement("div", null, selectionPanel), 
				React.createElement(FooterNav, {ref: "navFooter"}), 
				React.createElement(Drawer, {
					frames: this.state.frames, 
					selectedFrame: this.state.selectedFrame}), 
				React.createElement(SettingsModal, {
					frame: this.state.selectedFrame, 
					onSaveSettings: this._saveFrame, 
					onSettingsChange: this._onSettingsChange}
				), 
				React.createElement(AddContentModal, null), 
				React.createElement(FramePreview, null)
			)
	    )
  	}
});

module.exports = App;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./AddContentForm.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./AddContentModal.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js","./ContentList.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./Drawer.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Drawer.js","./FooterNav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./FramePreview.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FramePreview.js","./Nav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./PublicFramesList.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/PublicFramesList.js","./SettingsModal.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js","./SimpleNav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js","./TransferButtons.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentItem.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var ContentItem = React.createClass({displayName: "ContentItem",
	_handleSlideClick: function(e) {
		console.log('slide click');
		// bit of a hack -- so we can use the FramePreview
        // component here. Preview should get refactored to be more generic.
		UIActions.openPreview({
            current_content: this.props.content
        });
	},
	render: function() {
		var content = this.props.content;
		return (
			React.createElement("div", {className: "swiper-slide content-slide", "data-contentid": content._id, onClick: this._handleSlideClick}, 
				React.createElement("img", {src: content.url})
			)
		);
	}
});

module.exports = ContentItem;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null),
    ContentItem = require('./ContentItem'),
    ContentActions = require('../actions/ContentActions'),
    UIActions = require('../actions/UIActions'),
    ContentStore = require('../stores/ContentStore'),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var ContentList = React.createClass({displayName: "ContentList",
    getInitialState: function() {
        return {
            content: []
        }
    },

    componentDidMount: function() {
        ContentActions.loadContent();
        ContentStore.addChangeListener(this._onChange);
        this._updateContainerDimensions();
    },

    componentWillUnmount: function() {
        console.log('componentDidUnmount');
        ContentStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {

    },

    _onChange: function() {
        this.setState({
            content: ContentStore.getContent()
        });

        // TODO: better React integration for the swiper

        this._initSlider();

        var content_id = this.state.content[0]._id;
    },

    _initSlider: function() {
        var el = React.findDOMNode(this.refs.Swiper);
        if (this.swiper) {
            this.swiper.destroy();
        }
        this.swiper = new Swiper(el, {
            slidesPerView: 3,
            spaceBetween: 50,
            centeredSlides: true,
            // freeMode: true,
            // freeModeMomentum: true,
            // freeModeMomentumRatio: 0.5,
            // freeModeSticky:true,
            // loop: true,
            // loopedSlides: 5,
            initialSlide: 0,
            keyboardControl: true,
            onSlideChangeEnd: this._slideChangeEnd
        });
    },

    /**
     * When we change slides, update the selected content
     * in the ContentStore
     * @param  {Swiper} swiper
     */
    _slideChangeEnd: function(swiper) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            content_id = slide.dataset.contentid;
        console.log('_slideChangeEnd', content_id);
        ContentActions.slideChanged(content_id);
    },

    /**
     * Once the component has loaded we can appropriately
     * adjust the size of the slider container.
     */
    _updateContainerDimensions: function() {
        console.log('_updateContainerDimensions');
        var container = React.findDOMNode(this)
            h = container.offsetHeight,
            padding = 40,
            newH = h - padding;

        container.style.height = newH+'px';
    },

    render: function() {

        var contentItems = this.state.content.map(function (contentItem) {
            return (
                React.createElement(ContentItem, {content: contentItem, key: contentItem._id})
            );
        });

        contentItems.reverse();

        return (
            React.createElement("div", {className: "swiper-outer-container"}, 
                React.createElement("div", {className: "swiper-container", ref: "Swiper"}, 
                    React.createElement("div", {className: "swiper-wrapper"}, 
                        contentItems
                    )
                )
            )
        );
    }

});

module.exports = ContentList;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js","./ContentItem":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentItem.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Drawer.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	NavFrameList = require('./NavFrameList'),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore');

var Drawer = React.createClass({displayName: "Drawer",
	getInitialState: function() {
		return {
			open: false
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-left'
		}
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
    },

    _handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		UIActions.toggleMenu(false);
	},

	_onChange: function() {
        this.setState(UIStore.getMenuState());
    },

	render: function() {
		var baseClass = 'visible-xs menu-drawer';
		var openClass = this.state.open ? 'menu-drawer-open' : 'menu-drawer-closed';
		var sideClass = this.props.sideClass;
		var fullClass = [baseClass, openClass, sideClass].join(' ');


		return (
			React.createElement("div", {className: fullClass}, 
				React.createElement("div", {className: "menu-drawer-inner"}, 
					React.createElement("div", {className: "of-nav-fixed of-nav-drawer"}, 
						React.createElement("div", {className: "username text-center"}, OF_USERNAME), 
						React.createElement("button", {type: "button", className: "btn-simple-nav visible-xs pull-right", onClick: this._handleCloseMenuClick}, 
		                    React.createElement("span", {className: "icon-close"})
		                )
					), 
					React.createElement(NavFrameList, {
						frames: this.props.frames, 
                        selectedFrame: this.props.selectedFrame, 
						linkClickHandler: this._handleCloseMenuClick}
					)
				)
			)
		);
	}

});

module.exports = Drawer;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./NavFrameList":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore');

var FooterNav = React.createClass({displayName: "FooterNav",
	getInitialState: function() {
		return {
			selectionPanel: "collection"
		};
	},

	getDefaultProps: function() {
		return {}
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
    },

    _handleCloseMenuClick: function() {
		UIActions.toggleMenu(false);
	},

	_handleCollectionClick: function() {
		UIActions.setSelectionPanel("collection");
	},

	_handleFramesClick: function() {
		UIActions.setSelectionPanel("frames");
	},

	_handleAddClick: function(e) {
		e.stopPropagation();
		UIActions.openAddContentModal();
	},

	_onChange: function() {
        this.setState({
        	selectionPanel: UIStore.getSelectionPanelState()
        });
    },

	/**
	 * TODO: figure out state management. Store?
	 * @return {[type]} [description]
	 */
	render: function() {
		var collection = (
			React.createElement("div", {className: "row of-nav-fixed of-nav-footer"}, 
				React.createElement("div", {className: "col-xs-6"}, 
					React.createElement("a", {className: "btn-nav-footer btn-nav-footer-collection active", href: "#", onClick: this._handleCollectionClick}, 
						React.createElement("span", {className: "collection"}, "collection")
					)
				), 
				React.createElement("div", {className: "col-xs-6"}, 
					React.createElement("a", {className: "btn-nav-footer btn-nav-footer-frames", href: "#", onClick: this._handleFramesClick}, 
						React.createElement("span", {className: "frames"}, "frames")
					)
				), 
				React.createElement("a", {className: "btn-nav-footer-add active", href: "#", onClick: this._handleAddClick}, "+")
			)
		);

		var frames = (
			React.createElement("div", {className: "row of-nav-fixed of-nav-footer"}, 
				React.createElement("div", {className: "col-xs-6"}, 
					React.createElement("a", {className: "btn-nav-footer btn-nav-footer-collection", href: "#", onClick: this._handleCollectionClick}, 
						React.createElement("span", {className: "collection"}, "collection")
					)
				), 
				React.createElement("div", {className: "col-xs-6"}, 
					React.createElement("a", {className: "btn-nav-footer btn-nav-footer-frames active", href: "#", onClick: this._handleFramesClick}, 
						React.createElement("span", {className: "frames"}, "frames")
					)
				)
			)
		);
		var panel = this.state.selectionPanel;
		console.log('PANEL: ', this.state, panel);
		return panel === 'collection' ? collection : frames;
	}

});

module.exports = FooterNav;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Frame.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	FrameActions = require('../actions/FrameActions'),
	UIActions = require('../actions/UIActions'),
	FrameStore = require('../stores/FrameStore');

var Frame = React.createClass({displayName: "Frame",

	// getInitialState: function() {
	// 	return {}
	// },

	componentDidMount: function() {
		// FrameActions.loadFrames();
		// FrameStore.addChangeListener(this._onChange);
	},

	componentDidUpdate: function() {
		this._updateContainerDimensions();
	},

	_handleClick: function(e) {
		UIActions.openPreview(this.props.frame);
	},

  	// _onChange: function() {
  	// 	var selectedFrame = FrameStore.getSelectedFrame();
  	// 	console.log('selectedFrame:', selectedFrame);
  	// 	this.setState({
  	// 		frame: selectedFrame
  	// 	});
  	// },

  	_updateContainerDimensions: function() {
  		var container = React.findDOMNode(this),
  			frameOuterContainer = React.findDOMNode(this.refs.frameOuterContainer),
  			frameInnerContainer = React.findDOMNode(this.refs.frameInnerContainer),
  			frame = React.findDOMNode(this.refs.frame),
			w = container.offsetWidth,
			h = container.offsetHeight,
			padding = 50,
			maxW = w - 2*padding,
			maxH = h - 2*padding,
			frameW, frameH;

		if ((this.w_h_ratio > 1 || maxH * this.w_h_ratio > maxW) && maxW / this.w_h_ratio < maxH) {
			// width > height or using full height would extend beyond maxW
			frameW = maxW;
			frameH = (maxW / this.w_h_ratio);
		} else {
			// width < height
			frameH = maxH;
			frameW = (maxH * this.w_h_ratio);
		}

		frame.style.width = frameW + 'px';
		frame.style.height = frameH + 'px';

		frameOuterContainer.style.width = maxW+'px';
		frameInnerContainer.style.top = ((h - frameH) / 2) + 'px';
		// frameInnerContainer.style.height = frame.style.height;



		console.log('frameOuterContainer:', frameOuterContainer);
		console.log('container:', w, h, maxW, maxH);
  	},

	render: function() {
		if (!this.props.frame) {
			return React.createElement("div", {className: "row frames-list"})
		}
		this.w_h_ratio = this.props.frame && this.props.frame.settings ? this.props.frame.settings.w_h_ratio : 1;

		var url = this.props.frame && this.props.frame.current_content ? this.props.frame.current_content.url : '';
		var divStyle = {
			backgroundImage: 'url(' + url + ')',
		};

		console.log(this.w_h_ratio);

		var whStyle = {
			paddingBottom: (1/this.w_h_ratio) * 100 + '%'
		};

		return (
			React.createElement("div", {className: "row frames-list", ref: "frameContainer"}, 
				React.createElement("div", {className: "col-xl-12 frame-outer-container", ref: "frameOuterContainer"}, 
					React.createElement("div", {className: "frame-inner-container", ref: "frameInnerContainer", onClick: this._handleClick}, 
		            	React.createElement("div", {className: "frame", style: divStyle, ref: "frame"})
		            )
		        )
	        )
		);
	}
});

module.exports = Frame;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameItem.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var FrameItem = React.createClass({displayName: "FrameItem",
	propTypes: {
		frame: React.PropTypes.object.isRequired
	},
	_handleSlideClick: function(e) {
		console.log('slide click');
		UIActions.openPreview(this.props.frame);
	},
	render: function() {
		var frame = this.props.frame;
		return (
			React.createElement("div", {className: "swiper-slide frame-slide", "data-frameid": frame._id, onClick: this._handleSlideClick}, 
				React.createElement("img", {src: frame.current_content.url})
			)
		);
	}
});

module.exports = FrameItem;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameItemDetails.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    PublicFrameStore = require('../stores/PublicFrameStore');

var FrameItemDetails = React.createClass({displayName: "FrameItemDetails",
    // getInitialState: function() {
    //     return {
    //         frame: {
    //             name: '',
    //             owner: ''
    //         }
    //     }
    // },

    getDefaultProps: function() {
        return {
            frame: {
                name: '',
                owner: ''
            }
        }
    },

    // componentDidMount: function() {
    //     PublicFrameStore.addChangeListener(this._onChange);
    // },

    // componentWillUnmount: function() {
    //     PublicFrameStore.removeChangeListener(this._onChange);
    // },

    // _onChange: function() {

    // },

    render: function() {

        var mirroring_count = '';

        if (this.props.frame && this.props.frame.mirroring_count) {
            mirroring_count = (
                React.createElement("div", {className: "visible-frame-stats"}, 
                    React.createElement("span", {className: "of-icon-mirror"}), " ", this.props.frame.mirroring_count
                )
            )
        }

        var owner = '';
        if (this.props.frame.owner) {
            owner += '@' + this.props.frame.owner;
        }

        return (
            React.createElement("div", {className: "frame-slide-content"}, 
                React.createElement("div", {className: "visible-frame-details"}, 
                    React.createElement("div", null, 
                        React.createElement("span", {className: "visible-frame-name"}, this.props.frame.name), 
                        React.createElement("span", {className: "visible-frame-user"}, owner)
                    ), 
                    mirroring_count
                )
            )
        );
    }

});

module.exports = FrameItemDetails;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/PublicFrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/PublicFrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FramePreview.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore'),
    UIStore = require('../stores/UIStore'),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var FramePreview = React.createClass({displayName: "FramePreview",

    getInitialState: function() {
        return {
            frame: null,
            previewOpen: false
        };
    },

    componentDidMount: function() {
        UIStore.addChangeListener(this._onUIChange);
    },

    _handleCloseClick: function() {
        UIActions.closePreview();
    },

    _onUIChange: function() {
        this.setState(UIStore.getPreviewState());
    },

    render: function() {
        if (!this.state.frame) {
            return false;
        }

        var content = this.state.frame.current_content,
            tags = content.tags,
            frameDetails = null,
            mirroring_icon = '',
            mirroring_content = '',
            mirroring_count = this.state.frame.mirroring_count;

        tags_content = '';
        if (tags) {
            _.each(tags, function(tag) {
                tags_content += '#' + tag + ' ';
            });
        }

        var previewClass = this.state.previewOpen ? 'preview-open' : 'preview-closed';

        var fullClass = 'preview-container ' + previewClass;

        var divStyle = {
            backgroundImage: 'url(' + content.url + ')'
        };

        if (mirroring_count) {
            mirroring_icon = (
                React.createElement("span", {className: "of-icon-mirror"})
            );
            mirroring_content = (
                React.createElement("span", {className: "mirroring-meta"}, mirroring_count)
            );
        }

        if (this.state.frame.name) {
            frameDetails = (
                React.createElement("div", null, 
                    React.createElement("div", {className: "row preview-frame-details"}, 
                        React.createElement("div", {className: "col-xs-6"}, 
                            React.createElement("span", {className: "frame-name"}, this.state.frame.name), 
                            React.createElement("span", {className: "mirroring-content"}, 
                                mirroring_icon, 
                                mirroring_content
                            )
                        ), 
                        React.createElement("div", {className: "col-xs-6"}, 
                            React.createElement("span", {className: "owner pull-right"}, "@", this.state.frame.owner)
                        ), 
                        React.createElement("div", {className: "col-xs-12 description"}, 
                            this.state.frame.description
                        )
                    )
                )
            );
        }

        return (
            React.createElement("div", {className: fullClass, style: divStyle}, 
                React.createElement("div", {className: "preview-footer-wrap"}, 
                    React.createElement("div", {className: "preview-footer"}, 
                        React.createElement("div", {className: "row preview-tags"}, 
                            React.createElement("div", {className: "col-xs-11"}, 
                                React.createElement("div", {className: "preview-tags"}, 
                                    tags_content
                                )
                            ), 
                            React.createElement("div", {className: "col-xs-1"}, 
                                React.createElement("button", {type: "button", className: "btn-simple-nav pull-right", onClick: this._handleCloseClick}, 
                                    React.createElement("span", {className: "icon-close"})
                                )
                            )
                        ), 
                        React.createElement("div", {className: "row preview-dimensions"}, 
                            React.createElement("div", {className: "col-xs-12"}

                            )
                        ), 
                        React.createElement("div", {className: "row preview-url"}, 
                            React.createElement("div", {className: "col-xs-12"}, 
                                content.url
                            )
                        )
                    ), 
                    frameDetails
                )
            )
        );
    }

});

module.exports = FramePreview;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    NavFrameLink = require('./NavFrameLink'),
    FrameStore = require('../stores/FrameStore');


var Nav = React.createClass({displayName: "Nav",
    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getInitialState: function() {
        return {
            frames: []
        }
    },

    render: function() {
        function createFrameLink(frame) {
            console.log('frame: ', frame);
            return React.createElement(NavFrameLink, {key: frame._id, frame: frame})
        }

        return (
            React.createElement("nav", {className: "navbar navbar-default"}, 
                /* Brand and toggle get grouped for better mobile display */
                React.createElement("div", {className: "navbar-header"}, 
                    React.createElement("button", {type: "button", className: "navbar-toggle collapsed pull-left", "data-toggle": "collapse", "data-target": "#bs-example-navbar-collapse-1"}, 
                        React.createElement("span", {className: "sr-only"}, "Toggle navigation"), 
                        React.createElement("span", {className: "icon-bar"}), 
                        React.createElement("span", {className: "icon-bar"}), 
                        React.createElement("span", {className: "icon-bar"})
                    ), 
                    React.createElement("h3", {className: "text-muted hidden-xs"}, React.createElement("span", {className: "openframe"}, "openframe/"), React.createElement("span", {className: "username"}, OF_USERNAME))
                ), 
                /* Collect the nav links, forms, and other content for toggling */
                React.createElement("div", {className: "collapse navbar-collapse", id: "bs-example-navbar-collapse-1"}, 
                    React.createElement("ul", {className: "nav navbar-nav navbar-right"}, 
                        React.createElement("li", {className: "dropdown"}, 
                            React.createElement("a", {href: "#", className: "dropdown-toggle", "data-toggle": "dropdown", role: "button", "aria-expanded": "false"}, "Frames ", React.createElement("span", {className: "caret"})), 
                            React.createElement("ul", {className: "dropdown-menu", role: "menu"}, 
                                this.state.frames.map(createFrameLink.bind(this))
                            )
                        ), 
                        React.createElement("li", null, 
                            React.createElement("a", {href: "/logout"}, React.createElement("span", {className: "glyphicon glyphicon-log-out"}))
                        )
                    )
                )
                /* /.navbar-collapse */
            )
        );
    },

    _onChange: function() {
        this.setState({
            frames: FrameStore.getAllFrames()
        });
    }

});

module.exports = Nav;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    FrameActions = require('../actions/FrameActions');

var NavFrameLink = React.createClass({displayName: "NavFrameLink",
	handleFrameSelection: function(e) {
		FrameActions.select(this.props.frame);
		if (this.props.linkClickHandler) {
			this.props.linkClickHandler();
		}
	},

	render: function() {
		var activeClass = 'not-connected',
			activeText = 'not connected';
		if (this.props.frame.connected) {
			activeClass = activeText = 'connected';
		}

		function isSelected(selected) {
            return selected ? 'icon-check' : 'space';
        }

		var classes = 'pull-right status ' + activeClass;
		return (
			React.createElement("li", {onClick: this.handleFrameSelection}, 
				React.createElement("a", {href: "#"}, 
					React.createElement("span", {className: isSelected(this.props.selected)}), " ", this.props.frame.name, 
					React.createElement("span", {className: classes}, activeText)
				)
			)
		);
	}
});

module.exports = NavFrameLink;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	NavFrameLink = require('./NavFrameLink');

var NavFrameList = React.createClass({displayName: "NavFrameList",
	componentDidMount: function() {
        // FrameStore.addChangeListener(this._onChange);
    },

    getDefaultProps: function() {
    	return {
    		extraClasses: '',
    		includeLogout: true,
    		linkClickHandler: function() {
    			console.log('link clicked');
    		}
    	};
    },

    // getInitialState: function() {
    //     return {
    //         frames: []
    //     }
    // },

	render: function() {
		function createFrameLink(frame) {
            console.log('MMMMMM?', frame, this.props.selectedFrame);
            return (
                React.createElement(NavFrameLink, {
                    key: frame._id, 
                    frame: frame, 
                    selected: frame._id === this.props.selectedFrame._id, 
                    linkClickHandler: this.props.linkClickHandler}
                )
            );
        }

		var classes = this.props.extraClasses + ' nav-frame-list drawer-content';

		var logout = '';
		if (this.props.includeLogout) {
			console.log('includeLogout');
			logout = (
				React.createElement("li", null, 
					React.createElement("a", {onClick: this.props.linkClickHandler, className: "btn-logout", href: "/logout"}, "log out")
				)
			);
		}

		return (
			React.createElement("ul", {className: classes, role: "menu"}, 
                this.props.frames.map(createFrameLink.bind(this)), 
                logout
            )
		);
	},

	// _onChange: function() {
 //        this.setState({
 //            frames: FrameStore.getAllFrames()
 //        });
 //    }

});

module.exports = NavFrameList;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./NavFrameLink":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/PublicFrameSwiper.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null),
    FrameItem = require('./FrameItem'),
    PublicFrameActions = require('../actions/PublicFrameActions');

var PublicFrameSwiper = React.createClass({displayName: "PublicFrameSwiper",
    componentDidMount: function() {
        this._updateContainerDimensions();
    },

    componentDidUpdate: function(prevProps, prevState) {
        if (!this.swiper) {
            this._initSlider();
        }
    },

    _initSlider: function() {
        var el = React.findDOMNode(this.refs.Swiper);
        if (this.swiper) {
            this.swiper.destroy();
        }
        this.swiper = new Swiper(el, {
            slidesPerView: 3,
            spaceBetween: 50,
            centeredSlides: true,
            // preloadImages: true,
            // freeMode: true,
            // freeModeMomentum: true,
            // freeModeMomentumRatio: .25,
            // freeModeSticky:true,
            keyboardControl: true,
            onSlideChangeEnd: this._slideChangeEnd
        });
    },

    _slideTo: function(index) {
        this.swiper.slideTo(index);
    },

    _slideChangeEnd: function(slider) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            frame_id = slide.dataset.frameid;
        PublicFrameActions.slideChanged(frame_id);
    },

    _updateContainerDimensions: function() {
        console.log('_updateContainerDimensions');
        var container = this.refs.container.getDOMNode(),
            h = container.offsetHeight,
            // current top of the frames swiper container (i.e. screen midpoint)
            top = container.offsetTop,
            //  height of the footer nav (40) + frame detail text (52)
            footerH = 92,
            //  additional padding
            padding = 40,
            totalPad = footerH + padding,
            newH = h - totalPad;

        container.style.height = newH+'px';
        container.style.top = (top + padding/2) + 'px';
    },

    render: function() {
        var frameItems = this.props.frames.map(function (frameItem) {
            return (
                React.createElement(FrameItem, {frame: frameItem, key: frameItem._id})
            );
        });

        return (
            React.createElement("div", {className: "swiper-outer-container", ref: "container"}, 
                React.createElement("div", {className: "swiper-container", ref: "Swiper"}, 
                    React.createElement("div", {className: "swiper-wrapper"}, 
                        frameItems
                    )
                )
            )
        );
    }

});

module.exports = PublicFrameSwiper;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/PublicFrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/PublicFrameActions.js","./FrameItem":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameItem.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/PublicFramesList.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	FrameItemDetails = require('./FrameItemDetails'),
    PublicFrameSwiper = require('./PublicFrameSwiper'),
    PublicFrameActions = require('../actions/PublicFrameActions'),
    PublicFrameStore = require('../stores/PublicFrameStore');


/**
 * This component manages state for the list of public frames
 */
var PublicFramesList = React.createClass({displayName: "PublicFramesList",
	getInitialState: function() {
        return {
			frames: [],
            selectedFrame: {
                name: '',
                owner: ''
            }
		}
	},

	componentDidMount: function() {
        console.log('PublicFramesList: component did mount');
		PublicFrameStore.addChangeListener(this._onChange);
        PublicFrameActions.loadPublicFrames();
    },

    componentWillUnmount: function() {
        PublicFrameStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {},

  	_onChange: function() {
  		this.setState({
  			frames: PublicFrameStore.getPublicFrames(),
            selectedFrame: PublicFrameStore.getSelectedPublicFrame()
  		});
  	},

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement(PublicFrameSwiper, {frames: this.state.frames}), 
                React.createElement(FrameItemDetails, {frame: this.state.selectedFrame})
            )
        );
    }

});

module.exports = PublicFramesList;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/PublicFrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/PublicFrameActions.js","../stores/PublicFrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/PublicFrameStore.js","./FrameItemDetails":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameItemDetails.js","./PublicFrameSwiper":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/PublicFrameSwiper.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore'),
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var SettingsModal = React.createClass({displayName: "SettingsModal",
	getInitialState: function() {
		return {
			settingsOpen: false
		}
	},

	componentDidMount: function() {
		// this.setState(this.props);
        UIStore.addChangeListener(this._onUIChange);

        // set modal event handler
        $(this.refs.modal.getDOMNode()).on('hidden.bs.modal', function() {
        	console.log('hidden.bs.modal');
        	UIActions.settingsModalClosed();
        });

        // Vertically center modals
		/* center modal */
		function centerModals(){
		    $('.modal').each(function(i){
		        var $clone = $(this).clone().css('display', 'block').appendTo('body');
		        var top = Math.round(($clone.height() - $clone.find('.modal-content').height()) / 2);
		        top = top > 0 ? top : 0;
		        $clone.remove();
		        $(this).find('.modal-content').css("margin-top", top);
		    });
		}
		$(this.refs.modal.getDOMNode()).on('show.bs.modal', centerModals);
    },

    componentWillUnount: function() {
        UIStore.removeChangeListener(this._onUIChange);
        $(this.refs.modal.getDOMNode()).off('hidden.bs.modal');
    },

	_handleNameChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.name = val;
		this.props.onSettingsChange(frame);
	},

	_handleDescriptionChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.description = val;
		this.props.onSettingsChange(frame);
	},

	_handleVisibilityChange: function(e) {
		var val = event.target.checked;
		frame = this.props.frame;
		frame.settings.visible = val;
		this.props.onSettingsChange(frame);
	},

	_handleRotationChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.settings.rotation = val;
		this.props.onSettingsChange(frame);
	},

	/**
	 * Pass along event to App, where the save Action is triggered.
	 * @param  {[type]} e [description]
	 */
	_handleSave: function(e) {
		this.props.onSaveSettings()
	},

	_onUIChange: function() {
        this.setState(UIStore.getSettingsModalState(), function() {
	        if (this.state.settingsOpen) {
	        	$(this.refs.modal.getDOMNode()).modal();
	        } else {
	        	$(this.refs.modal.getDOMNode()).modal('hide');
	        }
        });
    },

	render: function() {
		console.log('++++++++ ', this.props.frame);

		return (
			React.createElement("div", {className: "modal fade modal-settings", ref: "modal"}, 
				React.createElement("div", {className: "modal-dialog"}, 
					React.createElement("div", {className: "modal-content"}, 
				  		React.createElement("div", {className: "modal-header"}, 
				    		React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-label": "Close"}, 
				    			React.createElement("span", {className: "icon-close", "aria-hidden": "true"})
			    			), 
					    	React.createElement("h4", {className: "modal-title"}, "Settings")
					  	), 
						React.createElement("div", {className: "modal-body"}, 
							React.createElement("div", {className: "row row-form-field"}, 
								React.createElement("div", {className: "col-xs-12"}, 
						    		React.createElement("div", {className: "form-label"}, "Name"), 
						    		React.createElement("div", {className: "form-input"}, 
						    			React.createElement("input", {
						    				ref: "name", 
						    				type: "text", 
						    				value: this.props.frame.name, 
						    				onChange: this._handleNameChange}
					    				)
						    		)
						    	)
					    	), 

				    		React.createElement("div", {className: "row row-form-field"}, 
				    			React.createElement("div", {className: "col-xs-12"}, 
						    		React.createElement("div", {className: "form-label"}, "Description (optional)"), 
						    		React.createElement("div", {className: "form-label-subtext"}, "Useful if your frame follows a theme"), 
						    		React.createElement("div", {className: "form-input"}, 
						    			React.createElement("input", {
						    				ref: "description", 
					    					type: "text", 
					    					value: this.props.frame.description, 
					    					onChange: this._handleDescriptionChange, 
					    					placeholder: "e.g. japanese art, 90s posters"})
						    		)
						    	)
					    	), 

				    		React.createElement("div", {className: "row row-form-field"}, 
				    			React.createElement("div", {className: "col-xs-9"}, 
						    		React.createElement("div", {className: "form-label"}, "Visible to other people"), 
						    		React.createElement("div", {className: "form-label-subtext"}, "Your frame will appear on Frames and others can mirror it")
						    	), 
						    	React.createElement("div", {className: "col-xs-3"}, 
						    		React.createElement("div", {className: "form-input-checkbox"}, 
						    			React.createElement("input", {className: "pull-right", ref: "visibility", type: "checkbox", 
						    				checked: this.props.frame.settings.visible, 
						    				onChange: this._handleVisibilityChange}
					    				)
						    		)
						    	)
					    	), 

				    		React.createElement("div", {className: "row row-form-field row-form-field-rotation"}, 
				    			React.createElement("div", {className: "col-xs-6 form-label"}, "Rotation"), 
					    		React.createElement("div", {className: "col-xs-6 form-input-select"}, 
					    			React.createElement("select", {className: "pull-right", ref: "rotation", 
					    				value: this.props.frame.settings.rotation, 
					    				onChange: this._handleRotationChange
				    				}, 
										React.createElement("option", {value: "0"}, "0°"), 
										React.createElement("option", {value: "90"}, "90°"), 
										React.createElement("option", {value: "-90"}, "-90°"), 
										React.createElement("option", {value: "180"}, "180°")
									)
					    		)
					    	)
				  		), 
				  		React.createElement("div", {className: "modal-footer"}, 
				    		React.createElement("button", {onClick: this._handleSave, type: "button", className: "btn btn-primary btn-add-content"}, 
				    			"Save"
				    		)
				  		)
					)
				)
			)
		);
	}

});

module.exports = SettingsModal;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    NavFrameList = require('./NavFrameList'),
    UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore');


var SimpleNav = React.createClass({displayName: "SimpleNav",
    componentDidMount: function() {
        // FrameStore.addChangeListener(this._onChange);
    },

    getDefualtProps: function() {
        return {
            frames: [],
            selectedFrame: {
                name: '',
                mirroring: null,
                mirroring_count: null,
                mirror_meta: {
                    name: '',
                    owner: ''
                }
            }
        }
    },

    _handleOpenMenuClick: function(e) {
        console.log('_handleOpenMenuClick');
        UIActions.toggleMenu(true);
    },

    _handleOpenSettings: function(e) {
        console.log('_handleOpenSettings');
        UIActions.openSettingsModal();
    },

    // _onChange: function() {
    //     console.log('++++++ get selected frame', FrameStore.getSelectedFrame());
    //     this.setState({
    //         frames: FrameStore.getAllFrames(),
    //         selectedFrame: FrameStore.getSelectedFrame()
    //     });
    // },

    render: function() {
        var frameName = this.props.selectedFrame.name,
            mirroring = this.props.selectedFrame.mirroring,
            mirror_meta = this.props.selectedFrame.mirror_meta,
            mirroring_icon = '',
            mirroring_content = '',
            mirroring_count = this.props.selectedFrame.mirroring_count;

        function connected(connected) {
            var connected_content = '';
            if (connected) {
                connected_content = '&bull; ';
            }
            return {__html: connected_content};
        }

        if (mirroring_count) {
            mirroring_icon = (
                React.createElement("span", {className: "of-icon-mirror"})
            );
            mirroring_content = (
                React.createElement("span", {className: "mirroring-meta"}, mirroring_count)
            );
        }

        if (mirroring) {
            mirroring_icon = (
                React.createElement("span", {className: "of-icon-mirror"})
            );
            mirroring_content = (
                React.createElement("span", {className: "mirroring-meta"}, "@", mirror_meta.owner, " : ", mirror_meta.name)
            );
        }

        return (
            React.createElement("div", {className: "of-nav-fixed of-nav-top"}, 
                React.createElement("h6", {className: "frame-name text-center"}, 
                    React.createElement("span", {className: "connected", dangerouslySetInnerHTML: connected(this.props.selectedFrame.connected)}), 
                    frameName, 
                    React.createElement("span", {className: "mirroring-content"}, 
                        mirroring_icon, 
                        mirroring_content
                    )
                ), 

                React.createElement("button", {type: "button", className: "btn-simple-nav btn-menu visible-xs pull-left", onClick: this._handleOpenMenuClick}, 
                    React.createElement("span", {className: "icon-hamburger"})
                ), 
                React.createElement("button", {type: "button", className: "btn-simple-nav btn-setting visible-xs pull-right", onClick: this._handleOpenSettings}, 
                    React.createElement("span", {className: "icon-cog"})
                ), 
                React.createElement("h3", {className: "text-muted hidden-xs pull-left"}, React.createElement("span", {className: "openframe"}, "openframe/"), React.createElement("span", {className: "username"}, OF_USERNAME)), 


                React.createElement("ul", {className: "nav navbar-nav navbar-right hidden-xs"}, 
                    React.createElement("li", {className: "dropdown"}, 
                        React.createElement("a", {href: "#", className: "dropdown-toggle", "data-toggle": "dropdown", role: "button", "aria-expanded": "false"}, "Frames ", React.createElement("span", {className: "caret"})), 
                        React.createElement(NavFrameList, {
                            frames: this.props.frames, 
                            selectedFrame: this.props.selectedFrame, 
                            extraClasses: "dropdown-menu", 
                            includeLogout: false})
                    ), 
                    React.createElement("li", null, 
                        React.createElement("a", {href: "#settings", onClick: this._handleOpenSettings}, "Settings")
                    ), 
                    React.createElement("li", null, 
                        React.createElement("a", {href: "/logout"}, "Log Out")
                    )
                )
            )
        );
    }

});

module.exports = SimpleNav;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameList":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	FrameActions = require('../actions/FrameActions'),
    ContentStore = require('../stores/ContentStore'),
    PublicFrameStore = require('../stores/PublicFrameStore'),
	UIStore = require('../stores/UIStore');

var TransferButtons = React.createClass({displayName: "TransferButtons",
    componentDidMount: function() {
        // UIStore.addChangeListener(this._onChange);
    },

    _onChange: function() {
        // this.setState(UIStore.getSelectionPanelState());
    },

    _handleSendClicked: function(e) {
        console.log('_handleSendClicked', ContentStore.getSelectedContent());
        FrameActions.updateContent(ContentStore.getSelectedContent());
    },

	_handleMirrorClicked: function(e) {
        console.log('_handleMirrorClicked');
		FrameActions.mirrorFrame(PublicFrameStore.getSelectedPublicFrame());
	},

    render: function() {
        var icon, handler;
        if (this.props.panelState === 'collection') {
            icon = 'icon-up';
            handler = this._handleSendClicked;
        } else {
            icon = 'of-icon-mirror';
            handler = this._handleMirrorClicked;
        }
        return (
            React.createElement("div", {className: "row transfer-buttons"}, 
                React.createElement("div", {className: "col-xs-12 text-center"}, 
                    React.createElement("div", {className: "btn-group", role: "group", "aria-label": "..."}, 
                        React.createElement("button", {type: "button", className: "btn btn-xs btn-default btn-send btn-transfer", onClick: handler}, 
                            React.createElement("span", {className: icon, "aria-hidden": "true"})
                        )
                        /* <button type="button" class="btn btn-xs btn-default btn-send btn-transfer">
                                                <span class="icon icon-send" aria-hidden="true"></span>
                                        </button> */
                    )
                )
            )
        );
    }

});

module.exports = TransferButtons;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js","../stores/PublicFrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/PublicFrameStore.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js":[function(require,module,exports){
var conf = {
	domain: 'localhost',
	port: '8888',
	navbarH: 50
}

module.exports = conf;

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js":[function(require,module,exports){
var keymirror = require('keymirror');

module.exports = keymirror({

	// frame action types
	FRAME_LOAD: null,
	FRAME_LOAD_DONE: null,
	FRAME_LOAD_FAIL: null,
	FRAME_SELECT: null,
	FRAME_UPDATE_CONTENT: null,
	FRAME_SETTINGS_CONTENT: null,
	FRAME_CONTENT_UPDATED: null,
	FRAME_CONNECTED: null,
	FRAME_DISCONNECTED: null,
	FRAME_SAVE: null,
	FRAME_SAVE_DONE: null,
	FRAME_SAVE_FAIL: null,
	FRAME_MIRRORED: null,

	// content action types
	CONTENT_LOAD: null,
	CONTENT_LOAD_DONE: null,
	CONTENT_LOAD_FAIL: null,
	CONTENT_SEND: null,
	CONTENT_SLIDE_CHANGED: null,
	CONTENT_ADD: null,
	CONTENT_ADD_DONE: null,
	CONTENT_ADD_FAIL: null,
	CONTENT_REMOVE: null,
	CONTENT_REMOVE_DONE: null,
	CONTENT_REMOVE_FAIL: null,

	// public frames list
	PUBLIC_FRAMES_LOAD: null,
	PUBLIC_FRAMES_LOAD_DONE: null,
	PUBLIC_FRAMES_LOAD_FAIL: null,
	PUBLIC_FRAMES_ADD: null,
	PUBLIC_FRAMES_REMOVE: null,
	PUBLIC_FRAMES_SLIDE_CHANGED: null,

	// UI action types
	UI_MENU_TOGGLE: null,
	UI_SET_SELECTION_PANEL: null,
	UI_OPEN_ADD_CONTENT: null,
	UI_CLOSE_ADD_CONTENT: null,
	UI_OPEN_SETTINGS: null,
	UI_CLOSE_SETTINGS: null,
	UI_OPEN_PREVIEW: null,
	UI_CLOSE_PREVIEW: null,

	// emitted by stores
	CHANGE_EVENT: null
});

},{"keymirror":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/keymirror/index.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js":[function(require,module,exports){
(function (global){
var Dispatcher = (typeof window !== "undefined" ? window.Flux : typeof global !== "undefined" ? global.Flux : null).Dispatcher;

var AppDispatcher = new Dispatcher();

/**
* A bridge function between the views and the dispatcher, marking the action
* as a view action.  Another variant here could be handleServerAction.
* @param  {object} action The data coming from the view.
*/
AppDispatcher.handleViewAction = function(action) {
	action.source = 'VIEW_ACTION';
	this.dispatch(action);
}


/**
* A bridge function between the server and the dispatcher, marking the action
* as a server action.
* @param  {object} action The data coming from the server.
*/
AppDispatcher.handleServerAction = function(action) {
	action.source = 'SERVER_ACTION';
	this.dispatch(action);
}

module.exports = AppDispatcher;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


var _content = [],
	_selected_content_id = null;


var ContentStore = assign({}, EventEmitter.prototype, {

	init: function(content) {
		_content = content;
		// since the last item becomes the first in the slider,
		// we start with (content.length - 1)
		_selected_content_id = _content[content.length - 1]._id;
	},

	addContent: function(content) {
		_content.push(content);
		_selected_content_id = content._id;
	},

	removeContent: function(content) {
		_content = _.remove(_content, {_id: content._id});
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	getContent: function() {
		return _content;
	},

	getSelectedContent: function() {
		// console.log('getSelectedContent:', _content, _selected_content_id);
		return _.find(_content, {'_id': _selected_content_id});
	},

	addChangeListener: function(cb){
    	this.on(OFConstants.CHANGE_EVENT, cb);
  	},

  	removeChangeListener: function(cb){
    	this.removeListener(OFConstants.CHANGE_EVENT, cb);
	}

});


// Register callback to handle all updates
AppDispatcher.register(function(action) {
  	switch(action.actionType) {
		case OFConstants.CONTENT_LOAD:
			console.log('loading content...');
			break;

    	case OFConstants.CONTENT_LOAD_DONE:
    		console.log('content loaded: ', action.content);
			ContentStore.init(action.content);
			ContentStore.emitChange();
			break;

		case OFConstants.CONTENT_LOAD_FAIL:
			console.log('content failed to load: ', action.err);
			break;

		case OFConstants.CONTENT_SLIDE_CHANGED:
			console.log('slide changed...');
			_selected_content_id = action.content_id;
			break;

		case OFConstants.CONTENT_ADD:
			console.log('adding content...');
			break;

    	case OFConstants.CONTENT_ADD_DONE:
    		console.log('content added: ', action.content);
			ContentStore.addContent(action.content);
			ContentStore.emitChange();
			break;

		case OFConstants.CONTENT_ADD_FAIL:
			console.log('content failed to be added: ', action.err);
			break;

    	case OFConstants.CONTENT_SEND:

			// ContentStore.emitChange();
			break;

	    // case OFConstants.TODO_UPDATE_TEXT:
	    //   text = action.text.trim();
	    //   if (text !== '') {
	    //     update(action.id, {text: text});
	    //     ContentStore.emitChange();
	    //   }
	    //   break;

	    // case OFConstants.TODO_DESTROY:
	    //   destroy(action.id);
	    //   ContentStore.emitChange();
	    //   break;

	    // case OFConstants.TODO_DESTROY_COMPLETED:
	    //   destroyCompleted();
	    //   ContentStore.emitChange();
	    //   break;

	    default:
    		// no op
  }
});

module.exports = ContentStore;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


var _frames = {},
	_selectedFrameId = null;

var addFrame = function(frame, select) {
	_frames[frame._id] = frame;
	if (select === true) selectFrame(frame);
}

var removeFrame = function(frame){
	console.log('removeFrame', frame);
	var id = frame._id;
	if (id in _frames) delete _frames[id];
	console.log(_frames);
};

var selectFrame = function(frame) {
	console.log('selectFrame: ', frame);
	_selectedFrameId = frame._id;

	// // unselect currently selected
	// var selectedFrame = FrameStore.getSelectedFrame();
	// if (selectedFrame) {
	// 	selectedFrame.selected = false;
	// }

	// // now set the new selected frame
	// var _selectedFrame = _.find(_frames, {_id: frame._id});
	// _selectedFrame.selected = true;
}

var FrameStore = assign({}, EventEmitter.prototype, {

	/**
	 * Set _selectedFrameId and add all of the frames.
	 * @param  {[type]} frames [description]
	 * @return {[type]}        [description]
	 */
	init: function(frames) {
		_selectedFrameId = frames[0]._id;
		_.each(frames, addFrame);
	},

	getAllFrames: function() {
		console.log('getAllFrames: ', _frames);
		return _.map(_frames, function(frame) {
			return frame;
		});
	},

	getSelectedFrame: function() {
		// var selected = frames[_selectedFrameId];
		console.log('------ ', _frames);
		console.log('------ ', _selectedFrameId);
		console.log('------ ', _frames[_selectedFrameId]);
		return _frames[_selectedFrameId]
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	/**
	 * A frame has connected. Simply update the frame object in our collection.
	 */
	connectFrame: function(frame) {
		// addFrame will replace previous frame
		console.log('connectFrame: ', frame);
		frame.connected = true;
		addFrame(frame);
	},

	/**
	 * A frame has disconnected. Simply updated the frame object in our collection.
	 */
	disconnectFrame: function(frame) {
		// addFrame will replace previous frame
		frame.connected = false;
		addFrame(frame);
	},

	addChangeListener: function(cb){
    	this.on(OFConstants.CHANGE_EVENT, cb);
  	},

  	removeChangeListener: function(cb){
    	this.removeListener(OFConstants.CHANGE_EVENT, cb);
	}

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
	// console.log('ACTION: FrameStore: ', action.actionType);
  	switch(action.actionType) {
		case OFConstants.FRAME_LOAD:
			console.log('loading frames...');
			break;

    	case OFConstants.FRAME_LOAD_DONE:
    		console.log('frames loaded: ', action.frames);
			FrameStore.init(action.frames);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_LOAD_FAIL:
			console.log('frames failed to load: ', action.err);
			break;

		case OFConstants.FRAME_CONNECTED:
			FrameStore.connectFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_DISCONNECTED:
			FrameStore.disconnectFrame(action.frame);
			FrameStore.emitChange();
			break;

    	case OFConstants.FRAME_SELECT:
    		selectFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.CONTENT_SEND:
    		FrameStore.getSelectedFrame().content = action.content;
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_CONTENT_UPDATED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_UPDATED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_MIRRORED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_SAVE:
			// adding the saved frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_SAVE_DONE:
			// adding the frame since it will replace current instance
			// noop (optimistic ui update already happened on FRAME_SAVE)
			break;

		case OFConstants.FRAME_SAVE_FAIL:
			// adding the failed frame since it will replace current instance
			// TODO: handle this by reverting (immutable.js would help)
			console.log('failed to save frame', action.frame);
			break;

	    default:
    		// no op
  }
});

module.exports = FrameStore;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/PublicFrameStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


var _publicFrames = [],
	_selected_public_frame_id = null;

var addFrame = function(frame, select) {
	_publicFrames.push(frame)
	if (select !== false) selectFrame(frame);
}

var removeFrame = function(frame){
	_.remove(_publicFrames, {_id: frame._id});
};

var PublicFrameStore = assign({}, EventEmitter.prototype, {

	init: function(frames) {
		_publicFrames = frames;
	},

	/**
	 * Get the list of public frames.
	 * @return {object} Array
	 */
	getPublicFrames: function() {
		return _publicFrames;
	},

	/**
	 * Get the public frame that is currently selected.
	 * @return {object} frame
	 */
	getSelectedPublicFrame: function() {
		return _.find(_publicFrames, {'_id': _selected_public_frame_id});
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	addChangeListener: function(cb){
    	this.on(OFConstants.CHANGE_EVENT, cb);
  	},

  	removeChangeListener: function(cb){
    	this.removeListener(OFConstants.CHANGE_EVENT, cb);
	}

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
  	switch(action.actionType) {
		case OFConstants.PUBLIC_FRAMES_LOAD:
			console.log('loading visible frames...');
			break;

    	case OFConstants.PUBLIC_FRAMES_LOAD_DONE:
    		console.log('visible frames loaded: ', action.frames);
			_publicFrames = action.frames;
			_selected_public_frame_id = _publicFrames[0]._id;
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_LOAD_FAIL:
			console.log('visible frames failed to load: ', action.err);
			break;

		case OFConstants.PUBLIC_FRAMES_ADD:
			addFrame(action.frame);
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_REMOVE:
			removeFrame(action.frame);
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_SLIDE_CHANGED:
			console.log('slide changed...', action);
			_selected_public_frame_id = action.frame_id;
			PublicFrameStore.emitChange();
			break;

	    default:
    		// no op
  }
});

module.exports = PublicFrameStore;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    EventEmitter = require('events').EventEmitter,
    OFConstants = require('../constants/OFConstants'),
    assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


var _menuOpen = false,
    _settingsOpen = false,
    _addOpen = false,
    _settingsOpen = false,
    _previewOpen = false,
    _previewFrame = null,
    _selectionPanel = "collection";

var _toggleMenu = function(open) {
    _menuOpen = !!open;
}


var UIStore = assign({}, EventEmitter.prototype, {

    getMenuState: function() {
        return {
            open: _menuOpen
        };
    },

    getSettingsState: function() {
        return {
            open: _settingsOpen
        };
    },

    getSelectionPanelState: function() {
        return _selectionPanel;
    },

    getAddModalState: function() {
        return {
            addOpen: _addOpen
        };
    },

    getSettingsModalState: function() {
        console.log('========', _settingsOpen);
        return {
            settingsOpen: _settingsOpen
        };
    },

    getPreviewState: function() {
        return {
            previewOpen: _previewOpen,
            frame: _previewFrame
        }
    },

    emitChange: function() {
        this.emit(OFConstants.CHANGE_EVENT);
    },

    addChangeListener: function(cb){
        this.on(OFConstants.CHANGE_EVENT, cb);
    },

    removeChangeListener: function(cb){
        this.removeListener(OFConstants.CHANGE_EVENT, cb);
    }

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
    switch(action.actionType) {

        case OFConstants.UI_MENU_TOGGLE:
            _toggleMenu(action.open);
            UIStore.emitChange();
            break;

        case OFConstants.UI_MENU_TOGGLE:
            _toggleSettings();
            UIStore.emitChange();
            break;

        case OFConstants.UI_SET_SELECTION_PANEL:
            _selectionPanel = action.panel;
            UIStore.emitChange();
            break;

        case OFConstants.UI_OPEN_ADD_CONTENT:
            _addOpen = true;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_ADD_CONTENT:
            // modal already closing, no change emmission needed
            _addOpen = false;
            break;

        case OFConstants.UI_OPEN_SETTINGS:
            _settingsOpen = true;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_SETTINGS:
            // modal already closing, no change emmission needed
            _settingsOpen = false;
            break;

        case OFConstants.UI_OPEN_PREVIEW:
            _previewOpen = true;
            _previewFrame = action.frame;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_PREVIEW:
            _previewOpen = false;
            UIStore.emitChange();
            break;

        case OFConstants.CONTENT_ADD_DONE:
            _addOpen = false;
            UIStore.emitChange();
            break;

        case OFConstants.FRAME_SAVE:
            _settingsOpen = false;
            UIStore.emitChange();
            break;

        default:
            // no op
  }
});

module.exports = UIStore;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"openframe/static/src/js/react-main.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager'),
    FastClick = (typeof window !== "undefined" ? window.FastClick : typeof global !== "undefined" ? global.FastClick : null);

// init javascript media query-like state detection
browser_state.init();

// Turn on touch events for React.
// React.initializeTouchEvents(true);

// FastClick removes the 300s delay on stupid iOS devices
window.addEventListener('load', function() {
	console.log('attaching FastClick');
	FastClick.attach(document.body);
});

React.render(
	React.createElement(App, null),
	document.getElementById('OpenFrame')
)

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./browser_state_manager":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/browser_state_manager.js","./components/App.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js"}]},{},["openframe/static/src/js/react-main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9Db250ZW50QWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1B1YmxpY0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1VJQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2Jyb3dzZXJfc3RhdGVfbWFuYWdlci5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FkZENvbnRlbnRGb3JtLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudE1vZGFsLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQXBwLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQ29udGVudEl0ZW0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9Db250ZW50TGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0RyYXdlci5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVJdGVtLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVJdGVtRGV0YWlscy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lUHJldmlldy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGluay5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1B1YmxpY0ZyYW1lU3dpcGVyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvUHVibGljRnJhbWVzTGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzTW9kYWwuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TaW1wbGVOYXYuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uZmlnLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbnN0YW50cy9PRkNvbnN0YW50cy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0NvbnRlbnRTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvRnJhbWVTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvUHVibGljRnJhbWVTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvVUlTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9yZWFjdC1tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyREEsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2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QUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDOztBQUVILEtBQUssQ0FBQyxNQUFNO0NBQ1gsb0JBQUMsR0FBRyxFQUFBLElBQUEsQ0FBRyxDQUFBO0NBQ1AsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYW4gZW51bWVyYXRpb24gd2l0aCBrZXlzIGVxdWFsIHRvIHRoZWlyIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgdmFyIENPTE9SUyA9IGtleU1pcnJvcih7Ymx1ZTogbnVsbCwgcmVkOiBudWxsfSk7XG4gKiAgIHZhciBteUNvbG9yID0gQ09MT1JTLmJsdWU7XG4gKiAgIHZhciBpc0NvbG9yVmFsaWQgPSAhIUNPTE9SU1tteUNvbG9yXTtcbiAqXG4gKiBUaGUgbGFzdCBsaW5lIGNvdWxkIG5vdCBiZSBwZXJmb3JtZWQgaWYgdGhlIHZhbHVlcyBvZiB0aGUgZ2VuZXJhdGVkIGVudW0gd2VyZVxuICogbm90IGVxdWFsIHRvIHRoZWlyIGtleXMuXG4gKlxuICogICBJbnB1dDogIHtrZXkxOiB2YWwxLCBrZXkyOiB2YWwyfVxuICogICBPdXRwdXQ6IHtrZXkxOiBrZXkxLCBrZXkyOiBrZXkyfVxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xudmFyIGtleU1pcnJvciA9IGZ1bmN0aW9uKG9iaikge1xuICB2YXIgcmV0ID0ge307XG4gIHZhciBrZXk7XG4gIGlmICghKG9iaiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheShvYmopKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigna2V5TWlycm9yKC4uLik6IEFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICB9XG4gIGZvciAoa2V5IGluIG9iaikge1xuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXRba2V5XSA9IGtleTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlNaXJyb3I7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0YWxsX2NvbnRlbnQ6ICcvY29udGVudC91c2VyLycgKyBPRl9VU0VSTkFNRVxufVxuXG52YXIgQ29udGVudEFjdGlvbnMgPSB7XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSBjb250ZW50IGFzeW5jaHJvbm91c2x5IGZyb20gdGhlIHNlcnZlci5cblx0ICovXG5cdGxvYWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnQ29udGVudEFjdGlvbnMubG9hZENvbnRlbnRzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGNvbnRlbnRcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgY29udGVudFxuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMuYWxsX2NvbnRlbnQpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0RPTkUsXG5cdFx0XHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0Ly8gbG9hZCBmYWlsdXJlLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgYSBuZXcgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQURELFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FLFxuXHRcdFx0XHRjb250ZW50OiByZXNwXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0FERF9GQUlMLFxuXHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHR9KTtcbiAgICAgICAgfSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhIGNvbnRlbnQgaXRlbS4gUGVyZm9ybXMgc2VydmVyIHJlcXVlc3QuXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29udGVudFxuXHQgKi9cblx0cmVtb3ZlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX1JFTU9WRSxcblx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHR9KTtcblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQvJyArIGNvbnRlbnQuX2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0RPTkVcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX1JFTU9WRV9GQUlMLFxuXHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHR9KTtcbiAgICAgICAgfSk7XG5cdH0sXG5cblx0c2xpZGVDaGFuZ2VkOiBmdW5jdGlvbihjb250ZW50X2lkKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRCxcblx0XHRcdGNvbnRlbnRfaWQ6IGNvbnRlbnRfaWRcblx0XHR9KTtcblx0fVxuXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50QWN0aW9uczsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHR1c2Vyc19mcmFtZXM6ICcvZnJhbWVzL3VzZXIvJyArIE9GX1VTRVJOQU1FLFxuXHR2aXNpYmxlX2ZyYW1lczogJy9mcmFtZXMvdmlzaWJsZT92PTEnXG59XG5cbnZhciBGcmFtZUFjdGlvbnMgPSB7XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSBmcmFtZXMgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpJyk7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBmcmFtZXNcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMudXNlcnNfZnJhbWVzKVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXM6ICcsIGZyYW1lcyk7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBGZXRjaCBhbGwgZnJhbWVzIG1hcmtlZCAndmlzaWJsZSdcblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRsb2FkVmlzaWJsZUZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMudmlzaWJsZV9mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lczogJywgZnJhbWVzKTtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRE9ORSxcblx0XHRcdFx0XHRmcmFtZXM6IGZyYW1lc1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0Ly8gbG9hZCBmYWlsdXJlLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgYSBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzZWxlY3QnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGNvbnRlbnQgb24gdGhlIHNlbGVjdGVkIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdHVwZGF0ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHR2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcbiAgICAgICAgZnJhbWUuY3VycmVudF9jb250ZW50ID0gY29udGVudDtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZTogZnJhbWVcbiAgICAgICAgfTtcbiAgICAgICAgU29ja2VyLnNlbmQoJ2ZyYW1lOnVwZGF0ZV9mcmFtZScsIGRhdGEpO1xuXHR9LFxuXG4gICAgbWlycm9yRnJhbWU6IGZ1bmN0aW9uKG1pcnJvcmVkX2ZyYW1lKSB7XG4gICAgICAgIHZhciBmcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lX2lkOiBmcmFtZS5faWQsXG4gICAgICAgICAgICBtaXJyb3JlZF9mcmFtZV9pZDogbWlycm9yZWRfZnJhbWUuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTptaXJyb3JfZnJhbWUnLCBkYXRhKVxuICAgIH0sXG5cblx0c2F2ZUZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFLFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cbiAgICAgICAgLy8gaGFjayBzbyB0aGF0IHNlbGVjdGVkIGRvZXNuJ3QgZ2V0IHBlcnNpc3RlZFxuICAgICAgICBmcmFtZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvZnJhbWVzLycrZnJhbWUuX2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGZyYW1lKSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9ET05FLFxuXHRcdFx0XHRmcmFtZTogZnJhbWVcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRkFJTCxcblx0XHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZnJhbWUuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRmcmFtZUNvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0ZnJhbWVEaXNjb25uZWN0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIGRpc2Nvbm5lY3RlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZUNvbnRlbnRVcGRhdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb250ZW50IHVwZGF0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05URU5UX1VQREFURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuICAgIGZyYW1lVXBkYXRlZDogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFVwZGF0ZWQ6ICcsIGZyYW1lKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfVVBEQVRFRCxcbiAgICAgICAgICAgIGZyYW1lOiBmcmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZnJhbWVNaXJyb3JlZDogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIG1pcnJvcmVkOiAnLCBmcmFtZSk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX01JUlJPUkVELFxuICAgICAgICAgICAgZnJhbWU6IGZyYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cblx0c2V0dXA6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgZnJhbWUgPSBkYXRhLmZyYW1lO1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgU2V0dXAnLCBmcmFtZSk7XG4gICAgICAgIC8vIHRoaXMgaXMgYSBsaXR0bGUgd2VpcmQgLS0gd2h5IGlzbid0IHNldHVwIGp1c3QgcGFydCBvZiB0aGUgaW5pdGlhbFxuICAgICAgICAvLyBjb25uZWN0ZWQgZXZlbnQ/XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhbGx5PyBEb2VzIHRoZSB2aWV3IGRpbWVuc2lvbiBuZWVkIHRvIGJlIHBhcnQgb2YgdGhlIHN0YXRlP1xuICAgICAqIFByb2JhYmxlIG5vdC4gTm90IHVzZWQgcHJlc2VudGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSB3IFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGggW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgc2V0dXBGcmFtZVZpZXc6IGZ1bmN0aW9uKHcsIGgpIHtcbiAgICBcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TRVRVUF9WSUVXLFxuXHRcdFx0dzogdyxcblx0XHRcdGg6IGhcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgc2xpZGVDaGFuZ2VkOiBmdW5jdGlvbihmcmFtZV9pZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZnJhbWVfaWQnLCBmcmFtZV9pZCk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NMSURFX0NIQU5HRUQsXG5cdFx0XHRmcmFtZV9pZDogZnJhbWVfaWRcblx0XHR9KTtcblx0fVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVBY3Rpb25zO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHR1c2Vyc19mcmFtZXM6ICcvZnJhbWVzL3VzZXIvJyArIE9GX1VTRVJOQU1FLFxuXHRwdWJsaWNfZnJhbWVzOiAnL2ZyYW1lcy92aXNpYmxlP3Y9MSdcbn1cblxudmFyIFB1YmxpY0ZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggYWxsIGZyYW1lcyBtYXJrZWQgJ3Zpc2libGUnXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZFB1YmxpY0ZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMucHVibGljX2ZyYW1lcylcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnZnJhbWVzOiAnLCBmcmFtZXMpO1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2VsZWN0ZWQgcHVibGljIGZyYW1lIHNsaWRlIGhhcyBjaGFuZ2VkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZnJhbWVfaWRcbiAgICAgKi9cbiAgICBzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGZyYW1lX2lkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZV9pZCcsIGZyYW1lX2lkKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuUFVCTElDX0ZSQU1FU19TTElERV9DSEFOR0VELFxuXHRcdFx0ZnJhbWVfaWQ6IGZyYW1lX2lkXG5cdFx0fSk7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFB1YmxpY0ZyYW1lQWN0aW9ucztcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG4gICAgT0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JylcblxudmFyIFVJQWN0aW9ucyA9IHtcblxuICAgIHRvZ2dsZU1lbnU6IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICAgICAgLy8gaWYgb3BlbiB0cnVlLCBvcGVuLiBpZiBmYWxzZSwgY2xvc2UuXG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9NRU5VX1RPR0dMRSxcbiAgICAgICAgICAgIG9wZW46IG9wZW5cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNldHRpbmdzOiBmdW5jdGlvbihvcGVuKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9TRVRUSU5HU19UT0dHTEUsXG4gICAgICAgICAgICBvcGVuOiBvcGVuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRTZWxlY3Rpb25QYW5lbDogZnVuY3Rpb24ocGFuZWwpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX1NFVF9TRUxFQ1RJT05fUEFORUwsXG4gICAgICAgICAgICBwYW5lbDogcGFuZWxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5BZGRDb250ZW50TW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnb3BlbkFkZENvbnRlbnRNb2RhbCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9BRERfQ09OVEVOVFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWRkQ29udGVudE1vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2FkZENvbnRlbnRNb2RhbENsb3NlZCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfQ0xPU0VfQUREX0NPTlRFTlRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5TZXR0aW5nc01vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ29wZW5TZXR0aW5nc01vZGFsJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9PUEVOX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nc01vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3NldHRpbmdzTW9kYWxDbG9zZWQnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuUHJldmlldzogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX09QRU5fUFJFVklFVyxcbiAgICAgICAgICAgIGZyYW1lOiBmcmFtZVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBjbG9zZVByZXZpZXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfQ0xPU0VfUFJFVklFV1xuICAgICAgICB9KVxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJQWN0aW9uczsiLCJTb2NrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9zZWxmID0ge30sXG4gICAgICAgIF9ldmVudEhhbmRsZXJzID0ge30sXG4gICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZSxcbiAgICAgICAgX29wdHMgPSB7XG4gICAgICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBjaGVja0ludGVydmFsOiAxMDAwMFxuICAgICAgICB9LFxuICAgICAgICBfdXJsLFxuICAgICAgICBfd3MsXG4gICAgICAgIF90aW1lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdlYnNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdXJsICBUaGUgc2VydmVyIFVSTC5cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdHMgT3B0aW9uYWwgc2V0dGluZ3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY29ubmVjdCh1cmwsIG9wdHMpIHtcbiAgICAgICAgX3VybCA9IHVybDtcbiAgICAgICAgaWYgKG9wdHMpIF9leHRlbmQoX29wdHMsIG9wdHMpO1xuICAgICAgICBfd3MgPSBuZXcgV2ViU29ja2V0KHVybCk7XG5cbiAgICAgICAgX3dzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gb3BlbmVkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbk9wZW4pIF9vcHRzLm9uT3BlbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbkNsb3NlKSBfb3B0cy5vbkNsb3NlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gbWVzc2FnZS5uYW1lLFxuICAgICAgICAgICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBldmVudCBoYW5kbGVyLCBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2V2ZW50SGFuZGxlcnNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV1baV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgXCIgZXZlbnQgbm90IGhhbmRsZWQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfb3B0cy5rZWVwQWxpdmUpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgICAgIF90aW1lciA9IHNldEludGVydmFsKF9jaGVja0Nvbm5lY3Rpb24sIF9vcHRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdID0gW2NhbGxiYWNrXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29mZihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9ldmVudEhhbmRsZXJzW25hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZGF0YSBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc2VuZChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Muc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIElmIG5vdCwgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hlY2tDb25uZWN0aW9uKCkge1xuICAgICAgICBpZiAoIV9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIF9jb25uZWN0KF91cmwsIF9vcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIGV4dGVuZGluZyBhbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZXh0ZW5kKG9iaikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBfc2VsZi5vbiA9IF9vbjtcbiAgICBfc2VsZi5vZmYgPSBfb2ZmO1xuICAgIF9zZWxmLnNlbmQgPSBfc2VuZDtcbiAgICBfc2VsZi5jb25uZWN0ID0gX2Nvbm5lY3Q7XG4gICAgcmV0dXJuIF9zZWxmO1xufSkoKTtcblxuLy8gQ09NTU9OLkpTXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBTb2NrZXI7IiwidmFyIHNzbSA9IHJlcXVpcmUoJ3NzbScpXG5cdGNvbmYgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuXG5mdW5jdGlvbiBfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQoKSB7XG5cdGNvbnNvbGUubG9nKCdfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQnKTtcblxuXHRfc2V0dXBTY3JlZW5TaXplKCk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAneHMnLFxuXHQgICAgbWF4V2lkdGg6IDc2Nyxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIHhzJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICd4cyc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ3NtJyxcblx0ICAgIG1pbldpZHRoOiA3NjgsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBzbScpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnc20nO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdtZCcsXG5cdCAgICBtaW5XaWR0aDogOTkyLFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgbWQnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ21kJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnbGcnLFxuXHQgICAgbWluV2lkdGg6IDEyMDAsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBsZycpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnbGcnO1xuXHQgICAgfVxuXHR9KTtcdFxuXG5cdHNzbS5yZWFkeSgpO1xufVxuXG5mdW5jdGlvbiBfc2V0dXBTY3JlZW5TaXplKCkge1xuXHRjb25mLndXID0gd2luZG93LmlubmVyV2lkdGg7XG5cdGNvbmYud0ggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdGNvbnNvbGUubG9nKGNvbmYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdDogX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50XG59XG5cbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgQ29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyk7XG5cbnZhciBBZGRDb250ZW50Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBoYW5kbGVGb3JtU3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHVybCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlO1xuXG4gICAgICAgIGlmICghdXJsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWJtaXR0aW5nIGNvbnRlbnQ6ICcsIGNvbnRlbnQpO1xuICAgICAgICBDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlID0gJyc7XG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLmZvY3VzKCk7XG4gICAgfSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgaGlkZGVuLXhzIGFkZC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1pbmxpbmVcIiBpZD1cImFkZC1mb3JtXCIgb25TdWJtaXQ9e3RoaXMuaGFuZGxlRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxsYWJlbCBmb3I9XCJTZW5kVG9Vc2VyXCI+VVJMPC9sYWJlbD4gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIGlkPVwiVVJMXCIgcGxhY2Vob2xkZXI9XCJlbnRlciBVUkxcIiByZWY9XCJVUkxcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHQgYnRuLWFkZC1jb250ZW50XCIgaHJlZj1cIiNhZGQtY29udGVudFwiIGlkPVwiYWRkLWNvbnRlbnQtYnV0dG9uXCI+QWRkIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRGb3JtOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgQWRkQ29udGVudE1vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhZGRPcGVuOiBmYWxzZVxuXHRcdH1cblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgICAgICBcdHRoYXQuX3Jlc2V0Rm9ybSgpO1xuICAgICAgICBcdFVJQWN0aW9ucy5hZGRDb250ZW50TW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcblx0XHQvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIGNlbnRlck1vZGFscyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vZmYoJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgIH0sXG5cblx0X2hhbmRsZUFkZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSxcblx0XHRcdHRhZ3MgPSB0aGlzLnJlZnMudGFncy5nZXRET01Ob2RlKCkudmFsdWU7XG5cblx0XHRpZiAoIXVybC50cmltKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0YWdzID0gdGFncy50cmltKCkuc3BsaXQoJyMnKTtcblxuXHRcdF8ucmVtb3ZlKHRhZ3MsIGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0cmV0dXJuIHRhZy50cmltKCkgPT0gJyc7XG5cdFx0fSk7XG5cblx0XHRfLmVhY2godGFncywgZnVuY3Rpb24odGFnLCBpKSB7XG5cdFx0XHR0YWdzW2ldID0gdGFnLnRyaW0oKTtcblx0XHR9KTtcblxuXHRcdGNvbnNvbGUubG9nKHRhZ3MpO1xuXG5cdFx0dmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdLFxuICAgICAgICAgICAgdGFnczogdGFnc1xuICAgICAgICB9O1xuXHRcdENvbnRlbnRBY3Rpb25zLmFkZENvbnRlbnQoY29udGVudCk7XG5cblx0fSxcblxuXHRfaGFuZGxlT25Gb2N1czogZnVuY3Rpb24oZSkge1xuXHRcdHZhciBlbCA9IGUuY3VycmVudFRhcmdldDtcblx0XHRpZiAoZWwudmFsdWUudHJpbSgpID09ICcnKSB7XG5cdFx0XHRlbC52YWx1ZSA9ICcjJztcblx0XHR9XG5cdH0sXG5cblx0X2hhbmRsZVRhZ3NDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgZWwgPSBlLmN1cnJlbnRUYXJnZXQsXG5cdFx0XHR2YWwgPSBlbC52YWx1ZTtcblxuXHRcdGlmIChlbC52YWx1ZSA9PSAnJykge1xuXHRcdFx0ZWwudmFsdWUgPSAnIyc7XG5cdFx0fVxuXG5cdFx0aWYgKHZhbFt2YWwubGVuZ3RoLTFdID09PSAnICcpIHtcblx0XHRcdGVsLnZhbHVlICs9ICcjJ1xuXHRcdH1cblx0fSxcblxuXHRfaGFuZGxlS2V5RG93bjogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBlLmN1cnJlbnRUYXJnZXQudmFsdWU7XG5cdFx0aWYgKHZhbFswXSAhPSAnIycpIHtcblx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbCA9ICcjJyArIHZhbDtcblxuXHRcdH1cblx0XHRpZiAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIHZhbCAhPT0gJyMnKSB7XG5cdFx0XHRpZiAodmFsW3ZhbC5sZW5ndGggLSAxXSA9PT0gJyMnKSB7XG5cdFx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbC5zdWJzdHJpbmcoMCwgdmFsLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfcmVzZXRGb3JtOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHRcdHRoaXMucmVmcy50YWdzLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRBZGRNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLmFkZE9wZW4pIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnaGlkZScpO1xuXHQgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsIGZhZGUgbW9kYWwtYWRkLWNvbnRlbnRcIiByZWY9XCJtb2RhbFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWRpYWxvZ1wiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHQgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWhlYWRlclwiPlxuXHRcdFx0XHQgICAgXHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwibW9kYWxcIiBhcmlhLWxhYmVsPVwiQ2xvc2VcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHQgICAgXHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0ICAgIFx0PGg0IGNsYXNzTmFtZT1cIm1vZGFsLXRpdGxlXCI+QWRkIENvbnRlbnQ8L2g0PlxuXHRcdFx0XHRcdCAgXHQ8L2Rpdj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtYm9keVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgVVJMPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ1cmxcIiB0eXBlPVwidXJsXCIgYXV0b0NhcGl0YWxpemU9XCJvZmZcIiBwbGFjZWhvbGRlcj1cImh0dHA6Ly8uLi5cIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyXCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1sYWJlbFwiPkVudGVyIGRlc2NyaXB0aW9uIHdpdGggdGFnczwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwidGFnc1wiIHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0YXV0b0NhcGl0YWxpemU9XCJvZmZcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRwbGFjZWhvbGRlcj1cIiNwaG90byAjUm9kY2hlbmtvICMxOTQxXCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25Gb2N1cz17dGhpcy5faGFuZGxlT25Gb2N1c31cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVRhZ3NDaGFuZ2V9XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdG9uS2V5RG93bj17dGhpcy5faGFuZGxlS2V5RG93bn0gLz5cblx0XHRcdFx0ICAgIFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVBZGRDb250ZW50fSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0QWRkIFRvIENvbGxlY3Rpb25cblx0XHRcdFx0ICAgIFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZGRDb250ZW50TW9kYWw7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cblx0TmF2ID0gcmVxdWlyZSgnLi9OYXYuanMnKSxcblx0U2ltcGxlTmF2ID0gcmVxdWlyZSgnLi9TaW1wbGVOYXYuanMnKSxcblx0RnJhbWUgPSByZXF1aXJlKCcuL0ZyYW1lLmpzJyksXG5cdFRyYW5zZmVyQnV0dG9ucyA9IHJlcXVpcmUoJy4vVHJhbnNmZXJCdXR0b25zLmpzJyksXG5cdEFkZENvbnRlbnRGb3JtID0gcmVxdWlyZSgnLi9BZGRDb250ZW50Rm9ybS5qcycpLFxuXHRDb250ZW50TGlzdCA9IHJlcXVpcmUoJy4vQ29udGVudExpc3QuanMnKSxcblx0UHVibGljRnJhbWVzTGlzdCA9IHJlcXVpcmUoJy4vUHVibGljRnJhbWVzTGlzdC5qcycpLFxuXHRGb290ZXJOYXYgPSByZXF1aXJlKCcuL0Zvb3Rlck5hdi5qcycpLFxuXHREcmF3ZXIgPSByZXF1aXJlKCcuL0RyYXdlci5qcycpLFxuXHRBZGRDb250ZW50TW9kYWwgPSByZXF1aXJlKCcuL0FkZENvbnRlbnRNb2RhbC5qcycpLFxuXHRTZXR0aW5nc01vZGFsID0gcmVxdWlyZSgnLi9TZXR0aW5nc01vZGFsLmpzJyksXG5cdEZyYW1lUHJldmlldyA9IHJlcXVpcmUoJy4vRnJhbWVQcmV2aWV3LmpzJyksXG5cblx0QXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG5cblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXG5cdGNvbmYgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxuLyoqXG4gKiBUaGUgQXBwIGlzIHRoZSByb290IGNvbXBvbmVudCByZXNwb25zaWJsZSBmb3I6XG4gKiAtIHNldHRpbmcgdXAgc3RydWN0dXJlIG9mIGNoaWxkIGNvbXBvbmVudHNcbiAqXG4gKiBJbmRpdmlkdWFsIGNvbXBvbmVudHMgcmVnaXN0ZXIgZm9yIFN0b3JlIHN0YXRlIGNoYW5nZSBldmVudHNcbiAqL1xudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0aW9uUGFuZWw6IFwiY29sbGVjdGlvblwiLFxuXHRcdFx0ZnJhbWVzOiBbXSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICcnLFxuXHRcdFx0XHRzZXR0aW5nczoge1xuXHRcdFx0XHRcdHZpc2libGU6IHRydWUsXG5cdFx0XHRcdFx0cm90YXRpb246IDBcblx0XHRcdFx0fSxcbiAgICAgICAgICAgICAgICBtaXJyb3Jpbmc6IG51bGwsXG4gICAgICAgICAgICAgICAgbWlycm9yaW5nX2NvdW50OiBudWxsLFxuICAgICAgICAgICAgICAgIG1pcnJvcl9tZXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBvd25lcjogJydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghZ2xvYmFsLk9GX1VTRVJOQU1FKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT0ZfVVNFUk5BTUUgbm90IGRlZmluZWQuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0U29ja2VyLmNvbm5lY3QoXCJ3czovL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9hZG1pbi93cy9cIiArIE9GX1VTRVJOQU1FKTtcblxuXHRcdC8vIFRPRE86IHRoZXNlIHNob3VsZCBtb3ZlIHRvIHRoZSBjb3JyZXNwb25kaW5nIEFjdGlvbnMgY3JlYXRvciAoZS5nLiBGcmFtZUFjdGlvbnMpXG5cdFx0U29ja2VyLm9uKCdmcmFtZTpjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmRpc2Nvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZURpc2Nvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6ZnJhbWVfdXBkYXRlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIEZyYW1lQWN0aW9ucy5zZXR1cCk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHRcdEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHRcdC8vIGtpY2sgb2ZmIGZyYW1lIGxvYWRpbmdcblx0XHRGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0XHRGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuXHQvKipcblx0ICogVHJpZ2dlcmVkIGZyb20gd2l0aGluIHNldHRpbmdzIG1vZGFsXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gc2V0dGluZ3MgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0X3NhdmVGcmFtZTogZnVuY3Rpb24oc2V0dGluZ3MpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2F2ZUZyYW1lKHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFRyaWdnZXJlZCBieSBjaGFuZ2VzIHdpdGhpbiBzZXR0aW5ncyBtb2RhbC5cblx0ICogQHBhcmFtICB7W3R5cGVdfSBmcmFtZSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRfb25TZXR0aW5nc0NoYW5nZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNlbGVjdGVkRnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnU0VMRUNURUQgRlJBTUU6ICcsIEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNlbGVjdGlvblBhbmVsOiBVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSxcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpXG4gICAgICAgIH0pO1xuXHR9LFxuXG4gIFx0cmVuZGVyOiBmdW5jdGlvbigpe1xuICBcdFx0dmFyIGNvbnRlbnRMaXN0ID0gPENvbnRlbnRMaXN0IC8+LFxuICBcdFx0XHRmcmFtZUxpc3QgPSA8UHVibGljRnJhbWVzTGlzdCAvPjtcbiAgXHRcdHZhciBzZWxlY3Rpb25QYW5lbCA9IHRoaXMuc3RhdGUuc2VsZWN0aW9uUGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbnRlbnRMaXN0IDogZnJhbWVMaXN0O1xuXHQgICAgcmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXIgYXBwJz5cblx0XHRcdFx0PFNpbXBsZU5hdiBmcmFtZXM9e3RoaXMuc3RhdGUuZnJhbWVzfSBzZWxlY3RlZEZyYW1lPXt0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWV9Lz5cblx0XHRcdFx0PEZyYW1lIGZyYW1lPXt0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWV9IC8+XG5cdFx0XHRcdDxUcmFuc2ZlckJ1dHRvbnMgcGFuZWxTdGF0ZT17dGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbH0gLz5cblx0XHRcdFx0PGRpdj57c2VsZWN0aW9uUGFuZWx9PC9kaXY+XG5cdFx0XHRcdDxGb290ZXJOYXYgcmVmPVwibmF2Rm9vdGVyXCIvPlxuXHRcdFx0XHQ8RHJhd2VyXG5cdFx0XHRcdFx0ZnJhbWVzPXt0aGlzLnN0YXRlLmZyYW1lc31cblx0XHRcdFx0XHRzZWxlY3RlZEZyYW1lPXt0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWV9IC8+XG5cdFx0XHRcdDxTZXR0aW5nc01vZGFsXG5cdFx0XHRcdFx0ZnJhbWU9e3RoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZX1cblx0XHRcdFx0XHRvblNhdmVTZXR0aW5ncz17dGhpcy5fc2F2ZUZyYW1lfVxuXHRcdFx0XHRcdG9uU2V0dGluZ3NDaGFuZ2U9e3RoaXMuX29uU2V0dGluZ3NDaGFuZ2V9XG5cdFx0XHRcdC8+XG5cdFx0XHRcdDxBZGRDb250ZW50TW9kYWwgLz5cblx0XHRcdFx0PEZyYW1lUHJldmlldyAvPlxuXHRcdFx0PC9kaXY+XG5cdCAgICApXG4gIFx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0Q29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpO1xuXG52YXIgQ29udGVudEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdF9oYW5kbGVTbGlkZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0Y29uc29sZS5sb2coJ3NsaWRlIGNsaWNrJyk7XG5cdFx0Ly8gYml0IG9mIGEgaGFjayAtLSBzbyB3ZSBjYW4gdXNlIHRoZSBGcmFtZVByZXZpZXdcbiAgICAgICAgLy8gY29tcG9uZW50IGhlcmUuIFByZXZpZXcgc2hvdWxkIGdldCByZWZhY3RvcmVkIHRvIGJlIG1vcmUgZ2VuZXJpYy5cblx0XHRVSUFjdGlvbnMub3BlblByZXZpZXcoe1xuICAgICAgICAgICAgY3VycmVudF9jb250ZW50OiB0aGlzLnByb3BzLmNvbnRlbnRcbiAgICAgICAgfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRlbnQgPSB0aGlzLnByb3BzLmNvbnRlbnQ7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXNsaWRlIGNvbnRlbnQtc2xpZGVcIiBkYXRhLWNvbnRlbnRpZD17Y29udGVudC5faWR9IG9uQ2xpY2s9e3RoaXMuX2hhbmRsZVNsaWRlQ2xpY2t9PlxuXHRcdFx0XHQ8aW1nIHNyYz17Y29udGVudC51cmx9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50SXRlbTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgU3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyksXG4gICAgQ29udGVudEl0ZW0gPSByZXF1aXJlKCcuL0NvbnRlbnRJdGVtJyksXG4gICAgQ29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyksXG4gICAgVUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcbiAgICBDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyksXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgQ29udGVudExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IFtdXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudCgpO1xuICAgICAgICBDb250ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICB0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2NvbXBvbmVudERpZFVubW91bnQnKTtcbiAgICAgICAgQ29udGVudFN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcblxuICAgIH0sXG5cbiAgICBfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IENvbnRlbnRTdG9yZS5nZXRDb250ZW50KClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVE9ETzogYmV0dGVyIFJlYWN0IGludGVncmF0aW9uIGZvciB0aGUgc3dpcGVyXG5cbiAgICAgICAgdGhpcy5faW5pdFNsaWRlcigpO1xuXG4gICAgICAgIHZhciBjb250ZW50X2lkID0gdGhpcy5zdGF0ZS5jb250ZW50WzBdLl9pZDtcbiAgICB9LFxuXG4gICAgX2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuU3dpcGVyKTtcbiAgICAgICAgaWYgKHRoaXMuc3dpcGVyKSB7XG4gICAgICAgICAgICB0aGlzLnN3aXBlci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiAzLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiA1MCxcbiAgICAgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuICAgICAgICAgICAgLy8gZnJlZU1vZGU6IHRydWUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZU1vbWVudHVtOiB0cnVlLFxuICAgICAgICAgICAgLy8gZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAwLjUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZVN0aWNreTp0cnVlLFxuICAgICAgICAgICAgLy8gbG9vcDogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGxvb3BlZFNsaWRlczogNSxcbiAgICAgICAgICAgIGluaXRpYWxTbGlkZTogMCxcbiAgICAgICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZSxcbiAgICAgICAgICAgIG9uU2xpZGVDaGFuZ2VFbmQ6IHRoaXMuX3NsaWRlQ2hhbmdlRW5kXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGVuIHdlIGNoYW5nZSBzbGlkZXMsIHVwZGF0ZSB0aGUgc2VsZWN0ZWQgY29udGVudFxuICAgICAqIGluIHRoZSBDb250ZW50U3RvcmVcbiAgICAgKiBAcGFyYW0gIHtTd2lwZXJ9IHN3aXBlclxuICAgICAqL1xuICAgIF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc3dpcGVyKSB7XG4gICAgICAgIHZhciBzbGlkZSA9IHRoaXMuc3dpcGVyLnNsaWRlc1t0aGlzLnN3aXBlci5hY3RpdmVJbmRleF0sXG4gICAgICAgICAgICBjb250ZW50X2lkID0gc2xpZGUuZGF0YXNldC5jb250ZW50aWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfc2xpZGVDaGFuZ2VFbmQnLCBjb250ZW50X2lkKTtcbiAgICAgICAgQ29udGVudEFjdGlvbnMuc2xpZGVDaGFuZ2VkKGNvbnRlbnRfaWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPbmNlIHRoZSBjb21wb25lbnQgaGFzIGxvYWRlZCB3ZSBjYW4gYXBwcm9wcmlhdGVseVxuICAgICAqIGFkanVzdCB0aGUgc2l6ZSBvZiB0aGUgc2xpZGVyIGNvbnRhaW5lci5cbiAgICAgKi9cbiAgICBfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucycpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcylcbiAgICAgICAgICAgIGggPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgcGFkZGluZyA9IDQwLFxuICAgICAgICAgICAgbmV3SCA9IGggLSBwYWRkaW5nO1xuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBuZXdIKydweCc7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIGNvbnRlbnRJdGVtcyA9IHRoaXMuc3RhdGUuY29udGVudC5tYXAoZnVuY3Rpb24gKGNvbnRlbnRJdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxDb250ZW50SXRlbSBjb250ZW50PXtjb250ZW50SXRlbX0ga2V5PXtjb250ZW50SXRlbS5faWR9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb250ZW50SXRlbXMucmV2ZXJzZSgpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1jb250YWluZXJcIiByZWY9XCJTd2lwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItd3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2NvbnRlbnRJdGVtc31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRMaXN0O1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2RnJhbWVMaXN0ID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpc3QnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyk7XG5cbnZhciBEcmF3ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaWRlQ2xhc3M6ICdtZW51LWRyYXdlci1sZWZ0J1xuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ2xvc2VNZW51Q2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdfaGFuZGxlQ2xvc2VNZW51Q2xpY2snKTtcblx0XHRVSUFjdGlvbnMudG9nZ2xlTWVudShmYWxzZSk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldE1lbnVTdGF0ZSgpKTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJhc2VDbGFzcyA9ICd2aXNpYmxlLXhzIG1lbnUtZHJhd2VyJztcblx0XHR2YXIgb3BlbkNsYXNzID0gdGhpcy5zdGF0ZS5vcGVuID8gJ21lbnUtZHJhd2VyLW9wZW4nIDogJ21lbnUtZHJhd2VyLWNsb3NlZCc7XG5cdFx0dmFyIHNpZGVDbGFzcyA9IHRoaXMucHJvcHMuc2lkZUNsYXNzO1xuXHRcdHZhciBmdWxsQ2xhc3MgPSBbYmFzZUNsYXNzLCBvcGVuQ2xhc3MsIHNpZGVDbGFzc10uam9pbignICcpO1xuXG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2Z1bGxDbGFzc30+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibWVudS1kcmF3ZXItaW5uZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm9mLW5hdi1maXhlZCBvZi1uYXYtZHJhd2VyXCI+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInVzZXJuYW1lIHRleHQtY2VudGVyXCI+e09GX1VTRVJOQU1FfTwvZGl2PlxuXHRcdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xvc2VNZW51Q2xpY2t9ID5cblx0XHQgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiAvPlxuXHRcdCAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8TmF2RnJhbWVMaXN0XG5cdFx0XHRcdFx0XHRmcmFtZXM9e3RoaXMucHJvcHMuZnJhbWVzfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZT17dGhpcy5wcm9wcy5zZWxlY3RlZEZyYW1lfVxuXHRcdFx0XHRcdFx0bGlua0NsaWNrSGFuZGxlcj17dGhpcy5faGFuZGxlQ2xvc2VNZW51Q2xpY2t9XG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXdlcjtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyk7XG5cbnZhciBGb290ZXJOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGlvblBhbmVsOiBcImNvbGxlY3Rpb25cIlxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge31cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ2xvc2VNZW51Q2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFVJQWN0aW9ucy50b2dnbGVNZW51KGZhbHNlKTtcblx0fSxcblxuXHRfaGFuZGxlQ29sbGVjdGlvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRVSUFjdGlvbnMuc2V0U2VsZWN0aW9uUGFuZWwoXCJjb2xsZWN0aW9uXCIpO1xuXHR9LFxuXG5cdF9oYW5kbGVGcmFtZXNDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0VUlBY3Rpb25zLnNldFNlbGVjdGlvblBhbmVsKFwiZnJhbWVzXCIpO1xuXHR9LFxuXG5cdF9oYW5kbGVBZGRDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0VUlBY3Rpb25zLm9wZW5BZGRDb250ZW50TW9kYWwoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgXHRzZWxlY3Rpb25QYW5lbDogVUlTdG9yZS5nZXRTZWxlY3Rpb25QYW5lbFN0YXRlKClcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHQvKipcblx0ICogVE9ETzogZmlndXJlIG91dCBzdGF0ZSBtYW5hZ2VtZW50LiBTdG9yZT9cblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uID0gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgb2YtbmF2LWZpeGVkIG9mLW5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWNvbGxlY3Rpb24gYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDb2xsZWN0aW9uQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY29sbGVjdGlvblwiPmNvbGxlY3Rpb248L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWZyYW1lc1wiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlRnJhbWVzQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZnJhbWVzXCI+ZnJhbWVzPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyLWFkZCBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENsaWNrfT4rPC9hPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblxuXHRcdHZhciBmcmFtZXMgPSAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItY29sbGVjdGlvblwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ29sbGVjdGlvbkNsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvbGxlY3Rpb25cIj5jb2xsZWN0aW9uPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1mcmFtZXMgYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVGcmFtZXNDbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJmcmFtZXNcIj5mcmFtZXM8L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdFx0dmFyIHBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbDtcblx0XHRjb25zb2xlLmxvZygnUEFORUw6ICcsIHRoaXMuc3RhdGUsIHBhbmVsKTtcblx0XHRyZXR1cm4gcGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbGxlY3Rpb24gOiBmcmFtZXM7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9vdGVyTmF2O1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBGcmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHQvLyBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHQvLyBcdHJldHVybiB7fVxuXHQvLyB9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyBGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpO1xuXHRcdC8vIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdF9oYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdFVJQWN0aW9ucy5vcGVuUHJldmlldyh0aGlzLnByb3BzLmZyYW1lKTtcblx0fSxcblxuICBcdC8vIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0Ly8gXHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuICBcdC8vIFx0Y29uc29sZS5sb2coJ3NlbGVjdGVkRnJhbWU6Jywgc2VsZWN0ZWRGcmFtZSk7XG4gIFx0Ly8gXHR0aGlzLnNldFN0YXRlKHtcbiAgXHQvLyBcdFx0ZnJhbWU6IHNlbGVjdGVkRnJhbWVcbiAgXHQvLyBcdH0pO1xuICBcdC8vIH0sXG5cbiAgXHRfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgY29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcyksXG4gIFx0XHRcdGZyYW1lT3V0ZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVPdXRlckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lSW5uZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVJbm5lckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lKSxcblx0XHRcdHcgPSBjb250YWluZXIub2Zmc2V0V2lkdGgsXG5cdFx0XHRoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcblx0XHRcdHBhZGRpbmcgPSA1MCxcblx0XHRcdG1heFcgPSB3IC0gMipwYWRkaW5nLFxuXHRcdFx0bWF4SCA9IGggLSAyKnBhZGRpbmcsXG5cdFx0XHRmcmFtZVcsIGZyYW1lSDtcblxuXHRcdGlmICgodGhpcy53X2hfcmF0aW8gPiAxIHx8IG1heEggKiB0aGlzLndfaF9yYXRpbyA+IG1heFcpICYmIG1heFcgLyB0aGlzLndfaF9yYXRpbyA8IG1heEgpIHtcblx0XHRcdC8vIHdpZHRoID4gaGVpZ2h0IG9yIHVzaW5nIGZ1bGwgaGVpZ2h0IHdvdWxkIGV4dGVuZCBiZXlvbmQgbWF4V1xuXHRcdFx0ZnJhbWVXID0gbWF4Vztcblx0XHRcdGZyYW1lSCA9IChtYXhXIC8gdGhpcy53X2hfcmF0aW8pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB3aWR0aCA8IGhlaWdodFxuXHRcdFx0ZnJhbWVIID0gbWF4SDtcblx0XHRcdGZyYW1lVyA9IChtYXhIICogdGhpcy53X2hfcmF0aW8pO1xuXHRcdH1cblxuXHRcdGZyYW1lLnN0eWxlLndpZHRoID0gZnJhbWVXICsgJ3B4Jztcblx0XHRmcmFtZS5zdHlsZS5oZWlnaHQgPSBmcmFtZUggKyAncHgnO1xuXG5cdFx0ZnJhbWVPdXRlckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IG1heFcrJ3B4Jztcblx0XHRmcmFtZUlubmVyQ29udGFpbmVyLnN0eWxlLnRvcCA9ICgoaCAtIGZyYW1lSCkgLyAyKSArICdweCc7XG5cdFx0Ly8gZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBmcmFtZS5zdHlsZS5oZWlnaHQ7XG5cblxuXG5cdFx0Y29uc29sZS5sb2coJ2ZyYW1lT3V0ZXJDb250YWluZXI6JywgZnJhbWVPdXRlckNvbnRhaW5lcik7XG5cdFx0Y29uc29sZS5sb2coJ2NvbnRhaW5lcjonLCB3LCBoLCBtYXhXLCBtYXhIKTtcbiAgXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnByb3BzLmZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIj48L2Rpdj5cblx0XHR9XG5cdFx0dGhpcy53X2hfcmF0aW8gPSB0aGlzLnByb3BzLmZyYW1lICYmIHRoaXMucHJvcHMuZnJhbWUuc2V0dGluZ3MgPyB0aGlzLnByb3BzLmZyYW1lLnNldHRpbmdzLndfaF9yYXRpbyA6IDE7XG5cblx0XHR2YXIgdXJsID0gdGhpcy5wcm9wcy5mcmFtZSAmJiB0aGlzLnByb3BzLmZyYW1lLmN1cnJlbnRfY29udGVudCA/IHRoaXMucHJvcHMuZnJhbWUuY3VycmVudF9jb250ZW50LnVybCA6ICcnO1xuXHRcdHZhciBkaXZTdHlsZSA9IHtcblx0XHRcdGJhY2tncm91bmRJbWFnZTogJ3VybCgnICsgdXJsICsgJyknLFxuXHRcdH07XG5cblx0XHRjb25zb2xlLmxvZyh0aGlzLndfaF9yYXRpbyk7XG5cblx0XHR2YXIgd2hTdHlsZSA9IHtcblx0XHRcdHBhZGRpbmdCb3R0b206ICgxL3RoaXMud19oX3JhdGlvKSAqIDEwMCArICclJ1xuXHRcdH07XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIiByZWY9XCJmcmFtZUNvbnRhaW5lclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14bC0xMiBmcmFtZS1vdXRlci1jb250YWluZXJcIiByZWY9XCJmcmFtZU91dGVyQ29udGFpbmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZS1pbm5lci1jb250YWluZXJcIiByZWY9XCJmcmFtZUlubmVyQ29udGFpbmVyXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xpY2t9PlxuXHRcdCAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZVwiIHN0eWxlPXtkaXZTdHlsZX0gcmVmPVwiZnJhbWVcIi8+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG5cdFx0ICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKTtcblxudmFyIEZyYW1lSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cHJvcFR5cGVzOiB7XG5cdFx0ZnJhbWU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZFxuXHR9LFxuXHRfaGFuZGxlU2xpZGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjbGljaycpO1xuXHRcdFVJQWN0aW9ucy5vcGVuUHJldmlldyh0aGlzLnByb3BzLmZyYW1lKTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZnJhbWUgPSB0aGlzLnByb3BzLmZyYW1lO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1zbGlkZSBmcmFtZS1zbGlkZVwiIGRhdGEtZnJhbWVpZD17ZnJhbWUuX2lkfSBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTbGlkZUNsaWNrfT5cblx0XHRcdFx0PGltZyBzcmM9e2ZyYW1lLmN1cnJlbnRfY29udGVudC51cmx9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUl0ZW07XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIFB1YmxpY0ZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvUHVibGljRnJhbWVTdG9yZScpO1xuXG52YXIgRnJhbWVJdGVtRGV0YWlscyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICAvLyBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICByZXR1cm4ge1xuICAgIC8vICAgICAgICAgZnJhbWU6IHtcbiAgICAvLyAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAvLyAgICAgICAgICAgICBvd25lcjogJydcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBvd25lcjogJydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIFB1YmxpY0ZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIC8vIH0sXG5cbiAgICAvLyBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIFB1YmxpY0ZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIC8vIH0sXG5cbiAgICAvLyBfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIG1pcnJvcmluZ19jb3VudCA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmZyYW1lICYmIHRoaXMucHJvcHMuZnJhbWUubWlycm9yaW5nX2NvdW50KSB7XG4gICAgICAgICAgICBtaXJyb3JpbmdfY291bnQgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLXN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9mLWljb24tbWlycm9yXCI+PC9zcGFuPiB7dGhpcy5wcm9wcy5mcmFtZS5taXJyb3JpbmdfY291bnR9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3duZXIgPSAnJztcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZnJhbWUub3duZXIpIHtcbiAgICAgICAgICAgIG93bmVyICs9ICdAJyArIHRoaXMucHJvcHMuZnJhbWUub3duZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmcmFtZS1zbGlkZS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtbmFtZVwiPnt0aGlzLnByb3BzLmZyYW1lLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS11c2VyXCI+e293bmVyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfY291bnR9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lSXRlbURldGFpbHM7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG4gICAgVUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgRnJhbWVQcmV2aWV3ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lOiBudWxsLFxuICAgICAgICAgICAgcHJldmlld09wZW46IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vblVJQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSUFjdGlvbnMuY2xvc2VQcmV2aWV3KCk7XG4gICAgfSxcblxuICAgIF9vblVJQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFByZXZpZXdTdGF0ZSgpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29udGVudCA9IHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50LFxuICAgICAgICAgICAgdGFncyA9IGNvbnRlbnQudGFncyxcbiAgICAgICAgICAgIGZyYW1lRGV0YWlscyA9IG51bGwsXG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9ICcnLFxuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb3VudCA9IHRoaXMuc3RhdGUuZnJhbWUubWlycm9yaW5nX2NvdW50O1xuXG4gICAgICAgIHRhZ3NfY29udGVudCA9ICcnO1xuICAgICAgICBpZiAodGFncykge1xuICAgICAgICAgICAgXy5lYWNoKHRhZ3MsIGZ1bmN0aW9uKHRhZykge1xuICAgICAgICAgICAgICAgIHRhZ3NfY29udGVudCArPSAnIycgKyB0YWcgKyAnICc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2aWV3Q2xhc3MgPSB0aGlzLnN0YXRlLnByZXZpZXdPcGVuID8gJ3ByZXZpZXctb3BlbicgOiAncHJldmlldy1jbG9zZWQnO1xuXG4gICAgICAgIHZhciBmdWxsQ2xhc3MgPSAncHJldmlldy1jb250YWluZXIgJyArIHByZXZpZXdDbGFzcztcblxuICAgICAgICB2YXIgZGl2U3R5bGUgPSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6ICd1cmwoJyArIGNvbnRlbnQudXJsICsgJyknXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG1pcnJvcmluZ19jb3VudCkge1xuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLW1ldGFcIj57bWlycm9yaW5nX2NvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5mcmFtZS5uYW1lKSB7XG4gICAgICAgICAgICBmcmFtZURldGFpbHMgPSAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJldmlldy1mcmFtZS1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZnJhbWUtbmFtZVwiPnt0aGlzLnN0YXRlLmZyYW1lLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1pcnJvcmluZy1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfaWNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm93bmVyIHB1bGwtcmlnaHRcIj5Ae3RoaXMuc3RhdGUuZnJhbWUub3duZXJ9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMiBkZXNjcmlwdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17ZnVsbENsYXNzfSBzdHlsZT17ZGl2U3R5bGV9ID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZXZpZXctZm9vdGVyLXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmV2aWV3LWZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJldmlldy10YWdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmV2aWV3LXRhZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0YWdzX2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgcHVsbC1yaWdodFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsb3NlQ2xpY2t9ID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJldmlldy1kaW1lbnNpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdyBwcmV2aWV3LXVybFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjb250ZW50LnVybH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAge2ZyYW1lRGV0YWlsc31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVQcmV2aWV3OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgTmF2RnJhbWVMaW5rID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpbmsnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZnJhbWU6ICcsIGZyYW1lKTtcbiAgICAgICAgICAgIHJldHVybiA8TmF2RnJhbWVMaW5rIGtleT17ZnJhbWUuX2lkfSBmcmFtZT17ZnJhbWV9IC8+XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPG5hdiBjbGFzc05hbWU9XCJuYXZiYXIgbmF2YmFyLWRlZmF1bHRcIj5cbiAgICAgICAgICAgICAgICB7LyogQnJhbmQgYW5kIHRvZ2dsZSBnZXQgZ3JvdXBlZCBmb3IgYmV0dGVyIG1vYmlsZSBkaXNwbGF5ICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJuYXZiYXItdG9nZ2xlIGNvbGxhcHNlZCBwdWxsLWxlZnRcIiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjYnMtZXhhbXBsZS1uYXZiYXItY29sbGFwc2UtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwic3Itb25seVwiPlRvZ2dsZSBuYXZpZ2F0aW9uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQgaGlkZGVuLXhzXCI+PHNwYW4gY2xhc3NOYW1lPVwib3BlbmZyYW1lXCI+b3BlbmZyYW1lLzwvc3Bhbj48c3BhbiBjbGFzc05hbWU9XCJ1c2VybmFtZVwiPntPRl9VU0VSTkFNRX08L3NwYW4+PC9oMz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogQ29sbGVjdCB0aGUgbmF2IGxpbmtzLCBmb3JtcywgYW5kIG90aGVyIGNvbnRlbnQgZm9yIHRvZ2dsaW5nICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sbGFwc2UgbmF2YmFyLWNvbGxhcHNlXCIgaWQ9XCJicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJkcm9wZG93blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHJvbGU9XCJidXR0b25cIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj5GcmFtZXMgPHNwYW4gY2xhc3NOYW1lPVwiY2FyZXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwiZHJvcGRvd24tbWVudVwiIHJvbGU9XCJtZW51XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1sb2ctb3V0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiAvLm5hdmJhci1jb2xsYXBzZSAqL31cbiAgICAgICAgICAgIDwvbmF2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyk7XG5cbnZhciBOYXZGcmFtZUxpbmsgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGhhbmRsZUZyYW1lU2VsZWN0aW9uOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnNlbGVjdCh0aGlzLnByb3BzLmZyYW1lKTtcblx0XHRpZiAodGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyKSB7XG5cdFx0XHR0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXIoKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYWN0aXZlQ2xhc3MgPSAnbm90LWNvbm5lY3RlZCcsXG5cdFx0XHRhY3RpdmVUZXh0ID0gJ25vdCBjb25uZWN0ZWQnO1xuXHRcdGlmICh0aGlzLnByb3BzLmZyYW1lLmNvbm5lY3RlZCkge1xuXHRcdFx0YWN0aXZlQ2xhc3MgPSBhY3RpdmVUZXh0ID0gJ2Nvbm5lY3RlZCc7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNTZWxlY3RlZChzZWxlY3RlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkID8gJ2ljb24tY2hlY2snIDogJ3NwYWNlJztcbiAgICAgICAgfVxuXG5cdFx0dmFyIGNsYXNzZXMgPSAncHVsbC1yaWdodCBzdGF0dXMgJyArIGFjdGl2ZUNsYXNzO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8bGkgb25DbGljaz17dGhpcy5oYW5kbGVGcmFtZVNlbGVjdGlvbn0+XG5cdFx0XHRcdDxhIGhyZWY9XCIjXCI+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPXtpc1NlbGVjdGVkKHRoaXMucHJvcHMuc2VsZWN0ZWQpfSAvPiB7dGhpcy5wcm9wcy5mcmFtZS5uYW1lfVxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT17Y2xhc3Nlc30+e2FjdGl2ZVRleHR9PC9zcGFuPlxuXHRcdFx0XHQ8L2E+XG5cdFx0XHQ8L2xpPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkZyYW1lTGluaztcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyk7XG5cbnZhciBOYXZGcmFtZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgXHRyZXR1cm4ge1xuICAgIFx0XHRleHRyYUNsYXNzZXM6ICcnLFxuICAgIFx0XHRpbmNsdWRlTG9nb3V0OiB0cnVlLFxuICAgIFx0XHRsaW5rQ2xpY2tIYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICBcdFx0XHRjb25zb2xlLmxvZygnbGluayBjbGlja2VkJyk7XG4gICAgXHRcdH1cbiAgICBcdH07XG4gICAgfSxcblxuICAgIC8vIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHJldHVybiB7XG4gICAgLy8gICAgICAgICBmcmFtZXM6IFtdXG4gICAgLy8gICAgIH1cbiAgICAvLyB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0ZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTU1NTU1NPycsIGZyYW1lLCB0aGlzLnByb3BzLnNlbGVjdGVkRnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8TmF2RnJhbWVMaW5rXG4gICAgICAgICAgICAgICAgICAgIGtleT17ZnJhbWUuX2lkfVxuICAgICAgICAgICAgICAgICAgICBmcmFtZT17ZnJhbWV9XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkPXtmcmFtZS5faWQgPT09IHRoaXMucHJvcHMuc2VsZWN0ZWRGcmFtZS5faWR9XG4gICAgICAgICAgICAgICAgICAgIGxpbmtDbGlja0hhbmRsZXI9e3RoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcn1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLmV4dHJhQ2xhc3NlcyArICcgbmF2LWZyYW1lLWxpc3QgZHJhd2VyLWNvbnRlbnQnO1xuXG5cdFx0dmFyIGxvZ291dCA9ICcnO1xuXHRcdGlmICh0aGlzLnByb3BzLmluY2x1ZGVMb2dvdXQpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdpbmNsdWRlTG9nb3V0Jyk7XG5cdFx0XHRsb2dvdXQgPSAoXG5cdFx0XHRcdDxsaT5cblx0XHRcdFx0XHQ8YSBvbkNsaWNrPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IGNsYXNzTmFtZT1cImJ0bi1sb2dvdXRcIiBocmVmPVwiL2xvZ291dFwiPmxvZyBvdXQ8L2E+XG5cdFx0XHRcdDwvbGk+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPXtjbGFzc2VzfSByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgIHtsb2dvdXR9XG4gICAgICAgICAgICA8L3VsPlxuXHRcdCk7XG5cdH0sXG5cblx0Ly8gX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAvLyAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gLy8gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAvLyAgICAgICAgfSk7XG4gLy8gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpc3Q7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuICAgIEZyYW1lSXRlbSA9IHJlcXVpcmUoJy4vRnJhbWVJdGVtJyksXG4gICAgUHVibGljRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9QdWJsaWNGcmFtZUFjdGlvbnMnKTtcblxudmFyIFB1YmxpY0ZyYW1lU3dpcGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgICAgIGlmICghdGhpcy5zd2lwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaW5pdFNsaWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5Td2lwZXIpO1xuICAgICAgICBpZiAodGhpcy5zd2lwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc3dpcGVyLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN3aXBlciA9IG5ldyBTd2lwZXIoZWwsIHtcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IDMsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IDUwLFxuICAgICAgICAgICAgY2VudGVyZWRTbGlkZXM6IHRydWUsXG4gICAgICAgICAgICAvLyBwcmVsb2FkSW1hZ2VzOiB0cnVlLFxuICAgICAgICAgICAgLy8gZnJlZU1vZGU6IHRydWUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZU1vbWVudHVtOiB0cnVlLFxuICAgICAgICAgICAgLy8gZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAuMjUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZVN0aWNreTp0cnVlLFxuICAgICAgICAgICAga2V5Ym9hcmRDb250cm9sOiB0cnVlLFxuICAgICAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKGluZGV4KTtcbiAgICB9LFxuXG4gICAgX3NsaWRlQ2hhbmdlRW5kOiBmdW5jdGlvbihzbGlkZXIpIHtcbiAgICAgICAgdmFyIHNsaWRlID0gdGhpcy5zd2lwZXIuc2xpZGVzW3RoaXMuc3dpcGVyLmFjdGl2ZUluZGV4XSxcbiAgICAgICAgICAgIGZyYW1lX2lkID0gc2xpZGUuZGF0YXNldC5mcmFtZWlkO1xuICAgICAgICBQdWJsaWNGcmFtZUFjdGlvbnMuc2xpZGVDaGFuZ2VkKGZyYW1lX2lkKTtcbiAgICB9LFxuXG4gICAgX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMnKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMucmVmcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpLFxuICAgICAgICAgICAgaCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG4gICAgICAgICAgICAvLyBjdXJyZW50IHRvcCBvZiB0aGUgZnJhbWVzIHN3aXBlciBjb250YWluZXIgKGkuZS4gc2NyZWVuIG1pZHBvaW50KVxuICAgICAgICAgICAgdG9wID0gY29udGFpbmVyLm9mZnNldFRvcCxcbiAgICAgICAgICAgIC8vICBoZWlnaHQgb2YgdGhlIGZvb3RlciBuYXYgKDQwKSArIGZyYW1lIGRldGFpbCB0ZXh0ICg1MilcbiAgICAgICAgICAgIGZvb3RlckggPSA5MixcbiAgICAgICAgICAgIC8vICBhZGRpdGlvbmFsIHBhZGRpbmdcbiAgICAgICAgICAgIHBhZGRpbmcgPSA0MCxcbiAgICAgICAgICAgIHRvdGFsUGFkID0gZm9vdGVySCArIHBhZGRpbmcsXG4gICAgICAgICAgICBuZXdIID0gaCAtIHRvdGFsUGFkO1xuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBuZXdIKydweCc7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAodG9wICsgcGFkZGluZy8yKSArICdweCc7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmcmFtZUl0ZW1zID0gdGhpcy5wcm9wcy5mcmFtZXMubWFwKGZ1bmN0aW9uIChmcmFtZUl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPEZyYW1lSXRlbSBmcmFtZT17ZnJhbWVJdGVtfSBrZXk9e2ZyYW1lSXRlbS5faWR9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItb3V0ZXItY29udGFpbmVyXCIgcmVmPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcmFtZUl0ZW1zfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHVibGljRnJhbWVTd2lwZXI7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUl0ZW1EZXRhaWxzID0gcmVxdWlyZSgnLi9GcmFtZUl0ZW1EZXRhaWxzJyksXG4gICAgUHVibGljRnJhbWVTd2lwZXIgPSByZXF1aXJlKCcuL1B1YmxpY0ZyYW1lU3dpcGVyJyksXG4gICAgUHVibGljRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9QdWJsaWNGcmFtZUFjdGlvbnMnKSxcbiAgICBQdWJsaWNGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1B1YmxpY0ZyYW1lU3RvcmUnKTtcblxuXG4vKipcbiAqIFRoaXMgY29tcG9uZW50IG1hbmFnZXMgc3RhdGUgZm9yIHRoZSBsaXN0IG9mIHB1YmxpYyBmcmFtZXNcbiAqL1xudmFyIFB1YmxpY0ZyYW1lc0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG5cdFx0XHRmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIG93bmVyOiAnJ1xuICAgICAgICAgICAgfVxuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQdWJsaWNGcmFtZXNMaXN0OiBjb21wb25lbnQgZGlkIG1vdW50Jyk7XG5cdFx0UHVibGljRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIFB1YmxpY0ZyYW1lQWN0aW9ucy5sb2FkUHVibGljRnJhbWVzKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgUHVibGljRnJhbWVTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7fSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0ZnJhbWVzOiBQdWJsaWNGcmFtZVN0b3JlLmdldFB1YmxpY0ZyYW1lcygpLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZTogUHVibGljRnJhbWVTdG9yZS5nZXRTZWxlY3RlZFB1YmxpY0ZyYW1lKClcbiAgXHRcdH0pO1xuICBcdH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8UHVibGljRnJhbWVTd2lwZXIgZnJhbWVzPXt0aGlzLnN0YXRlLmZyYW1lc30gLz5cbiAgICAgICAgICAgICAgICA8RnJhbWVJdGVtRGV0YWlscyBmcmFtZT17dGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lfS8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFB1YmxpY0ZyYW1lc0xpc3Q7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgU2V0dGluZ3NNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3NPcGVuOiBmYWxzZVxuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdGhpcy5zZXRTdGF0ZSh0aGlzLnByb3BzKTtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vblVJQ2hhbmdlKTtcblxuICAgICAgICAvLyBzZXQgbW9kYWwgZXZlbnQgaGFuZGxlclxuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZygnaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgICAgIFx0VUlBY3Rpb25zLnNldHRpbmdzTW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVub3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25VSUNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVOYW1lQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZTtcblx0XHRmcmFtZSA9IHRoaXMucHJvcHMuZnJhbWU7XG5cdFx0ZnJhbWUubmFtZSA9IHZhbDtcblx0XHR0aGlzLnByb3BzLm9uU2V0dGluZ3NDaGFuZ2UoZnJhbWUpO1xuXHR9LFxuXG5cdF9oYW5kbGVEZXNjcmlwdGlvbkNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWU7XG5cdFx0ZnJhbWUgPSB0aGlzLnByb3BzLmZyYW1lO1xuXHRcdGZyYW1lLmRlc2NyaXB0aW9uID0gdmFsO1xuXHRcdHRoaXMucHJvcHMub25TZXR0aW5nc0NoYW5nZShmcmFtZSk7XG5cdH0sXG5cblx0X2hhbmRsZVZpc2liaWxpdHlDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG5cdFx0ZnJhbWUgPSB0aGlzLnByb3BzLmZyYW1lO1xuXHRcdGZyYW1lLnNldHRpbmdzLnZpc2libGUgPSB2YWw7XG5cdFx0dGhpcy5wcm9wcy5vblNldHRpbmdzQ2hhbmdlKGZyYW1lKTtcblx0fSxcblxuXHRfaGFuZGxlUm90YXRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuXHRcdGZyYW1lID0gdGhpcy5wcm9wcy5mcmFtZTtcblx0XHRmcmFtZS5zZXR0aW5ncy5yb3RhdGlvbiA9IHZhbDtcblx0XHR0aGlzLnByb3BzLm9uU2V0dGluZ3NDaGFuZ2UoZnJhbWUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBQYXNzIGFsb25nIGV2ZW50IHRvIEFwcCwgd2hlcmUgdGhlIHNhdmUgQWN0aW9uIGlzIHRyaWdnZXJlZC5cblx0ICogQHBhcmFtICB7W3R5cGVdfSBlIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdF9oYW5kbGVTYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0dGhpcy5wcm9wcy5vblNhdmVTZXR0aW5ncygpXG5cdH0sXG5cblx0X29uVUlDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFVJU3RvcmUuZ2V0U2V0dGluZ3NNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLnNldHRpbmdzT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJysrKysrKysrICcsIHRoaXMucHJvcHMuZnJhbWUpO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1zZXR0aW5nc1wiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5TZXR0aW5nczwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+TmFtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdHJlZj1cIm5hbWVcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0dHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0dmFsdWU9e3RoaXMucHJvcHMuZnJhbWUubmFtZX1cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLl9oYW5kbGVOYW1lQ2hhbmdlfVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RGVzY3JpcHRpb24gKG9wdGlvbmFsKTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPlVzZWZ1bCBpZiB5b3VyIGZyYW1lIGZvbGxvd3MgYSB0aGVtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdHJlZj1cImRlc2NyaXB0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnByb3BzLmZyYW1lLmRlc2NyaXB0aW9ufVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZURlc2NyaXB0aW9uQ2hhbmdlfVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0cGxhY2Vob2xkZXI9XCJlLmcuIGphcGFuZXNlIGFydCwgOTBzIHBvc3RlcnNcIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTlcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+VmlzaWJsZSB0byBvdGhlciBwZW9wbGU8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsLXN1YnRleHRcIj5Zb3VyIGZyYW1lIHdpbGwgYXBwZWFyIG9uIEZyYW1lcyBhbmQgb3RoZXJzIGNhbiBtaXJyb3IgaXQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtM1wiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXQtY2hlY2tib3hcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInZpc2liaWxpdHlcIiB0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0Y2hlY2tlZD17dGhpcy5wcm9wcy5mcmFtZS5zZXR0aW5ncy52aXNpYmxlfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVZpc2liaWxpdHlDaGFuZ2V9XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkIHJvdy1mb3JtLWZpZWxkLXJvdGF0aW9uXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0tbGFiZWxcIj5Sb3RhdGlvbjwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNiBmb3JtLWlucHV0LXNlbGVjdFwiPlxuXHRcdFx0XHRcdCAgICBcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJyb3RhdGlvblwiXG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0dmFsdWU9e3RoaXMucHJvcHMuZnJhbWUuc2V0dGluZ3Mucm90YXRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVJvdGF0aW9uQ2hhbmdlfVxuXHRcdFx0XHQgICAgXHRcdFx0XHQ+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwXCI+MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTYXZlfSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0U2F2ZVxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzTW9kYWw7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG4gICAgVUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgU2ltcGxlTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldERlZnVhbHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIG1pcnJvcmluZzogbnVsbCxcbiAgICAgICAgICAgICAgICBtaXJyb3JpbmdfY291bnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbWlycm9yX21ldGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyOiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaGFuZGxlT3Blbk1lbnVDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5NZW51Q2xpY2snKTtcbiAgICAgICAgVUlBY3Rpb25zLnRvZ2dsZU1lbnUodHJ1ZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuU2V0dGluZ3M6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ19oYW5kbGVPcGVuU2V0dGluZ3MnKTtcbiAgICAgICAgVUlBY3Rpb25zLm9wZW5TZXR0aW5nc01vZGFsKCk7XG4gICAgfSxcblxuICAgIC8vIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCcrKysrKysgZ2V0IHNlbGVjdGVkIGZyYW1lJywgRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkpO1xuICAgIC8vICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAvLyAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKSxcbiAgICAvLyAgICAgICAgIHNlbGVjdGVkRnJhbWU6IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpXG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZnJhbWVOYW1lID0gdGhpcy5wcm9wcy5zZWxlY3RlZEZyYW1lLm5hbWUsXG4gICAgICAgICAgICBtaXJyb3JpbmcgPSB0aGlzLnByb3BzLnNlbGVjdGVkRnJhbWUubWlycm9yaW5nLFxuICAgICAgICAgICAgbWlycm9yX21ldGEgPSB0aGlzLnByb3BzLnNlbGVjdGVkRnJhbWUubWlycm9yX21ldGEsXG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9ICcnLFxuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb3VudCA9IHRoaXMucHJvcHMuc2VsZWN0ZWRGcmFtZS5taXJyb3JpbmdfY291bnQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29ubmVjdGVkKGNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdmFyIGNvbm5lY3RlZF9jb250ZW50ID0gJyc7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGVkX2NvbnRlbnQgPSAnJmJ1bGw7ICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge19faHRtbDogY29ubmVjdGVkX2NvbnRlbnR9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1pcnJvcmluZ19jb3VudCkge1xuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLW1ldGFcIj57bWlycm9yaW5nX2NvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWlycm9yaW5nKSB7XG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvZi1pY29uLW1pcnJvclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtaXJyb3JpbmdfY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctbWV0YVwiPkB7bWlycm9yX21ldGEub3duZXJ9IDoge21pcnJvcl9tZXRhLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9mLW5hdi1maXhlZCBvZi1uYXYtdG9wXCI+XG4gICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImZyYW1lLW5hbWUgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29ubmVjdGVkXCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e2Nvbm5lY3RlZCh0aGlzLnByb3BzLnNlbGVjdGVkRnJhbWUuY29ubmVjdGVkKX0gLz5cbiAgICAgICAgICAgICAgICAgICAge2ZyYW1lTmFtZX1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfaWNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfY29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvaDY+XG5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tbWVudSB2aXNpYmxlLXhzIHB1bGwtbGVmdFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5NZW51Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWhhbWJ1cmdlclwiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgYnRuLXNldHRpbmcgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3BlblNldHRpbmdzfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jb2dcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14cyBwdWxsLWxlZnRcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuXG5cbiAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXYgbmF2YmFyLXJpZ2h0IGhpZGRlbi14c1wiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwiZHJvcGRvd25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHJvbGU9XCJidXR0b25cIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj5GcmFtZXMgPHNwYW4gY2xhc3NOYW1lPVwiY2FyZXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxOYXZGcmFtZUxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZXM9e3RoaXMucHJvcHMuZnJhbWVzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU9e3RoaXMucHJvcHMuc2VsZWN0ZWRGcmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUNsYXNzZXM9XCJkcm9wZG93bi1tZW51XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTG9nb3V0PXtmYWxzZX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNzZXR0aW5nc1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5TZXR0aW5nc30+U2V0dGluZ3M8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+TG9nIE91dDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVOYXY7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuICAgIENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKSxcbiAgICBQdWJsaWNGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1B1YmxpY0ZyYW1lU3RvcmUnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyk7XG5cbnZhciBUcmFuc2ZlckJ1dHRvbnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVTZW5kQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZVNlbmRDbGlja2VkJywgQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICAgICAgRnJhbWVBY3Rpb25zLnVwZGF0ZUNvbnRlbnQoQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVNaXJyb3JDbGlja2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlTWlycm9yQ2xpY2tlZCcpO1xuXHRcdEZyYW1lQWN0aW9ucy5taXJyb3JGcmFtZShQdWJsaWNGcmFtZVN0b3JlLmdldFNlbGVjdGVkUHVibGljRnJhbWUoKSk7XG5cdH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWNvbiwgaGFuZGxlcjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucGFuZWxTdGF0ZSA9PT0gJ2NvbGxlY3Rpb24nKSB7XG4gICAgICAgICAgICBpY29uID0gJ2ljb24tdXAnO1xuICAgICAgICAgICAgaGFuZGxlciA9IHRoaXMuX2hhbmRsZVNlbmRDbGlja2VkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWNvbiA9ICdvZi1pY29uLW1pcnJvcic7XG4gICAgICAgICAgICBoYW5kbGVyID0gdGhpcy5faGFuZGxlTWlycm9yQ2xpY2tlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgdHJhbnNmZXItYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnRuLWdyb3VwXCIgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIi4uLlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIiBvbkNsaWNrPXtoYW5kbGVyfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2ljb259IGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPiAqL31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZmVyQnV0dG9ucztcbiIsInZhciBjb25mID0ge1xuXHRkb21haW46ICdsb2NhbGhvc3QnLFxuXHRwb3J0OiAnODg4OCcsXG5cdG5hdmJhckg6IDUwXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZjsiLCJ2YXIga2V5bWlycm9yID0gcmVxdWlyZSgna2V5bWlycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5bWlycm9yKHtcblxuXHQvLyBmcmFtZSBhY3Rpb24gdHlwZXNcblx0RlJBTUVfTE9BRDogbnVsbCxcblx0RlJBTUVfTE9BRF9ET05FOiBudWxsLFxuXHRGUkFNRV9MT0FEX0ZBSUw6IG51bGwsXG5cdEZSQU1FX1NFTEVDVDogbnVsbCxcblx0RlJBTUVfVVBEQVRFX0NPTlRFTlQ6IG51bGwsXG5cdEZSQU1FX1NFVFRJTkdTX0NPTlRFTlQ6IG51bGwsXG5cdEZSQU1FX0NPTlRFTlRfVVBEQVRFRDogbnVsbCxcblx0RlJBTUVfQ09OTkVDVEVEOiBudWxsLFxuXHRGUkFNRV9ESVNDT05ORUNURUQ6IG51bGwsXG5cdEZSQU1FX1NBVkU6IG51bGwsXG5cdEZSQU1FX1NBVkVfRE9ORTogbnVsbCxcblx0RlJBTUVfU0FWRV9GQUlMOiBudWxsLFxuXHRGUkFNRV9NSVJST1JFRDogbnVsbCxcblxuXHQvLyBjb250ZW50IGFjdGlvbiB0eXBlc1xuXHRDT05URU5UX0xPQUQ6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9ET05FOiBudWxsLFxuXHRDT05URU5UX0xPQURfRkFJTDogbnVsbCxcblx0Q09OVEVOVF9TRU5EOiBudWxsLFxuXHRDT05URU5UX1NMSURFX0NIQU5HRUQ6IG51bGwsXG5cdENPTlRFTlRfQUREOiBudWxsLFxuXHRDT05URU5UX0FERF9ET05FOiBudWxsLFxuXHRDT05URU5UX0FERF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRE9ORTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRkFJTDogbnVsbCxcblxuXHQvLyBwdWJsaWMgZnJhbWVzIGxpc3Rcblx0UFVCTElDX0ZSQU1FU19MT0FEOiBudWxsLFxuXHRQVUJMSUNfRlJBTUVTX0xPQURfRE9ORTogbnVsbCxcblx0UFVCTElDX0ZSQU1FU19MT0FEX0ZBSUw6IG51bGwsXG5cdFBVQkxJQ19GUkFNRVNfQUREOiBudWxsLFxuXHRQVUJMSUNfRlJBTUVTX1JFTU9WRTogbnVsbCxcblx0UFVCTElDX0ZSQU1FU19TTElERV9DSEFOR0VEOiBudWxsLFxuXG5cdC8vIFVJIGFjdGlvbiB0eXBlc1xuXHRVSV9NRU5VX1RPR0dMRTogbnVsbCxcblx0VUlfU0VUX1NFTEVDVElPTl9QQU5FTDogbnVsbCxcblx0VUlfT1BFTl9BRERfQ09OVEVOVDogbnVsbCxcblx0VUlfQ0xPU0VfQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX09QRU5fU0VUVElOR1M6IG51bGwsXG5cdFVJX0NMT1NFX1NFVFRJTkdTOiBudWxsLFxuXHRVSV9PUEVOX1BSRVZJRVc6IG51bGwsXG5cdFVJX0NMT1NFX1BSRVZJRVc6IG51bGwsXG5cblx0Ly8gZW1pdHRlZCBieSBzdG9yZXNcblx0Q0hBTkdFX0VWRU5UOiBudWxsXG59KTtcbiIsInZhciBEaXNwYXRjaGVyID0gcmVxdWlyZSgnZmx1eCcpLkRpc3BhdGNoZXI7XG5cbnZhciBBcHBEaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcblxuLyoqXG4qIEEgYnJpZGdlIGZ1bmN0aW9uIGJldHdlZW4gdGhlIHZpZXdzIGFuZCB0aGUgZGlzcGF0Y2hlciwgbWFya2luZyB0aGUgYWN0aW9uXG4qIGFzIGEgdmlldyBhY3Rpb24uICBBbm90aGVyIHZhcmlhbnQgaGVyZSBjb3VsZCBiZSBoYW5kbGVTZXJ2ZXJBY3Rpb24uXG4qIEBwYXJhbSAge29iamVjdH0gYWN0aW9uIFRoZSBkYXRhIGNvbWluZyBmcm9tIHRoZSB2aWV3LlxuKi9cbkFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXHRhY3Rpb24uc291cmNlID0gJ1ZJRVdfQUNUSU9OJztcblx0dGhpcy5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5cbi8qKlxuKiBBIGJyaWRnZSBmdW5jdGlvbiBiZXR3ZWVuIHRoZSBzZXJ2ZXIgYW5kIHRoZSBkaXNwYXRjaGVyLCBtYXJraW5nIHRoZSBhY3Rpb25cbiogYXMgYSBzZXJ2ZXIgYWN0aW9uLlxuKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbiBUaGUgZGF0YSBjb21pbmcgZnJvbSB0aGUgc2VydmVyLlxuKi9cbkFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uID0gZnVuY3Rpb24oYWN0aW9uKSB7XG5cdGFjdGlvbi5zb3VyY2UgPSAnU0VSVkVSX0FDVElPTic7XG5cdHRoaXMuZGlzcGF0Y2goYWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBcHBEaXNwYXRjaGVyOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9jb250ZW50ID0gW10sXG5cdF9zZWxlY3RlZF9jb250ZW50X2lkID0gbnVsbDtcblxuXG52YXIgQ29udGVudFN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gY29udGVudDtcblx0XHQvLyBzaW5jZSB0aGUgbGFzdCBpdGVtIGJlY29tZXMgdGhlIGZpcnN0IGluIHRoZSBzbGlkZXIsXG5cdFx0Ly8gd2Ugc3RhcnQgd2l0aCAoY29udGVudC5sZW5ndGggLSAxKVxuXHRcdF9zZWxlY3RlZF9jb250ZW50X2lkID0gX2NvbnRlbnRbY29udGVudC5sZW5ndGggLSAxXS5faWQ7XG5cdH0sXG5cblx0YWRkQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50LnB1c2goY29udGVudCk7XG5cdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBjb250ZW50Ll9pZDtcblx0fSxcblxuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQgPSBfLnJlbW92ZShfY29udGVudCwge19pZDogY29udGVudC5faWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHRnZXRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2NvbnRlbnQ7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyBjb25zb2xlLmxvZygnZ2V0U2VsZWN0ZWRDb250ZW50OicsIF9jb250ZW50LCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdFx0cmV0dXJuIF8uZmluZChfY29udGVudCwgeydfaWQnOiBfc2VsZWN0ZWRfY29udGVudF9pZH0pO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG5cbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgbG9hZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuaW5pdChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRDpcblx0XHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjaGFuZ2VkLi4uJyk7XG5cdFx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGFjdGlvbi5jb250ZW50X2lkO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREOlxuXHRcdFx0Y29uc29sZS5sb2coJ2FkZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBhZGRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmFkZENvbnRlbnQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGJlIGFkZGVkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcblxuXHRcdFx0Ly8gQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgfVxuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1k6XG5cdCAgICAvLyAgIGRlc3Ryb3koYWN0aW9uLmlkKTtcblx0ICAgIC8vICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZX0NPTVBMRVRFRDpcblx0ICAgIC8vICAgZGVzdHJveUNvbXBsZXRlZCgpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudFN0b3JlO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2ZyYW1lcyA9IHt9LFxuXHRfc2VsZWN0ZWRGcmFtZUlkID0gbnVsbDtcblxudmFyIGFkZEZyYW1lID0gZnVuY3Rpb24oZnJhbWUsIHNlbGVjdCkge1xuXHRfZnJhbWVzW2ZyYW1lLl9pZF0gPSBmcmFtZTtcblx0aWYgKHNlbGVjdCA9PT0gdHJ1ZSkgc2VsZWN0RnJhbWUoZnJhbWUpO1xufVxuXG52YXIgcmVtb3ZlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSl7XG5cdGNvbnNvbGUubG9nKCdyZW1vdmVGcmFtZScsIGZyYW1lKTtcblx0dmFyIGlkID0gZnJhbWUuX2lkO1xuXHRpZiAoaWQgaW4gX2ZyYW1lcykgZGVsZXRlIF9mcmFtZXNbaWRdO1xuXHRjb25zb2xlLmxvZyhfZnJhbWVzKTtcbn07XG5cbnZhciBzZWxlY3RGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdGNvbnNvbGUubG9nKCdzZWxlY3RGcmFtZTogJywgZnJhbWUpO1xuXHRfc2VsZWN0ZWRGcmFtZUlkID0gZnJhbWUuX2lkO1xuXG5cdC8vIC8vIHVuc2VsZWN0IGN1cnJlbnRseSBzZWxlY3RlZFxuXHQvLyB2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHQvLyBpZiAoc2VsZWN0ZWRGcmFtZSkge1xuXHQvLyBcdHNlbGVjdGVkRnJhbWUuc2VsZWN0ZWQgPSBmYWxzZTtcblx0Ly8gfVxuXG5cdC8vIC8vIG5vdyBzZXQgdGhlIG5ldyBzZWxlY3RlZCBmcmFtZVxuXHQvLyB2YXIgX3NlbGVjdGVkRnJhbWUgPSBfLmZpbmQoX2ZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG5cdC8vIF9zZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gdHJ1ZTtcbn1cblxudmFyIEZyYW1lU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHQvKipcblx0ICogU2V0IF9zZWxlY3RlZEZyYW1lSWQgYW5kIGFkZCBhbGwgb2YgdGhlIGZyYW1lcy5cblx0ICogQHBhcmFtICB7W3R5cGVdfSBmcmFtZXMgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRfc2VsZWN0ZWRGcmFtZUlkID0gZnJhbWVzWzBdLl9pZDtcblx0XHRfLmVhY2goZnJhbWVzLCBhZGRGcmFtZSk7XG5cdH0sXG5cblx0Z2V0QWxsRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnZ2V0QWxsRnJhbWVzOiAnLCBfZnJhbWVzKTtcblx0XHRyZXR1cm4gXy5tYXAoX2ZyYW1lcywgZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRcdHJldHVybiBmcmFtZTtcblx0XHR9KTtcblx0fSxcblxuXHRnZXRTZWxlY3RlZEZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHQvLyB2YXIgc2VsZWN0ZWQgPSBmcmFtZXNbX3NlbGVjdGVkRnJhbWVJZF07XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLSAnLCBfZnJhbWVzKTtcblx0XHRjb25zb2xlLmxvZygnLS0tLS0tICcsIF9zZWxlY3RlZEZyYW1lSWQpO1xuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0gJywgX2ZyYW1lc1tfc2VsZWN0ZWRGcmFtZUlkXSk7XG5cdFx0cmV0dXJuIF9mcmFtZXNbX3NlbGVjdGVkRnJhbWVJZF1cblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCByZXBsYWNlIHByZXZpb3VzIGZyYW1lXG5cdFx0Y29uc29sZS5sb2coJ2Nvbm5lY3RGcmFtZTogJywgZnJhbWUpO1xuXHRcdGZyYW1lLmNvbm5lY3RlZCA9IHRydWU7XG5cdFx0YWRkRnJhbWUoZnJhbWUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBIGZyYW1lIGhhcyBkaXNjb25uZWN0ZWQuIFNpbXBseSB1cGRhdGVkIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRkaXNjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCByZXBsYWNlIHByZXZpb3VzIGZyYW1lXG5cdFx0ZnJhbWUuY29ubmVjdGVkID0gZmFsc2U7XG5cdFx0YWRkRnJhbWUoZnJhbWUpO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG5cbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuXHQvLyBjb25zb2xlLmxvZygnQUNUSU9OOiBGcmFtZVN0b3JlOiAnLCBhY3Rpb24uYWN0aW9uVHlwZSk7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgZnJhbWVzLi4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuaW5pdChhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQ6XG5cdFx0XHRGcmFtZVN0b3JlLmRpc2Nvbm5lY3RGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TRUxFQ1Q6XG4gICAgXHRcdHNlbGVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG4gICAgXHRcdEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpLmNvbnRlbnQgPSBhY3Rpb24uY29udGVudDtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRDpcblx0XHRcdC8vIGFkZGluZyB0aGUgdXBkYXRlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1VQREFURUQ6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIHVwZGF0ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9NSVJST1JFRDpcblx0XHRcdC8vIGFkZGluZyB0aGUgdXBkYXRlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NBVkU6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIHNhdmVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9ET05FOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0Ly8gbm9vcCAob3B0aW1pc3RpYyB1aSB1cGRhdGUgYWxyZWFkeSBoYXBwZW5lZCBvbiBGUkFNRV9TQVZFKVxuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRkFJTDpcblx0XHRcdC8vIGFkZGluZyB0aGUgZmFpbGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHQvLyBUT0RPOiBoYW5kbGUgdGhpcyBieSByZXZlcnRpbmcgKGltbXV0YWJsZS5qcyB3b3VsZCBoZWxwKVxuXHRcdFx0Y29uc29sZS5sb2coJ2ZhaWxlZCB0byBzYXZlIGZyYW1lJywgYWN0aW9uLmZyYW1lKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZVN0b3JlO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX3B1YmxpY0ZyYW1lcyA9IFtdLFxuXHRfc2VsZWN0ZWRfcHVibGljX2ZyYW1lX2lkID0gbnVsbDtcblxudmFyIGFkZEZyYW1lID0gZnVuY3Rpb24oZnJhbWUsIHNlbGVjdCkge1xuXHRfcHVibGljRnJhbWVzLnB1c2goZnJhbWUpXG5cdGlmIChzZWxlY3QgIT09IGZhbHNlKSBzZWxlY3RGcmFtZShmcmFtZSk7XG59XG5cbnZhciByZW1vdmVGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKXtcblx0Xy5yZW1vdmUoX3B1YmxpY0ZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG59O1xuXG52YXIgUHVibGljRnJhbWVTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdF9wdWJsaWNGcmFtZXMgPSBmcmFtZXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgbGlzdCBvZiBwdWJsaWMgZnJhbWVzLlxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IEFycmF5XG5cdCAqL1xuXHRnZXRQdWJsaWNGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfcHVibGljRnJhbWVzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIHB1YmxpYyBmcmFtZSB0aGF0IGlzIGN1cnJlbnRseSBzZWxlY3RlZC5cblx0ICogQHJldHVybiB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0Z2V0U2VsZWN0ZWRQdWJsaWNGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmluZChfcHVibGljRnJhbWVzLCB7J19pZCc6IF9zZWxlY3RlZF9wdWJsaWNfZnJhbWVfaWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuXG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRDpcblx0XHRcdGNvbnNvbGUubG9nKCdsb2FkaW5nIHZpc2libGUgZnJhbWVzLi4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ3Zpc2libGUgZnJhbWVzIGxvYWRlZDogJywgYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRfcHVibGljRnJhbWVzID0gYWN0aW9uLmZyYW1lcztcblx0XHRcdF9zZWxlY3RlZF9wdWJsaWNfZnJhbWVfaWQgPSBfcHVibGljRnJhbWVzWzBdLl9pZDtcblx0XHRcdFB1YmxpY0ZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ3Zpc2libGUgZnJhbWVzIGZhaWxlZCB0byBsb2FkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX0FERDpcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRQdWJsaWNGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX1JFTU9WRTpcblx0XHRcdHJlbW92ZUZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRQdWJsaWNGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicsIGFjdGlvbik7XG5cdFx0XHRfc2VsZWN0ZWRfcHVibGljX2ZyYW1lX2lkID0gYWN0aW9uLmZyYW1lX2lkO1xuXHRcdFx0UHVibGljRnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHVibGljRnJhbWVTdG9yZTtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuICAgIE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG4gICAgYXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX21lbnVPcGVuID0gZmFsc2UsXG4gICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlLFxuICAgIF9hZGRPcGVuID0gZmFsc2UsXG4gICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlLFxuICAgIF9wcmV2aWV3T3BlbiA9IGZhbHNlLFxuICAgIF9wcmV2aWV3RnJhbWUgPSBudWxsLFxuICAgIF9zZWxlY3Rpb25QYW5lbCA9IFwiY29sbGVjdGlvblwiO1xuXG52YXIgX3RvZ2dsZU1lbnUgPSBmdW5jdGlvbihvcGVuKSB7XG4gICAgX21lbnVPcGVuID0gISFvcGVuO1xufVxuXG5cbnZhciBVSVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cbiAgICBnZXRNZW51U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3BlbjogX21lbnVPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNldHRpbmdzU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3BlbjogX3NldHRpbmdzT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZWxlY3Rpb25QYW5lbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9zZWxlY3Rpb25QYW5lbDtcbiAgICB9LFxuXG4gICAgZ2V0QWRkTW9kYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhZGRPcGVuOiBfYWRkT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZXR0aW5nc01vZGFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnPT09PT09PT0nLCBfc2V0dGluZ3NPcGVuKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNldHRpbmdzT3BlbjogX3NldHRpbmdzT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRQcmV2aWV3U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJldmlld09wZW46IF9wcmV2aWV3T3BlbixcbiAgICAgICAgICAgIGZyYW1lOiBfcHJldmlld0ZyYW1lXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuICAgIH0sXG5cbiAgICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH0sXG5cbiAgICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgICBzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZU1lbnUoYWN0aW9uLm9wZW4pO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZVNldHRpbmdzKCk7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfU0VUX1NFTEVDVElPTl9QQU5FTDpcbiAgICAgICAgICAgIF9zZWxlY3Rpb25QYW5lbCA9IGFjdGlvbi5wYW5lbDtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX0FERF9DT05URU5UOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX0FERF9DT05URU5UOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfT1BFTl9TRVRUSU5HUzpcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX1BSRVZJRVc6XG4gICAgICAgICAgICBfcHJldmlld09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgX3ByZXZpZXdGcmFtZSA9IGFjdGlvbi5mcmFtZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9DTE9TRV9QUkVWSUVXOlxuICAgICAgICAgICAgX3ByZXZpZXdPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORTpcbiAgICAgICAgICAgIF9hZGRPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJU3RvcmU7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBBcHAgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvQXBwLmpzJyksXG4gICAgYnJvd3Nlcl9zdGF0ZSA9IHJlcXVpcmUoJy4vYnJvd3Nlcl9zdGF0ZV9tYW5hZ2VyJyksXG4gICAgRmFzdENsaWNrID0gcmVxdWlyZSgnZmFzdGNsaWNrJyk7XG5cbi8vIGluaXQgamF2YXNjcmlwdCBtZWRpYSBxdWVyeS1saWtlIHN0YXRlIGRldGVjdGlvblxuYnJvd3Nlcl9zdGF0ZS5pbml0KCk7XG5cbi8vIFR1cm4gb24gdG91Y2ggZXZlbnRzIGZvciBSZWFjdC5cbi8vIFJlYWN0LmluaXRpYWxpemVUb3VjaEV2ZW50cyh0cnVlKTtcblxuLy8gRmFzdENsaWNrIHJlbW92ZXMgdGhlIDMwMHMgZGVsYXkgb24gc3R1cGlkIGlPUyBkZXZpY2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXHRjb25zb2xlLmxvZygnYXR0YWNoaW5nIEZhc3RDbGljaycpO1xuXHRGYXN0Q2xpY2suYXR0YWNoKGRvY3VtZW50LmJvZHkpO1xufSk7XG5cblJlYWN0LnJlbmRlcihcblx0PEFwcCAvPixcblx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ09wZW5GcmFtZScpXG4pIl19
