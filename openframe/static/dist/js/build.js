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
			selectionPanel: "collection"
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

		// console.log('componentDidMount', $('.nav-footer').height());
		// console.log('componentDidMount', React.findDOMNode(this.refs.navFooter).offsetHeight);
		UIStore.addChangeListener(this._onChange);

	},

	componentWillUnmount: function() {
		UIStore.addChangeListener(this._onChange);
	},

	_onChange: function() {
		var panel = UIStore.getSelectionPanelState();
		this.setState(panel);
	},

  	render: function(){
  		var contentList = React.createElement(ContentList, null),
  			frameList = React.createElement(PublicFramesList, null);
  		var selectionPanel = this.state.selectionPanel === 'collection' ? contentList : frameList;
	    return (
			React.createElement("div", {className: "container app"}, 
				React.createElement(SimpleNav, null), 
				React.createElement(Frame, null), 
				React.createElement(TransferButtons, null), 
				React.createElement("div", null, selectionPanel), 
				React.createElement(FooterNav, {ref: "navFooter"}), 
				React.createElement(Drawer, null), 
				React.createElement(SettingsModal, null), 
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
					React.createElement(NavFrameList, {linkClickHandler: this._handleCloseMenuClick})
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
        this.setState(UIStore.getSelectionPanelState());
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

	getInitialState: function() {
		return {}
	},

	componentDidMount: function() {
		FrameActions.loadFrames();
		FrameStore.addChangeListener(this._onChange);
	},

	componentDidUpdate: function() {
		this._updateContainerDimensions();
	},

	_handleClick: function(e) {
		console.log('CLICKED!');
		UIActions.openPreview(this.state.frame);
	},

  	_onChange: function() {
  		var selectedFrame = FrameStore.getSelectedFrame();
  		console.log('selectedFrame:', selectedFrame);
  		this.setState({
  			frame: selectedFrame
  		});
  	},

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
		if (!this.state.frame) {
			return React.createElement("div", {className: "row frames-list"})
		}
		this.w_h_ratio = this.state.frame && this.state.frame.settings ? this.state.frame.settings.w_h_ratio : 1;

		var url = this.state.frame && this.state.frame.current_content ? this.state.frame.current_content.url : '';
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
					React.createElement("span", {className: isSelected(this.props.frame.selected)}), " ", this.props.frame.name, 
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
	NavFrameLink = require('./NavFrameLink'),
	FrameStore = require('../stores/FrameStore');

var NavFrameList = React.createClass({displayName: "NavFrameList",
	componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
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

    getInitialState: function() {
        return {
            frames: []
        }
    },

	render: function() {
		function createFrameLink(frame) {
            return React.createElement(NavFrameLink, {key: frame._id, frame: frame, linkClickHandler: this.props.linkClickHandler})
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
                this.state.frames.map(createFrameLink.bind(this)), 
                logout
            )
		);
	},

	_onChange: function() {
        this.setState({
            frames: FrameStore.getAllFrames()
        });
    }

});

module.exports = NavFrameList;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/PublicFrameSwiper.js":[function(require,module,exports){
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
	FrameActions = require('../actions/FrameActions'),
	UIStore = require('../stores/UIStore'),
	FrameStore = require('../stores/FrameStore'),
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var SettingsModal = React.createClass({displayName: "SettingsModal",
	getInitialState: function() {
		return {
			settingsOpen: false,
			frame: {
				name: '',
				description: '',
				settings: {
					visible: true,
					rotation: 0
				}
			}
		}
	},

	getDefaultProps: function() {
		return {}
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onUIChange);
        FrameStore.addChangeListener(this._onFrameChange);
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
        FrameStore.removeChangeListener(this._onFrameChange);
        $(this.refs.modal.getDOMNode()).off('hidden.bs.modal');
    },

	_handleNameChange: function(e) {
		var val = event.target.value,
			state = this.state;
		state.frame.name = val;
		this.setState(state);
	},

	_handleDescriptionChange: function(e) {
		var val = event.target.value,
			state = this.state;
		state.frame.description = val;
		this.setState(state);
	},

	_handleVisibilityChange: function(e) {
		var val = event.target.checked,
			state = this.state;
		state.frame.settings.visible = val;
		this.setState(state);
	},

	_handleRotationChange: function(e) {
		var val = event.target.value,
			state = this.state;
		state.frame.settings.rotation = val;
		this.setState(state);
	},

	_handleSave: function(e) {
		FrameActions.saveFrame(this.state.frame);
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

    _onFrameChange: function() {
        this.setState({
        	frame: FrameStore.getSelectedFrame()
        });
    },

	render: function() {
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
						    			React.createElement("input", {ref: "name", type: "text", value: this.state.frame.name, onChange: this._handleNameChange})
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
					    					value: this.state.frame.description, 
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
						    				checked: this.state.frame.settings.visible, 
						    				onChange: this._handleVisibilityChange})
						    		)
						    	)
					    	), 

				    		React.createElement("div", {className: "row row-form-field row-form-field-rotation"}, 
				    			React.createElement("div", {className: "col-xs-6 form-label"}, "Rotation"), 
					    		React.createElement("div", {className: "col-xs-6 form-input-select"}, 
					    			React.createElement("select", {className: "pull-right", ref: "rotation", 
					    				value: this.state.frame.settings.rotation, 
					    				onChange: this._handleRotationChange}, 
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

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../actions/UIActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    NavFrameList = require('./NavFrameList'),
    UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore');


var SimpleNav = React.createClass({displayName: "SimpleNav",
    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getInitialState: function() {
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

    render: function() {
        var frameName = this.state.selectedFrame.name,
            mirroring = this.state.selectedFrame.mirroring,
            mirror_meta = this.state.selectedFrame.mirror_meta,
            mirroring_icon = '',
            mirroring_content = '',
            mirroring_count = this.state.selectedFrame.mirroring_count;

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
                    React.createElement("span", {className: "connected", dangerouslySetInnerHTML: connected(this.state.selectedFrame.connected)}), 
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
                        React.createElement(NavFrameList, {extraClasses: "dropdown-menu", includeLogout: false})
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
    },

    _handleOpenMenuClick: function(e) {
        console.log('_handleOpenMenuClick');
        UIActions.toggleMenu(true);
    },

    _handleOpenSettings: function(e) {
        console.log('_handleOpenSettings');
        UIActions.openSettingsModal();
    },

    _onChange: function() {
        console.log('++++++ get selected frame', FrameStore.getSelectedFrame());
        this.setState({
            frames: FrameStore.getAllFrames(),
            selectedFrame: FrameStore.getSelectedFrame()
        });
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
    getInitialState: function() {
        return {
            selectionPanel: "collection"
        };
    },

    componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
    },

    _onChange: function() {
        this.setState(UIStore.getSelectionPanelState());
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
        if (this.state.selectionPanel === 'collection') {
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
	// these two are for the swiper of visible frames:
	_visibleFrames = [],
	_selected_visible_frame_id = null;;

var addFrame = function(frame, select) {
	_frames[frame._id] = frame;
	if (select !== false) selectFrame(frame);
}

var removeFrame = function(frame){
	console.log('removeFrame', frame);
	var id = frame._id;
	if (id in _frames) delete _frames[id];
	console.log(_frames);
};

var selectFrame = function(frame) {
	console.log('selectFrame: ', frame);

	// unselect currently selected
	var selectedFrame = FrameStore.getSelectedFrame();
	if (selectedFrame) {
		selectedFrame.selected = false;
	}

	// now set the new selected frame
	var _selectedFrame = _.find(_frames, {_id: frame._id});
	_selectedFrame.selected = true;
}

var FrameStore = assign({}, EventEmitter.prototype, {

	init: function(frames) {
		_.each(frames, addFrame);

		// see if any frame is marked as selected from db,
		// otherwise select the first frame.
		if (!_.find(_frames, {selected: true})) {
			_.sample(_frames).selected = true;
		}
	},


	getFrame: function(id) {
		return _frames[id];
	},

	getAllFrames: function() {
		console.log('getAllFrames: ', _frames);
		return _.map(_frames, function(frame) {
			return frame;
		});
	},

	getSelectedFrame: function() {
		return _.find(_frames, {selected: true});
	},

	getState: function() {
		return {
			frames: _frames,
			selectedFrame: this.getSelectedFrame()
		};
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	/**
	 * A frame has connected. Simply updated the frame object in our collection.
	 */
	connectFrame: function(frame) {
		// addFrame will overwrite previous frame
		console.log('connectFrame: ', frame);
		addFrame(frame);
	},

	/**
	 * A frame has disconnected. Simply updated the frame object in our collection.
	 */
	disconnectFrame: function(frame) {
		// addFrame will overwrite previous frame
		addFrame(frame, false);
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
        return {
            selectionPanel: _selectionPanel
        };
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9Db250ZW50QWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1B1YmxpY0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1VJQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2Jyb3dzZXJfc3RhdGVfbWFuYWdlci5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FkZENvbnRlbnRGb3JtLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudE1vZGFsLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQXBwLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQ29udGVudEl0ZW0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9Db250ZW50TGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0RyYXdlci5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVJdGVtLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVJdGVtRGV0YWlscy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lUHJldmlldy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGluay5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1B1YmxpY0ZyYW1lU3dpcGVyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvUHVibGljRnJhbWVzTGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzTW9kYWwuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TaW1wbGVOYXYuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uZmlnLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbnN0YW50cy9PRkNvbnN0YW50cy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0NvbnRlbnRTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvRnJhbWVTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvUHVibGljRnJhbWVTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvVUlTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9yZWFjdC1tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyREEsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDO0NBQ3pELFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUM7Q0FDakQsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDdEIsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUVuQyxJQUFJLFNBQVMsR0FBRztDQUNmLFdBQVcsRUFBRSxnQkFBZ0IsR0FBRyxXQUFXO0FBQzVDLENBQUM7O0FBRUQsSUFBSSxjQUFjLEdBQUc7QUFDckI7QUFDQTtBQUNBOztDQUVDLFdBQVcsRUFBRSxXQUFXO0FBQ3pCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDOztFQUU3QyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7R0FDOUIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxZQUFZO0FBQ3ZDLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7O0VBRUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO0FBQ2xDLElBQUksSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFOztJQUV2QixhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxpQkFBaUI7S0FDekMsT0FBTyxFQUFFLE9BQU87S0FDaEIsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztBQUNMLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFOztJQUVuQixhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxpQkFBaUI7S0FDekMsR0FBRyxFQUFFLEdBQUc7S0FDUixDQUFDLENBQUM7SUFDSCxDQUFDLENBQUM7QUFDTixFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0NBRUMsVUFBVSxFQUFFLFNBQVMsT0FBTyxFQUFFO0VBQzdCLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztHQUM5QixVQUFVLEVBQUUsV0FBVyxDQUFDLFdBQVc7R0FDbkMsT0FBTyxFQUFFLE9BQU87R0FDaEIsQ0FBQyxDQUFDO0VBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNHLEdBQUcsRUFBRSxVQUFVO1lBQ2YsTUFBTSxFQUFFLE1BQU07WUFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDN0IsUUFBUSxFQUFFLE1BQU07U0FDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRTtZQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztJQUN6QyxVQUFVLEVBQUUsV0FBVyxDQUFDLGdCQUFnQjtJQUN4QyxPQUFPLEVBQUUsSUFBSTtJQUNiLENBQUMsQ0FBQztTQUNHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUU7U0FDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztJQUN6QyxVQUFVLEVBQUUsV0FBVyxDQUFDLGdCQUFnQjtJQUN4QyxPQUFPLEVBQUUsT0FBTztJQUNoQixDQUFDLENBQUM7U0FDRyxDQUFDLENBQUM7QUFDWCxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0NBRUMsYUFBYSxFQUFFLFNBQVMsT0FBTyxFQUFFO0VBQ2hDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztHQUM5QixVQUFVLEVBQUUsV0FBVyxDQUFDLGNBQWM7R0FDdEMsT0FBTyxFQUFFLE9BQU87R0FDaEIsQ0FBQyxDQUFDO0VBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNHLEdBQUcsRUFBRSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUc7WUFDOUIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsUUFBUSxFQUFFLE1BQU07U0FDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRTtZQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztJQUN2QyxVQUFVLEVBQUUsV0FBVyxDQUFDLG1CQUFtQjtJQUMzQyxDQUFDLENBQUM7U0FDRyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFO1NBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxhQUFhLENBQUMsZ0JBQWdCLENBQUM7SUFDdkMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxtQkFBbUI7SUFDM0MsT0FBTyxFQUFFLE9BQU87SUFDaEIsQ0FBQyxDQUFDO1NBQ0csQ0FBQyxDQUFDO0FBQ1gsRUFBRTs7Q0FFRCxZQUFZLEVBQUUsU0FBUyxVQUFVLEVBQUU7RUFDbEMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQzlCLFVBQVUsRUFBRSxXQUFXLENBQUMscUJBQXFCO0dBQzdDLFVBQVUsRUFBRSxVQUFVO0dBQ3RCLENBQUMsQ0FBQztBQUNMLEVBQUU7QUFDRjs7QUFFQSxDQUFDOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYzs7Ozs7O0FDekcvQixJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUM7Q0FDekQsV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztDQUNqRCxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztDQUNyQixNQUFNLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQztDQUNqQyxVQUFVLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0FBQzdDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFMUIsSUFBSSxTQUFTLEdBQUc7Q0FDZixZQUFZLEVBQUUsZUFBZSxHQUFHLFdBQVc7Q0FDM0MsY0FBYyxFQUFFLHFCQUFxQjtBQUN0QyxDQUFDOztBQUVELElBQUksWUFBWSxHQUFHO0FBQ25CO0FBQ0E7QUFDQTtBQUNBOztDQUVDLFVBQVUsRUFBRSxXQUFXO0FBQ3hCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztFQUV6QyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7R0FDOUIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxVQUFVO0FBQ3JDLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7O0VBRUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO0lBQy9CLElBQUksQ0FBQyxTQUFTLE1BQU0sRUFBRTtBQUMxQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztJQUVoQyxhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxlQUFlO0tBQ3ZDLE1BQU0sRUFBRSxNQUFNO0tBQ2QsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztBQUNMLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFOztJQUVuQixhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxlQUFlO0tBQ3ZDLEdBQUcsRUFBRSxHQUFHO0tBQ1IsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDO0FBQ04sRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztBQUVBLENBQUMsaUJBQWlCLEVBQUUsV0FBVzs7RUFFN0IsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQzlCLFVBQVUsRUFBRSxXQUFXLENBQUMsa0JBQWtCO0FBQzdDLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7O0VBRUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ2pDLElBQUksQ0FBQyxTQUFTLE1BQU0sRUFBRTtBQUMxQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztJQUVoQyxhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyx1QkFBdUI7S0FDL0MsTUFBTSxFQUFFLE1BQU07S0FDZCxDQUFDLENBQUM7SUFDSCxDQUFDO0FBQ0wsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUU7O0lBRW5CLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztLQUNoQyxVQUFVLEVBQUUsV0FBVyxDQUFDLHVCQUF1QjtLQUMvQyxHQUFHLEVBQUUsR0FBRztLQUNSLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQztBQUNOLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7Q0FFQyxNQUFNLEVBQUUsU0FBUyxLQUFLLEVBQUU7RUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDN0IsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQzlCLFVBQVUsRUFBRSxXQUFXLENBQUMsWUFBWTtHQUNwQyxLQUFLLEVBQUUsS0FBSztHQUNaLENBQUMsQ0FBQztBQUNMLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7Q0FFQyxhQUFhLEVBQUUsU0FBUyxPQUFPLEVBQUU7RUFDaEMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDcEMsS0FBSyxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUM7UUFDaEMsSUFBSSxJQUFJLEdBQUc7WUFDUCxLQUFLLEVBQUUsS0FBSztTQUNmLENBQUM7UUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hELEVBQUU7O0lBRUUsV0FBVyxFQUFFLFNBQVMsY0FBYyxFQUFFO1FBQ2xDLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFDLElBQUksSUFBSSxHQUFHO1lBQ1AsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHO1lBQ25CLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxHQUFHO1NBQ3hDLENBQUM7UUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQztBQUMvQyxLQUFLOztDQUVKLFNBQVMsRUFBRSxTQUFTLEtBQUssRUFBRTtFQUMxQixhQUFhLENBQUMsZ0JBQWdCLENBQUM7R0FDOUIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxVQUFVO0dBQ2xDLEtBQUssRUFBRSxLQUFLO0FBQ2YsR0FBRyxDQUFDLENBQUM7QUFDTDs7UUFFUSxLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztFQUM3QixDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ0csR0FBRyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRztZQUN6QixNQUFNLEVBQUUsS0FBSztZQUNiLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUMzQixRQUFRLEVBQUUsTUFBTTtTQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxFQUFFO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsYUFBYSxDQUFDLGtCQUFrQixDQUFDO0lBQ3pDLFVBQVUsRUFBRSxXQUFXLENBQUMsZUFBZTtJQUN2QyxLQUFLLEVBQUUsS0FBSztJQUNaLENBQUMsQ0FBQztTQUNHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUU7U0FDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztJQUN6QyxVQUFVLEVBQUUsV0FBVyxDQUFDLGVBQWU7SUFDdkMsS0FBSyxFQUFFLEtBQUs7SUFDWixDQUFDLENBQUM7U0FDRyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVc7WUFDakIsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDekIsQ0FBQyxDQUFDO0FBQ1gsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsU0FBUyxLQUFLLEVBQUU7RUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsQ0FBQztFQUN4QyxhQUFhLENBQUMsa0JBQWtCLENBQUM7R0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxlQUFlO0dBQ3ZDLEtBQUssRUFBRSxLQUFLO0dBQ1osQ0FBQyxDQUFDO0FBQ0wsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLEtBQUssRUFBRTtFQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQzNDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztHQUM5QixVQUFVLEVBQUUsV0FBVyxDQUFDLGtCQUFrQjtHQUMxQyxLQUFLLEVBQUUsS0FBSztHQUNaLENBQUMsQ0FBQztBQUNMLEVBQUU7O0NBRUQsbUJBQW1CLEVBQUUsU0FBUyxLQUFLLEVBQUU7RUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztFQUM5QyxhQUFhLENBQUMsa0JBQWtCLENBQUM7R0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxxQkFBcUI7R0FDN0MsS0FBSyxFQUFFLEtBQUs7R0FDWixDQUFDLENBQUM7QUFDTCxFQUFFOztJQUVFLFlBQVksRUFBRSxTQUFTLEtBQUssRUFBRTtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztZQUM3QixVQUFVLEVBQUUsV0FBVyxDQUFDLGFBQWE7WUFDckMsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7QUFDWCxLQUFLOztJQUVELGFBQWEsRUFBRSxTQUFTLEtBQUssRUFBRTtRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztZQUM3QixVQUFVLEVBQUUsV0FBVyxDQUFDLGNBQWM7WUFDdEMsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7QUFDWCxLQUFLOztDQUVKLEtBQUssRUFBRSxTQUFTLElBQUksRUFBRTtFQUNyQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3pCLFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUM7O1FBRVEsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQ3BDLFVBQVUsRUFBRSxXQUFXLENBQUMsZUFBZTtHQUN2QyxLQUFLLEVBQUUsS0FBSztHQUNaLENBQUMsQ0FBQztBQUNMLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUVJLGNBQWMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7S0FDOUIsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQ2pDLFVBQVUsRUFBRSxXQUFXLENBQUMsZ0JBQWdCO0dBQ3hDLENBQUMsRUFBRSxDQUFDO0dBQ0osQ0FBQyxFQUFFLENBQUM7R0FDSixDQUFDLENBQUM7QUFDTCxLQUFLOztJQUVELFlBQVksRUFBRSxTQUFTLFFBQVEsRUFBRTtRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztFQUN4QyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7R0FDOUIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxtQkFBbUI7R0FDM0MsUUFBUSxFQUFFLFFBQVE7R0FDbEIsQ0FBQyxDQUFDO0FBQ0wsRUFBRTs7QUFFRixDQUFDOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDOzs7Ozs7O0FDdE45QixJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUM7Q0FDekQsV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztBQUNsRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXZCLElBQUksU0FBUyxHQUFHO0NBQ2YsWUFBWSxFQUFFLGVBQWUsR0FBRyxXQUFXO0NBQzNDLGFBQWEsRUFBRSxxQkFBcUI7QUFDckMsQ0FBQzs7QUFFRCxJQUFJLGtCQUFrQixHQUFHO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBOztBQUVBLENBQUMsZ0JBQWdCLEVBQUUsV0FBVzs7RUFFNUIsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQzlCLFVBQVUsRUFBRSxXQUFXLENBQUMsa0JBQWtCO0FBQzdDLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7O0VBRUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxTQUFTLE1BQU0sRUFBRTtBQUMxQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztJQUVoQyxhQUFhLENBQUMsa0JBQWtCLENBQUM7S0FDaEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyx1QkFBdUI7S0FDL0MsTUFBTSxFQUFFLE1BQU07S0FDZCxDQUFDLENBQUM7SUFDSCxDQUFDO0FBQ0wsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUU7O0lBRW5CLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztLQUNoQyxVQUFVLEVBQUUsV0FBVyxDQUFDLHVCQUF1QjtLQUMvQyxHQUFHLEVBQUUsR0FBRztLQUNSLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQztBQUNOLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxZQUFZLEVBQUUsU0FBUyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7RUFDeEMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0dBQzlCLFVBQVUsRUFBRSxXQUFXLENBQUMsMkJBQTJCO0dBQ25ELFFBQVEsRUFBRSxRQUFRO0dBQ2xCLENBQUMsQ0FBQztBQUNMLEVBQUU7O0FBRUYsQ0FBQzs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDOzs7Ozs7O0FDdERwQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUM7SUFDdEQsV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztBQUNyRCxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDOztBQUV6QixJQUFJLFNBQVMsR0FBRzs7QUFFaEIsSUFBSSxVQUFVLEVBQUUsU0FBUyxJQUFJLEVBQUU7O1FBRXZCLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzQixVQUFVLEVBQUUsV0FBVyxDQUFDLGNBQWM7WUFDdEMsSUFBSSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUM7QUFDWCxLQUFLOztJQUVELGNBQWMsRUFBRSxTQUFTLElBQUksRUFBRTtRQUMzQixhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsVUFBVSxFQUFFLFdBQVcsQ0FBQyxrQkFBa0I7WUFDMUMsSUFBSSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUM7QUFDWCxLQUFLOztJQUVELGlCQUFpQixFQUFFLFNBQVMsS0FBSyxFQUFFO1FBQy9CLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzQixVQUFVLEVBQUUsV0FBVyxDQUFDLHNCQUFzQjtZQUM5QyxLQUFLLEVBQUUsS0FBSztTQUNmLENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQsbUJBQW1CLEVBQUUsV0FBVztRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDbkMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQzNCLFVBQVUsRUFBRSxXQUFXLENBQUMsbUJBQW1CO1NBQzlDLENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQscUJBQXFCLEVBQUUsV0FBVztRQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDckMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQzNCLFVBQVUsRUFBRSxXQUFXLENBQUMsb0JBQW9CO1NBQy9DLENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQsaUJBQWlCLEVBQUUsV0FBVztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDakMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQzNCLFVBQVUsRUFBRSxXQUFXLENBQUMsZ0JBQWdCO1NBQzNDLENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQsbUJBQW1CLEVBQUUsV0FBVztRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDbkMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQzNCLFVBQVUsRUFBRSxXQUFXLENBQUMsaUJBQWlCO1NBQzVDLENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQsV0FBVyxFQUFFLFNBQVMsS0FBSyxFQUFFO1FBQ3pCLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzQixVQUFVLEVBQUUsV0FBVyxDQUFDLGVBQWU7WUFDdkMsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDO0FBQ1YsS0FBSzs7SUFFRCxZQUFZLEVBQUUsV0FBVztRQUNyQixhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsVUFBVSxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0I7U0FDM0MsQ0FBQztBQUNWLEtBQUs7O0FBRUwsQ0FBQzs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVM7Ozs7O0FDdkUxQixNQUFNLEdBQUcsQ0FBQyxXQUFXO0lBQ2pCLElBQUksS0FBSyxHQUFHLEVBQUU7UUFDVixjQUFjLEdBQUcsRUFBRTtRQUNuQixVQUFVLEdBQUcsS0FBSztRQUNsQixLQUFLLEdBQUc7WUFDSixTQUFTLEVBQUUsSUFBSTtZQUNmLGFBQWEsRUFBRSxLQUFLO1NBQ3ZCO1FBQ0QsSUFBSTtRQUNKLEdBQUc7QUFDWCxRQUFRLE1BQU0sQ0FBQztBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRUksU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtRQUN6QixJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ1gsSUFBSSxJQUFJLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN2QyxRQUFRLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7UUFFekIsR0FBRyxDQUFDLE1BQU0sR0FBRyxXQUFXO1lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNqQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDN0MsU0FBUyxDQUFDOztRQUVGLEdBQUcsQ0FBQyxPQUFPLEdBQUcsV0FBVztZQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDakMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9DLFNBQVMsQ0FBQzs7UUFFRixHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsR0FBRyxFQUFFO1lBQzFCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDOUIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJO0FBQ25DLGdCQUFnQixJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQzs7QUFFcEMsWUFBWSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUVqQyxZQUFZLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFOztnQkFFdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2xELGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakM7YUFDSixNQUFNO2dCQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDLENBQUM7YUFDN0M7QUFDYixTQUFTLENBQUM7O1FBRUYsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFO1lBQ2pCLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixNQUFNLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUMvRDtBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRUksU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0QixjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3ZDLE1BQU07WUFDSCxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNyQztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRUksU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMxQixJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0QixJQUFJLEtBQUssR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25ELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUNaLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO0FBQ2IsU0FBUyxNQUFNOztTQUVOO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3ZCLElBQUksT0FBTyxHQUFHO1lBQ1YsSUFBSSxFQUFFLElBQUk7WUFDVixJQUFJLEVBQUUsSUFBSTtBQUN0QixTQUFTLENBQUM7O1FBRUYsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDMUMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztJQUVJLFNBQVMsZ0JBQWdCLEdBQUc7UUFDeEIsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNiLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekI7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDbEIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxNQUFNLEVBQUU7WUFDOUQsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsS0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7b0JBQ3JCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzVCO2FBQ0o7U0FDSixDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNuQixLQUFLO0FBQ0w7O0lBRUksS0FBSyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDZixLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztJQUNqQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNuQixLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztJQUN6QixPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDLEdBQUcsQ0FBQzs7QUFFTCxZQUFZO0FBQ1osSUFBSSxPQUFPLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU07Ozs7QUMxSTNFLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDeEIsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUU1QixTQUFTLDJCQUEyQixHQUFHO0FBQ3ZDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDOztBQUU1QyxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0NBRW5CLEdBQUcsQ0FBQyxRQUFRLENBQUM7S0FDVCxFQUFFLEVBQUUsSUFBSTtLQUNSLFFBQVEsRUFBRSxHQUFHO0tBQ2IsT0FBTyxFQUFFLFVBQVU7U0FDZixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO01BQzNCO0FBQ04sRUFBRSxDQUFDLENBQUM7O0NBRUgsR0FBRyxDQUFDLFFBQVEsQ0FBQztLQUNULEVBQUUsRUFBRSxJQUFJO0tBQ1IsUUFBUSxFQUFFLEdBQUc7S0FDYixPQUFPLEVBQUUsVUFBVTtTQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7TUFDM0I7QUFDTixFQUFFLENBQUMsQ0FBQzs7Q0FFSCxHQUFHLENBQUMsUUFBUSxDQUFDO0tBQ1QsRUFBRSxFQUFFLElBQUk7S0FDUixRQUFRLEVBQUUsR0FBRztLQUNiLE9BQU8sRUFBRSxVQUFVO1NBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztNQUMzQjtBQUNOLEVBQUUsQ0FBQyxDQUFDOztDQUVILEdBQUcsQ0FBQyxRQUFRLENBQUM7S0FDVCxFQUFFLEVBQUUsSUFBSTtLQUNSLFFBQVEsRUFBRSxJQUFJO0tBQ2QsT0FBTyxFQUFFLFVBQVU7U0FDZixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO01BQzNCO0FBQ04sRUFBRSxDQUFDLENBQUM7O0NBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsQ0FBQzs7QUFFRCxTQUFTLGdCQUFnQixHQUFHO0NBQzNCLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztDQUM1QixJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7Q0FDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQixDQUFDOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7Q0FDaEIsSUFBSSxFQUFFLDJCQUEyQjtBQUNsQyxDQUFDOzs7Ozs7OztBQ3ZERCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQzVCLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztBQUUxRCxJQUFJLG9DQUFvQyw4QkFBQTtJQUNwQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsRUFBRTtRQUMxQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDM0IsUUFBUSxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDOztBQUV6RCxRQUFRLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTzs7UUFFakIsSUFBSSxPQUFPLEdBQUc7WUFDVixHQUFHLEVBQUUsR0FBRztZQUNSLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQztTQUN2QixDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNyRCxRQUFRLGNBQWMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7O1FBRW5DLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQzVDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUM1QztDQUNKLE1BQU0sRUFBRSxXQUFXO0VBQ2xCO0dBQ0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywyQkFBNEIsQ0FBQSxFQUFBO2dCQUM5QixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLFVBQUEsRUFBVSxDQUFDLFFBQUEsRUFBUSxDQUFFLElBQUksQ0FBQyxnQkFBa0IsQ0FBQSxFQUFBO29CQUN6RSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFBO3dCQUN2Qix5Q0FBMEM7d0JBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7NEJBQ3ZCLG9CQUFBLE9BQU0sRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsTUFBQSxFQUFNLENBQUMsU0FBQSxFQUFTLENBQUMsY0FBQSxFQUFjLENBQUMsRUFBQSxFQUFFLENBQUMsS0FBQSxFQUFLLENBQUMsV0FBQSxFQUFXLENBQUMsV0FBQSxFQUFXLENBQUMsR0FBQSxFQUFHLENBQUMsS0FBSyxDQUFBLENBQUcsQ0FBQTt3QkFDdkYsQ0FBQSxFQUFBO3dCQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7NEJBQ3RCLG9CQUFBLFFBQU8sRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQUEsRUFBaUMsQ0FBQyxJQUFBLEVBQUksQ0FBQyxjQUFBLEVBQWMsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBLGFBQW9CLENBQUE7d0JBQ2xILENBQUE7b0JBQ0osQ0FBQTtnQkFDSCxDQUFBO1lBQ0wsQ0FBQTtJQUNkO0FBQ0osRUFBRTs7QUFFRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGNBQWM7Ozs7OztBQ3hDL0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztDQUMzQixTQUFTLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQzNDLGNBQWMsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUM7Q0FDckQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztBQUN2QyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXZCLElBQUkscUNBQXFDLCtCQUFBO0NBQ3hDLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU87R0FDTixPQUFPLEVBQUUsS0FBSztHQUNkO0FBQ0gsRUFBRTs7Q0FFRCxlQUFlLEVBQUUsV0FBVztBQUM3QixFQUFFOztDQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDdkIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLFdBQVc7U0FDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQy9CLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUNsQixTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUMzQyxTQUFTLENBQUMsQ0FBQztBQUNYO0FBQ0E7O0VBRUUsU0FBUyxZQUFZLEVBQUU7TUFDbkIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztVQUN4QixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7VUFDdEUsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7VUFDckYsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztVQUN4QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7VUFDaEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7T0FDekQsQ0FBQyxDQUFDO0dBQ047QUFDSCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7O0FBRXBFLEtBQUs7O0lBRUQsbUJBQW1CLEVBQUUsV0FBVztRQUM1QixPQUFPLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQy9ELEtBQUs7O0NBRUosaUJBQWlCLEVBQUUsV0FBVztFQUM3QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLO0FBQzVDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtHQUNoQixPQUFPO0FBQ1YsR0FBRzs7QUFFSCxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztFQUU5QixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLEdBQUcsRUFBRTtHQUM1QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDM0IsR0FBRyxDQUFDLENBQUM7O0VBRUgsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxHQUFHLEVBQUUsQ0FBQyxFQUFFO0dBQzdCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEIsR0FBRyxDQUFDLENBQUM7O0FBRUwsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOztFQUVsQixJQUFJLE9BQU8sR0FBRztZQUNKLEdBQUcsRUFBRSxHQUFHO1lBQ1IsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDO1lBQ3BCLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQztBQUNWLEVBQUUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFckMsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDM0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQztFQUN6QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO0dBQzFCLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0dBQ2Y7QUFDSCxFQUFFOztDQUVELGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQzlCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxhQUFhO0FBQzFCLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7O0VBRWhCLElBQUksRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUU7R0FDbkIsRUFBRSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsR0FBRzs7RUFFRCxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtHQUM5QixFQUFFLENBQUMsS0FBSyxJQUFJLEdBQUc7R0FDZjtBQUNILEVBQUU7O0NBRUQsY0FBYyxFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQzNCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0VBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUNyQixHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDOztHQUV4QztFQUNELElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxXQUFXLElBQUksR0FBRyxLQUFLLEdBQUcsRUFBRTtHQUN6QyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtJQUNoQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pEO0dBQ0Q7QUFDSCxFQUFFOztDQUVELFVBQVUsRUFBRSxXQUFXO0VBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7RUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUN6QyxFQUFFOztDQUVELFNBQVMsRUFBRSxXQUFXO1FBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxXQUFXO1NBQ3BELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7VUFDdkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7VUFDeEMsTUFBTTtVQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztVQUM5QztTQUNELENBQUMsQ0FBQztBQUNYLEtBQUs7O0NBRUosTUFBTSxFQUFFLFdBQVc7RUFDbEI7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDhCQUFBLEVBQThCLENBQUMsR0FBQSxFQUFHLENBQUMsT0FBUSxDQUFBLEVBQUE7SUFDekQsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtLQUM3QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGVBQWdCLENBQUEsRUFBQTtRQUM1QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO1VBQzVCLG9CQUFBLFFBQU8sRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsUUFBQSxFQUFRLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBQSxFQUFPLENBQUMsY0FBQSxFQUFZLENBQUMsT0FBQSxFQUFPLENBQUMsWUFBQSxFQUFVLENBQUMsT0FBUSxDQUFBLEVBQUE7V0FDL0Usb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFBLEVBQVksQ0FBQyxhQUFBLEVBQVcsQ0FBQyxNQUFPLENBQU8sQ0FBQTtVQUMvQyxDQUFBLEVBQUE7VUFDVCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQWMsQ0FBQSxFQUFBLGFBQWdCLENBQUE7UUFDeEMsQ0FBQSxFQUFBO01BQ1Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQTtPQUMzQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG9CQUFxQixDQUFBLEVBQUE7V0FDaEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUEsRUFBQTtZQUMxQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFBLFdBQWUsQ0FBQSxFQUFBO1lBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7YUFDM0Isb0JBQUEsT0FBTSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxLQUFBLEVBQUssQ0FBQyxJQUFBLEVBQUksQ0FBQyxLQUFBLEVBQUssQ0FBQyxjQUFBLEVBQWMsQ0FBQyxLQUFBLEVBQUssQ0FBQyxXQUFBLEVBQVcsQ0FBQyxZQUFZLENBQUEsQ0FBRyxDQUFBO1lBQ3ZFLENBQUE7V0FDRCxDQUFBO0FBQ2pCLFVBQWdCLENBQUEsRUFBQTs7VUFFTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG9CQUFxQixDQUFBLEVBQUE7V0FDbkMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUEsRUFBQTtZQUMxQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFBLDZCQUFpQyxDQUFBLEVBQUE7WUFDN0Qsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQTthQUMzQixvQkFBQSxPQUFNLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFDLE1BQUEsRUFBTSxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQUEsRUFBTTtlQUMzQixjQUFBLEVBQWMsQ0FBQyxLQUFBLEVBQUs7ZUFDcEIsV0FBQSxFQUFXLENBQUMseUJBQUEsRUFBeUI7ZUFDckMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGNBQWMsRUFBQztlQUM3QixRQUFBLEVBQVEsQ0FBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUM7ZUFDakMsU0FBQSxFQUFTLENBQUUsSUFBSSxDQUFDLGNBQWUsQ0FBQSxDQUFHLENBQUE7WUFDL0IsQ0FBQTtXQUNELENBQUE7VUFDRCxDQUFBO1FBQ0YsQ0FBQSxFQUFBO1FBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtVQUM1QixvQkFBQSxRQUFPLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBQyxDQUFDLElBQUEsRUFBSSxDQUFDLFFBQUEsRUFBUSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlDQUFrQyxDQUFBLEVBQUE7QUFBQSxXQUFBLG1CQUFBO0FBQUEsVUFFMUYsQ0FBQTtRQUNMLENBQUE7S0FDSCxDQUFBO0lBQ0QsQ0FBQTtHQUNELENBQUE7SUFDTDtBQUNKLEVBQUU7O0FBRUYsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7Ozs7Ozs7QUMxS2pDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDNUIsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7Q0FFckIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7Q0FDekIsU0FBUyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztDQUNyQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztDQUM3QixlQUFlLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQ2pELGNBQWMsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUM7Q0FDL0MsV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztDQUN6QyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUM7Q0FDbkQsU0FBUyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztDQUNyQyxNQUFNLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztDQUMvQixlQUFlLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQ2pELGFBQWEsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUM7QUFDOUMsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOztDQUUzQyxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDO0NBQ3RELFlBQVksR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUM7Q0FDakQsVUFBVSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUM3QyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7O0FBRXZDLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7O0FBRWxDLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFN0I7QUFDQTtBQUNBO0FBQ0E7O0dBRUc7QUFDSCxJQUFJLHlCQUF5QixtQkFBQTtDQUM1QixlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPO0dBQ04sY0FBYyxFQUFFLFlBQVk7R0FDNUIsQ0FBQztBQUNKLEVBQUU7O0NBRUQsa0JBQWtCLEVBQUUsV0FBVztFQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtHQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7R0FDeEMsT0FBTztBQUNWLEdBQUc7O0FBRUgsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxZQUFZLEdBQUcsV0FBVyxDQUFDLENBQUM7QUFDOUU7O0VBRUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyRCxFQUFFOztBQUVGLENBQUMsaUJBQWlCLEVBQUUsV0FBVztBQUMvQjtBQUNBOztBQUVBLEVBQUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFNUMsRUFBRTs7Q0FFRCxvQkFBb0IsRUFBRSxXQUFXO0VBQ2hDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUMsRUFBRTs7Q0FFRCxTQUFTLEVBQUUsV0FBVztFQUNyQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztFQUM3QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEVBQUU7O0dBRUMsTUFBTSxFQUFFLFVBQVU7SUFDakIsSUFBSSxXQUFXLEdBQUcsb0JBQUMsV0FBVyxFQUFBLElBQUEsQ0FBRyxDQUFBO0tBQ2hDLFNBQVMsR0FBRyxvQkFBQyxnQkFBZ0IsRUFBQSxJQUFBLENBQUcsQ0FBQSxDQUFDO0lBQ2xDLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxLQUFLLFlBQVksR0FBRyxXQUFXLEdBQUcsU0FBUyxDQUFDO0tBQ3pGO0dBQ0Ysb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxlQUFnQixDQUFBLEVBQUE7SUFDOUIsb0JBQUMsU0FBUyxFQUFBLElBQUEsQ0FBRyxDQUFBLEVBQUE7SUFDYixvQkFBQyxLQUFLLEVBQUEsSUFBQSxDQUFHLENBQUEsRUFBQTtJQUNULG9CQUFDLGVBQWUsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFBO0lBQ25CLG9CQUFBLEtBQUksRUFBQSxJQUFDLEVBQUMsY0FBcUIsQ0FBQSxFQUFBO0lBQzNCLG9CQUFDLFNBQVMsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUMsV0FBVyxDQUFFLENBQUEsRUFBQTtJQUM1QixvQkFBQyxNQUFNLEVBQUEsSUFBQSxDQUFHLENBQUEsRUFBQTtJQUNWLG9CQUFDLGFBQWEsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFBO0lBQ2pCLG9CQUFDLGVBQWUsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFBO0lBQ25CLG9CQUFDLFlBQVksRUFBQSxJQUFBLENBQUcsQ0FBQTtHQUNYLENBQUE7TUFDSDtJQUNGO0FBQ0osQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7Ozs7Ozs7QUMxRnJCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7Q0FDM0IsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUM1QyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQzs7QUFFbEQsSUFBSSxpQ0FBaUMsMkJBQUE7Q0FDcEMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFDaEMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzdCOztFQUVFLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDWixlQUFlLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPO1NBQ3RDLENBQUMsQ0FBQztFQUNUO0NBQ0QsTUFBTSxFQUFFLFdBQVc7RUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7RUFDakM7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDRCQUFBLEVBQTRCLENBQUMsZ0JBQUEsRUFBYyxDQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsaUJBQW1CLENBQUEsRUFBQTtJQUN6RyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFFLE9BQU8sQ0FBQyxHQUFJLENBQUEsQ0FBRyxDQUFBO0dBQ3BCLENBQUE7SUFDTDtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7Ozs7Ozs7QUN2QjdCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDeEIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDMUIsV0FBVyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7SUFDdEMsY0FBYyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQztJQUNyRCxTQUFTLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0lBQzNDLFlBQVksR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUM7QUFDcEQsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUxQixJQUFJLGlDQUFpQywyQkFBQTtJQUNqQyxlQUFlLEVBQUUsV0FBVztRQUN4QixPQUFPO1lBQ0gsT0FBTyxFQUFFLEVBQUU7U0FDZDtBQUNULEtBQUs7O0lBRUQsaUJBQWlCLEVBQUUsV0FBVztRQUMxQixjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDN0IsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztBQUMxQyxLQUFLOztJQUVELG9CQUFvQixFQUFFLFdBQVc7UUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ25DLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDMUQsS0FBSzs7QUFFTCxJQUFJLGtCQUFrQixFQUFFLFdBQVc7O0FBRW5DLEtBQUs7O0lBRUQsU0FBUyxFQUFFLFdBQVc7UUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNWLE9BQU8sRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFO0FBQzlDLFNBQVMsQ0FBQyxDQUFDO0FBQ1g7QUFDQTs7QUFFQSxRQUFRLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7UUFFbkIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ25ELEtBQUs7O0lBRUQsV0FBVyxFQUFFLFdBQVc7UUFDcEIsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDekI7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEVBQUUsRUFBRTtZQUN6QixhQUFhLEVBQUUsQ0FBQztZQUNoQixZQUFZLEVBQUUsRUFBRTtBQUM1QixZQUFZLGNBQWMsRUFBRSxJQUFJO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O1lBRVksWUFBWSxFQUFFLENBQUM7WUFDZixlQUFlLEVBQUUsSUFBSTtZQUNyQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZUFBZTtTQUN6QyxDQUFDLENBQUM7QUFDWCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxlQUFlLEVBQUUsU0FBUyxNQUFNLEVBQUU7UUFDOUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDbkQsVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0MsY0FBYyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0lBRUksMEJBQTBCLEVBQUUsV0FBVztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDMUMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7WUFDbkMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxZQUFZO1lBQzFCLE9BQU8sR0FBRyxFQUFFO0FBQ3hCLFlBQVksSUFBSSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7O1FBRXZCLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDM0MsS0FBSzs7QUFFTCxJQUFJLE1BQU0sRUFBRSxXQUFXOztRQUVmLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFdBQVcsRUFBRTtZQUM3RDtnQkFDSSxvQkFBQyxXQUFXLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLFdBQVcsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLFdBQVcsQ0FBQyxHQUFJLENBQUEsQ0FBRyxDQUFBO2NBQzdEO0FBQ2QsU0FBUyxDQUFDLENBQUM7O0FBRVgsUUFBUSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7O1FBRXZCO1lBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx3QkFBeUIsQ0FBQSxFQUFBO2dCQUNwQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFBLEVBQWtCLENBQUMsR0FBQSxFQUFHLENBQUMsUUFBUyxDQUFBLEVBQUE7b0JBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQWlCLENBQUEsRUFBQTt3QkFDM0IsWUFBYTtvQkFDWixDQUFBO2dCQUNKLENBQUE7WUFDSixDQUFBO1VBQ1I7QUFDVixLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDOzs7Ozs7O0FDaEg3QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0NBQzNCLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7Q0FDeEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUM1QyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7QUFFeEMsSUFBSSw0QkFBNEIsc0JBQUE7Q0FDL0IsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTztHQUNOLElBQUksRUFBRSxLQUFLO0dBQ1gsQ0FBQztBQUNKLEVBQUU7O0NBRUQsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTztHQUNOLFNBQVMsRUFBRSxrQkFBa0I7R0FDN0I7QUFDSCxFQUFFOztDQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDdkIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNsRCxLQUFLOztJQUVELHFCQUFxQixFQUFFLFdBQVc7RUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0VBQ3JDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsRUFBRTs7Q0FFRCxTQUFTLEVBQUUsV0FBVztRQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7QUFDOUMsS0FBSzs7Q0FFSixNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQztFQUN6QyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQztFQUM1RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUN2QyxFQUFFLElBQUksU0FBUyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUQ7O0VBRUU7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLFNBQVcsQ0FBQSxFQUFBO0lBQzFCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtLQUNsQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDRCQUE2QixDQUFBLEVBQUE7TUFDM0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFDLFdBQWtCLENBQUEsRUFBQTtNQUN6RCxvQkFBQSxRQUFPLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLFFBQUEsRUFBUSxDQUFDLFNBQUEsRUFBUyxDQUFDLHNDQUFBLEVBQXNDLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLHFCQUFzQixDQUFFLENBQUEsRUFBQTtzQkFDN0Ysb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFZLENBQUEsQ0FBRyxDQUFBO2tCQUMxQixDQUFBO0tBQ2hCLENBQUEsRUFBQTtLQUNOLG9CQUFDLFlBQVksRUFBQSxDQUFBLENBQUMsZ0JBQUEsRUFBZ0IsQ0FBRSxJQUFJLENBQUMscUJBQXNCLENBQUEsQ0FBRyxDQUFBO0lBQ3pELENBQUE7R0FDRCxDQUFBO0lBQ0w7QUFDSixFQUFFOztBQUVGLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTTs7Ozs7O0FDdkR2QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0NBQzNCLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0NBQ3JCLFNBQVMsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUM7QUFDNUMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRXhDLElBQUksK0JBQStCLHlCQUFBO0NBQ2xDLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU87R0FDTixjQUFjLEVBQUUsWUFBWTtHQUM1QixDQUFDO0FBQ0osRUFBRTs7Q0FFRCxlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPLEVBQUU7QUFDWCxFQUFFOztDQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDdkIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNsRCxLQUFLOztJQUVELHFCQUFxQixFQUFFLFdBQVc7RUFDcEMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QixFQUFFOztDQUVELHNCQUFzQixFQUFFLFdBQVc7RUFDbEMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzVDLEVBQUU7O0NBRUQsa0JBQWtCLEVBQUUsV0FBVztFQUM5QixTQUFTLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEMsRUFBRTs7Q0FFRCxlQUFlLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDNUIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0VBQ3BCLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ2xDLEVBQUU7O0NBRUQsU0FBUyxFQUFFLFdBQVc7UUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7QUFDeEQsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztDQUVDLE1BQU0sRUFBRSxXQUFXO0VBQ2xCLElBQUksVUFBVTtHQUNiLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0NBQWlDLENBQUEsRUFBQTtJQUMvQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO0tBQ3pCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaURBQUEsRUFBaUQsQ0FBQyxJQUFBLEVBQUksQ0FBQyxHQUFBLEVBQUcsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsc0JBQXdCLENBQUEsRUFBQTtNQUM3RyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFBLFlBQWlCLENBQUE7S0FDM0MsQ0FBQTtJQUNDLENBQUEsRUFBQTtJQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7S0FDekIsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxzQ0FBQSxFQUFzQyxDQUFDLElBQUEsRUFBSSxDQUFDLEdBQUEsRUFBRyxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxrQkFBb0IsQ0FBQSxFQUFBO01BQzlGLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsUUFBUyxDQUFBLEVBQUEsUUFBYSxDQUFBO0tBQ25DLENBQUE7SUFDQyxDQUFBLEVBQUE7SUFDTixvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDJCQUFBLEVBQTJCLENBQUMsSUFBQSxFQUFJLENBQUMsR0FBQSxFQUFHLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGVBQWlCLENBQUEsRUFBQSxHQUFLLENBQUE7R0FDakYsQ0FBQTtBQUNULEdBQUcsQ0FBQzs7RUFFRixJQUFJLE1BQU07R0FDVCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdDQUFpQyxDQUFBLEVBQUE7SUFDL0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtLQUN6QixvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDBDQUFBLEVBQTBDLENBQUMsSUFBQSxFQUFJLENBQUMsR0FBQSxFQUFHLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLHNCQUF3QixDQUFBLEVBQUE7TUFDdEcsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQSxZQUFpQixDQUFBO0tBQzNDLENBQUE7SUFDQyxDQUFBLEVBQUE7SUFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO0tBQ3pCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsNkNBQUEsRUFBNkMsQ0FBQyxJQUFBLEVBQUksQ0FBQyxHQUFBLEVBQUcsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsa0JBQW9CLENBQUEsRUFBQTtNQUNyRyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFFBQVMsQ0FBQSxFQUFBLFFBQWEsQ0FBQTtLQUNuQyxDQUFBO0lBQ0MsQ0FBQTtHQUNELENBQUE7R0FDTixDQUFDO0VBQ0YsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUM7RUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztFQUMxQyxPQUFPLEtBQUssS0FBSyxZQUFZLEdBQUcsVUFBVSxHQUFHLE1BQU0sQ0FBQztBQUN0RCxFQUFFOztBQUVGLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDOzs7Ozs7O0FDbkYzQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0NBQzNCLFlBQVksR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUM7Q0FDakQsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUM1QyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFOUMsSUFBSSwyQkFBMkIscUJBQUE7O0NBRTlCLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU8sRUFBRTtBQUNYLEVBQUU7O0NBRUQsaUJBQWlCLEVBQUUsV0FBVztFQUM3QixZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7RUFDMUIsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMvQyxFQUFFOztDQUVELGtCQUFrQixFQUFFLFdBQVc7RUFDOUIsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7QUFDcEMsRUFBRTs7Q0FFRCxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUN4QixTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsRUFBRTs7R0FFQyxTQUFTLEVBQUUsV0FBVztJQUNyQixJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdDLElBQUksQ0FBQyxRQUFRLENBQUM7S0FDYixLQUFLLEVBQUUsYUFBYTtLQUNwQixDQUFDLENBQUM7QUFDUCxJQUFJOztHQUVELDBCQUEwQixFQUFFLFdBQVc7SUFDdEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7S0FDdEMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDO0tBQ3RFLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztLQUN0RSxLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztHQUM1QyxDQUFDLEdBQUcsU0FBUyxDQUFDLFdBQVc7R0FDekIsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxZQUFZO0dBQzFCLE9BQU8sR0FBRyxFQUFFO0dBQ1osSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTztHQUNwQixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPO0FBQ3ZCLEdBQUcsTUFBTSxFQUFFLE1BQU0sQ0FBQzs7QUFFbEIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksRUFBRTs7R0FFekYsTUFBTSxHQUFHLElBQUksQ0FBQztHQUNkLE1BQU0sSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BDLEdBQUcsTUFBTTs7R0FFTixNQUFNLEdBQUcsSUFBSSxDQUFDO0dBQ2QsTUFBTSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsR0FBRzs7RUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQzs7RUFFbkMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzlDLEVBQUUsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQzVEO0FBQ0E7QUFDQTs7RUFFRSxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLG1CQUFtQixDQUFDLENBQUM7RUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDOUMsSUFBSTs7Q0FFSCxNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7R0FDdEIsT0FBTyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlCQUFrQixDQUFNLENBQUE7R0FDOUM7QUFDSCxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDOztFQUV6RyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7RUFDM0csSUFBSSxRQUFRLEdBQUc7R0FDZCxlQUFlLEVBQUUsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHO0FBQ3RDLEdBQUcsQ0FBQzs7QUFFSixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztFQUU1QixJQUFJLE9BQU8sR0FBRztHQUNiLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLEdBQUcsR0FBRyxHQUFHO0FBQ2hELEdBQUcsQ0FBQzs7RUFFRjtHQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQUEsRUFBaUIsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO0lBQ3JELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQUEsRUFBaUMsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO0tBQzFFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUJBQUEsRUFBdUIsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxQkFBQSxFQUFxQixDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxZQUFjLENBQUEsRUFBQTtlQUNuRixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE9BQUEsRUFBTyxDQUFDLEtBQUEsRUFBSyxDQUFFLFFBQVEsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFDLE9BQU8sQ0FBRSxDQUFBO2NBQ2hELENBQUE7VUFDSixDQUFBO1NBQ0QsQ0FBQTtJQUNYO0VBQ0Y7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUs7Ozs7OztBQ2pHdEIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztDQUMzQixTQUFTLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0FBQzVDLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDOztBQUVsRCxJQUFJLCtCQUErQix5QkFBQTtDQUNsQyxTQUFTLEVBQUU7RUFDVixLQUFLLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVTtFQUN4QztDQUNELGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7RUFDM0IsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3hDO0NBQ0QsTUFBTSxFQUFFLFdBQVc7RUFDbEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7RUFDN0I7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDBCQUFBLEVBQTBCLENBQUMsY0FBQSxFQUFZLENBQUUsS0FBSyxDQUFDLEdBQUcsRUFBQyxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxpQkFBbUIsQ0FBQSxFQUFBO0lBQ25HLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFJLENBQUEsQ0FBRyxDQUFBO0dBQ2xDLENBQUE7SUFDTDtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7Ozs7Ozs7QUN0QjNCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDNUIsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQzs7QUFFN0QsSUFBSSxzQ0FBc0MsZ0NBQUE7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxlQUFlLEVBQUUsV0FBVztRQUN4QixPQUFPO1lBQ0gsS0FBSyxFQUFFO2dCQUNILElBQUksRUFBRSxFQUFFO2dCQUNSLEtBQUssRUFBRSxFQUFFO2FBQ1o7U0FDSjtBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSSxNQUFNLEVBQUUsV0FBVzs7QUFFdkIsUUFBUSxJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7O1FBRXpCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFO1lBQ3RELGVBQWU7Z0JBQ1gsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO29CQUNqQyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFPLENBQUEsRUFBQSxHQUFBLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZUFBZ0I7Z0JBQ3pFLENBQUE7YUFDVDtBQUNiLFNBQVM7O1FBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDeEIsS0FBSyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDbEQsU0FBUzs7UUFFRDtZQUNJLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQXNCLENBQUEsRUFBQTtnQkFDakMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1QkFBd0IsQ0FBQSxFQUFBO29CQUNuQyxvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFBO3dCQUNELG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQXFCLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFZLENBQUEsRUFBQTt3QkFDbkUsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFDLEtBQWEsQ0FBQTtvQkFDakQsQ0FBQSxFQUFBO29CQUNMLGVBQWdCO2dCQUNmLENBQUE7WUFDSixDQUFBO1VBQ1I7QUFDVixLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUM7Ozs7Ozs7QUNsRWxDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDeEIsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztJQUMzQyxVQUFVLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0lBQzVDLE9BQU8sR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7QUFDMUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUxQixJQUFJLGtDQUFrQyw0QkFBQTs7SUFFbEMsZUFBZSxFQUFFLFdBQVc7UUFDeEIsT0FBTztZQUNILEtBQUssRUFBRSxJQUFJO1lBQ1gsV0FBVyxFQUFFLEtBQUs7U0FDckIsQ0FBQztBQUNWLEtBQUs7O0lBRUQsaUJBQWlCLEVBQUUsV0FBVztRQUMxQixPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3BELEtBQUs7O0lBRUQsaUJBQWlCLEVBQUUsV0FBVztRQUMxQixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDakMsS0FBSzs7SUFFRCxXQUFXLEVBQUUsV0FBVztRQUNwQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0FBQ2pELEtBQUs7O0lBRUQsTUFBTSxFQUFFLFdBQVc7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDbkIsT0FBTyxLQUFLLENBQUM7QUFDekIsU0FBUzs7UUFFRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlO1lBQzFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSTtZQUNuQixZQUFZLEdBQUcsSUFBSTtZQUNuQixjQUFjLEdBQUcsRUFBRTtZQUNuQixpQkFBaUIsR0FBRyxFQUFFO0FBQ2xDLFlBQVksZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQzs7UUFFdkQsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLElBQUksRUFBRTtZQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsR0FBRyxFQUFFO2dCQUN2QixZQUFZLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7YUFDbkMsQ0FBQyxDQUFDO0FBQ2YsU0FBUzs7QUFFVCxRQUFRLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQzs7QUFFdEYsUUFBUSxJQUFJLFNBQVMsR0FBRyxvQkFBb0IsR0FBRyxZQUFZLENBQUM7O1FBRXBELElBQUksUUFBUSxHQUFHO1lBQ1gsZUFBZSxFQUFFLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUc7QUFDdkQsU0FBUyxDQUFDOztRQUVGLElBQUksZUFBZSxFQUFFO1lBQ2pCLGNBQWM7Z0JBQ1Ysb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBTyxDQUFBO2FBQzNDLENBQUM7WUFDRixpQkFBaUI7Z0JBQ2Isb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFDLGVBQXVCLENBQUE7YUFDNUQsQ0FBQztBQUNkLFNBQVM7O1FBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7WUFDdkIsWUFBWTtnQkFDUixvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFBO29CQUNELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkJBQTRCLENBQUEsRUFBQTt3QkFDdkMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTs0QkFDdEIsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFZLENBQUEsRUFBQTs0QkFDM0Qsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBQSxFQUFBO2dDQUMvQixjQUFjLEVBQUM7Z0NBQ2YsaUJBQWtCOzRCQUNoQixDQUFBO3dCQUNMLENBQUEsRUFBQTt3QkFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBOzRCQUN0QixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFBLEVBQUEsR0FBQSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQWEsQ0FBQTt3QkFDakUsQ0FBQSxFQUFBO3dCQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUJBQXdCLENBQUEsRUFBQTs0QkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBWTt3QkFDNUIsQ0FBQTtvQkFDSixDQUFBO2dCQUNKLENBQUE7YUFDVCxDQUFDO0FBQ2QsU0FBUzs7UUFFRDtZQUNJLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsU0FBUyxFQUFDLENBQUMsS0FBQSxFQUFLLENBQUUsUUFBUyxDQUFFLENBQUEsRUFBQTtnQkFDekMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO29CQUNqQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7d0JBQzVCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQUEsRUFBQTs0QkFDOUIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUEsRUFBQTtnQ0FDdkIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtvQ0FDekIsWUFBYTtnQ0FDWixDQUFBOzRCQUNKLENBQUEsRUFBQTs0QkFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO2dDQUN0QixvQkFBQSxRQUFPLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLFFBQUEsRUFBUSxDQUFDLFNBQUEsRUFBUyxDQUFDLDJCQUFBLEVBQTJCLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGlCQUFrQixDQUFFLENBQUEsRUFBQTtvQ0FDMUYsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFZLENBQUEsQ0FBRyxDQUFBO2dDQUMxQixDQUFBOzRCQUNQLENBQUE7d0JBQ0osQ0FBQSxFQUFBO3dCQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsd0JBQXlCLENBQUEsRUFBQTtBQUNoRSw0QkFBNEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUE7OzRCQUVyQixDQUFBO3dCQUNKLENBQUEsRUFBQTt3QkFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlCQUFrQixDQUFBLEVBQUE7NEJBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7Z0NBQ3RCLE9BQU8sQ0FBQyxHQUFJOzRCQUNYLENBQUE7d0JBQ0osQ0FBQTtvQkFDSixDQUFBLEVBQUE7b0JBQ0wsWUFBYTtnQkFDWixDQUFBO1lBQ0osQ0FBQTtVQUNSO0FBQ1YsS0FBSzs7QUFFTCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVk7Ozs7OztBQ3hIN0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUN4QixZQUFZLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0FBQzVDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2pEOztBQUVBLElBQUkseUJBQXlCLG1CQUFBO0lBQ3pCLGlCQUFpQixFQUFFLFdBQVc7UUFDMUIsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyRCxLQUFLOztJQUVELGVBQWUsRUFBRSxXQUFXO1FBQ3hCLE9BQU87WUFDSCxNQUFNLEVBQUUsRUFBRTtTQUNiO0FBQ1QsS0FBSzs7SUFFRCxNQUFNLEVBQUUsV0FBVztRQUNmLFNBQVMsZUFBZSxDQUFDLEtBQUssRUFBRTtZQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM5QixPQUFPLG9CQUFDLFlBQVksRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsS0FBSyxDQUFDLEdBQUcsRUFBQyxDQUFDLEtBQUEsRUFBSyxDQUFFLEtBQU0sQ0FBQSxDQUFHLENBQUE7QUFDakUsU0FBUzs7UUFFRDtZQUNJLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUJBQXdCLENBQUEsRUFBQTtnQkFDbEMsNERBQTZEO2dCQUM5RCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGVBQWdCLENBQUEsRUFBQTtvQkFDM0Isb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxRQUFBLEVBQVEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQ0FBQSxFQUFtQyxDQUFDLGFBQUEsRUFBVyxDQUFDLFVBQUEsRUFBVSxDQUFDLGFBQUEsRUFBVyxDQUFDLCtCQUFnQyxDQUFBLEVBQUE7d0JBQ25JLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsU0FBVSxDQUFBLEVBQUEsbUJBQXdCLENBQUEsRUFBQTt3QkFDbEQsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFVLENBQUEsQ0FBRyxDQUFBLEVBQUE7d0JBQzdCLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVSxDQUFBLENBQUcsQ0FBQSxFQUFBO3dCQUM3QixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVUsQ0FBQSxDQUFHLENBQUE7b0JBQ3hCLENBQUEsRUFBQTtvQkFDVCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHNCQUF1QixDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUEsRUFBQSxZQUFpQixDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQyxXQUFtQixDQUFLLENBQUE7Z0JBQ3BJLENBQUEsRUFBQTtnQkFDTCxrRUFBbUU7Z0JBQ3BFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMEJBQUEsRUFBMEIsQ0FBQyxFQUFBLEVBQUUsQ0FBQyw4QkFBK0IsQ0FBQSxFQUFBO29CQUN4RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDZCQUE4QixDQUFBLEVBQUE7d0JBQ3hDLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7NEJBQ3JCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsR0FBQSxFQUFHLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQUEsRUFBaUIsQ0FBQyxhQUFBLEVBQVcsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxJQUFBLEVBQUksQ0FBQyxRQUFBLEVBQVEsQ0FBQyxlQUFBLEVBQWEsQ0FBQyxPQUFRLENBQUEsRUFBQSxTQUFBLEVBQU8sb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFPLENBQUEsQ0FBRyxDQUFJLENBQUEsRUFBQTs0QkFDeEksb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxlQUFBLEVBQWUsQ0FBQyxJQUFBLEVBQUksQ0FBQyxNQUFPLENBQUEsRUFBQTtnQ0FDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUU7NEJBQ2xELENBQUE7d0JBQ0osQ0FBQSxFQUFBO3dCQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7NEJBQ0Esb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxTQUFVLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDZCQUE2QixDQUFBLENBQUcsQ0FBSSxDQUFBO3dCQUNyRSxDQUFBO29CQUNKLENBQUE7Z0JBQ0gsQ0FBQTtnQkFDTCx1QkFBd0I7WUFDdkIsQ0FBQTtVQUNSO0FBQ1YsS0FBSzs7SUFFRCxTQUFTLEVBQUUsV0FBVztRQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ1YsTUFBTSxFQUFFLFVBQVUsQ0FBQyxZQUFZLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0FBQ1gsS0FBSzs7QUFFTCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUc7Ozs7OztBQzdEcEIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUM1QixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQzs7QUFFdEQsSUFBSSxrQ0FBa0MsNEJBQUE7Q0FDckMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDakMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3RDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtHQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7R0FDOUI7QUFDSCxFQUFFOztDQUVELE1BQU0sRUFBRSxXQUFXO0VBQ2xCLElBQUksV0FBVyxHQUFHLGVBQWU7R0FDaEMsVUFBVSxHQUFHLGVBQWUsQ0FBQztFQUM5QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRTtHQUMvQixXQUFXLEdBQUcsVUFBVSxHQUFHLFdBQVcsQ0FBQztBQUMxQyxHQUFHOztFQUVELFNBQVMsVUFBVSxDQUFDLFFBQVEsRUFBRTtZQUNwQixPQUFPLFFBQVEsR0FBRyxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQ3JELFNBQVM7O0VBRVAsSUFBSSxPQUFPLEdBQUcsb0JBQW9CLEdBQUcsV0FBVyxDQUFDO0VBQ2pEO0dBQ0Msb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsb0JBQXNCLENBQUEsRUFBQTtJQUN2QyxvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLEdBQUksQ0FBQSxFQUFBO0tBQ1gsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUEsQ0FBRyxDQUFBLEVBQUEsR0FBQSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztLQUNsRixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLE9BQVMsQ0FBQSxFQUFDLFVBQWtCLENBQUE7SUFDMUMsQ0FBQTtHQUNBLENBQUE7SUFDSjtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZOzs7Ozs7QUNsQzdCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7Q0FDM0IsWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztBQUN6QyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFOUMsSUFBSSxrQ0FBa0MsNEJBQUE7Q0FDckMsaUJBQWlCLEVBQUUsV0FBVztRQUN2QixVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3JELEtBQUs7O0lBRUQsZUFBZSxFQUFFLFdBQVc7S0FDM0IsT0FBTztNQUNOLFlBQVksRUFBRSxFQUFFO01BQ2hCLGFBQWEsRUFBRSxJQUFJO01BQ25CLGdCQUFnQixFQUFFLFdBQVc7T0FDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztPQUM1QjtNQUNELENBQUM7QUFDUCxLQUFLOztJQUVELGVBQWUsRUFBRSxXQUFXO1FBQ3hCLE9BQU87WUFDSCxNQUFNLEVBQUUsRUFBRTtTQUNiO0FBQ1QsS0FBSzs7Q0FFSixNQUFNLEVBQUUsV0FBVztFQUNsQixTQUFTLGVBQWUsQ0FBQyxLQUFLLEVBQUU7WUFDdEIsT0FBTyxvQkFBQyxZQUFZLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxLQUFBLEVBQUssQ0FBRSxLQUFLLEVBQUMsQ0FBQyxnQkFBQSxFQUFnQixDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWlCLENBQUEsQ0FBRyxDQUFBO0FBQ2hILFNBQVM7O0FBRVQsRUFBRSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxnQ0FBZ0MsQ0FBQzs7RUFFekUsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0VBQ2hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUU7R0FDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztHQUM3QixNQUFNO0lBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtLQUNILG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBQyxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQUEsRUFBWSxDQUFDLElBQUEsRUFBSSxDQUFDLFNBQVUsQ0FBQSxFQUFBLFNBQVcsQ0FBQTtJQUN0RixDQUFBO0lBQ0wsQ0FBQztBQUNMLEdBQUc7O0VBRUQ7R0FDQyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLE9BQU8sRUFBQyxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQU8sQ0FBQSxFQUFBO2dCQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDO2dCQUNsRCxNQUFPO1lBQ1AsQ0FBQTtJQUNiO0FBQ0osRUFBRTs7Q0FFRCxTQUFTLEVBQUUsV0FBVztRQUNmLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDVixNQUFNLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRTtTQUNwQyxDQUFDLENBQUM7QUFDWCxLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWTs7Ozs7O0FDMUQ3QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ3hCLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQzFCLFNBQVMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO0FBQ3RDLElBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7O0FBRWxFLElBQUksdUNBQXVDLGlDQUFBO0lBQ3ZDLGlCQUFpQixFQUFFLFdBQVc7UUFDMUIsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7QUFDMUMsS0FBSzs7SUFFRCxrQkFBa0IsRUFBRSxTQUFTLFNBQVMsRUFBRSxTQUFTLEVBQUU7UUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdEI7QUFDVCxLQUFLOztJQUVELFdBQVcsRUFBRSxXQUFXO1FBQ3BCLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUU7WUFDekIsYUFBYSxFQUFFLENBQUM7WUFDaEIsWUFBWSxFQUFFLEVBQUU7QUFDNUIsWUFBWSxjQUFjLEVBQUUsSUFBSTtBQUNoQztBQUNBO0FBQ0E7QUFDQTs7WUFFWSxlQUFlLEVBQUUsSUFBSTtZQUNyQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZUFBZTtTQUN6QyxDQUFDLENBQUM7QUFDWCxLQUFLOztJQUVELFFBQVEsRUFBRSxTQUFTLEtBQUssRUFBRTtRQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQyxLQUFLOztJQUVELGVBQWUsRUFBRSxTQUFTLE1BQU0sRUFBRTtRQUM5QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUNuRCxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDckMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xELEtBQUs7O0lBRUQsMEJBQTBCLEVBQUUsV0FBVztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDMUMsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQ3hELFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxZQUFZOztBQUV0QyxZQUFZLEdBQUcsR0FBRyxTQUFTLENBQUMsU0FBUzs7QUFFckMsWUFBWSxPQUFPLEdBQUcsRUFBRTs7WUFFWixPQUFPLEdBQUcsRUFBRTtZQUNaLFFBQVEsR0FBRyxPQUFPLEdBQUcsT0FBTztBQUN4QyxZQUFZLElBQUksR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDOztRQUV4QixTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ25DLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3ZELEtBQUs7O0lBRUQsTUFBTSxFQUFFLFdBQVc7UUFDZixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxTQUFTLEVBQUU7WUFDeEQ7Z0JBQ0ksb0JBQUMsU0FBUyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBRSxTQUFTLEVBQUMsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxTQUFTLENBQUMsR0FBSSxDQUFBLENBQUcsQ0FBQTtjQUNyRDtBQUNkLFNBQVMsQ0FBQyxDQUFDOztRQUVIO1lBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx3QkFBQSxFQUF3QixDQUFDLEdBQUEsRUFBRyxDQUFDLFdBQVksQ0FBQSxFQUFBO2dCQUNwRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFBLEVBQWtCLENBQUMsR0FBQSxFQUFHLENBQUMsUUFBUyxDQUFBLEVBQUE7b0JBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQWlCLENBQUEsRUFBQTt3QkFDM0IsVUFBVztvQkFDVixDQUFBO2dCQUNKLENBQUE7WUFDSixDQUFBO1VBQ1I7QUFDVixLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUM7Ozs7Ozs7QUNsRm5DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7Q0FDM0IsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDO0lBQzdDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztJQUNsRCxrQkFBa0IsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUM7QUFDakUsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUM3RDs7QUFFQTs7R0FFRztBQUNILElBQUksc0NBQXNDLGdDQUFBO0NBQ3pDLGVBQWUsRUFBRSxXQUFXO1FBQ3JCLE9BQU87R0FDWixNQUFNLEVBQUUsRUFBRTtZQUNELGFBQWEsRUFBRTtnQkFDWCxJQUFJLEVBQUUsRUFBRTtnQkFDUixLQUFLLEVBQUUsRUFBRTthQUNaO0dBQ1Y7QUFDSCxFQUFFOztDQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0VBQzNELGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxrQkFBa0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQzlDLEtBQUs7O0lBRUQsb0JBQW9CLEVBQUUsV0FBVztRQUM3QixnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUQsS0FBSzs7QUFFTCxJQUFJLGtCQUFrQixFQUFFLFdBQVcsRUFBRTs7R0FFbEMsU0FBUyxFQUFFLFdBQVc7SUFDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUNiLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUU7WUFDbkMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFO0tBQy9ELENBQUMsQ0FBQztBQUNQLElBQUk7O0lBRUEsTUFBTSxFQUFFLFdBQVc7UUFDZjtZQUNJLG9CQUFBLEtBQUksRUFBQSxJQUFDLEVBQUE7Z0JBQ0Qsb0JBQUMsaUJBQWlCLEVBQUEsQ0FBQSxDQUFDLE1BQUEsRUFBTSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTyxDQUFBLENBQUcsQ0FBQSxFQUFBO2dCQUNoRCxvQkFBQyxnQkFBZ0IsRUFBQSxDQUFBLENBQUMsS0FBQSxFQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFjLENBQUUsQ0FBQTtZQUNsRCxDQUFBO1VBQ1I7QUFDVixLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUM7Ozs7Ozs7QUNuRGxDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7Q0FDM0IsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztDQUMzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDO0NBQ2pELE9BQU8sR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7Q0FDdEMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUM3QyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXZCLElBQUksbUNBQW1DLDZCQUFBO0NBQ3RDLGVBQWUsRUFBRSxXQUFXO0VBQzNCLE9BQU87R0FDTixZQUFZLEVBQUUsS0FBSztHQUNuQixLQUFLLEVBQUU7SUFDTixJQUFJLEVBQUUsRUFBRTtJQUNSLFdBQVcsRUFBRSxFQUFFO0lBQ2YsUUFBUSxFQUFFO0tBQ1QsT0FBTyxFQUFFLElBQUk7S0FDYixRQUFRLEVBQUUsQ0FBQztLQUNYO0lBQ0Q7R0FDRDtBQUNILEVBQUU7O0NBRUQsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTyxFQUFFO0FBQ1gsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxXQUFXO1FBQ3ZCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsV0FBVztTQUNoRSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDL0IsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDekMsU0FBUyxDQUFDLENBQUM7QUFDWDtBQUNBOztFQUVFLFNBQVMsWUFBWSxFQUFFO01BQ25CLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7VUFDeEIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1VBQ3RFLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1VBQ3JGLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7VUFDeEIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1VBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQ3pELENBQUMsQ0FBQztHQUNOO0VBQ0QsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNwRSxLQUFLOztJQUVELG1CQUFtQixFQUFFLFdBQVc7UUFDNUIsT0FBTyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMvQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQy9ELEtBQUs7O0NBRUosaUJBQWlCLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDOUIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLO0dBQzNCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQ3BCLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztFQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEVBQUU7O0NBRUQsd0JBQXdCLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDckMsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLO0dBQzNCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQ3BCLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztFQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEVBQUU7O0NBRUQsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDcEMsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPO0dBQzdCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQ3BCLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7RUFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QixFQUFFOztDQUVELHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQ2xDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSztHQUMzQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztFQUNwQixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0VBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkIsRUFBRTs7Q0FFRCxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUU7RUFDeEIsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLEVBQUU7O0NBRUQsV0FBVyxFQUFFLFdBQVc7UUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxXQUFXO1NBQ3pELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUU7VUFDNUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7VUFDeEMsTUFBTTtVQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztVQUM5QztTQUNELENBQUMsQ0FBQztBQUNYLEtBQUs7O0lBRUQsY0FBYyxFQUFFLFdBQVc7UUFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUNiLEtBQUssRUFBRSxVQUFVLENBQUMsZ0JBQWdCLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0FBQ1gsS0FBSzs7Q0FFSixNQUFNLEVBQUUsV0FBVztFQUNsQjtHQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkJBQUEsRUFBMkIsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxPQUFRLENBQUEsRUFBQTtJQUN0RCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO0tBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO1FBQzVCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsY0FBZSxDQUFBLEVBQUE7VUFDNUIsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxRQUFBLEVBQVEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFBLEVBQU8sQ0FBQyxjQUFBLEVBQVksQ0FBQyxPQUFBLEVBQU8sQ0FBQyxZQUFBLEVBQVUsQ0FBQyxPQUFRLENBQUEsRUFBQTtXQUMvRSxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQUEsRUFBWSxDQUFDLGFBQUEsRUFBVyxDQUFDLE1BQU8sQ0FBTyxDQUFBO1VBQy9DLENBQUEsRUFBQTtVQUNULG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsYUFBYyxDQUFBLEVBQUEsVUFBYSxDQUFBO1FBQ3JDLENBQUEsRUFBQTtNQUNSLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7T0FDM0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBO1FBQ25DLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7WUFDdkIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQSxNQUFVLENBQUEsRUFBQTtZQUN0QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFlBQWEsQ0FBQSxFQUFBO2FBQzNCLG9CQUFBLE9BQU0sRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUMsTUFBQSxFQUFNLENBQUMsSUFBQSxFQUFJLENBQUMsTUFBQSxFQUFNLENBQUMsS0FBQSxFQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDLENBQUMsUUFBQSxFQUFRLENBQUUsSUFBSSxDQUFDLGlCQUFrQixDQUFBLENBQUcsQ0FBQTtZQUMzRixDQUFBO1dBQ0QsQ0FBQTtBQUNqQixVQUFnQixDQUFBLEVBQUE7O1VBRU4sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBO1dBQ25DLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7WUFDMUIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQSx3QkFBNEIsQ0FBQSxFQUFBO1lBQ3hELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQXFCLENBQUEsRUFBQSxzQ0FBMEMsQ0FBQSxFQUFBO1lBQzlFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7YUFDM0Isb0JBQUEsT0FBTSxFQUFBLENBQUE7Y0FDTCxHQUFBLEVBQUcsQ0FBQyxhQUFBLEVBQWE7Y0FDakIsSUFBQSxFQUFJLENBQUMsTUFBQSxFQUFNO2NBQ1gsS0FBQSxFQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDO2NBQ3BDLFFBQUEsRUFBUSxDQUFFLElBQUksQ0FBQyx3QkFBd0IsRUFBQztjQUN4QyxXQUFBLEVBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQSxDQUFHLENBQUE7WUFDM0MsQ0FBQTtXQUNELENBQUE7QUFDakIsVUFBZ0IsQ0FBQSxFQUFBOztVQUVOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsb0JBQXFCLENBQUEsRUFBQTtXQUNuQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO1lBQ3pCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUEseUJBQTZCLENBQUEsRUFBQTtZQUN6RCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG9CQUFxQixDQUFBLEVBQUEsMkRBQStELENBQUE7V0FDOUYsQ0FBQSxFQUFBO1dBQ04sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtZQUN6QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHFCQUFzQixDQUFBLEVBQUE7YUFDcEMsb0JBQUEsT0FBTSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFBLEVBQVksQ0FBQyxHQUFBLEVBQUcsQ0FBQyxZQUFBLEVBQVksQ0FBQyxJQUFBLEVBQUksQ0FBQyxVQUFBLEVBQVU7Y0FDN0QsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBQztjQUMzQyxRQUFBLEVBQVEsQ0FBRSxJQUFJLENBQUMsdUJBQXdCLENBQUUsQ0FBQTtZQUNyQyxDQUFBO1dBQ0QsQ0FBQTtBQUNqQixVQUFnQixDQUFBLEVBQUE7O1VBRU4sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyw0Q0FBNkMsQ0FBQSxFQUFBO1dBQzNELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQXNCLENBQUEsRUFBQSxVQUFjLENBQUEsRUFBQTtXQUNuRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLDRCQUE2QixDQUFBLEVBQUE7WUFDM0Msb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFBLEVBQVksQ0FBQyxHQUFBLEVBQUcsQ0FBQyxVQUFBLEVBQVU7YUFDNUMsS0FBQSxFQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBQzthQUMxQyxRQUFBLEVBQVEsQ0FBRSxJQUFJLENBQUMscUJBQXNCLENBQUUsQ0FBQSxFQUFBO1VBQzFDLG9CQUFBLFFBQU8sRUFBQSxDQUFBLENBQUMsS0FBQSxFQUFLLENBQUMsR0FBSSxDQUFBLEVBQUEsSUFBZSxDQUFBLEVBQUE7VUFDakMsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBQyxJQUFLLENBQUEsRUFBQSxLQUFnQixDQUFBLEVBQUE7VUFDbkMsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBQyxLQUFNLENBQUEsRUFBQSxNQUFpQixDQUFBLEVBQUE7VUFDckMsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBQyxLQUFNLENBQUEsRUFBQSxNQUFpQixDQUFBO1NBQzdCLENBQUE7V0FDRCxDQUFBO1VBQ0QsQ0FBQTtRQUNGLENBQUEsRUFBQTtRQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsY0FBZSxDQUFBLEVBQUE7VUFDNUIsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsV0FBVyxFQUFDLENBQUMsSUFBQSxFQUFJLENBQUMsUUFBQSxFQUFRLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQWtDLENBQUEsRUFBQTtBQUFBLFdBQUEsTUFBQTtBQUFBLFVBRXBGLENBQUE7UUFDTCxDQUFBO0tBQ0gsQ0FBQTtJQUNELENBQUE7R0FDRCxDQUFBO0lBQ0w7QUFDSixFQUFFOztBQUVGLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDOzs7Ozs7O0FDbkwvQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ3hCLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7SUFDeEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztBQUMvQyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNqRDs7QUFFQSxJQUFJLCtCQUErQix5QkFBQTtJQUMvQixpQkFBaUIsRUFBRSxXQUFXO1FBQzFCLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDckQsS0FBSzs7SUFFRCxlQUFlLEVBQUUsV0FBVztRQUN4QixPQUFPO1lBQ0gsTUFBTSxFQUFFLEVBQUU7WUFDVixhQUFhLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsRUFBRTtvQkFDUixLQUFLLEVBQUUsRUFBRTtpQkFDWjthQUNKO1NBQ0o7QUFDVCxLQUFLOztJQUVELE1BQU0sRUFBRSxXQUFXO1FBQ2YsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSTtZQUN6QyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBUztZQUM5QyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVztZQUNsRCxjQUFjLEdBQUcsRUFBRTtZQUNuQixpQkFBaUIsR0FBRyxFQUFFO0FBQ2xDLFlBQVksZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQzs7UUFFL0QsU0FBUyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzFCLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1lBQzNCLElBQUksU0FBUyxFQUFFO2dCQUNYLGlCQUFpQixHQUFHLFNBQVMsQ0FBQzthQUNqQztZQUNELE9BQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUMvQyxTQUFTOztRQUVELElBQUksZUFBZSxFQUFFO1lBQ2pCLGNBQWM7Z0JBQ1Ysb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBTyxDQUFBO2FBQzNDLENBQUM7WUFDRixpQkFBaUI7Z0JBQ2Isb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFDLGVBQXVCLENBQUE7YUFDNUQsQ0FBQztBQUNkLFNBQVM7O1FBRUQsSUFBSSxTQUFTLEVBQUU7WUFDWCxjQUFjO2dCQUNWLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQWlCLENBQU8sQ0FBQTthQUMzQyxDQUFDO1lBQ0YsaUJBQWlCO2dCQUNiLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQWlCLENBQUEsRUFBQSxHQUFBLEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBQyxLQUFBLEVBQUksV0FBVyxDQUFDLElBQVksQ0FBQTthQUNwRixDQUFDO0FBQ2QsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOztRQUVRO1lBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx5QkFBMEIsQ0FBQSxFQUFBO2dCQUNyQyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUF5QixDQUFBLEVBQUE7b0JBQ25DLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBQSxFQUFXLENBQUMsdUJBQUEsRUFBdUIsQ0FBRSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFFLENBQUEsQ0FBRyxDQUFBLEVBQUE7b0JBQ3JHLFNBQVMsRUFBQztvQkFDWCxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFBLEVBQUE7d0JBQy9CLGNBQWMsRUFBQzt3QkFDZixpQkFBa0I7b0JBQ2hCLENBQUE7QUFDM0IsZ0JBQXFCLENBQUEsRUFBQTs7Z0JBRUwsb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxRQUFBLEVBQVEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyw4Q0FBQSxFQUE4QyxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxvQkFBc0IsQ0FBQSxFQUFBO29CQUMvRyxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFnQixDQUFBLENBQUcsQ0FBQTtnQkFDOUIsQ0FBQSxFQUFBO2dCQUNULG9CQUFBLFFBQU8sRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsUUFBQSxFQUFRLENBQUMsU0FBQSxFQUFTLENBQUMsa0RBQUEsRUFBa0QsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsbUJBQXFCLENBQUEsRUFBQTtvQkFDbEgsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFVLENBQUEsQ0FBRyxDQUFBO2dCQUN4QixDQUFBLEVBQUE7QUFDekIsZ0JBQWdCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0NBQWlDLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFdBQVksQ0FBQSxFQUFBLFlBQWlCLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFDLFdBQW1CLENBQUssQ0FBQSxFQUFBO0FBQ2hLOztnQkFFZ0Isb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1Q0FBd0MsQ0FBQSxFQUFBO29CQUNsRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3dCQUNyQixvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLEdBQUEsRUFBRyxDQUFDLFNBQUEsRUFBUyxDQUFDLGlCQUFBLEVBQWlCLENBQUMsYUFBQSxFQUFXLENBQUMsVUFBQSxFQUFVLENBQUMsSUFBQSxFQUFJLENBQUMsUUFBQSxFQUFRLENBQUMsZUFBQSxFQUFhLENBQUMsT0FBUSxDQUFBLEVBQUEsU0FBQSxFQUFPLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBTyxDQUFBLENBQUcsQ0FBSSxDQUFBLEVBQUE7d0JBQ3hJLG9CQUFDLFlBQVksRUFBQSxDQUFBLENBQUMsWUFBQSxFQUFZLENBQUMsZUFBQSxFQUFlLENBQUMsYUFBQSxFQUFhLENBQUUsS0FBTSxDQUFFLENBQUE7b0JBQ2pFLENBQUEsRUFBQTtvQkFDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3dCQUNBLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsV0FBQSxFQUFXLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLG1CQUFxQixDQUFBLEVBQUEsVUFBWSxDQUFBO29CQUNsRSxDQUFBLEVBQUE7b0JBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTt3QkFDQSxvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLFNBQVUsQ0FBQSxFQUFBLFNBQVcsQ0FBQTtvQkFDNUIsQ0FBQTtnQkFDSixDQUFBO1lBQ0gsQ0FBQTtVQUNSO0FBQ1YsS0FBSzs7SUFFRCxvQkFBb0IsRUFBRSxTQUFTLENBQUMsRUFBRTtRQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyxLQUFLOztJQUVELG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxFQUFFO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNuQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QyxLQUFLOztJQUVELFNBQVMsRUFBRSxXQUFXO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsVUFBVSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ1YsTUFBTSxFQUFFLFVBQVUsQ0FBQyxZQUFZLEVBQUU7WUFDakMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtTQUMvQyxDQUFDLENBQUM7QUFDWCxLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUzs7Ozs7O0FDeEgxQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0NBQzNCLFlBQVksR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUM7SUFDOUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztJQUNoRCxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUM7QUFDNUQsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRXhDLElBQUkscUNBQXFDLCtCQUFBO0lBQ3JDLGVBQWUsRUFBRSxXQUFXO1FBQ3hCLE9BQU87WUFDSCxjQUFjLEVBQUUsWUFBWTtTQUMvQixDQUFDO0FBQ1YsS0FBSzs7SUFFRCxpQkFBaUIsRUFBRSxXQUFXO1FBQzFCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbEQsS0FBSzs7SUFFRCxTQUFTLEVBQUUsV0FBVztRQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7QUFDeEQsS0FBSzs7SUFFRCxrQkFBa0IsRUFBRSxTQUFTLENBQUMsRUFBRTtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7UUFDckUsWUFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLEtBQUs7O0NBRUosb0JBQW9CLEVBQUUsU0FBUyxDQUFDLEVBQUU7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0VBQzFDLFlBQVksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLEVBQUU7O0lBRUUsTUFBTSxFQUFFLFdBQVc7UUFDZixJQUFJLElBQUksRUFBRSxPQUFPLENBQUM7UUFDbEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsS0FBSyxZQUFZLEVBQUU7WUFDNUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztZQUNqQixPQUFPLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1NBQ3JDLE1BQU07WUFDSCxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7WUFDeEIsT0FBTyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztTQUN2QztRQUNEO1lBQ0ksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxzQkFBdUIsQ0FBQSxFQUFBO2dCQUNsQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHVCQUF3QixDQUFBLEVBQUE7b0JBQ25DLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBQSxFQUFXLENBQUMsSUFBQSxFQUFJLENBQUMsT0FBQSxFQUFPLENBQUMsWUFBQSxFQUFVLENBQUMsS0FBTSxDQUFBLEVBQUE7d0JBQ3JELG9CQUFBLFFBQU8sRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsUUFBQSxFQUFRLENBQUMsU0FBQSxFQUFTLENBQUMsOENBQUEsRUFBOEMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxPQUFTLENBQUEsRUFBQTs0QkFDN0Ysb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxJQUFJLEVBQUMsQ0FBQyxhQUFBLEVBQVcsQ0FBQyxNQUFNLENBQUEsQ0FBRyxDQUFBO3dCQUN2QyxDQUFBO0FBQ2pDLHdCQUF5Qjs7b0RBRTRCO29CQUMzQixDQUFBO2dCQUNKLENBQUE7WUFDSixDQUFBO1VBQ1I7QUFDVixLQUFLOztBQUVMLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOzs7Ozs7QUMxRGpDLElBQUksSUFBSSxHQUFHO0NBQ1YsTUFBTSxFQUFFLFdBQVc7Q0FDbkIsSUFBSSxFQUFFLE1BQU07Q0FDWixPQUFPLEVBQUUsRUFBRTtBQUNaLENBQUM7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJOzs7QUNOckIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUVyQyxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUMzQjs7Q0FFQyxVQUFVLEVBQUUsSUFBSTtDQUNoQixlQUFlLEVBQUUsSUFBSTtDQUNyQixlQUFlLEVBQUUsSUFBSTtDQUNyQixZQUFZLEVBQUUsSUFBSTtDQUNsQixvQkFBb0IsRUFBRSxJQUFJO0NBQzFCLHNCQUFzQixFQUFFLElBQUk7Q0FDNUIscUJBQXFCLEVBQUUsSUFBSTtDQUMzQixlQUFlLEVBQUUsSUFBSTtDQUNyQixrQkFBa0IsRUFBRSxJQUFJO0NBQ3hCLFVBQVUsRUFBRSxJQUFJO0NBQ2hCLGVBQWUsRUFBRSxJQUFJO0NBQ3JCLGVBQWUsRUFBRSxJQUFJO0FBQ3RCLENBQUMsY0FBYyxFQUFFLElBQUk7QUFDckI7O0NBRUMsWUFBWSxFQUFFLElBQUk7Q0FDbEIsaUJBQWlCLEVBQUUsSUFBSTtDQUN2QixpQkFBaUIsRUFBRSxJQUFJO0NBQ3ZCLFlBQVksRUFBRSxJQUFJO0NBQ2xCLHFCQUFxQixFQUFFLElBQUk7Q0FDM0IsV0FBVyxFQUFFLElBQUk7Q0FDakIsZ0JBQWdCLEVBQUUsSUFBSTtDQUN0QixnQkFBZ0IsRUFBRSxJQUFJO0NBQ3RCLGNBQWMsRUFBRSxJQUFJO0NBQ3BCLG1CQUFtQixFQUFFLElBQUk7QUFDMUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJO0FBQzFCOztDQUVDLGtCQUFrQixFQUFFLElBQUk7Q0FDeEIsdUJBQXVCLEVBQUUsSUFBSTtDQUM3Qix1QkFBdUIsRUFBRSxJQUFJO0NBQzdCLGlCQUFpQixFQUFFLElBQUk7Q0FDdkIsb0JBQW9CLEVBQUUsSUFBSTtBQUMzQixDQUFDLDJCQUEyQixFQUFFLElBQUk7QUFDbEM7O0NBRUMsY0FBYyxFQUFFLElBQUk7Q0FDcEIsc0JBQXNCLEVBQUUsSUFBSTtDQUM1QixtQkFBbUIsRUFBRSxJQUFJO0NBQ3pCLG9CQUFvQixFQUFFLElBQUk7Q0FDMUIsZ0JBQWdCLEVBQUUsSUFBSTtDQUN0QixpQkFBaUIsRUFBRSxJQUFJO0NBQ3ZCLGVBQWUsRUFBRSxJQUFJO0FBQ3RCLENBQUMsZ0JBQWdCLEVBQUUsSUFBSTtBQUN2Qjs7Q0FFQyxZQUFZLEVBQUUsSUFBSTtDQUNsQixDQUFDLENBQUM7Ozs7QUNwREgsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQzs7QUFFNUMsSUFBSSxhQUFhLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzs7QUFFckM7QUFDQTtBQUNBOztFQUVFO0FBQ0YsYUFBYSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsTUFBTSxFQUFFO0NBQ2pELE1BQU0sQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDO0NBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUNEOztBQUVBO0FBQ0E7QUFDQTs7RUFFRTtBQUNGLGFBQWEsQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLE1BQU0sRUFBRTtDQUNuRCxNQUFNLENBQUMsTUFBTSxHQUFHLGVBQWUsQ0FBQztDQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxhQUFhOzs7Ozs7QUN6QjlCLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQztDQUN6RCxZQUFZLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVk7Q0FDN0MsV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztDQUNqRCxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU07QUFDbEMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZCOztBQUVBLElBQUksUUFBUSxHQUFHLEVBQUU7QUFDakIsQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7QUFDN0I7O0FBRUEsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsU0FBUyxFQUFFOztDQUVyRCxJQUFJLEVBQUUsU0FBUyxPQUFPLEVBQUU7QUFDekIsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3JCOztFQUVFLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUMxRCxFQUFFOztDQUVELFVBQVUsRUFBRSxTQUFTLE9BQU8sRUFBRTtFQUM3QixRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3ZCLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDckMsRUFBRTs7Q0FFRCxhQUFhLEVBQUUsU0FBUyxPQUFPLEVBQUU7RUFDaEMsUUFBUSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BELEVBQUU7O0NBRUQsVUFBVSxFQUFFLFdBQVc7RUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEMsRUFBRTs7Q0FFRCxVQUFVLEVBQUUsV0FBVztFQUN0QixPQUFPLFFBQVEsQ0FBQztBQUNsQixFQUFFOztBQUVGLENBQUMsa0JBQWtCLEVBQUUsV0FBVzs7RUFFOUIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7QUFDekQsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsQ0FBQztLQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0MsSUFBSTs7R0FFRCxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsQ0FBQztLQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdkQsRUFBRTs7QUFFRixDQUFDLENBQUMsQ0FBQztBQUNIOztBQUVBLDBDQUEwQztBQUMxQyxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsTUFBTSxFQUFFO0dBQ3JDLE9BQU8sTUFBTSxDQUFDLFVBQVU7RUFDekIsS0FBSyxXQUFXLENBQUMsWUFBWTtHQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDckMsR0FBRyxNQUFNOztLQUVKLEtBQUssV0FBVyxDQUFDLGlCQUFpQjtNQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUNuRCxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUNsQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDN0IsR0FBRyxNQUFNOztFQUVQLEtBQUssV0FBVyxDQUFDLGlCQUFpQjtHQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2RCxHQUFHLE1BQU07O0VBRVAsS0FBSyxXQUFXLENBQUMscUJBQXFCO0dBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztHQUNoQyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQzVDLEdBQUcsTUFBTTs7RUFFUCxLQUFLLFdBQVcsQ0FBQyxXQUFXO0dBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNwQyxHQUFHLE1BQU07O0tBRUosS0FBSyxXQUFXLENBQUMsZ0JBQWdCO01BQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ2xELFlBQVksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ3hDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM3QixHQUFHLE1BQU07O0VBRVAsS0FBSyxXQUFXLENBQUMsZ0JBQWdCO0dBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNELEdBQUcsTUFBTTs7QUFFVCxLQUFLLEtBQUssV0FBVyxDQUFDLFlBQVk7QUFDbEM7O0FBRUEsR0FBRyxNQUFNO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLEtBQUssUUFBUTs7R0FFVjtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDOzs7Ozs7O0FDckg5QixJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUM7Q0FDekQsWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZO0NBQzdDLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUM7Q0FDakQsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNO0FBQ2xDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2Qjs7QUFFQSxJQUFJLE9BQU8sR0FBRyxFQUFFOztDQUVmLGNBQWMsR0FBRyxFQUFFO0FBQ3BCLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxDQUFDLENBQUM7O0FBRXBDLElBQUksUUFBUSxHQUFHLFNBQVMsS0FBSyxFQUFFLE1BQU0sRUFBRTtDQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztDQUMzQixJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUM7O0FBRUQsSUFBSSxXQUFXLEdBQUcsU0FBUyxLQUFLLENBQUM7Q0FDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDbEMsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztDQUNuQixJQUFJLEVBQUUsSUFBSSxPQUFPLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUM7O0FBRUYsSUFBSSxXQUFXLEdBQUcsU0FBUyxLQUFLLEVBQUU7QUFDbEMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyQzs7Q0FFQyxJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztDQUNsRCxJQUFJLGFBQWEsRUFBRTtFQUNsQixhQUFhLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUNqQyxFQUFFO0FBQ0Y7O0NBRUMsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDdkQsY0FBYyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDaEMsQ0FBQzs7QUFFRCxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxTQUFTLEVBQUU7O0NBRW5ELElBQUksRUFBRSxTQUFTLE1BQU0sRUFBRTtBQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzNCO0FBQ0E7O0VBRUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7R0FDdkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0dBQ2xDO0FBQ0gsRUFBRTtBQUNGOztDQUVDLFFBQVEsRUFBRSxTQUFTLEVBQUUsRUFBRTtFQUN0QixPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQixFQUFFOztDQUVELFlBQVksRUFBRSxXQUFXO0VBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUM7RUFDdkMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLEtBQUssRUFBRTtHQUNyQyxPQUFPLEtBQUssQ0FBQztHQUNiLENBQUMsQ0FBQztBQUNMLEVBQUU7O0NBRUQsZ0JBQWdCLEVBQUUsV0FBVztFQUM1QixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDM0MsRUFBRTs7Q0FFRCxRQUFRLEVBQUUsV0FBVztFQUNwQixPQUFPO0dBQ04sTUFBTSxFQUFFLE9BQU87R0FDZixhQUFhLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFO0dBQ3RDLENBQUM7QUFDSixFQUFFOztDQUVELFVBQVUsRUFBRSxXQUFXO0VBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3RDLEVBQUU7QUFDRjtBQUNBO0FBQ0E7O0FBRUEsQ0FBQyxZQUFZLEVBQUUsU0FBUyxLQUFLLEVBQUU7O0VBRTdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDckMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xCLEVBQUU7QUFDRjtBQUNBO0FBQ0E7O0FBRUEsQ0FBQyxlQUFlLEVBQUUsU0FBUyxLQUFLLEVBQUU7O0VBRWhDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDekIsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsQ0FBQztLQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0MsSUFBSTs7R0FFRCxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsQ0FBQztLQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdkQsRUFBRTs7QUFFRixDQUFDLENBQUMsQ0FBQzs7QUFFSCwwQ0FBMEM7QUFDMUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLE1BQU0sRUFBRTs7R0FFckMsT0FBTyxNQUFNLENBQUMsVUFBVTtFQUN6QixLQUFLLFdBQVcsQ0FBQyxVQUFVO0dBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNwQyxHQUFHLE1BQU07O0tBRUosS0FBSyxXQUFXLENBQUMsZUFBZTtNQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUNqRCxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUMvQixVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDM0IsR0FBRyxNQUFNOztFQUVQLEtBQUssV0FBVyxDQUFDLGVBQWU7R0FDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEQsR0FBRyxNQUFNOztFQUVQLEtBQUssV0FBVyxDQUFDLGVBQWU7R0FDL0IsVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdEMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7RUFFUCxLQUFLLFdBQVcsQ0FBQyxrQkFBa0I7R0FDbEMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDekMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7S0FFSixLQUFLLFdBQVcsQ0FBQyxZQUFZO01BQzVCLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDN0IsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7RUFFUCxLQUFLLFdBQVcsQ0FBQyxZQUFZO01BQ3pCLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0dBQzFELFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMzQixHQUFHLE1BQU07O0FBRVQsRUFBRSxLQUFLLFdBQVcsQ0FBQyxxQkFBcUI7O0dBRXJDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdkIsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7QUFFVCxFQUFFLEtBQUssV0FBVyxDQUFDLGFBQWE7O0dBRTdCLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdkIsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7QUFFVCxFQUFFLEtBQUssV0FBVyxDQUFDLGNBQWM7O0dBRTlCLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdkIsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7QUFFVCxFQUFFLEtBQUssV0FBVyxDQUFDLFVBQVU7O0dBRTFCLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdkIsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTs7QUFFVCxFQUFFLEtBQUssV0FBVyxDQUFDLGVBQWU7QUFDbEM7O0FBRUEsR0FBRyxNQUFNOztBQUVULEVBQUUsS0FBSyxXQUFXLENBQUMsZUFBZTtBQUNsQzs7R0FFRyxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyRCxHQUFHLE1BQU07O0FBRVQsS0FBSyxRQUFROztHQUVWO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7Ozs7Ozs7QUN0TDVCLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQztDQUN6RCxZQUFZLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVk7Q0FDN0MsV0FBVyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztDQUNqRCxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU07QUFDbEMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZCOztBQUVBLElBQUksYUFBYSxHQUFHLEVBQUU7QUFDdEIsQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7O0FBRWxDLElBQUksUUFBUSxHQUFHLFNBQVMsS0FBSyxFQUFFLE1BQU0sRUFBRTtDQUN0QyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztDQUN6QixJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUM7O0FBRUQsSUFBSSxXQUFXLEdBQUcsU0FBUyxLQUFLLENBQUM7Q0FDaEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDOztBQUVGLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsU0FBUyxFQUFFOztDQUV6RCxJQUFJLEVBQUUsU0FBUyxNQUFNLEVBQUU7RUFDdEIsYUFBYSxHQUFHLE1BQU0sQ0FBQztBQUN6QixFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0NBRUMsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTyxhQUFhLENBQUM7QUFDdkIsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztDQUVDLHNCQUFzQixFQUFFLFdBQVc7RUFDbEMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEtBQUssRUFBRSx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7QUFDbkUsRUFBRTs7Q0FFRCxVQUFVLEVBQUUsV0FBVztFQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN0QyxFQUFFOztDQUVELGlCQUFpQixFQUFFLFNBQVMsRUFBRSxDQUFDO0tBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzQyxJQUFJOztHQUVELG9CQUFvQixFQUFFLFNBQVMsRUFBRSxDQUFDO0tBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN2RCxFQUFFOztBQUVGLENBQUMsQ0FBQyxDQUFDOztBQUVILDBDQUEwQztBQUMxQyxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsTUFBTSxFQUFFO0dBQ3JDLE9BQU8sTUFBTSxDQUFDLFVBQVU7RUFDekIsS0FBSyxXQUFXLENBQUMsa0JBQWtCO0dBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM1QyxHQUFHLE1BQU07O0tBRUosS0FBSyxXQUFXLENBQUMsdUJBQXVCO01BQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0dBQ3pELGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0dBQzlCLHlCQUF5QixHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7R0FDakQsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsR0FBRyxNQUFNOztFQUVQLEtBQUssV0FBVyxDQUFDLHVCQUF1QjtHQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5RCxHQUFHLE1BQU07O0VBRVAsS0FBSyxXQUFXLENBQUMsaUJBQWlCO0dBQ2pDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdkIsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsR0FBRyxNQUFNOztFQUVQLEtBQUssV0FBVyxDQUFDLG9CQUFvQjtHQUNwQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQzFCLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLEdBQUcsTUFBTTs7RUFFUCxLQUFLLFdBQVcsQ0FBQywyQkFBMkI7R0FDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztHQUN4Qyx5QkFBeUIsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0dBQzVDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLEdBQUcsTUFBTTs7QUFFVCxLQUFLLFFBQVE7O0dBRVY7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDOzs7Ozs7O0FDOUZsQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUM7SUFDdEQsWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZO0lBQzdDLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUM7SUFDakQsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNO0FBQ3JDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQjs7QUFFQSxJQUFJLFNBQVMsR0FBRyxLQUFLO0lBQ2pCLGFBQWEsR0FBRyxLQUFLO0lBQ3JCLFFBQVEsR0FBRyxLQUFLO0lBQ2hCLGFBQWEsR0FBRyxLQUFLO0lBQ3JCLFlBQVksR0FBRyxLQUFLO0lBQ3BCLGFBQWEsR0FBRyxJQUFJO0FBQ3hCLElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQzs7QUFFbkMsSUFBSSxXQUFXLEdBQUcsU0FBUyxJQUFJLEVBQUU7SUFDN0IsU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdkIsQ0FBQztBQUNEOztBQUVBLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLFNBQVMsRUFBRTs7SUFFN0MsWUFBWSxFQUFFLFdBQVc7UUFDckIsT0FBTztZQUNILElBQUksRUFBRSxTQUFTO1NBQ2xCLENBQUM7QUFDVixLQUFLOztJQUVELGdCQUFnQixFQUFFLFdBQVc7UUFDekIsT0FBTztZQUNILElBQUksRUFBRSxhQUFhO1NBQ3RCLENBQUM7QUFDVixLQUFLOztJQUVELHNCQUFzQixFQUFFLFdBQVc7UUFDL0IsT0FBTztZQUNILGNBQWMsRUFBRSxlQUFlO1NBQ2xDLENBQUM7QUFDVixLQUFLOztJQUVELGdCQUFnQixFQUFFLFdBQVc7UUFDekIsT0FBTztZQUNILE9BQU8sRUFBRSxRQUFRO1NBQ3BCLENBQUM7QUFDVixLQUFLOztJQUVELHFCQUFxQixFQUFFLFdBQVc7UUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkMsT0FBTztZQUNILFlBQVksRUFBRSxhQUFhO1NBQzlCLENBQUM7QUFDVixLQUFLOztJQUVELGVBQWUsRUFBRSxXQUFXO1FBQ3hCLE9BQU87WUFDSCxXQUFXLEVBQUUsWUFBWTtZQUN6QixLQUFLLEVBQUUsYUFBYTtTQUN2QjtBQUNULEtBQUs7O0lBRUQsVUFBVSxFQUFFLFdBQVc7UUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDNUMsS0FBSzs7SUFFRCxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDOUMsS0FBSzs7SUFFRCxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUQsS0FBSzs7QUFFTCxDQUFDLENBQUMsQ0FBQzs7QUFFSCwwQ0FBMEM7QUFDMUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLE1BQU0sRUFBRTtBQUN4QyxJQUFJLE9BQU8sTUFBTSxDQUFDLFVBQVU7O1FBRXBCLEtBQUssV0FBVyxDQUFDLGNBQWM7WUFDM0IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsWUFBWSxNQUFNOztRQUVWLEtBQUssV0FBVyxDQUFDLGNBQWM7WUFDM0IsZUFBZSxFQUFFLENBQUM7WUFDbEIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7UUFFVixLQUFLLFdBQVcsQ0FBQyxzQkFBc0I7WUFDbkMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDL0IsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7UUFFVixLQUFLLFdBQVcsQ0FBQyxtQkFBbUI7WUFDaEMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNoQixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsWUFBWSxNQUFNOztBQUVsQixRQUFRLEtBQUssV0FBVyxDQUFDLG9CQUFvQjs7WUFFakMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUM3QixZQUFZLE1BQU07O1FBRVYsS0FBSyxXQUFXLENBQUMsZ0JBQWdCO1lBQzdCLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDckIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7QUFFbEIsUUFBUSxLQUFLLFdBQVcsQ0FBQyxpQkFBaUI7O1lBRTlCLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDbEMsWUFBWSxNQUFNOztRQUVWLEtBQUssV0FBVyxDQUFDLGVBQWU7WUFDNUIsWUFBWSxHQUFHLElBQUksQ0FBQztZQUNwQixhQUFhLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUM3QixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsWUFBWSxNQUFNOztRQUVWLEtBQUssV0FBVyxDQUFDLGdCQUFnQjtZQUM3QixZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O1FBRVYsS0FBSyxXQUFXLENBQUMsZ0JBQWdCO1lBQzdCLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDakIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7UUFFVixLQUFLLFdBQVcsQ0FBQyxVQUFVO1lBQ3ZCLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDdEIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7QUFFbEIsUUFBUSxRQUFROztHQUViO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7Ozs7Ozs7QUMzSXpCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDeEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDckIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztJQUNwQyxhQUFhLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDO0FBQ3RELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFckMsbURBQW1EO0FBQ25ELGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7QUFFckIsa0NBQWtDO0FBQ2xDLHFDQUFxQzs7QUFFckMseURBQXlEO0FBQ3pELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsV0FBVztDQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7Q0FDbkMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUM7O0FBRUgsS0FBSyxDQUFDLE1BQU07Q0FDWCxvQkFBQyxHQUFHLEVBQUEsSUFBQSxDQUFHLENBQUE7Q0FDUCxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHRhbGxfY29udGVudDogJy9jb250ZW50L3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBDb250ZW50QWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGNvbnRlbnQgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKi9cblx0bG9hZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudHMoKScpO1xuXHRcdC8vIGRpc3BhdGNoIGFuIGFjdGlvbiBpbmRpY2F0aW5nIHRoYXQgd2UncmUgbG9hZGluZyB0aGUgY29udGVudFxuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BREQsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoY29udGVudCksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdHVzZXJzX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUUsXG5cdHZpc2libGVfZnJhbWVzOiAnL2ZyYW1lcy92aXNpYmxlP3Y9MSdcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy51c2Vyc19mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lczogJywgZnJhbWVzKTtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkUsXG5cdFx0XHRcdFx0ZnJhbWVzOiBmcmFtZXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdC8vIGxvYWQgZmFpbHVyZSwgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZldGNoIGFsbCBmcmFtZXMgbWFya2VkICd2aXNpYmxlJ1xuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRWaXNpYmxlRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRVxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy52aXNpYmxlX2ZyYW1lcylcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnZnJhbWVzOiAnLCBmcmFtZXMpO1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNlbGVjdCBhIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGZyYW1lXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ3NlbGVjdCcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VMRUNULFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgY29udGVudCBvbiB0aGUgc2VsZWN0ZWQgZnJhbWUuXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29udGVudFxuXHQgKi9cblx0dXBkYXRlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdHZhciBmcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuICAgICAgICBmcmFtZS5jdXJyZW50X2NvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lOiBmcmFtZVxuICAgICAgICB9O1xuICAgICAgICBTb2NrZXIuc2VuZCgnZnJhbWU6dXBkYXRlX2ZyYW1lJywgZGF0YSk7XG5cdH0sXG5cbiAgICBtaXJyb3JGcmFtZTogZnVuY3Rpb24obWlycm9yZWRfZnJhbWUpIHtcbiAgICAgICAgdmFyIGZyYW1lID0gRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCk7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgZnJhbWVfaWQ6IGZyYW1lLl9pZCxcbiAgICAgICAgICAgIG1pcnJvcmVkX2ZyYW1lX2lkOiBtaXJyb3JlZF9mcmFtZS5faWRcbiAgICAgICAgfTtcbiAgICAgICAgU29ja2VyLnNlbmQoJ2ZyYW1lOm1pcnJvcl9mcmFtZScsIGRhdGEpXG4gICAgfSxcblxuXHRzYXZlRnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkUsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblxuICAgICAgICAvLyBoYWNrIHNvIHRoYXQgc2VsZWN0ZWQgZG9lc24ndCBnZXQgcGVyc2lzdGVkXG4gICAgICAgIGZyYW1lLnNlbGVjdGVkID0gZmFsc2U7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9mcmFtZXMvJytmcmFtZS5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZnJhbWUpLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0RPTkUsXG5cdFx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9GQUlMLFxuXHRcdFx0XHRmcmFtZTogZnJhbWVcblx0XHRcdH0pO1xuICAgICAgICB9KS5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmcmFtZS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZURpc2Nvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgZGlzY29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29udGVudFVwZGF0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIENvbnRlbnQgdXBkYXRlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG4gICAgZnJhbWVVcGRhdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgVXBkYXRlZDogJywgZnJhbWUpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9VUERBVEVELFxuICAgICAgICAgICAgZnJhbWU6IGZyYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBmcmFtZU1pcnJvcmVkOiBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgbWlycm9yZWQ6ICcsIGZyYW1lKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTUlSUk9SRUQsXG4gICAgICAgICAgICBmcmFtZTogZnJhbWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRzZXR1cDogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBmcmFtZSA9IGRhdGEuZnJhbWU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGcmFtZSBTZXR1cCcsIGZyYW1lKTtcbiAgICAgICAgLy8gdGhpcyBpcyBhIGxpdHRsZSB3ZWlyZCAtLSB3aHkgaXNuJ3Qgc2V0dXAganVzdCBwYXJ0IG9mIHRoZSBpbml0aWFsXG4gICAgICAgIC8vIGNvbm5lY3RlZCBldmVudD9cbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWFsbHk/IERvZXMgdGhlIHZpZXcgZGltZW5zaW9uIG5lZWQgdG8gYmUgcGFydCBvZiB0aGUgc3RhdGU/XG4gICAgICogUHJvYmFibGUgbm90LiBOb3QgdXNlZCBwcmVzZW50bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IHcgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gaCBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBzZXR1cEZyYW1lVmlldzogZnVuY3Rpb24odywgaCkge1xuICAgIFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NFVFVQX1ZJRVcsXG5cdFx0XHR3OiB3LFxuXHRcdFx0aDogaFxuXHRcdH0pO1xuICAgIH0sXG5cbiAgICBzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGZyYW1lX2lkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZV9pZCcsIGZyYW1lX2lkKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0xJREVfQ0hBTkdFRCxcblx0XHRcdGZyYW1lX2lkOiBmcmFtZV9pZFxuXHRcdH0pO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUFjdGlvbnM7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdHVzZXJzX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUUsXG5cdHB1YmxpY19mcmFtZXM6ICcvZnJhbWVzL3Zpc2libGU/dj0xJ1xufVxuXG52YXIgUHVibGljRnJhbWVBY3Rpb25zID0ge1xuXG5cdC8qKlxuXHQgKiBGZXRjaCBhbGwgZnJhbWVzIG1hcmtlZCAndmlzaWJsZSdcblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRsb2FkUHVibGljRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5wdWJsaWNfZnJhbWVzKVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXM6ICcsIGZyYW1lcyk7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuUFVCTElDX0ZSQU1FU19MT0FEX0RPTkUsXG5cdFx0XHRcdFx0ZnJhbWVzOiBmcmFtZXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdC8vIGxvYWQgZmFpbHVyZSwgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuUFVCTElDX0ZSQU1FU19MT0FEX0ZBSUwsXG5cdFx0XHRcdFx0ZXJyOiBlcnJcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0fSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBzZWxlY3RlZCBwdWJsaWMgZnJhbWUgc2xpZGUgaGFzIGNoYW5nZWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBmcmFtZV9pZFxuICAgICAqL1xuICAgIHNsaWRlQ2hhbmdlZDogZnVuY3Rpb24oZnJhbWVfaWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lX2lkJywgZnJhbWVfaWQpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5QVUJMSUNfRlJBTUVTX1NMSURFX0NIQU5HRUQsXG5cdFx0XHRmcmFtZV9pZDogZnJhbWVfaWRcblx0XHR9KTtcblx0fVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHVibGljRnJhbWVBY3Rpb25zO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcbiAgICBPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKVxuXG52YXIgVUlBY3Rpb25zID0ge1xuXG4gICAgdG9nZ2xlTWVudTogZnVuY3Rpb24ob3Blbikge1xuICAgICAgICAvLyBpZiBvcGVuIHRydWUsIG9wZW4uIGlmIGZhbHNlLCBjbG9zZS5cbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFLFxuICAgICAgICAgICAgb3Blbjogb3BlblxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlU2V0dGluZ3M6IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX1NFVFRJTkdTX1RPR0dMRSxcbiAgICAgICAgICAgIG9wZW46IG9wZW5cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldFNlbGVjdGlvblBhbmVsOiBmdW5jdGlvbihwYW5lbCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfU0VUX1NFTEVDVElPTl9QQU5FTCxcbiAgICAgICAgICAgIHBhbmVsOiBwYW5lbFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb3BlbkFkZENvbnRlbnRNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdvcGVuQWRkQ29udGVudE1vZGFsJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9PUEVOX0FERF9DT05URU5UXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhZGRDb250ZW50TW9kYWxDbG9zZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnYWRkQ29udGVudE1vZGFsQ2xvc2VkJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9DTE9TRV9BRERfQ09OVEVOVFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb3BlblNldHRpbmdzTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnb3BlblNldHRpbmdzTW9kYWwnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX09QRU5fU0VUVElOR1NcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldHRpbmdzTW9kYWxDbG9zZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnc2V0dGluZ3NNb2RhbENsb3NlZCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfQ0xPU0VfU0VUVElOR1NcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5QcmV2aWV3OiBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9QUkVWSUVXLFxuICAgICAgICAgICAgZnJhbWU6IGZyYW1lXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGNsb3NlUHJldmlldzogZnVuY3Rpb24oKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9DTE9TRV9QUkVWSUVXXG4gICAgICAgIH0pXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVUlBY3Rpb25zOyIsIlNvY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgX3NlbGYgPSB7fSxcbiAgICAgICAgX2V2ZW50SGFuZGxlcnMgPSB7fSxcbiAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlLFxuICAgICAgICBfb3B0cyA9IHtcbiAgICAgICAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNoZWNrSW50ZXJ2YWw6IDEwMDAwXG4gICAgICAgIH0sXG4gICAgICAgIF91cmwsXG4gICAgICAgIF93cyxcbiAgICAgICAgX3RpbWVyO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB1cmwgIFRoZSBzZXJ2ZXIgVVJMLlxuICAgICAqIEBwYXJhbSAge29iamVjdH0gb3B0cyBPcHRpb25hbCBzZXR0aW5nc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jb25uZWN0KHVybCwgb3B0cykge1xuICAgICAgICBfdXJsID0gdXJsO1xuICAgICAgICBpZiAob3B0cykgX2V4dGVuZChfb3B0cywgb3B0cyk7XG4gICAgICAgIF93cyA9IG5ldyBXZWJTb2NrZXQodXJsKTtcblxuICAgICAgICBfd3Mub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBvcGVuZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uT3BlbikgX29wdHMub25PcGVuKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIGNsb3NlZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uQ2xvc2UpIF9vcHRzLm9uQ2xvc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBtZXNzYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIGV2ZW50IGhhbmRsZXIsIGNhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfZXZlbnRIYW5kbGVyc1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXVtpXShkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyBcIiBldmVudCBub3QgaGFuZGxlZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9vcHRzLmtlZXBBbGl2ZSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChfdGltZXIpO1xuICAgICAgICAgICAgX3RpbWVyID0gc2V0SW50ZXJ2YWwoX2NoZWNrQ29ubmVjdGlvbiwgX29wdHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vbihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb2ZmKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gX2V2ZW50SGFuZGxlcnNbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGFuIGV2ZW50LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gbmFtZSBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBkYXRhIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9zZW5kKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC4gSWYgbm90LCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jaGVja0Nvbm5lY3Rpb24oKSB7XG4gICAgICAgIGlmICghX2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgX2Nvbm5lY3QoX3VybCwgX29wdHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXRpbGl0eSBmdW5jdGlvbiBmb3IgZXh0ZW5kaW5nIGFuIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9leHRlbmQob2JqKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cblxuICAgIF9zZWxmLm9uID0gX29uO1xuICAgIF9zZWxmLm9mZiA9IF9vZmY7XG4gICAgX3NlbGYuc2VuZCA9IF9zZW5kO1xuICAgIF9zZWxmLmNvbm5lY3QgPSBfY29ubmVjdDtcbiAgICByZXR1cm4gX3NlbGY7XG59KSgpO1xuXG4vLyBDT01NT04uSlNcbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IFNvY2tlcjsiLCJ2YXIgc3NtID0gcmVxdWlyZSgnc3NtJylcblx0Y29uZiA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbmZ1bmN0aW9uIF9pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudCgpIHtcblx0Y29uc29sZS5sb2coJ19pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudCcpO1xuXG5cdF9zZXR1cFNjcmVlblNpemUoKTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICd4cycsXG5cdCAgICBtYXhXaWR0aDogNzY3LFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgeHMnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ3hzJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnc20nLFxuXHQgICAgbWluV2lkdGg6IDc2OCxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIHNtJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdzbSc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ21kJyxcblx0ICAgIG1pbldpZHRoOiA5OTIsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBtZCcpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnbWQnO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdsZycsXG5cdCAgICBtaW5XaWR0aDogMTIwMCxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIGxnJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdsZyc7XG5cdCAgICB9XG5cdH0pO1x0XG5cblx0c3NtLnJlYWR5KCk7XG59XG5cbmZ1bmN0aW9uIF9zZXR1cFNjcmVlblNpemUoKSB7XG5cdGNvbmYud1cgPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0Y29uZi53SCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0Y29uc29sZS5sb2coY29uZik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnRcbn1cblxuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKTtcblxudmFyIEFkZENvbnRlbnRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGhhbmRsZUZvcm1TdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgdXJsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkudmFsdWU7XG5cbiAgICAgICAgaWYgKCF1cmwpIHJldHVybjtcblxuICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgdXNlcnM6IFtPRl9VU0VSTkFNRV1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2coJ3N1Ym1pdHRpbmcgY29udGVudDogJywgY29udGVudCk7XG4gICAgICAgIENvbnRlbnRBY3Rpb25zLmFkZENvbnRlbnQoY29udGVudCk7XG5cbiAgICAgICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkudmFsdWUgPSAnJztcbiAgICAgICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkuZm9jdXMoKTtcbiAgICB9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBoaWRkZW4teHMgYWRkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZVwiIGlkPVwiYWRkLWZvcm1cIiBvblN1Ym1pdD17dGhpcy5oYW5kbGVGb3JtU3VibWl0fT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGxhYmVsIGZvcj1cIlNlbmRUb1VzZXJcIj5VUkw8L2xhYmVsPiAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJVUkxcIiBwbGFjZWhvbGRlcj1cImVudGVyIFVSTFwiIHJlZj1cIlVSTFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdCBidG4tYWRkLWNvbnRlbnRcIiBocmVmPVwiI2FkZC1jb250ZW50XCIgaWQ9XCJhZGQtY29udGVudC1idXR0b25cIj5BZGQgQ29udGVudDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRkQ29udGVudEZvcm07IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0Q29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBBZGRDb250ZW50TW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGFkZE9wZW46IGZhbHNlXG5cdFx0fVxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZygnaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgICAgIFx0dGhhdC5fcmVzZXRGb3JtKCk7XG4gICAgICAgIFx0VUlBY3Rpb25zLmFkZENvbnRlbnRNb2RhbENsb3NlZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBWZXJ0aWNhbGx5IGNlbnRlciBtb2RhbHNcblx0XHQvKiBjZW50ZXIgbW9kYWwgKi9cblx0XHRmdW5jdGlvbiBjZW50ZXJNb2RhbHMoKXtcblx0XHQgICAgJCgnLm1vZGFsJykuZWFjaChmdW5jdGlvbihpKXtcblx0XHQgICAgICAgIHZhciAkY2xvbmUgPSAkKHRoaXMpLmNsb25lKCkuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJykuYXBwZW5kVG8oJ2JvZHknKTtcblx0XHQgICAgICAgIHZhciB0b3AgPSBNYXRoLnJvdW5kKCgkY2xvbmUuaGVpZ2h0KCkgLSAkY2xvbmUuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5oZWlnaHQoKSkgLyAyKTtcblx0XHQgICAgICAgIHRvcCA9IHRvcCA+IDAgPyB0b3AgOiAwO1xuXHRcdCAgICAgICAgJGNsb25lLnJlbW92ZSgpO1xuXHRcdCAgICAgICAgJCh0aGlzKS5maW5kKCcubW9kYWwtY29udGVudCcpLmNzcyhcIm1hcmdpbi10b3BcIiwgdG9wKTtcblx0XHQgICAgfSk7XG5cdFx0fVxuXHRcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub24oJ3Nob3cuYnMubW9kYWwnLCBjZW50ZXJNb2RhbHMpO1xuXHRcdC8vICQod2luZG93KS5vbigncmVzaXplJywgY2VudGVyTW9kYWxzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVub3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9mZignaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgfSxcblxuXHRfaGFuZGxlQWRkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVybCA9IHRoaXMucmVmcy51cmwuZ2V0RE9NTm9kZSgpLnZhbHVlLFxuXHRcdFx0dGFncyA9IHRoaXMucmVmcy50YWdzLmdldERPTU5vZGUoKS52YWx1ZTtcblxuXHRcdGlmICghdXJsLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRhZ3MgPSB0YWdzLnRyaW0oKS5zcGxpdCgnIycpO1xuXG5cdFx0Xy5yZW1vdmUodGFncywgZnVuY3Rpb24odGFnKSB7XG5cdFx0XHRyZXR1cm4gdGFnLnRyaW0oKSA9PSAnJztcblx0XHR9KTtcblxuXHRcdF8uZWFjaCh0YWdzLCBmdW5jdGlvbih0YWcsIGkpIHtcblx0XHRcdHRhZ3NbaV0gPSB0YWcudHJpbSgpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc29sZS5sb2codGFncyk7XG5cblx0XHR2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgdXNlcnM6IFtPRl9VU0VSTkFNRV0sXG4gICAgICAgICAgICB0YWdzOiB0YWdzXG4gICAgICAgIH07XG5cdFx0Q29udGVudEFjdGlvbnMuYWRkQ29udGVudChjb250ZW50KTtcblxuXHR9LFxuXG5cdF9oYW5kbGVPbkZvY3VzOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIGVsID0gZS5jdXJyZW50VGFyZ2V0O1xuXHRcdGlmIChlbC52YWx1ZS50cmltKCkgPT0gJycpIHtcblx0XHRcdGVsLnZhbHVlID0gJyMnO1xuXHRcdH1cblx0fSxcblxuXHRfaGFuZGxlVGFnc0NoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciBlbCA9IGUuY3VycmVudFRhcmdldCxcblx0XHRcdHZhbCA9IGVsLnZhbHVlO1xuXG5cdFx0aWYgKGVsLnZhbHVlID09ICcnKSB7XG5cdFx0XHRlbC52YWx1ZSA9ICcjJztcblx0XHR9XG5cblx0XHRpZiAodmFsW3ZhbC5sZW5ndGgtMV0gPT09ICcgJykge1xuXHRcdFx0ZWwudmFsdWUgKz0gJyMnXG5cdFx0fVxuXHR9LFxuXG5cdF9oYW5kbGVLZXlEb3duOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGUuY3VycmVudFRhcmdldC52YWx1ZTtcblx0XHRpZiAodmFsWzBdICE9ICcjJykge1xuXHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsID0gJyMnICsgdmFsO1xuXG5cdFx0fVxuXHRcdGlmIChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgdmFsICE9PSAnIycpIHtcblx0XHRcdGlmICh2YWxbdmFsLmxlbmd0aCAtIDFdID09PSAnIycpIHtcblx0XHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsLnN1YnN0cmluZygwLCB2YWwubGVuZ3RoIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9yZXNldEZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVmcy51cmwuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdFx0dGhpcy5yZWZzLnRhZ3MuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldEFkZE1vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuYWRkT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1hZGQtY29udGVudFwiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5BZGQgQ29udGVudDwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5FbnRlciBVUkw8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWlucHV0XCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0PGlucHV0IHJlZj1cInVybFwiIHR5cGU9XCJ1cmxcIiBhdXRvQ2FwaXRhbGl6ZT1cIm9mZlwiIHBsYWNlaG9sZGVyPVwiaHR0cDovLy4uLlwiIC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0XHQgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgZGVzY3JpcHRpb24gd2l0aCB0YWdzPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ0YWdzXCIgdHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRhdXRvQ2FwaXRhbGl6ZT1cIm9mZlwiXG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHBsYWNlaG9sZGVyPVwiI3Bob3RvICNSb2RjaGVua28gIzE5NDFcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkZvY3VzPXt0aGlzLl9oYW5kbGVPbkZvY3VzfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlVGFnc0NoYW5nZX1cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25LZXlEb3duPXt0aGlzLl9oYW5kbGVLZXlEb3dufSAvPlxuXHRcdFx0XHQgICAgXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENvbnRlbnR9IHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLWFkZC1jb250ZW50XCI+XG5cdFx0XHRcdCAgICBcdFx0XHRBZGQgVG8gQ29sbGVjdGlvblxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRNb2RhbDtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblxuXHROYXYgPSByZXF1aXJlKCcuL05hdi5qcycpLFxuXHRTaW1wbGVOYXYgPSByZXF1aXJlKCcuL1NpbXBsZU5hdi5qcycpLFxuXHRGcmFtZSA9IHJlcXVpcmUoJy4vRnJhbWUuanMnKSxcblx0VHJhbnNmZXJCdXR0b25zID0gcmVxdWlyZSgnLi9UcmFuc2ZlckJ1dHRvbnMuanMnKSxcblx0QWRkQ29udGVudEZvcm0gPSByZXF1aXJlKCcuL0FkZENvbnRlbnRGb3JtLmpzJyksXG5cdENvbnRlbnRMaXN0ID0gcmVxdWlyZSgnLi9Db250ZW50TGlzdC5qcycpLFxuXHRQdWJsaWNGcmFtZXNMaXN0ID0gcmVxdWlyZSgnLi9QdWJsaWNGcmFtZXNMaXN0LmpzJyksXG5cdEZvb3Rlck5hdiA9IHJlcXVpcmUoJy4vRm9vdGVyTmF2LmpzJyksXG5cdERyYXdlciA9IHJlcXVpcmUoJy4vRHJhd2VyLmpzJyksXG5cdEFkZENvbnRlbnRNb2RhbCA9IHJlcXVpcmUoJy4vQWRkQ29udGVudE1vZGFsLmpzJyksXG5cdFNldHRpbmdzTW9kYWwgPSByZXF1aXJlKCcuL1NldHRpbmdzTW9kYWwuanMnKSxcblx0RnJhbWVQcmV2aWV3ID0gcmVxdWlyZSgnLi9GcmFtZVByZXZpZXcuanMnKSxcblxuXHRBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblxuXHRTb2NrZXIgPSByZXF1aXJlKCcuLi9hcGkvU29ja2VyJyksXG5cblx0Y29uZiA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG4vKipcbiAqIFRoZSBBcHAgaXMgdGhlIHJvb3QgY29tcG9uZW50IHJlc3BvbnNpYmxlIGZvcjpcbiAqIC0gc2V0dGluZyB1cCBzdHJ1Y3R1cmUgb2YgY2hpbGQgY29tcG9uZW50c1xuICpcbiAqIEluZGl2aWR1YWwgY29tcG9uZW50cyByZWdpc3RlciBmb3IgU3RvcmUgc3RhdGUgY2hhbmdlIGV2ZW50c1xuICovXG52YXIgQXBwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCFnbG9iYWwuT0ZfVVNFUk5BTUUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdPRl9VU0VSTkFNRSBub3QgZGVmaW5lZC4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRTb2NrZXIuY29ubmVjdChcIndzOi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArIFwiL2FkbWluL3dzL1wiICsgT0ZfVVNFUk5BTUUpO1xuXG5cdFx0Ly8gVE9ETzogdGhlc2Ugc2hvdWxkIG1vdmUgdG8gdGhlIGNvcnJlc3BvbmRpbmcgQWN0aW9ucyBjcmVhdG9yIChlLmcuIEZyYW1lQWN0aW9ucylcblx0XHRTb2NrZXIub24oJ2ZyYW1lOmNvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6ZGlzY29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lRGlzY29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpmcmFtZV91cGRhdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lQ29udGVudFVwZGF0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOnNldHVwJywgRnJhbWVBY3Rpb25zLnNldHVwKTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCAkKCcubmF2LWZvb3RlcicpLmhlaWdodCgpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMubmF2Rm9vdGVyKS5vZmZzZXRIZWlnaHQpO1xuXHRcdFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhbmVsID0gVUlTdG9yZS5nZXRTZWxlY3Rpb25QYW5lbFN0YXRlKCk7XG5cdFx0dGhpcy5zZXRTdGF0ZShwYW5lbCk7XG5cdH0sXG5cbiAgXHRyZW5kZXI6IGZ1bmN0aW9uKCl7XG4gIFx0XHR2YXIgY29udGVudExpc3QgPSA8Q29udGVudExpc3QgLz4sXG4gIFx0XHRcdGZyYW1lTGlzdCA9IDxQdWJsaWNGcmFtZXNMaXN0IC8+O1xuICBcdFx0dmFyIHNlbGVjdGlvblBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbCA9PT0gJ2NvbGxlY3Rpb24nID8gY29udGVudExpc3QgOiBmcmFtZUxpc3Q7XG5cdCAgICByZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRhaW5lciBhcHAnPlxuXHRcdFx0XHQ8U2ltcGxlTmF2IC8+XG5cdFx0XHRcdDxGcmFtZSAvPlxuXHRcdFx0XHQ8VHJhbnNmZXJCdXR0b25zIC8+XG5cdFx0XHRcdDxkaXY+e3NlbGVjdGlvblBhbmVsfTwvZGl2PlxuXHRcdFx0XHQ8Rm9vdGVyTmF2IHJlZj1cIm5hdkZvb3RlclwiLz5cblx0XHRcdFx0PERyYXdlciAvPlxuXHRcdFx0XHQ8U2V0dGluZ3NNb2RhbCAvPlxuXHRcdFx0XHQ8QWRkQ29udGVudE1vZGFsIC8+XG5cdFx0XHRcdDxGcmFtZVByZXZpZXcgLz5cblx0XHRcdDwvZGl2PlxuXHQgICAgKVxuICBcdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKTtcblxudmFyIENvbnRlbnRJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRfaGFuZGxlU2xpZGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjbGljaycpO1xuXHRcdC8vIGJpdCBvZiBhIGhhY2sgLS0gc28gd2UgY2FuIHVzZSB0aGUgRnJhbWVQcmV2aWV3XG4gICAgICAgIC8vIGNvbXBvbmVudCBoZXJlLiBQcmV2aWV3IHNob3VsZCBnZXQgcmVmYWN0b3JlZCB0byBiZSBtb3JlIGdlbmVyaWMuXG5cdFx0VUlBY3Rpb25zLm9wZW5QcmV2aWV3KHtcbiAgICAgICAgICAgIGN1cnJlbnRfY29udGVudDogdGhpcy5wcm9wcy5jb250ZW50XG4gICAgICAgIH0pO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZW50ID0gdGhpcy5wcm9wcy5jb250ZW50O1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1zbGlkZSBjb250ZW50LXNsaWRlXCIgZGF0YS1jb250ZW50aWQ9e2NvbnRlbnQuX2lkfSBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTbGlkZUNsaWNrfT5cblx0XHRcdFx0PGltZyBzcmM9e2NvbnRlbnQudXJsfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudEl0ZW07XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuICAgIENvbnRlbnRJdGVtID0gcmVxdWlyZSgnLi9Db250ZW50SXRlbScpLFxuICAgIENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuICAgIFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG4gICAgQ29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIENvbnRlbnRMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ29udGVudEFjdGlvbnMubG9hZENvbnRlbnQoKTtcbiAgICAgICAgQ29udGVudFN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjb21wb25lbnREaWRVbm1vdW50Jyk7XG4gICAgICAgIENvbnRlbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjb250ZW50OiBDb250ZW50U3RvcmUuZ2V0Q29udGVudCgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRPRE86IGJldHRlciBSZWFjdCBpbnRlZ3JhdGlvbiBmb3IgdGhlIHN3aXBlclxuXG4gICAgICAgIHRoaXMuX2luaXRTbGlkZXIoKTtcblxuICAgICAgICB2YXIgY29udGVudF9pZCA9IHRoaXMuc3RhdGUuY29udGVudFswXS5faWQ7XG4gICAgfSxcblxuICAgIF9pbml0U2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG4gICAgICAgIGlmICh0aGlzLnN3aXBlcikge1xuICAgICAgICAgICAgdGhpcy5zd2lwZXIuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3dpcGVyID0gbmV3IFN3aXBlcihlbCwge1xuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogMyxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogNTAsXG4gICAgICAgICAgICBjZW50ZXJlZFNsaWRlczogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGZyZWVNb2RlOiB0cnVlLFxuICAgICAgICAgICAgLy8gZnJlZU1vZGVNb21lbnR1bTogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGZyZWVNb2RlTW9tZW50dW1SYXRpbzogMC41LFxuICAgICAgICAgICAgLy8gZnJlZU1vZGVTdGlja3k6dHJ1ZSxcbiAgICAgICAgICAgIC8vIGxvb3A6IHRydWUsXG4gICAgICAgICAgICAvLyBsb29wZWRTbGlkZXM6IDUsXG4gICAgICAgICAgICBpbml0aWFsU2xpZGU6IDAsXG4gICAgICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG4gICAgICAgICAgICBvblNsaWRlQ2hhbmdlRW5kOiB0aGlzLl9zbGlkZUNoYW5nZUVuZFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hlbiB3ZSBjaGFuZ2Ugc2xpZGVzLCB1cGRhdGUgdGhlIHNlbGVjdGVkIGNvbnRlbnRcbiAgICAgKiBpbiB0aGUgQ29udGVudFN0b3JlXG4gICAgICogQHBhcmFtICB7U3dpcGVyfSBzd2lwZXJcbiAgICAgKi9cbiAgICBfc2xpZGVDaGFuZ2VFbmQ6IGZ1bmN0aW9uKHN3aXBlcikge1xuICAgICAgICB2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICAgICAgICAgICAgY29udGVudF9pZCA9IHNsaWRlLmRhdGFzZXQuY29udGVudGlkO1xuICAgICAgICBjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgY29udGVudF9pZCk7XG4gICAgICAgIENvbnRlbnRBY3Rpb25zLnNsaWRlQ2hhbmdlZChjb250ZW50X2lkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT25jZSB0aGUgY29tcG9uZW50IGhhcyBsb2FkZWQgd2UgY2FuIGFwcHJvcHJpYXRlbHlcbiAgICAgKiBhZGp1c3QgdGhlIHNpemUgb2YgdGhlIHNsaWRlciBjb250YWluZXIuXG4gICAgICovXG4gICAgX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMnKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpXG4gICAgICAgICAgICBoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHBhZGRpbmcgPSA0MCxcbiAgICAgICAgICAgIG5ld0ggPSBoIC0gcGFkZGluZztcblxuICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gbmV3SCsncHgnO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBjb250ZW50SXRlbXMgPSB0aGlzLnN0YXRlLmNvbnRlbnQubWFwKGZ1bmN0aW9uIChjb250ZW50SXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8Q29udGVudEl0ZW0gY29udGVudD17Y29udGVudEl0ZW19IGtleT17Y29udGVudEl0ZW0uX2lkfSAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGVudEl0ZW1zLnJldmVyc2UoKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItb3V0ZXItY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjb250ZW50SXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50TGlzdDtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItbGVmdCdcblx0XHR9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0VUlBY3Rpb25zLnRvZ2dsZU1lbnUoZmFsc2UpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRNZW51U3RhdGUoKSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBiYXNlQ2xhc3MgPSAndmlzaWJsZS14cyBtZW51LWRyYXdlcic7XG5cdFx0dmFyIG9wZW5DbGFzcyA9IHRoaXMuc3RhdGUub3BlbiA/ICdtZW51LWRyYXdlci1vcGVuJyA6ICdtZW51LWRyYXdlci1jbG9zZWQnO1xuXHRcdHZhciBzaWRlQ2xhc3MgPSB0aGlzLnByb3BzLnNpZGVDbGFzcztcblx0XHR2YXIgZnVsbENsYXNzID0gW2Jhc2VDbGFzcywgb3BlbkNsYXNzLCBzaWRlQ2xhc3NdLmpvaW4oJyAnKTtcblxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtmdWxsQ2xhc3N9PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1lbnUtZHJhd2VyLWlubmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJvZi1uYXYtZml4ZWQgb2YtbmF2LWRyYXdlclwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ1c2VybmFtZSB0ZXh0LWNlbnRlclwiPntPRl9VU0VSTkFNRX08L2Rpdj5cblx0XHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IHZpc2libGUteHMgcHVsbC1yaWdodFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsb3NlTWVudUNsaWNrfSA+XG5cdFx0ICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE5hdkZyYW1lTGlzdCBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXdlcjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRm9vdGVyTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRVSUFjdGlvbnMudG9nZ2xlTWVudShmYWxzZSk7XG5cdH0sXG5cblx0X2hhbmRsZUNvbGxlY3Rpb25DbGljazogZnVuY3Rpb24oKSB7XG5cdFx0VUlBY3Rpb25zLnNldFNlbGVjdGlvblBhbmVsKFwiY29sbGVjdGlvblwiKTtcblx0fSxcblxuXHRfaGFuZGxlRnJhbWVzQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFVJQWN0aW9ucy5zZXRTZWxlY3Rpb25QYW5lbChcImZyYW1lc1wiKTtcblx0fSxcblxuXHRfaGFuZGxlQWRkQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFVJQWN0aW9ucy5vcGVuQWRkQ29udGVudE1vZGFsKCk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgfSxcblxuXHQvKipcblx0ICogVE9ETzogZmlndXJlIG91dCBzdGF0ZSBtYW5hZ2VtZW50LiBTdG9yZT9cblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uID0gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgb2YtbmF2LWZpeGVkIG9mLW5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWNvbGxlY3Rpb24gYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDb2xsZWN0aW9uQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY29sbGVjdGlvblwiPmNvbGxlY3Rpb248L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWZyYW1lc1wiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlRnJhbWVzQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZnJhbWVzXCI+ZnJhbWVzPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyLWFkZCBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENsaWNrfT4rPC9hPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblxuXHRcdHZhciBmcmFtZXMgPSAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItY29sbGVjdGlvblwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ29sbGVjdGlvbkNsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvbGxlY3Rpb25cIj5jb2xsZWN0aW9uPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1mcmFtZXMgYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVGcmFtZXNDbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJmcmFtZXNcIj5mcmFtZXM8L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdFx0dmFyIHBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbDtcblx0XHRjb25zb2xlLmxvZygnUEFORUw6ICcsIHRoaXMuc3RhdGUsIHBhbmVsKTtcblx0XHRyZXR1cm4gcGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbGxlY3Rpb24gOiBmcmFtZXM7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9vdGVyTmF2O1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBGcmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpO1xuXHRcdEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdF9oYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGNvbnNvbGUubG9nKCdDTElDS0VEIScpO1xuXHRcdFVJQWN0aW9ucy5vcGVuUHJldmlldyh0aGlzLnN0YXRlLmZyYW1lKTtcblx0fSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuICBcdFx0Y29uc29sZS5sb2coJ3NlbGVjdGVkRnJhbWU6Jywgc2VsZWN0ZWRGcmFtZSk7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0ZnJhbWU6IHNlbGVjdGVkRnJhbWVcbiAgXHRcdH0pO1xuICBcdH0sXG5cbiAgXHRfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgY29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcyksXG4gIFx0XHRcdGZyYW1lT3V0ZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVPdXRlckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lSW5uZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVJbm5lckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lKSxcblx0XHRcdHcgPSBjb250YWluZXIub2Zmc2V0V2lkdGgsXG5cdFx0XHRoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcblx0XHRcdHBhZGRpbmcgPSA1MCxcblx0XHRcdG1heFcgPSB3IC0gMipwYWRkaW5nLFxuXHRcdFx0bWF4SCA9IGggLSAyKnBhZGRpbmcsXG5cdFx0XHRmcmFtZVcsIGZyYW1lSDtcblxuXHRcdGlmICgodGhpcy53X2hfcmF0aW8gPiAxIHx8IG1heEggKiB0aGlzLndfaF9yYXRpbyA+IG1heFcpICYmIG1heFcgLyB0aGlzLndfaF9yYXRpbyA8IG1heEgpIHtcblx0XHRcdC8vIHdpZHRoID4gaGVpZ2h0IG9yIHVzaW5nIGZ1bGwgaGVpZ2h0IHdvdWxkIGV4dGVuZCBiZXlvbmQgbWF4V1xuXHRcdFx0ZnJhbWVXID0gbWF4Vztcblx0XHRcdGZyYW1lSCA9IChtYXhXIC8gdGhpcy53X2hfcmF0aW8pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB3aWR0aCA8IGhlaWdodFxuXHRcdFx0ZnJhbWVIID0gbWF4SDtcblx0XHRcdGZyYW1lVyA9IChtYXhIICogdGhpcy53X2hfcmF0aW8pO1xuXHRcdH1cblxuXHRcdGZyYW1lLnN0eWxlLndpZHRoID0gZnJhbWVXICsgJ3B4Jztcblx0XHRmcmFtZS5zdHlsZS5oZWlnaHQgPSBmcmFtZUggKyAncHgnO1xuXG5cdFx0ZnJhbWVPdXRlckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IG1heFcrJ3B4Jztcblx0XHRmcmFtZUlubmVyQ29udGFpbmVyLnN0eWxlLnRvcCA9ICgoaCAtIGZyYW1lSCkgLyAyKSArICdweCc7XG5cdFx0Ly8gZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBmcmFtZS5zdHlsZS5oZWlnaHQ7XG5cblxuXG5cdFx0Y29uc29sZS5sb2coJ2ZyYW1lT3V0ZXJDb250YWluZXI6JywgZnJhbWVPdXRlckNvbnRhaW5lcik7XG5cdFx0Y29uc29sZS5sb2coJ2NvbnRhaW5lcjonLCB3LCBoLCBtYXhXLCBtYXhIKTtcbiAgXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIj48L2Rpdj5cblx0XHR9XG5cdFx0dGhpcy53X2hfcmF0aW8gPSB0aGlzLnN0YXRlLmZyYW1lICYmIHRoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MgPyB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLndfaF9yYXRpbyA6IDE7XG5cblx0XHR2YXIgdXJsID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudCA/IHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50LnVybCA6ICcnO1xuXHRcdHZhciBkaXZTdHlsZSA9IHtcblx0XHRcdGJhY2tncm91bmRJbWFnZTogJ3VybCgnICsgdXJsICsgJyknLFxuXHRcdH07XG5cblx0XHRjb25zb2xlLmxvZyh0aGlzLndfaF9yYXRpbyk7XG5cblx0XHR2YXIgd2hTdHlsZSA9IHtcblx0XHRcdHBhZGRpbmdCb3R0b206ICgxL3RoaXMud19oX3JhdGlvKSAqIDEwMCArICclJ1xuXHRcdH07XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIiByZWY9XCJmcmFtZUNvbnRhaW5lclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14bC0xMiBmcmFtZS1vdXRlci1jb250YWluZXJcIiByZWY9XCJmcmFtZU91dGVyQ29udGFpbmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZS1pbm5lci1jb250YWluZXJcIiByZWY9XCJmcmFtZUlubmVyQ29udGFpbmVyXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xpY2t9PlxuXHRcdCAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZVwiIHN0eWxlPXtkaXZTdHlsZX0gcmVmPVwiZnJhbWVcIi8+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG5cdFx0ICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBGcmFtZUl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHByb3BUeXBlczoge1xuXHRcdGZyYW1lOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWRcblx0fSxcblx0X2hhbmRsZVNsaWRlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2xpY2snKTtcblx0XHRVSUFjdGlvbnMub3BlblByZXZpZXcodGhpcy5wcm9wcy5mcmFtZSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyYW1lID0gdGhpcy5wcm9wcy5mcmFtZTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGUgZnJhbWUtc2xpZGVcIiBkYXRhLWZyYW1laWQ9e2ZyYW1lLl9pZH0gb25DbGljaz17dGhpcy5faGFuZGxlU2xpZGVDbGlja30+XG5cdFx0XHRcdDxpbWcgc3JjPXtmcmFtZS5jdXJyZW50X2NvbnRlbnQudXJsfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVJdGVtO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBQdWJsaWNGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1B1YmxpY0ZyYW1lU3RvcmUnKTtcblxudmFyIEZyYW1lSXRlbURldGFpbHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgLy8gZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAvLyAgICAgICAgIGZyYW1lOiB7XG4gICAgLy8gICAgICAgICAgICAgbmFtZTogJycsXG4gICAgLy8gICAgICAgICAgICAgb3duZXI6ICcnXG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgb3duZXI6ICcnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBQdWJsaWNGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAvLyB9LFxuXG4gICAgLy8gY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBQdWJsaWNGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAvLyB9LFxuXG4gICAgLy8gX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcblxuICAgIC8vIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBtaXJyb3JpbmdfY291bnQgPSAnJztcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5mcmFtZSAmJiB0aGlzLnByb3BzLmZyYW1lLm1pcnJvcmluZ19jb3VudCkge1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvdW50ID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS1zdGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvZi1pY29uLW1pcnJvclwiPjwvc3Bhbj4ge3RoaXMucHJvcHMuZnJhbWUubWlycm9yaW5nX2NvdW50fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG93bmVyID0gJyc7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmZyYW1lLm93bmVyKSB7XG4gICAgICAgICAgICBvd25lciArPSAnQCcgKyB0aGlzLnByb3BzLmZyYW1lLm93bmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZnJhbWUtc2xpZGUtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLW5hbWVcIj57dGhpcy5wcm9wcy5mcmFtZS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtdXNlclwiPntvd25lcn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7bWlycm9yaW5nX2NvdW50fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUl0ZW1EZXRhaWxzO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuICAgIFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIEZyYW1lUHJldmlldyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZTogbnVsbCxcbiAgICAgICAgICAgIHByZXZpZXdPcGVuOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25VSUNoYW5nZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVDbG9zZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlBY3Rpb25zLmNsb3NlUHJldmlldygpO1xuICAgIH0sXG5cbiAgICBfb25VSUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRQcmV2aWV3U3RhdGUoKSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5mcmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudCxcbiAgICAgICAgICAgIHRhZ3MgPSBjb250ZW50LnRhZ3MsXG4gICAgICAgICAgICBmcmFtZURldGFpbHMgPSBudWxsLFxuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb250ZW50ID0gJycsXG4gICAgICAgICAgICBtaXJyb3JpbmdfY291bnQgPSB0aGlzLnN0YXRlLmZyYW1lLm1pcnJvcmluZ19jb3VudDtcblxuICAgICAgICB0YWdzX2NvbnRlbnQgPSAnJztcbiAgICAgICAgaWYgKHRhZ3MpIHtcbiAgICAgICAgICAgIF8uZWFjaCh0YWdzLCBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgICAgICB0YWdzX2NvbnRlbnQgKz0gJyMnICsgdGFnICsgJyAnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJldmlld0NsYXNzID0gdGhpcy5zdGF0ZS5wcmV2aWV3T3BlbiA/ICdwcmV2aWV3LW9wZW4nIDogJ3ByZXZpZXctY2xvc2VkJztcblxuICAgICAgICB2YXIgZnVsbENsYXNzID0gJ3ByZXZpZXctY29udGFpbmVyICcgKyBwcmV2aWV3Q2xhc3M7XG5cbiAgICAgICAgdmFyIGRpdlN0eWxlID0ge1xuICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiAndXJsKCcgKyBjb250ZW50LnVybCArICcpJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtaXJyb3JpbmdfY291bnQpIHtcbiAgICAgICAgICAgIG1pcnJvcmluZ19pY29uID0gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9mLWljb24tbWlycm9yXCI+PC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb250ZW50ID0gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1pcnJvcmluZy1tZXRhXCI+e21pcnJvcmluZ19jb3VudH08L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZnJhbWUubmFtZSkge1xuICAgICAgICAgICAgZnJhbWVEZXRhaWxzID0gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IHByZXZpZXctZnJhbWUtZGV0YWlsc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZyYW1lLW5hbWVcIj57dGhpcy5zdGF0ZS5mcmFtZS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bWlycm9yaW5nX2ljb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfY29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvd25lciBwdWxsLXJpZ2h0XCI+QHt0aGlzLnN0YXRlLmZyYW1lLm93bmVyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTIgZGVzY3JpcHRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5mcmFtZS5kZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Z1bGxDbGFzc30gc3R5bGU9e2RpdlN0eWxlfSA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmV2aWV3LWZvb3Rlci13cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJldmlldy1mb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IHByZXZpZXctdGFnc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTExXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJldmlldy10YWdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGFnc19jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbG9zZUNsaWNrfSA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IHByZXZpZXctZGltZW5zaW9uc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyXCI+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJldmlldy11cmxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29udGVudC51cmx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHtmcmFtZURldGFpbHN9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lUHJldmlldzsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cblxudmFyIE5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lOiAnLCBmcmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSAvPlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwibmF2YmFyIG5hdmJhci1kZWZhdWx0XCI+XG4gICAgICAgICAgICAgICAgey8qIEJyYW5kIGFuZCB0b2dnbGUgZ2V0IGdyb3VwZWQgZm9yIGJldHRlciBtb2JpbGUgZGlzcGxheSAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdmJhci1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwibmF2YmFyLXRvZ2dsZSBjb2xsYXBzZWQgcHVsbC1sZWZ0XCIgZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI2JzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNyLW9ubHlcIj5Ub2dnbGUgbmF2aWdhdGlvbjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14c1wiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj57T0ZfVVNFUk5BTUV9PC9zcGFuPjwvaDM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIENvbGxlY3QgdGhlIG5hdiBsaW5rcywgZm9ybXMsIGFuZCBvdGhlciBjb250ZW50IGZvciB0b2dnbGluZyAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbGxhcHNlIG5hdmJhci1jb2xsYXBzZVwiIGlkPVwiYnMtZXhhbXBsZS1uYXZiYXItY29sbGFwc2UtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXYgbmF2YmFyLXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwiZHJvcGRvd25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiByb2xlPVwiYnV0dG9uXCIgYXJpYS1leHBhbmRlZD1cImZhbHNlXCI+RnJhbWVzIDxzcGFuIGNsYXNzTmFtZT1cImNhcmV0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImRyb3Bkb3duLW1lbnVcIiByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5mcmFtZXMubWFwKGNyZWF0ZUZyYW1lTGluay5iaW5kKHRoaXMpKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiL2xvZ291dFwiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tbG9nLW91dFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogLy5uYXZiYXItY29sbGFwc2UgKi99XG4gICAgICAgICAgICA8L25hdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpO1xuXG52YXIgTmF2RnJhbWVMaW5rID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRoYW5kbGVGcmFtZVNlbGVjdGlvbjogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy5zZWxlY3QodGhpcy5wcm9wcy5mcmFtZSk7XG5cdFx0aWYgKHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcikge1xuXHRcdFx0dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZUNsYXNzID0gJ25vdC1jb25uZWN0ZWQnLFxuXHRcdFx0YWN0aXZlVGV4dCA9ICdub3QgY29ubmVjdGVkJztcblx0XHRpZiAodGhpcy5wcm9wcy5mcmFtZS5jb25uZWN0ZWQpIHtcblx0XHRcdGFjdGl2ZUNsYXNzID0gYWN0aXZlVGV4dCA9ICdjb25uZWN0ZWQnO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzU2VsZWN0ZWQoc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA/ICdpY29uLWNoZWNrJyA6ICdzcGFjZSc7XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gJ3B1bGwtcmlnaHQgc3RhdHVzICcgKyBhY3RpdmVDbGFzcztcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGxpIG9uQ2xpY2s9e3RoaXMuaGFuZGxlRnJhbWVTZWxlY3Rpb259PlxuXHRcdFx0XHQ8YSBocmVmPVwiI1wiPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT17aXNTZWxlY3RlZCh0aGlzLnByb3BzLmZyYW1lLnNlbGVjdGVkKX0gLz4ge3RoaXMucHJvcHMuZnJhbWUubmFtZX1cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2NsYXNzZXN9PnthY3RpdmVUZXh0fTwvc3Bhbj5cblx0XHRcdFx0PC9hPlxuXHRcdFx0PC9saT5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpbms7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2RnJhbWVMaW5rID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpbmsnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBOYXZGcmFtZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgXHRyZXR1cm4ge1xuICAgIFx0XHRleHRyYUNsYXNzZXM6ICcnLFxuICAgIFx0XHRpbmNsdWRlTG9nb3V0OiB0cnVlLFxuICAgIFx0XHRsaW5rQ2xpY2tIYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICBcdFx0XHRjb25zb2xlLmxvZygnbGluayBjbGlja2VkJyk7XG4gICAgXHRcdH1cbiAgICBcdH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdXG4gICAgICAgIH1cbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0ZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IC8+XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5leHRyYUNsYXNzZXMgKyAnIG5hdi1mcmFtZS1saXN0IGRyYXdlci1jb250ZW50JztcblxuXHRcdHZhciBsb2dvdXQgPSAnJztcblx0XHRpZiAodGhpcy5wcm9wcy5pbmNsdWRlTG9nb3V0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaW5jbHVkZUxvZ291dCcpO1xuXHRcdFx0bG9nb3V0ID0gKFxuXHRcdFx0XHQ8bGk+XG5cdFx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSBjbGFzc05hbWU9XCJidG4tbG9nb3V0XCIgaHJlZj1cIi9sb2dvdXRcIj5sb2cgb3V0PC9hPlxuXHRcdFx0XHQ8L2xpPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHVsIGNsYXNzTmFtZT17Y2xhc3Nlc30gcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5mcmFtZXMubWFwKGNyZWF0ZUZyYW1lTGluay5iaW5kKHRoaXMpKX1cbiAgICAgICAgICAgICAgICB7bG9nb3V0fVxuICAgICAgICAgICAgPC91bD5cblx0XHQpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaXN0OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgU3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyksXG4gICAgRnJhbWVJdGVtID0gcmVxdWlyZSgnLi9GcmFtZUl0ZW0nKSxcbiAgICBQdWJsaWNGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1B1YmxpY0ZyYW1lQWN0aW9ucycpO1xuXG52YXIgUHVibGljRnJhbWVTd2lwZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN3aXBlcikge1xuICAgICAgICAgICAgdGhpcy5faW5pdFNsaWRlcigpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pbml0U2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG4gICAgICAgIGlmICh0aGlzLnN3aXBlcikge1xuICAgICAgICAgICAgdGhpcy5zd2lwZXIuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3dpcGVyID0gbmV3IFN3aXBlcihlbCwge1xuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogMyxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogNTAsXG4gICAgICAgICAgICBjZW50ZXJlZFNsaWRlczogdHJ1ZSxcbiAgICAgICAgICAgIC8vIHByZWxvYWRJbWFnZXM6IHRydWUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZTogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGZyZWVNb2RlTW9tZW50dW06IHRydWUsXG4gICAgICAgICAgICAvLyBmcmVlTW9kZU1vbWVudHVtUmF0aW86IC4yNSxcbiAgICAgICAgICAgIC8vIGZyZWVNb2RlU3RpY2t5OnRydWUsXG4gICAgICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG4gICAgICAgICAgICBvblNsaWRlQ2hhbmdlRW5kOiB0aGlzLl9zbGlkZUNoYW5nZUVuZFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3NsaWRlVG86IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc3dpcGVyLnNsaWRlVG8oaW5kZXgpO1xuICAgIH0sXG5cbiAgICBfc2xpZGVDaGFuZ2VFbmQ6IGZ1bmN0aW9uKHNsaWRlcikge1xuICAgICAgICB2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICAgICAgICAgICAgZnJhbWVfaWQgPSBzbGlkZS5kYXRhc2V0LmZyYW1laWQ7XG4gICAgICAgIFB1YmxpY0ZyYW1lQWN0aW9ucy5zbGlkZUNoYW5nZWQoZnJhbWVfaWQpO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucycpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5yZWZzLmNvbnRhaW5lci5nZXRET01Ob2RlKCksXG4gICAgICAgICAgICBoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgdG9wIG9mIHRoZSBmcmFtZXMgc3dpcGVyIGNvbnRhaW5lciAoaS5lLiBzY3JlZW4gbWlkcG9pbnQpXG4gICAgICAgICAgICB0b3AgPSBjb250YWluZXIub2Zmc2V0VG9wLFxuICAgICAgICAgICAgLy8gIGhlaWdodCBvZiB0aGUgZm9vdGVyIG5hdiAoNDApICsgZnJhbWUgZGV0YWlsIHRleHQgKDUyKVxuICAgICAgICAgICAgZm9vdGVySCA9IDkyLFxuICAgICAgICAgICAgLy8gIGFkZGl0aW9uYWwgcGFkZGluZ1xuICAgICAgICAgICAgcGFkZGluZyA9IDQwLFxuICAgICAgICAgICAgdG90YWxQYWQgPSBmb290ZXJIICsgcGFkZGluZyxcbiAgICAgICAgICAgIG5ld0ggPSBoIC0gdG90YWxQYWQ7XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IG5ld0grJ3B4JztcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnRvcCA9ICh0b3AgKyBwYWRkaW5nLzIpICsgJ3B4JztcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZyYW1lSXRlbXMgPSB0aGlzLnByb3BzLmZyYW1lcy5tYXAoZnVuY3Rpb24gKGZyYW1lSXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8RnJhbWVJdGVtIGZyYW1lPXtmcmFtZUl0ZW19IGtleT17ZnJhbWVJdGVtLl9pZH0gLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIiByZWY9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1jb250YWluZXJcIiByZWY9XCJTd2lwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItd3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2ZyYW1lSXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQdWJsaWNGcmFtZVN3aXBlcjtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdEZyYW1lSXRlbURldGFpbHMgPSByZXF1aXJlKCcuL0ZyYW1lSXRlbURldGFpbHMnKSxcbiAgICBQdWJsaWNGcmFtZVN3aXBlciA9IHJlcXVpcmUoJy4vUHVibGljRnJhbWVTd2lwZXInKSxcbiAgICBQdWJsaWNGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1B1YmxpY0ZyYW1lQWN0aW9ucycpLFxuICAgIFB1YmxpY0ZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvUHVibGljRnJhbWVTdG9yZScpO1xuXG5cbi8qKlxuICogVGhpcyBjb21wb25lbnQgbWFuYWdlcyBzdGF0ZSBmb3IgdGhlIGxpc3Qgb2YgcHVibGljIGZyYW1lc1xuICovXG52YXIgUHVibGljRnJhbWVzTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcblx0XHRcdGZyYW1lczogW10sXG4gICAgICAgICAgICBzZWxlY3RlZEZyYW1lOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgb3duZXI6ICcnXG4gICAgICAgICAgICB9XG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1B1YmxpY0ZyYW1lc0xpc3Q6IGNvbXBvbmVudCBkaWQgbW91bnQnKTtcblx0XHRQdWJsaWNGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgUHVibGljRnJhbWVBY3Rpb25zLmxvYWRQdWJsaWNGcmFtZXMoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBQdWJsaWNGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHt9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRmcmFtZXM6IFB1YmxpY0ZyYW1lU3RvcmUuZ2V0UHVibGljRnJhbWVzKCksXG4gICAgICAgICAgICBzZWxlY3RlZEZyYW1lOiBQdWJsaWNGcmFtZVN0b3JlLmdldFNlbGVjdGVkUHVibGljRnJhbWUoKVxuICBcdFx0fSk7XG4gIFx0fSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxQdWJsaWNGcmFtZVN3aXBlciBmcmFtZXM9e3RoaXMuc3RhdGUuZnJhbWVzfSAvPlxuICAgICAgICAgICAgICAgIDxGcmFtZUl0ZW1EZXRhaWxzIGZyYW1lPXt0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWV9Lz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHVibGljRnJhbWVzTGlzdDtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgU2V0dGluZ3NNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3NPcGVuOiBmYWxzZSxcblx0XHRcdGZyYW1lOiB7XG5cdFx0XHRcdG5hbWU6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJycsXG5cdFx0XHRcdHNldHRpbmdzOiB7XG5cdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRyb3RhdGlvbjogMFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uVUlDaGFuZ2UpO1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uRnJhbWVDaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZygnaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgICAgIFx0VUlBY3Rpb25zLnNldHRpbmdzTW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVub3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25VSUNoYW5nZSk7XG4gICAgICAgIEZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25GcmFtZUNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVOYW1lQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHN0YXRlID0gdGhpcy5zdGF0ZTtcblx0XHRzdGF0ZS5mcmFtZS5uYW1lID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVEZXNjcmlwdGlvbkNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuZGVzY3JpcHRpb24gPSB2YWw7XG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0X2hhbmRsZVZpc2liaWxpdHlDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJsZSA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlUm90YXRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9uID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVTYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnNhdmVGcmFtZSh0aGlzLnN0YXRlLmZyYW1lKTtcblx0fSxcblxuXHRfb25VSUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRTZXR0aW5nc01vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2V0dGluZ3NPcGVuKSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoJ2hpZGUnKTtcblx0ICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25GcmFtZUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBcdGZyYW1lOiBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1zZXR0aW5nc1wiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5TZXR0aW5nczwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+TmFtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwibmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUubmFtZX0gb25DaGFuZ2U9e3RoaXMuX2hhbmRsZU5hbWVDaGFuZ2V9IC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RGVzY3JpcHRpb24gKG9wdGlvbmFsKTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPlVzZWZ1bCBpZiB5b3VyIGZyYW1lIGZvbGxvd3MgYSB0aGVtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdHJlZj1cImRlc2NyaXB0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLmRlc2NyaXB0aW9ufVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZURlc2NyaXB0aW9uQ2hhbmdlfVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0cGxhY2Vob2xkZXI9XCJlLmcuIGphcGFuZXNlIGFydCwgOTBzIHBvc3RlcnNcIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTlcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+VmlzaWJsZSB0byBvdGhlciBwZW9wbGU8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsLXN1YnRleHRcIj5Zb3VyIGZyYW1lIHdpbGwgYXBwZWFyIG9uIEZyYW1lcyBhbmQgb3RoZXJzIGNhbiBtaXJyb3IgaXQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtM1wiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXQtY2hlY2tib3hcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInZpc2liaWxpdHlcIiB0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0Y2hlY2tlZD17dGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy52aXNpYmxlfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVZpc2liaWxpdHlDaGFuZ2V9Lz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkIHJvdy1mb3JtLWZpZWxkLXJvdGF0aW9uXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0tbGFiZWxcIj5Sb3RhdGlvbjwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNiBmb3JtLWlucHV0LXNlbGVjdFwiPlxuXHRcdFx0XHRcdCAgICBcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJyb3RhdGlvblwiXG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mucm90YXRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVJvdGF0aW9uQ2hhbmdlfSA+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwXCI+MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTYXZlfSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0U2F2ZVxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzTW9kYWw7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG4gICAgVUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgU2ltcGxlTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIG1pcnJvcmluZzogbnVsbCxcbiAgICAgICAgICAgICAgICBtaXJyb3JpbmdfY291bnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbWlycm9yX21ldGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyOiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZnJhbWVOYW1lID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLm5hbWUsXG4gICAgICAgICAgICBtaXJyb3JpbmcgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubWlycm9yaW5nLFxuICAgICAgICAgICAgbWlycm9yX21ldGEgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubWlycm9yX21ldGEsXG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9ICcnLFxuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb3VudCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5taXJyb3JpbmdfY291bnQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29ubmVjdGVkKGNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdmFyIGNvbm5lY3RlZF9jb250ZW50ID0gJyc7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGVkX2NvbnRlbnQgPSAnJmJ1bGw7ICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge19faHRtbDogY29ubmVjdGVkX2NvbnRlbnR9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1pcnJvcmluZ19jb3VudCkge1xuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLW1ldGFcIj57bWlycm9yaW5nX2NvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWlycm9yaW5nKSB7XG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvZi1pY29uLW1pcnJvclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtaXJyb3JpbmdfY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctbWV0YVwiPkB7bWlycm9yX21ldGEub3duZXJ9IDoge21pcnJvcl9tZXRhLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG5cblxuXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi10b3BcIj5cbiAgICAgICAgICAgICAgICA8aDYgY2xhc3NOYW1lPVwiZnJhbWUtbmFtZSB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25uZWN0ZWRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17Y29ubmVjdGVkKHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5jb25uZWN0ZWQpfSAvPlxuICAgICAgICAgICAgICAgICAgICB7ZnJhbWVOYW1lfVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19pY29ufVxuICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9oNj5cblxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IGJ0bi1tZW51IHZpc2libGUteHMgcHVsbC1sZWZ0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3Blbk1lbnVDbGlja30+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24taGFtYnVyZ2VyXCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tc2V0dGluZyB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVPcGVuU2V0dGluZ3N9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNvZ1wiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQgaGlkZGVuLXhzIHB1bGwtbGVmdFwiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj57T0ZfVVNFUk5BTUV9PC9zcGFuPjwvaDM+XG5cblxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHQgaGlkZGVuLXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJkcm9wZG93blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPE5hdkZyYW1lTGlzdCBleHRyYUNsYXNzZXM9XCJkcm9wZG93bi1tZW51XCIgaW5jbHVkZUxvZ291dD17ZmFsc2V9Lz5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNzZXR0aW5nc1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5TZXR0aW5nc30+U2V0dGluZ3M8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+TG9nIE91dDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuTWVudUNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlT3Blbk1lbnVDbGljaycpO1xuICAgICAgICBVSUFjdGlvbnMudG9nZ2xlTWVudSh0cnVlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU9wZW5TZXR0aW5nczogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5TZXR0aW5ncycpO1xuICAgICAgICBVSUFjdGlvbnMub3BlblNldHRpbmdzTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJysrKysrKyBnZXQgc2VsZWN0ZWQgZnJhbWUnLCBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcbiAgICBDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyksXG4gICAgUHVibGljRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9QdWJsaWNGcmFtZVN0b3JlJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgVHJhbnNmZXJCdXR0b25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVTZW5kQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZVNlbmRDbGlja2VkJywgQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICAgICAgRnJhbWVBY3Rpb25zLnVwZGF0ZUNvbnRlbnQoQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVNaXJyb3JDbGlja2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlTWlycm9yQ2xpY2tlZCcpO1xuXHRcdEZyYW1lQWN0aW9ucy5taXJyb3JGcmFtZShQdWJsaWNGcmFtZVN0b3JlLmdldFNlbGVjdGVkUHVibGljRnJhbWUoKSk7XG5cdH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWNvbiwgaGFuZGxlcjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0aW9uUGFuZWwgPT09ICdjb2xsZWN0aW9uJykge1xuICAgICAgICAgICAgaWNvbiA9ICdpY29uLXVwJztcbiAgICAgICAgICAgIGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVTZW5kQ2xpY2tlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljb24gPSAnb2YtaWNvbi1taXJyb3InO1xuICAgICAgICAgICAgaGFuZGxlciA9IHRoaXMuX2hhbmRsZU1pcnJvckNsaWNrZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IHRyYW5zZmVyLWJ1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1ncm91cFwiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCIuLi5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCIgb25DbGljaz17aGFuZGxlcn0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtpY29ufSBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tc2VuZFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4gKi99XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2ZlckJ1dHRvbnM7XG4iLCJ2YXIgY29uZiA9IHtcblx0ZG9tYWluOiAnbG9jYWxob3N0Jyxcblx0cG9ydDogJzg4ODgnLFxuXHRuYXZiYXJIOiA1MFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmY7IiwidmFyIGtleW1pcnJvciA9IHJlcXVpcmUoJ2tleW1pcnJvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleW1pcnJvcih7XG5cblx0Ly8gZnJhbWUgYWN0aW9uIHR5cGVzXG5cdEZSQU1FX0xPQUQ6IG51bGwsXG5cdEZSQU1FX0xPQURfRE9ORTogbnVsbCxcblx0RlJBTUVfTE9BRF9GQUlMOiBudWxsLFxuXHRGUkFNRV9TRUxFQ1Q6IG51bGwsXG5cdEZSQU1FX1VQREFURV9DT05URU5UOiBudWxsLFxuXHRGUkFNRV9TRVRUSU5HU19DT05URU5UOiBudWxsLFxuXHRGUkFNRV9DT05URU5UX1VQREFURUQ6IG51bGwsXG5cdEZSQU1FX0NPTk5FQ1RFRDogbnVsbCxcblx0RlJBTUVfRElTQ09OTkVDVEVEOiBudWxsLFxuXHRGUkFNRV9TQVZFOiBudWxsLFxuXHRGUkFNRV9TQVZFX0RPTkU6IG51bGwsXG5cdEZSQU1FX1NBVkVfRkFJTDogbnVsbCxcblx0RlJBTUVfTUlSUk9SRUQ6IG51bGwsXG5cblx0Ly8gY29udGVudCBhY3Rpb24gdHlwZXNcblx0Q09OVEVOVF9MT0FEOiBudWxsLFxuXHRDT05URU5UX0xPQURfRE9ORTogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfU0VORDogbnVsbCxcblx0Q09OVEVOVF9TTElERV9DSEFOR0VEOiBudWxsLFxuXHRDT05URU5UX0FERDogbnVsbCxcblx0Q09OVEVOVF9BRERfRE9ORTogbnVsbCxcblx0Q09OVEVOVF9BRERfRkFJTDogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkU6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFX0ZBSUw6IG51bGwsXG5cblx0Ly8gcHVibGljIGZyYW1lcyBsaXN0XG5cdFBVQkxJQ19GUkFNRVNfTE9BRDogbnVsbCxcblx0UFVCTElDX0ZSQU1FU19MT0FEX0RPTkU6IG51bGwsXG5cdFBVQkxJQ19GUkFNRVNfTE9BRF9GQUlMOiBudWxsLFxuXHRQVUJMSUNfRlJBTUVTX0FERDogbnVsbCxcblx0UFVCTElDX0ZSQU1FU19SRU1PVkU6IG51bGwsXG5cdFBVQkxJQ19GUkFNRVNfU0xJREVfQ0hBTkdFRDogbnVsbCxcblxuXHQvLyBVSSBhY3Rpb24gdHlwZXNcblx0VUlfTUVOVV9UT0dHTEU6IG51bGwsXG5cdFVJX1NFVF9TRUxFQ1RJT05fUEFORUw6IG51bGwsXG5cdFVJX09QRU5fQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX0NMT1NFX0FERF9DT05URU5UOiBudWxsLFxuXHRVSV9PUEVOX1NFVFRJTkdTOiBudWxsLFxuXHRVSV9DTE9TRV9TRVRUSU5HUzogbnVsbCxcblx0VUlfT1BFTl9QUkVWSUVXOiBudWxsLFxuXHRVSV9DTE9TRV9QUkVWSUVXOiBudWxsLFxuXG5cdC8vIGVtaXR0ZWQgYnkgc3RvcmVzXG5cdENIQU5HRV9FVkVOVDogbnVsbFxufSk7XG4iLCJ2YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJ2ZsdXgnKS5EaXNwYXRjaGVyO1xuXG52YXIgQXBwRGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG5cbi8qKlxuKiBBIGJyaWRnZSBmdW5jdGlvbiBiZXR3ZWVuIHRoZSB2aWV3cyBhbmQgdGhlIGRpc3BhdGNoZXIsIG1hcmtpbmcgdGhlIGFjdGlvblxuKiBhcyBhIHZpZXcgYWN0aW9uLiAgQW5vdGhlciB2YXJpYW50IGhlcmUgY291bGQgYmUgaGFuZGxlU2VydmVyQWN0aW9uLlxuKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbiBUaGUgZGF0YSBjb21pbmcgZnJvbSB0aGUgdmlldy5cbiovXG5BcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcblx0YWN0aW9uLnNvdXJjZSA9ICdWSUVXX0FDVElPTic7XG5cdHRoaXMuZGlzcGF0Y2goYWN0aW9uKTtcbn1cblxuXG4vKipcbiogQSBicmlkZ2UgZnVuY3Rpb24gYmV0d2VlbiB0aGUgc2VydmVyIGFuZCB0aGUgZGlzcGF0Y2hlciwgbWFya2luZyB0aGUgYWN0aW9uXG4qIGFzIGEgc2VydmVyIGFjdGlvbi5cbiogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb24gVGhlIGRhdGEgY29taW5nIGZyb20gdGhlIHNlcnZlci5cbiovXG5BcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXHRhY3Rpb24uc291cmNlID0gJ1NFUlZFUl9BQ1RJT04nO1xuXHR0aGlzLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwRGlzcGF0Y2hlcjsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfY29udGVudCA9IFtdLFxuXHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IG51bGw7XG5cblxudmFyIENvbnRlbnRTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IGNvbnRlbnQ7XG5cdFx0Ly8gc2luY2UgdGhlIGxhc3QgaXRlbSBiZWNvbWVzIHRoZSBmaXJzdCBpbiB0aGUgc2xpZGVyLFxuXHRcdC8vIHdlIHN0YXJ0IHdpdGggKGNvbnRlbnQubGVuZ3RoIC0gMSlcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IF9jb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0uX2lkO1xuXHR9LFxuXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudC5wdXNoKGNvbnRlbnQpO1xuXHRcdF9zZWxlY3RlZF9jb250ZW50X2lkID0gY29udGVudC5faWQ7XG5cdH0sXG5cblx0cmVtb3ZlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gXy5yZW1vdmUoX2NvbnRlbnQsIHtfaWQ6IGNvbnRlbnQuX2lkfSk7XG5cdH0sXG5cblx0ZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG5cdH0sXG5cblx0Z2V0Q29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9jb250ZW50O1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gY29uc29sZS5sb2coJ2dldFNlbGVjdGVkQ29udGVudDonLCBfY29udGVudCwgX3NlbGVjdGVkX2NvbnRlbnRfaWQpO1xuXHRcdHJldHVybiBfLmZpbmQoX2NvbnRlbnQsIHsnX2lkJzogX3NlbGVjdGVkX2NvbnRlbnRfaWR9KTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuXG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBcdHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGxvYWRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmluaXQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBsb2FkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicpO1xuXHRcdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBhY3Rpb24uY29udGVudF9pZDtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERDpcblx0XHRcdGNvbnNvbGUubG9nKCdhZGRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgYWRkZWQ6ICcsIGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5hZGRDb250ZW50KGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBiZSBhZGRlZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG5cblx0XHRcdC8vIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX1VQREFURV9URVhUOlxuXHQgICAgLy8gICB0ZXh0ID0gYWN0aW9uLnRleHQudHJpbSgpO1xuXHQgICAgLy8gICBpZiAodGV4dCAhPT0gJycpIHtcblx0ICAgIC8vICAgICB1cGRhdGUoYWN0aW9uLmlkLCB7dGV4dDogdGV4dH0pO1xuXHQgICAgLy8gICAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIH1cblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZOlxuXHQgICAgLy8gICBkZXN0cm95KGFjdGlvbi5pZCk7XG5cdCAgICAvLyAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWV9DT01QTEVURUQ6XG5cdCAgICAvLyAgIGRlc3Ryb3lDb21wbGV0ZWQoKTtcblx0ICAgIC8vICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRTdG9yZTtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9mcmFtZXMgPSB7fSxcblx0Ly8gdGhlc2UgdHdvIGFyZSBmb3IgdGhlIHN3aXBlciBvZiB2aXNpYmxlIGZyYW1lczpcblx0X3Zpc2libGVGcmFtZXMgPSBbXSxcblx0X3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQgPSBudWxsOztcblxudmFyIGFkZEZyYW1lID0gZnVuY3Rpb24oZnJhbWUsIHNlbGVjdCkge1xuXHRfZnJhbWVzW2ZyYW1lLl9pZF0gPSBmcmFtZTtcblx0aWYgKHNlbGVjdCAhPT0gZmFsc2UpIHNlbGVjdEZyYW1lKGZyYW1lKTtcbn1cblxudmFyIHJlbW92ZUZyYW1lID0gZnVuY3Rpb24oZnJhbWUpe1xuXHRjb25zb2xlLmxvZygncmVtb3ZlRnJhbWUnLCBmcmFtZSk7XG5cdHZhciBpZCA9IGZyYW1lLl9pZDtcblx0aWYgKGlkIGluIF9mcmFtZXMpIGRlbGV0ZSBfZnJhbWVzW2lkXTtcblx0Y29uc29sZS5sb2coX2ZyYW1lcyk7XG59O1xuXG52YXIgc2VsZWN0RnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuXHRjb25zb2xlLmxvZygnc2VsZWN0RnJhbWU6ICcsIGZyYW1lKTtcblxuXHQvLyB1bnNlbGVjdCBjdXJyZW50bHkgc2VsZWN0ZWRcblx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0aWYgKHNlbGVjdGVkRnJhbWUpIHtcblx0XHRzZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gZmFsc2U7XG5cdH1cblxuXHQvLyBub3cgc2V0IHRoZSBuZXcgc2VsZWN0ZWQgZnJhbWVcblx0dmFyIF9zZWxlY3RlZEZyYW1lID0gXy5maW5kKF9mcmFtZXMsIHtfaWQ6IGZyYW1lLl9pZH0pO1xuXHRfc2VsZWN0ZWRGcmFtZS5zZWxlY3RlZCA9IHRydWU7XG59XG5cbnZhciBGcmFtZVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0Xy5lYWNoKGZyYW1lcywgYWRkRnJhbWUpO1xuXG5cdFx0Ly8gc2VlIGlmIGFueSBmcmFtZSBpcyBtYXJrZWQgYXMgc2VsZWN0ZWQgZnJvbSBkYixcblx0XHQvLyBvdGhlcndpc2Ugc2VsZWN0IHRoZSBmaXJzdCBmcmFtZS5cblx0XHRpZiAoIV8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KSkge1xuXHRcdFx0Xy5zYW1wbGUoX2ZyYW1lcykuc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXG5cdGdldEZyYW1lOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiBfZnJhbWVzW2lkXTtcblx0fSxcblxuXHRnZXRBbGxGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdnZXRBbGxGcmFtZXM6ICcsIF9mcmFtZXMpO1xuXHRcdHJldHVybiBfLm1hcChfZnJhbWVzLCBmdW5jdGlvbihmcmFtZSkge1xuXHRcdFx0cmV0dXJuIGZyYW1lO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkRnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmZpbmQoX2ZyYW1lcywge3NlbGVjdGVkOiB0cnVlfSk7XG5cdH0sXG5cblx0Z2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRmcmFtZXM6IF9mcmFtZXMsXG5cdFx0XHRzZWxlY3RlZEZyYW1lOiB0aGlzLmdldFNlbGVjdGVkRnJhbWUoKVxuXHRcdH07XG5cdH0sXG5cblx0ZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgaGFzIGNvbm5lY3RlZC4gU2ltcGx5IHVwZGF0ZWQgdGhlIGZyYW1lIG9iamVjdCBpbiBvdXIgY29sbGVjdGlvbi5cblx0ICovXG5cdGNvbm5lY3RGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHQvLyBhZGRGcmFtZSB3aWxsIG92ZXJ3cml0ZSBwcmV2aW91cyBmcmFtZVxuXHRcdGNvbnNvbGUubG9nKCdjb25uZWN0RnJhbWU6ICcsIGZyYW1lKTtcblx0XHRhZGRGcmFtZShmcmFtZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgaGFzIGRpc2Nvbm5lY3RlZC4gU2ltcGx5IHVwZGF0ZWQgdGhlIGZyYW1lIG9iamVjdCBpbiBvdXIgY29sbGVjdGlvbi5cblx0ICovXG5cdGRpc2Nvbm5lY3RGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHQvLyBhZGRGcmFtZSB3aWxsIG92ZXJ3cml0ZSBwcmV2aW91cyBmcmFtZVxuXHRcdGFkZEZyYW1lKGZyYW1lLCBmYWxzZSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcblxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG5cdC8vIGNvbnNvbGUubG9nKCdBQ1RJT046IEZyYW1lU3RvcmU6ICcsIGFjdGlvbi5hY3Rpb25UeXBlKTtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBsb2FkZWQ6ICcsIGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5pbml0KGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5jb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuZGlzY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVDpcbiAgICBcdFx0c2VsZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0RnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkuY29udGVudCA9IGFjdGlvbi5jb250ZW50O1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfVVBEQVRFRDpcblx0XHRcdC8vIGFkZGluZyB0aGUgdXBkYXRlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX01JUlJPUkVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcblx0XHRcdC8vIGFkZGluZyB0aGUgc2F2ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0RPTkU6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHQvLyBub29wIChvcHRpbWlzdGljIHVpIHVwZGF0ZSBhbHJlYWR5IGhhcHBlbmVkIG9uIEZSQU1FX1NBVkUpXG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9GQUlMOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmYWlsZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdC8vIFRPRE86IGhhbmRsZSB0aGlzIGJ5IHJldmVydGluZyAoaW1tdXRhYmxlLmpzIHdvdWxkIGhlbHApXG5cdFx0XHRjb25zb2xlLmxvZygnZmFpbGVkIHRvIHNhdmUgZnJhbWUnLCBhY3Rpb24uZnJhbWUpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lU3RvcmU7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfcHVibGljRnJhbWVzID0gW10sXG5cdF9zZWxlY3RlZF9wdWJsaWNfZnJhbWVfaWQgPSBudWxsO1xuXG52YXIgYWRkRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgc2VsZWN0KSB7XG5cdF9wdWJsaWNGcmFtZXMucHVzaChmcmFtZSlcblx0aWYgKHNlbGVjdCAhPT0gZmFsc2UpIHNlbGVjdEZyYW1lKGZyYW1lKTtcbn1cblxudmFyIHJlbW92ZUZyYW1lID0gZnVuY3Rpb24oZnJhbWUpe1xuXHRfLnJlbW92ZShfcHVibGljRnJhbWVzLCB7X2lkOiBmcmFtZS5faWR9KTtcbn07XG5cbnZhciBQdWJsaWNGcmFtZVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0X3B1YmxpY0ZyYW1lcyA9IGZyYW1lcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0IHRoZSBsaXN0IG9mIHB1YmxpYyBmcmFtZXMuXG5cdCAqIEByZXR1cm4ge29iamVjdH0gQXJyYXlcblx0ICovXG5cdGdldFB1YmxpY0ZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9wdWJsaWNGcmFtZXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgcHVibGljIGZyYW1lIHRoYXQgaXMgY3VycmVudGx5IHNlbGVjdGVkLlxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IGZyYW1lXG5cdCAqL1xuXHRnZXRTZWxlY3RlZFB1YmxpY0ZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5maW5kKF9wdWJsaWNGcmFtZXMsIHsnX2lkJzogX3NlbGVjdGVkX3B1YmxpY19mcmFtZV9pZH0pO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG5cbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBcdHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXHRcdGNhc2UgT0ZDb25zdGFudHMuUFVCTElDX0ZSQU1FU19MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgdmlzaWJsZSBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfTE9BRF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygndmlzaWJsZSBmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdF9wdWJsaWNGcmFtZXMgPSBhY3Rpb24uZnJhbWVzO1xuXHRcdFx0X3NlbGVjdGVkX3B1YmxpY19mcmFtZV9pZCA9IF9wdWJsaWNGcmFtZXNbMF0uX2lkO1xuXHRcdFx0UHVibGljRnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuUFVCTElDX0ZSQU1FU19MT0FEX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygndmlzaWJsZSBmcmFtZXMgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfQUREOlxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdFB1YmxpY0ZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfUkVNT1ZFOlxuXHRcdFx0cmVtb3ZlRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdFB1YmxpY0ZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLlBVQkxJQ19GUkFNRVNfU0xJREVfQ0hBTkdFRDpcblx0XHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjaGFuZ2VkLi4uJywgYWN0aW9uKTtcblx0XHRcdF9zZWxlY3RlZF9wdWJsaWNfZnJhbWVfaWQgPSBhY3Rpb24uZnJhbWVfaWQ7XG5cdFx0XHRQdWJsaWNGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQdWJsaWNGcmFtZVN0b3JlO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG4gICAgT0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcbiAgICBhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfbWVudU9wZW4gPSBmYWxzZSxcbiAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2UsXG4gICAgX2FkZE9wZW4gPSBmYWxzZSxcbiAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2UsXG4gICAgX3ByZXZpZXdPcGVuID0gZmFsc2UsXG4gICAgX3ByZXZpZXdGcmFtZSA9IG51bGwsXG4gICAgX3NlbGVjdGlvblBhbmVsID0gXCJjb2xsZWN0aW9uXCI7XG5cbnZhciBfdG9nZ2xlTWVudSA9IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICBfbWVudU9wZW4gPSAhIW9wZW47XG59XG5cblxudmFyIFVJU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuICAgIGdldE1lbnVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcGVuOiBfbWVudU9wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2V0dGluZ3NTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcGVuOiBfc2V0dGluZ3NPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNlbGVjdGlvblBhbmVsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2VsZWN0aW9uUGFuZWw6IF9zZWxlY3Rpb25QYW5lbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRBZGRNb2RhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZE9wZW46IF9hZGRPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNldHRpbmdzTW9kYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT09PT09PScsIF9zZXR0aW5nc09wZW4pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2V0dGluZ3NPcGVuOiBfc2V0dGluZ3NPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFByZXZpZXdTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmV2aWV3T3BlbjogX3ByZXZpZXdPcGVuLFxuICAgICAgICAgICAgZnJhbWU6IF9wcmV2aWV3RnJhbWVcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG4gICAgfSxcblxuICAgIGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgICAgIHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gICAgfSxcblxuICAgIHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gICAgfVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICAgIHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEU6XG4gICAgICAgICAgICBfdG9nZ2xlTWVudShhY3Rpb24ub3Blbik7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEU6XG4gICAgICAgICAgICBfdG9nZ2xlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9TRVRfU0VMRUNUSU9OX1BBTkVMOlxuICAgICAgICAgICAgX3NlbGVjdGlvblBhbmVsID0gYWN0aW9uLnBhbmVsO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX09QRU5fQUREX0NPTlRFTlQ6XG4gICAgICAgICAgICBfYWRkT3BlbiA9IHRydWU7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfQ0xPU0VfQUREX0NPTlRFTlQ6XG4gICAgICAgICAgICAvLyBtb2RhbCBhbHJlYWR5IGNsb3NpbmcsIG5vIGNoYW5nZSBlbW1pc3Npb24gbmVlZGVkXG4gICAgICAgICAgICBfYWRkT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX1NFVFRJTkdTOlxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfQ0xPU0VfU0VUVElOR1M6XG4gICAgICAgICAgICAvLyBtb2RhbCBhbHJlYWR5IGNsb3NpbmcsIG5vIGNoYW5nZSBlbW1pc3Npb24gbmVlZGVkXG4gICAgICAgICAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX09QRU5fUFJFVklFVzpcbiAgICAgICAgICAgIF9wcmV2aWV3T3BlbiA9IHRydWU7XG4gICAgICAgICAgICBfcHJldmlld0ZyYW1lID0gYWN0aW9uLmZyYW1lO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX1BSRVZJRVc6XG4gICAgICAgICAgICBfcHJldmlld09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFOlxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVUlTdG9yZTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIEFwcCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9BcHAuanMnKSxcbiAgICBicm93c2VyX3N0YXRlID0gcmVxdWlyZSgnLi9icm93c2VyX3N0YXRlX21hbmFnZXInKSxcbiAgICBGYXN0Q2xpY2sgPSByZXF1aXJlKCdmYXN0Y2xpY2snKTtcblxuLy8gaW5pdCBqYXZhc2NyaXB0IG1lZGlhIHF1ZXJ5LWxpa2Ugc3RhdGUgZGV0ZWN0aW9uXG5icm93c2VyX3N0YXRlLmluaXQoKTtcblxuLy8gVHVybiBvbiB0b3VjaCBldmVudHMgZm9yIFJlYWN0LlxuLy8gUmVhY3QuaW5pdGlhbGl6ZVRvdWNoRXZlbnRzKHRydWUpO1xuXG4vLyBGYXN0Q2xpY2sgcmVtb3ZlcyB0aGUgMzAwcyBkZWxheSBvbiBzdHVwaWQgaU9TIGRldmljZXNcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdhdHRhY2hpbmcgRmFzdENsaWNrJyk7XG5cdEZhc3RDbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG59KTtcblxuUmVhY3QucmVuZGVyKFxuXHQ8QXBwIC8+LFxuXHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnT3BlbkZyYW1lJylcbikiXX0=
