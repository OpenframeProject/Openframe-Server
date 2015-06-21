(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jon/Projects/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
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

},{}],"/Users/jon/Projects/OpenFrame-Py/node_modules/keymirror/index.js":[function(require,module,exports){
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

},{}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (window.jQuery),
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

},{"../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (window.jQuery),
	Socker = require('../api/Socker'),
	FrameStore = require('../stores/FrameStore'),
    _ = (window._);

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
		console.log(frame, content);
		// var content = ContentStore.getSelectedContent();
        var data = {
            frame_id: frame._id,
            content_id: content._id
        };
        Socker.send('frame:update_content', data);

		// WebSocket event handler for frame:frame_updated triggers the dispatch
	},

    mirrorFrame: function(mirrored_frame) {
        var frame = FrameStore.getSelectedFrame();

        if (_.isArray(mirrored_frame.mirrored_by)) {
            mirrored_frame.mirrored_by.push(frame._id)
        }

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
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SLIDE_CHANGED,
			frame_id: frame_id
		});
	}

}

module.exports = FrameActions;

},{"../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    OFConstants = require('../constants/OFConstants'),
    $ = (window.jQuery)

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
    }

}

module.exports = UIActions;

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js":[function(require,module,exports){
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

},{}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/browser_state_manager.js":[function(require,module,exports){
var ssm = (window.ssm)
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

},{"./config":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js":[function(require,module,exports){
var React = (window.React),
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

},{"../actions/ContentActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js":[function(require,module,exports){
var React = (window.React),
	UIActions = require('../actions/UIActions'),
	ContentActions = require('../actions/ContentActions'),
	UIStore = require('../stores/UIStore'),
	_ = (window._);

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
		// hack because I can't seem to get the autocapitalize="off" to work
		// for the tags field ??
		el.value = el.value.toLowerCase();
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
						    			React.createElement("input", {ref: "url", type: "url", autocapitalize: "off", placeholder: "http://..."})
						    		)
						    	)
					    	), 

					    	React.createElement("div", {className: "row row-form-field"}, 
				    			React.createElement("div", {className: "col-xs-12"}, 
						    		React.createElement("div", {className: "form-label"}, "Enter description with tags"), 
						    		React.createElement("div", {className: "form-input"}, 
						    			React.createElement("input", {ref: "tags", type: "text", 
						    					autocapitalize: "off", 
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

},{"../actions/ContentActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../actions/UIActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/App.js":[function(require,module,exports){
(function (global){
var React = (window.React),
	$ = (window.jQuery),

	Nav = require('./Nav.js'),
	SimpleNav = require('./SimpleNav.js'),
	Frame = require('./Frame.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),
	FramesList = require('./FramesList.js'),
	FooterNav = require('./FooterNav.js'),
	Drawer = require('./Drawer.js'),
	AddContentModal = require('./AddContentModal.js'),
	SettingsModal = require('./SettingsModal.js'),

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
  			frameList = React.createElement(FramesList, null);
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
				React.createElement(AddContentModal, null)
			)
	    )
  	}
});

module.exports = App;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./AddContentForm.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./AddContentModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js","./ContentList.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./Drawer.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Drawer.js","./FooterNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./FramesList.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FramesList.js","./Nav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./SettingsModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js","./SimpleNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js","./TransferButtons.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
var React = (window.React),
	Swiper = (window.Swiper),
	ContentActions = require('../actions/ContentActions'),
	ContentStore = require('../stores/ContentStore');

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

  		if (!this.swiper) {
  			this._initSlider();
  		}

  		this._populateSlider()

		// var slide_index = $('div.swiper-slide').length;
        this.swiper.slideTo(0);
  	},

  	_initSlider: function() {
  		var el = React.findDOMNode(this.refs.Swiper);
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
	        keyboardControl: true,
	        onSlideChangeEnd: this._slideChangeEnd
	    });
  	},

  	_populateSlider: function() {
  		this.swiper.removeAllSlides();
  		this.state.content.forEach(this._addSlide);
  	},

  	_addSlide: function(contentItem) {
  		var html = '<div class="swiper-slide content-slide" data-contentid="' + contentItem._id + '"><img src=' + contentItem.url + ' /></div>'
		  this.swiper.prependSlide(html);
  	},

  	_slideTo: function(index) {
  		this.swiper.slideTo(index);
  	},

  	_slideChangeEnd: function(slider) {
  		var slide = this.swiper.slides[this.swiper.activeIndex],
  			content_id = slide.dataset.contentid;
  		console.log('_slideChangeEnd', content_id);
  		ContentActions.slideChanged(content_id);
  	},

    _updateContainerDimensions: function() {
    	console.log('_updateContainerDimensions');
        var container = React.findDOMNode(this)
            h = container.offsetHeight,
            padding = 40,
            newH = h - padding;

        container.style.height = newH+'px';
        // container.style.top = '0px';
    },

    render: function() {
        function createContentSlide(contentItem) {
            console.log('creating slide: ', contentItem);
            return (
                React.createElement("div", {key: contentItem._id.$oid, className: "swiper-slide"}, 
                    React.createElement("img", {src: contentItem.url})
                )
            );
        }
        return (
            React.createElement("div", {className: "swiper-outer-container"}, 
                React.createElement("div", {className: "swiper-container", ref: "Swiper"}, 
                    React.createElement("div", {className: "swiper-wrapper"}

                    )
                )
            )
        );
    }

});

module.exports = ContentList;

},{"../actions/ContentActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../stores/ContentStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Drawer.js":[function(require,module,exports){
var React = (window.React),
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

},{"../actions/UIActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./NavFrameList":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js":[function(require,module,exports){
var React = (window.React),
	$ = (window.jQuery),
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

},{"../actions/UIActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Frame.js":[function(require,module,exports){
var React = (window.React),
	FrameActions = require('../actions/FrameActions'),
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

		var active = this.state.frame.active ? '*' : '';
		return (
			React.createElement("div", {className: "row frames-list", ref: "frameContainer"}, 
				React.createElement("div", {className: "col-xl-12 frame-outer-container", ref: "frameOuterContainer"}, 
					React.createElement("button", {type: "button", className: "btn btn-primary btn-xs btn-settings hide", "data-toggle": "modal", "data-target": "#myModal"}, "S"), 
					React.createElement("div", {className: "frame-inner-container", ref: "frameInnerContainer"}, 
		            	React.createElement("div", {className: "frame", style: divStyle, ref: "frame"})
		            )
		        )
	        )
		);
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
  	}


});

module.exports = Frame;

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FramesList.js":[function(require,module,exports){
var React = (window.React),
	Swiper = (window.Swiper),
	FrameActions = require('../actions/FrameActions'),
    FrameStore = require('../stores/FrameStore'),
    _ = (window._);

var FramesList = React.createClass({displayName: "FramesList",
	getInitialState: function() {
        return {
			frames: [],
            currentFrame: {
                name: '',
                owner: ''
            }
		}
	},

	componentDidMount: function() {
		FrameActions.loadVisibleFrames();
		FrameStore.addChangeListener(this._onChange);
        this._updateContainerDimensions();
    },

    componentWillUnmount: function() {
        FrameStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {
    },

    _initSlider: function() {
        var el = React.findDOMNode(this.refs.Swiper);
        this.swiper = new Swiper(el, {
            slidesPerView: 3,
            spaceBetween: 50,
            preloadImages: true,
            centeredSlides: true,
            freeMode: true,
            freeModeMomentum: true,
            freeModeMomentumRatio: .25,
            freeModeSticky:true,
            keyboardControl: true,
            onSlideChangeEnd: this._slideChangeEnd
        });


    },

    _populateSlider: function() {
        this.swiper.removeAllSlides();
        this.state.frames.forEach(this._addSlide);
    },

    _addSlide: function(frame) {
        // If there is current content set on the frame.
        if (frame.current_content && frame.current_content.url) {
            var html = '' +
                '<div class="swiper-slide frame-slide" data-frameid="' + frame._id + '">' +
                    '<img src=' + frame.current_content.url + ' />' +
                '</div>';

            this.swiper.appendSlide(html);
        }
    },

    _slideTo: function(index) {
        this.swiper.slideTo(index);
    },

    _slideChangeEnd: function(slider) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            frame_id = slide.dataset.frameid;
        console.log('_slideChangeEnd', frame_id);
        FrameActions.slideChanged(frame_id);
    },

     _updateContainerDimensions: function() {
        var container = this.refs.container.getDOMNode(),
            h = container.offsetHeight,
            padding = 100,
            newH = h - padding;

        container.style.height = newH+'px';
        // container.style.top = '0px';
    },

  	_onChange: function() {
  		this.setState({
  			frames: FrameStore.getVisibleFrames(),
            currentFrame: FrameStore.getSelectedVisibleFrame()
  		});

  		// TODO: better React integration for the swiper
        // Maybe a slide component?

  		if (!this.swiper) {
  			this._initSlider();
  		    this._populateSlider()
            this.swiper.slideTo(0);
        }
  	},

    render: function() {
        var mirroring_count = '';

        if (this.state.currentFrame && this.state.currentFrame.mirroring_count) {
            mirroring_count = (
                React.createElement("div", {className: "visible-frame-stats"}, 
                    React.createElement("span", {className: "of-icon-mirror"}), " ", this.state.currentFrame.mirroring_count
                )
            )
        }
        console.log('mirroring_count: ', this.state.currentFrame.mirroring_count)
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "swiper-outer-container", ref: "container"}, 
                    React.createElement("div", {className: "swiper-container", ref: "Swiper"}, 
                        React.createElement("div", {className: "swiper-wrapper"}

                        )
                    )
                ), 
                React.createElement("div", {className: "frame-slide-content"}, 
                    React.createElement("div", {className: "visible-frame-details"}, 
                        React.createElement("div", null, 
                            React.createElement("span", {className: "visible-frame-name"}, this.state.currentFrame.name), 
                            React.createElement("span", {className: "visible-frame-user"}, "@ ", this.state.currentFrame.owner)
                        ), 
                        mirroring_count
                    )
                )
            )
        );
    }

});

module.exports = FramesList;

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Nav.js":[function(require,module,exports){
var React = (window.React),
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

},{"../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js":[function(require,module,exports){
var React = (window.React),
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
		if (this.props.frame.active) {
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

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js":[function(require,module,exports){
var React = (window.React),
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

},{"../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js":[function(require,module,exports){
var React = (window.React),
	UIActions = require('../actions/UIActions'),
	FrameActions = require('../actions/FrameActions'),
	UIStore = require('../stores/UIStore'),
	FrameStore = require('../stores/FrameStore'),
	_ = (window._);

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
		console.log('CCCCCCCCCC ----> ', this.state.frame);

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

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../actions/UIActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js":[function(require,module,exports){
var React = (window.React),
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

        function connected(active) {
            var connected = '';
            if (active) {
                connected = '&bull; ';
            }
            return {__html: connected};
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
                    React.createElement("span", {className: "connected", dangerouslySetInnerHTML: connected(this.state.selectedFrame.active)}), 
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

},{"../actions/UIActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameList":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js":[function(require,module,exports){
var React = (window.React),
	FrameActions = require('../actions/FrameActions'),
    ContentStore = require('../stores/ContentStore'),
    FrameStore = require('../stores/FrameStore'),
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
		FrameActions.mirrorFrame(FrameStore.getSelectedVisibleFrame());
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

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/ContentStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js":[function(require,module,exports){
var conf = {
	domain: 'localhost',
	port: '8888',
	navbarH: 50
}

module.exports = conf;

},{}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js":[function(require,module,exports){
var keymirror = require('keymirror');

module.exports = keymirror({

	// frame action types
	FRAME_LOAD: null,
	FRAME_LOAD_DONE: null,
	FRAME_LOAD_FAIL: null,
	FRAME_LOAD_VISIBLE: null,
	FRAME_LOAD_VISIBLE_DONE: null,
	FRAME_LOAD_VISIBLE_FAIL: null,
	FRAME_SELECT: null,
	FRAME_UPDATE_CONTENT: null,
	FRAME_SETTINGS_CONTENT: null,
	FRAME_CONTENT_UPDATED: null,
	FRAME_CONNECT: null,
	FRAME_DISCONNECT: null,
	FRAME_SAVE: null,
	FRAME_SAVE_DONE: null,
	FRAME_SAVE_FAIL: null,
	FRAME_SLIDE_CHANGED: null,
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

	// UI action types
	UI_MENU_TOGGLE: null,
	UI_SET_SELECTION_PANEL: null,
	UI_OPEN_ADD_CONTENT: null,
	UI_CLOSE_ADD_CONTENT: null,
	UI_OPEN_SETTINGS: null,
	UI_CLOSE_SETTINGS: null,

	// emitted by stores
	CHANGE_EVENT: null
});

},{"keymirror":"/Users/jon/Projects/OpenFrame-Py/node_modules/keymirror/index.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js":[function(require,module,exports){
var Dispatcher = (window.Flux).Dispatcher;

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

},{}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/react-main.js":[function(require,module,exports){
var React = (window.React),
    $ = (window.jQuery),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager'),
    FastClick = (window.FastClick);

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

},{"./browser_state_manager":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/browser_state_manager.js","./components/App.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/App.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (window._).assign,
	_ = (window._);


var _content = [],
	_selected_content_id = null;


var ContentStore = assign({}, EventEmitter.prototype, {

	init: function(content) {
		_content = content;
		_selected_content_id = _content[0]._id;
		console.log('init', _selected_content_id);
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

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Users/jon/Projects/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (window._).assign,
	_ = (window._);


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

	initVisibleFrames: function(visibleFrames) {
		_visibleFrames = visibleFrames;
		_selected_visible_frame_id = _visibleFrames[0]._id;
		console.log('initVisibleFrames', _selected_visible_frame_id);
	},

	addVisibleFrame: function(frame) {
		_visibleFrames.push(frame);
		_selected_visible_frame_id = frame._id;
	},

	removeVisibleFrame: function(frame) {
		_visibleFrames = _.remove(_visibleFrames, {_id: frame._id});
	},

	getVisibleFrames: function() {
		return _visibleFrames;
	},

	getSelectedVisibleFrame: function() {
		return _.find(_visibleFrames, {'_id': _selected_visible_frame_id});
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

		case OFConstants.FRAME_LOAD_VISIBLE:
			console.log('loading visible frames...');
			break;

    	case OFConstants.FRAME_LOAD_VISIBLE_DONE:
    		console.log('visible frames loaded: ', action.frames);
			FrameStore.initVisibleFrames(action.frames);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_LOAD_VISIBLE_FAIL:
			console.log('visible frames failed to load: ', action.err);
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

		case OFConstants.FRAME_SLIDE_CHANGED:
			console.log('slide changed...', action);
			_selected_visible_frame_id = action.frame_id;
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

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Users/jon/Projects/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    EventEmitter = require('events').EventEmitter,
    OFConstants = require('../constants/OFConstants'),
    assign = (window._).assign,
    _ = (window._);


var _menuOpen = false,
    _settingsOpen = false,
    _addOpen = false,
    _settingsOpen = false,
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

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Users/jon/Projects/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}]},{},["/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/react-main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9GcmFtZUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1VJQWN0aW9ucy5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwaS9Tb2NrZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9icm93c2VyX3N0YXRlX21hbmFnZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FkZENvbnRlbnRGb3JtLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BZGRDb250ZW50TW9kYWwuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FwcC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQ29udGVudExpc3QuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0RyYXdlci5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRm9vdGVyTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9GcmFtZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVzTGlzdC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9OYXZGcmFtZUxpbmsuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGlzdC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvU2V0dGluZ3NNb2RhbC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvU2ltcGxlTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25maWcuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25zdGFudHMvT0ZDb25zdGFudHMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9yZWFjdC1tYWluLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0NvbnRlbnRTdG9yZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9GcmFtZVN0b3JlLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL1VJU3RvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0VBQzlCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSztHQUMzQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztFQUNwQixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7RUFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QixFQUFFOztDQUVELHdCQUF3QixFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQ3JDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSztHQUMzQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztFQUNwQixLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7RUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QixFQUFFOztDQUVELHVCQUF1QixFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQ3BDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTztHQUM3QixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztFQUNwQixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO0VBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkIsRUFBRTs7Q0FFRCxxQkFBcUIsRUFBRSxTQUFTLENBQUMsRUFBRTtFQUNsQyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUs7R0FDM0IsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7RUFDcEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQztFQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEVBQUU7O0NBRUQsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFO0VBQ3hCLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFB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O0FBRWxCLFFBQVEsUUFBUTs7R0FFYjtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHRhbGxfY29udGVudDogJy9jb250ZW50L3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBDb250ZW50QWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGNvbnRlbnQgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKi9cblx0bG9hZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudHMoKScpO1xuXHRcdC8vIGRpc3BhdGNoIGFuIGFjdGlvbiBpbmRpY2F0aW5nIHRoYXQgd2UncmUgbG9hZGluZyB0aGUgY29udGVudFxuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BREQsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoY29udGVudCksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdHVzZXJzX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUUsXG5cdHZpc2libGVfZnJhbWVzOiAnL2ZyYW1lcy92aXNpYmxlP3Y9MSdcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy51c2Vyc19mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lczogJywgZnJhbWVzKTtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkUsXG5cdFx0XHRcdFx0ZnJhbWVzOiBmcmFtZXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdC8vIGxvYWQgZmFpbHVyZSwgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZldGNoIGFsbCBmcmFtZXMgbWFya2VkICd2aXNpYmxlJ1xuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRWaXNpYmxlRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRVxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy52aXNpYmxlX2ZyYW1lcylcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnZnJhbWVzOiAnLCBmcmFtZXMpO1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNlbGVjdCBhIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGZyYW1lXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ3NlbGVjdCcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VMRUNULFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgY29udGVudCBvbiB0aGUgc2VsZWN0ZWQgZnJhbWUuXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29udGVudFxuXHQgKi9cblx0dXBkYXRlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdHZhciBmcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRcdGNvbnNvbGUubG9nKGZyYW1lLCBjb250ZW50KTtcblx0XHQvLyB2YXIgY29udGVudCA9IENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZV9pZDogZnJhbWUuX2lkLFxuICAgICAgICAgICAgY29udGVudF9pZDogY29udGVudC5faWRcbiAgICAgICAgfTtcbiAgICAgICAgU29ja2VyLnNlbmQoJ2ZyYW1lOnVwZGF0ZV9jb250ZW50JywgZGF0YSk7XG5cblx0XHQvLyBXZWJTb2NrZXQgZXZlbnQgaGFuZGxlciBmb3IgZnJhbWU6ZnJhbWVfdXBkYXRlZCB0cmlnZ2VycyB0aGUgZGlzcGF0Y2hcblx0fSxcblxuICAgIG1pcnJvckZyYW1lOiBmdW5jdGlvbihtaXJyb3JlZF9mcmFtZSkge1xuICAgICAgICB2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblxuICAgICAgICBpZiAoXy5pc0FycmF5KG1pcnJvcmVkX2ZyYW1lLm1pcnJvcmVkX2J5KSkge1xuICAgICAgICAgICAgbWlycm9yZWRfZnJhbWUubWlycm9yZWRfYnkucHVzaChmcmFtZS5faWQpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lX2lkOiBmcmFtZS5faWQsXG4gICAgICAgICAgICBtaXJyb3JlZF9mcmFtZV9pZDogbWlycm9yZWRfZnJhbWUuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTptaXJyb3JfZnJhbWUnLCBkYXRhKVxuICAgIH0sXG5cblx0c2F2ZUZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFLFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cbiAgICAgICAgLy8gaGFjayBzbyB0aGF0IHNlbGVjdGVkIGRvZXNuJ3QgZ2V0IHBlcnNpc3RlZFxuICAgICAgICBmcmFtZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvZnJhbWVzLycrZnJhbWUuX2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGZyYW1lKSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9ET05FLFxuXHRcdFx0XHRmcmFtZTogZnJhbWVcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRkFJTCxcblx0XHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZnJhbWUuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRmcmFtZUNvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0ZnJhbWVEaXNjb25uZWN0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIGRpc2Nvbm5lY3RlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZUNvbnRlbnRVcGRhdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb250ZW50IHVwZGF0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05URU5UX1VQREFURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuICAgIGZyYW1lTWlycm9yZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGcmFtZSBtaXJyb3JlZDogJywgZnJhbWUpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9NSVJST1JFRCxcbiAgICAgICAgICAgIGZyYW1lOiBmcmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHNldHVwOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGZyYW1lID0gZGF0YS5mcmFtZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFNldHVwJywgZnJhbWUpO1xuICAgICAgICAvLyB0aGlzIGlzIGEgbGl0dGxlIHdlaXJkIC0tIHdoeSBpc24ndCBzZXR1cCBqdXN0IHBhcnQgb2YgdGhlIGluaXRpYWxcbiAgICAgICAgLy8gY29ubmVjdGVkIGV2ZW50P1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWxseT8gRG9lcyB0aGUgdmlldyBkaW1lbnNpb24gbmVlZCB0byBiZSBwYXJ0IG9mIHRoZSBzdGF0ZT9cbiAgICAgKiBQcm9iYWJsZSBub3QuIE5vdCB1c2VkIHByZXNlbnRseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gdyBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBoIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIHNldHVwRnJhbWVWaWV3OiBmdW5jdGlvbih3LCBoKSB7XG4gICAgXHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VUVVBfVklFVyxcblx0XHRcdHc6IHcsXG5cdFx0XHRoOiBoXG5cdFx0fSk7XG4gICAgfSxcblxuICAgIHNsaWRlQ2hhbmdlZDogZnVuY3Rpb24oZnJhbWVfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0xJREVfQ0hBTkdFRCxcblx0XHRcdGZyYW1lX2lkOiBmcmFtZV9pZFxuXHRcdH0pO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUFjdGlvbnM7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuICAgIE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbnZhciBVSUFjdGlvbnMgPSB7XG5cbiAgICB0b2dnbGVNZW51OiBmdW5jdGlvbihvcGVuKSB7XG4gICAgICAgIC8vIGlmIG9wZW4gdHJ1ZSwgb3Blbi4gaWYgZmFsc2UsIGNsb3NlLlxuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEUsXG4gICAgICAgICAgICBvcGVuOiBvcGVuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVTZXR0aW5nczogZnVuY3Rpb24ob3Blbikge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfU0VUVElOR1NfVE9HR0xFLFxuICAgICAgICAgICAgb3Blbjogb3BlblxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0U2VsZWN0aW9uUGFuZWw6IGZ1bmN0aW9uKHBhbmVsKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9TRVRfU0VMRUNUSU9OX1BBTkVMLFxuICAgICAgICAgICAgcGFuZWw6IHBhbmVsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuQWRkQ29udGVudE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ29wZW5BZGRDb250ZW50TW9kYWwnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX09QRU5fQUREX0NPTlRFTlRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFkZENvbnRlbnRNb2RhbENsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdhZGRDb250ZW50TW9kYWxDbG9zZWQnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX0NMT1NFX0FERF9DT05URU5UXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuU2V0dGluZ3NNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdvcGVuU2V0dGluZ3NNb2RhbCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9TRVRUSU5HU1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3NNb2RhbENsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzZXR0aW5nc01vZGFsQ2xvc2VkJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9DTE9TRV9TRVRUSU5HU1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVSUFjdGlvbnM7IiwiU29ja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBfc2VsZiA9IHt9LFxuICAgICAgICBfZXZlbnRIYW5kbGVycyA9IHt9LFxuICAgICAgICBfY29ubmVjdGVkID0gZmFsc2UsXG4gICAgICAgIF9vcHRzID0ge1xuICAgICAgICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tJbnRlcnZhbDogMTAwMDBcbiAgICAgICAgfSxcbiAgICAgICAgX3VybCxcbiAgICAgICAgX3dzLFxuICAgICAgICBfdGltZXI7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSB3ZWJzb2NrZXQgY29ubmVjdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHVybCAgVGhlIHNlcnZlciBVUkwuXG4gICAgICogQHBhcmFtICB7b2JqZWN0fSBvcHRzIE9wdGlvbmFsIHNldHRpbmdzXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2Nvbm5lY3QodXJsLCBvcHRzKSB7XG4gICAgICAgIF91cmwgPSB1cmw7XG4gICAgICAgIGlmIChvcHRzKSBfZXh0ZW5kKF9vcHRzLCBvcHRzKTtcbiAgICAgICAgX3dzID0gbmV3IFdlYlNvY2tldCh1cmwpO1xuXG4gICAgICAgIF93cy5vbm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIG9wZW5lZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoX29wdHMub25PcGVuKSBfb3B0cy5vbk9wZW4oKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gY2xvc2VkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoX29wdHMub25DbG9zZSkgX29wdHMub25DbG9zZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldnQuZGF0YSksXG4gICAgICAgICAgICAgICAgbmFtZSA9IG1lc3NhZ2UubmFtZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbWVzc2FnZS5kYXRhO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggZXZlbnQgaGFuZGxlciwgY2FsbCB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9ldmVudEhhbmRsZXJzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdW2ldKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSArIFwiIGV2ZW50IG5vdCBoYW5kbGVkLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX29wdHMua2VlcEFsaXZlKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKF90aW1lcik7XG4gICAgICAgICAgICBfdGltZXIgPSBzZXRJbnRlcnZhbChfY2hlY2tDb25uZWN0aW9uLCBfb3B0cy5jaGVja0ludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXSA9IFtjYWxsYmFja107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vZmYobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBfZXZlbnRIYW5kbGVyc1tuYW1lXS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYW4gZXZlbnQuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBuYW1lIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGRhdGEgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX3NlbmQobmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLnNlbmQoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLiBJZiBub3QsIHRyeSB0byByZWNvbm5lY3QuXG4gICAgICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2NoZWNrQ29ubmVjdGlvbigpIHtcbiAgICAgICAgaWYgKCFfY29ubmVjdGVkKSB7XG4gICAgICAgICAgICBfY29ubmVjdChfdXJsLCBfb3B0cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVdGlsaXR5IGZ1bmN0aW9uIGZvciBleHRlbmRpbmcgYW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gb2JqIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2V4dGVuZChvYmopIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuXG4gICAgX3NlbGYub24gPSBfb247XG4gICAgX3NlbGYub2ZmID0gX29mZjtcbiAgICBfc2VsZi5zZW5kID0gX3NlbmQ7XG4gICAgX3NlbGYuY29ubmVjdCA9IF9jb25uZWN0O1xuICAgIHJldHVybiBfc2VsZjtcbn0pKCk7XG5cbi8vIENPTU1PTi5KU1xuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gU29ja2VyOyIsInZhciBzc20gPSByZXF1aXJlKCdzc20nKVxuXHRjb25mID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblxuZnVuY3Rpb24gX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50KCkge1xuXHRjb25zb2xlLmxvZygnX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50Jyk7XG5cblx0X3NldHVwU2NyZWVuU2l6ZSgpO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ3hzJyxcblx0ICAgIG1heFdpZHRoOiA3NjcsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciB4cycpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAneHMnO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdzbScsXG5cdCAgICBtaW5XaWR0aDogNzY4LFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgc20nKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ3NtJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnbWQnLFxuXHQgICAgbWluV2lkdGg6IDk5Mixcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIG1kJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdtZCc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ2xnJyxcblx0ICAgIG1pbldpZHRoOiAxMjAwLFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgbGcnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ2xnJztcblx0ICAgIH1cblx0fSk7XHRcblxuXHRzc20ucmVhZHkoKTtcbn1cblxuZnVuY3Rpb24gX3NldHVwU2NyZWVuU2l6ZSgpIHtcblx0Y29uZi53VyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRjb25mLndIID0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRjb25zb2xlLmxvZyhjb25mKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IF9pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudFxufVxuXG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpO1xuXG52YXIgQWRkQ29udGVudEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgaGFuZGxlRm9ybVN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciB1cmwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZTtcblxuICAgICAgICBpZiAoIXVybCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICB1c2VyczogW09GX1VTRVJOQU1FXVxuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnc3VibWl0dGluZyBjb250ZW50OiAnLCBjb250ZW50KTtcbiAgICAgICAgQ29udGVudEFjdGlvbnMuYWRkQ29udGVudChjb250ZW50KTtcblxuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZSA9ICcnO1xuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS5mb2N1cygpO1xuICAgIH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGhpZGRlbi14cyBhZGQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT1cImZvcm0taW5saW5lXCIgaWQ9XCJhZGQtZm9ybVwiIG9uU3VibWl0PXt0aGlzLmhhbmRsZUZvcm1TdWJtaXR9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8bGFiZWwgZm9yPVwiU2VuZFRvVXNlclwiPlVSTDwvbGFiZWw+ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBpZD1cIlVSTFwiIHBsYWNlaG9sZGVyPVwiZW50ZXIgVVJMXCIgcmVmPVwiVVJMXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1hZGQtY29udGVudFwiIGhyZWY9XCIjYWRkLWNvbnRlbnRcIiBpZD1cImFkZC1jb250ZW50LWJ1dHRvblwiPkFkZCBDb250ZW50PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZGRDb250ZW50Rm9ybTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIEFkZENvbnRlbnRNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWRkT3BlbjogZmFsc2Vcblx0XHR9XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub24oJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBcdGNvbnNvbGUubG9nKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICAgICAgXHR0aGF0Ll9yZXNldEZvcm0oKTtcbiAgICAgICAgXHRVSUFjdGlvbnMuYWRkQ29udGVudE1vZGFsQ2xvc2VkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFZlcnRpY2FsbHkgY2VudGVyIG1vZGFsc1xuXHRcdC8qIGNlbnRlciBtb2RhbCAqL1xuXHRcdGZ1bmN0aW9uIGNlbnRlck1vZGFscygpe1xuXHRcdCAgICAkKCcubW9kYWwnKS5lYWNoKGZ1bmN0aW9uKGkpe1xuXHRcdCAgICAgICAgdmFyICRjbG9uZSA9ICQodGhpcykuY2xvbmUoKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5hcHBlbmRUbygnYm9keScpO1xuXHRcdCAgICAgICAgdmFyIHRvcCA9IE1hdGgucm91bmQoKCRjbG9uZS5oZWlnaHQoKSAtICRjbG9uZS5maW5kKCcubW9kYWwtY29udGVudCcpLmhlaWdodCgpKSAvIDIpO1xuXHRcdCAgICAgICAgdG9wID0gdG9wID4gMCA/IHRvcCA6IDA7XG5cdFx0ICAgICAgICAkY2xvbmUucmVtb3ZlKCk7XG5cdFx0ICAgICAgICAkKHRoaXMpLmZpbmQoJy5tb2RhbC1jb250ZW50JykuY3NzKFwibWFyZ2luLXRvcFwiLCB0b3ApO1xuXHRcdCAgICB9KTtcblx0XHR9XG5cdFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignc2hvdy5icy5tb2RhbCcsIGNlbnRlck1vZGFscyk7XG5cdFx0Ly8gJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBjZW50ZXJNb2RhbHMpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVBZGRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5yZWZzLnVybC5nZXRET01Ob2RlKCkudmFsdWUsXG5cdFx0XHR0YWdzID0gdGhpcy5yZWZzLnRhZ3MuZ2V0RE9NTm9kZSgpLnZhbHVlO1xuXG5cdFx0aWYgKCF1cmwudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGFncyA9IHRhZ3MudHJpbSgpLnNwbGl0KCcjJyk7XG5cblx0XHRfLnJlbW92ZSh0YWdzLCBmdW5jdGlvbih0YWcpIHtcblx0XHRcdHJldHVybiB0YWcudHJpbSgpID09ICcnO1xuXHRcdH0pO1xuXG5cdFx0Xy5lYWNoKHRhZ3MsIGZ1bmN0aW9uKHRhZywgaSkge1xuXHRcdFx0dGFnc1tpXSA9IHRhZy50cmltKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zb2xlLmxvZyh0YWdzKTtcblxuXHRcdHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICB1c2VyczogW09GX1VTRVJOQU1FXSxcbiAgICAgICAgICAgIHRhZ3M6IHRhZ3NcbiAgICAgICAgfTtcblx0XHRDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG5cdH0sXG5cblx0X2hhbmRsZU9uRm9jdXM6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgZWwgPSBlLmN1cnJlbnRUYXJnZXQ7XG5cdFx0aWYgKGVsLnZhbHVlLnRyaW0oKSA9PSAnJykge1xuXHRcdFx0ZWwudmFsdWUgPSAnIyc7XG5cdFx0fVxuXHR9LFxuXG5cdF9oYW5kbGVUYWdzQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIGVsID0gZS5jdXJyZW50VGFyZ2V0LFxuXHRcdFx0dmFsID0gZWwudmFsdWU7XG5cblx0XHRpZiAoZWwudmFsdWUgPT0gJycpIHtcblx0XHRcdGVsLnZhbHVlID0gJyMnO1xuXHRcdH1cblxuXHRcdGlmICh2YWxbdmFsLmxlbmd0aC0xXSA9PT0gJyAnKSB7XG5cdFx0XHRlbC52YWx1ZSArPSAnIydcblx0XHR9XG5cdFx0Ly8gaGFjayBiZWNhdXNlIEkgY2FuJ3Qgc2VlbSB0byBnZXQgdGhlIGF1dG9jYXBpdGFsaXplPVwib2ZmXCIgdG8gd29ya1xuXHRcdC8vIGZvciB0aGUgdGFncyBmaWVsZCA/P1xuXHRcdGVsLnZhbHVlID0gZWwudmFsdWUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXHRfaGFuZGxlS2V5RG93bjogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBlLmN1cnJlbnRUYXJnZXQudmFsdWU7XG5cdFx0aWYgKHZhbFswXSAhPSAnIycpIHtcblx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbCA9ICcjJyArIHZhbDtcblxuXHRcdH1cblx0XHRpZiAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIHZhbCAhPT0gJyMnKSB7XG5cdFx0XHRpZiAodmFsW3ZhbC5sZW5ndGggLSAxXSA9PT0gJyMnKSB7XG5cdFx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbC5zdWJzdHJpbmcoMCwgdmFsLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfcmVzZXRGb3JtOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHRcdHRoaXMucmVmcy50YWdzLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRBZGRNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLmFkZE9wZW4pIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnaGlkZScpO1xuXHQgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsIGZhZGUgbW9kYWwtYWRkLWNvbnRlbnRcIiByZWY9XCJtb2RhbFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWRpYWxvZ1wiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHQgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWhlYWRlclwiPlxuXHRcdFx0XHQgICAgXHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwibW9kYWxcIiBhcmlhLWxhYmVsPVwiQ2xvc2VcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHQgICAgXHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0ICAgIFx0PGg0IGNsYXNzTmFtZT1cIm1vZGFsLXRpdGxlXCI+QWRkIENvbnRlbnQ8L2g0PlxuXHRcdFx0XHRcdCAgXHQ8L2Rpdj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtYm9keVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgVVJMPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ1cmxcIiB0eXBlPVwidXJsXCIgYXV0b2NhcGl0YWxpemU9XCJvZmZcIiBwbGFjZWhvbGRlcj1cImh0dHA6Ly8uLi5cIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyXCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1sYWJlbFwiPkVudGVyIGRlc2NyaXB0aW9uIHdpdGggdGFnczwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwidGFnc1wiIHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0YXV0b2NhcGl0YWxpemU9XCJvZmZcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRwbGFjZWhvbGRlcj1cIiNwaG90byAjUm9kY2hlbmtvICMxOTQxXCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25Gb2N1cz17dGhpcy5faGFuZGxlT25Gb2N1c31cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVRhZ3NDaGFuZ2V9XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdG9uS2V5RG93bj17dGhpcy5faGFuZGxlS2V5RG93bn0gLz5cblx0XHRcdFx0ICAgIFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVBZGRDb250ZW50fSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0QWRkIFRvIENvbGxlY3Rpb25cblx0XHRcdFx0ICAgIFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZGRDb250ZW50TW9kYWw7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXG5cdE5hdiA9IHJlcXVpcmUoJy4vTmF2LmpzJyksXG5cdFNpbXBsZU5hdiA9IHJlcXVpcmUoJy4vU2ltcGxlTmF2LmpzJyksXG5cdEZyYW1lID0gcmVxdWlyZSgnLi9GcmFtZS5qcycpLFxuXHRUcmFuc2ZlckJ1dHRvbnMgPSByZXF1aXJlKCcuL1RyYW5zZmVyQnV0dG9ucy5qcycpLFxuXHRBZGRDb250ZW50Rm9ybSA9IHJlcXVpcmUoJy4vQWRkQ29udGVudEZvcm0uanMnKSxcblx0Q29udGVudExpc3QgPSByZXF1aXJlKCcuL0NvbnRlbnRMaXN0LmpzJyksXG5cdEZyYW1lc0xpc3QgPSByZXF1aXJlKCcuL0ZyYW1lc0xpc3QuanMnKSxcblx0Rm9vdGVyTmF2ID0gcmVxdWlyZSgnLi9Gb290ZXJOYXYuanMnKSxcblx0RHJhd2VyID0gcmVxdWlyZSgnLi9EcmF3ZXIuanMnKSxcblx0QWRkQ29udGVudE1vZGFsID0gcmVxdWlyZSgnLi9BZGRDb250ZW50TW9kYWwuanMnKSxcblx0U2V0dGluZ3NNb2RhbCA9IHJlcXVpcmUoJy4vU2V0dGluZ3NNb2RhbC5qcycpLFxuXG5cdEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKSxcblxuXHRjb25mID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbi8qKlxuICogVGhlIEFwcCBpcyB0aGUgcm9vdCBjb21wb25lbnQgcmVzcG9uc2libGUgZm9yOlxuICogLSBzZXR0aW5nIHVwIHN0cnVjdHVyZSBvZiBjaGlsZCBjb21wb25lbnRzXG4gKlxuICogSW5kaXZpZHVhbCBjb21wb25lbnRzIHJlZ2lzdGVyIGZvciBTdG9yZSBzdGF0ZSBjaGFuZ2UgZXZlbnRzXG4gKi9cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGlvblBhbmVsOiBcImNvbGxlY3Rpb25cIlxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIWdsb2JhbC5PRl9VU0VSTkFNRSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ09GX1VTRVJOQU1FIG5vdCBkZWZpbmVkLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdFNvY2tlci5jb25uZWN0KFwid3M6Ly9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgXCIvYWRtaW4vd3MvXCIgKyBPRl9VU0VSTkFNRSk7XG5cblx0XHQvLyBUT0RPOiB0aGVzZSBzaG91bGQgbW92ZSB0byB0aGUgY29ycmVzcG9uZGluZyBBY3Rpb25zIGNyZWF0b3IgKGUuZy4gRnJhbWVBY3Rpb25zKVxuXHRcdFNvY2tlci5vbignZnJhbWU6Y29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lQ29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpkaXNjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVEaXNjb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmZyYW1lX3VwZGF0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb250ZW50VXBkYXRlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6c2V0dXAnLCBGcmFtZUFjdGlvbnMuc2V0dXApO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCdjb21wb25lbnREaWRNb3VudCcsICQoJy5uYXYtZm9vdGVyJykuaGVpZ2h0KCkpO1xuXHRcdC8vIGNvbnNvbGUubG9nKCdjb21wb25lbnREaWRNb3VudCcsIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5uYXZGb290ZXIpLm9mZnNldEhlaWdodCk7XG5cdFx0VUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cblx0fSxcblxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0VUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcGFuZWwgPSBVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKTtcblx0XHR0aGlzLnNldFN0YXRlKHBhbmVsKTtcblx0fSxcblxuICBcdHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgXHRcdHZhciBjb250ZW50TGlzdCA9IDxDb250ZW50TGlzdCAvPixcbiAgXHRcdFx0ZnJhbWVMaXN0ID0gPEZyYW1lc0xpc3QgLz47XG4gIFx0XHR2YXIgc2VsZWN0aW9uUGFuZWwgPSB0aGlzLnN0YXRlLnNlbGVjdGlvblBhbmVsID09PSAnY29sbGVjdGlvbicgPyBjb250ZW50TGlzdCA6IGZyYW1lTGlzdDtcblx0ICAgIHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGFpbmVyIGFwcCc+XG5cdFx0XHRcdDxTaW1wbGVOYXYgLz5cblx0XHRcdFx0PEZyYW1lIC8+XG5cdFx0XHRcdDxUcmFuc2ZlckJ1dHRvbnMgLz5cblx0XHRcdFx0PGRpdj57c2VsZWN0aW9uUGFuZWx9PC9kaXY+XG5cdFx0XHRcdDxGb290ZXJOYXYgcmVmPVwibmF2Rm9vdGVyXCIvPlxuXHRcdFx0XHQ8RHJhd2VyIC8+XG5cdFx0XHRcdDxTZXR0aW5nc01vZGFsIC8+XG5cdFx0XHRcdDxBZGRDb250ZW50TW9kYWwgLz5cblx0XHRcdDwvZGl2PlxuXHQgICAgKVxuICBcdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRTd2lwZXIgPSByZXF1aXJlKCdzd2lwZXInKSxcblx0Q29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyksXG5cdENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKTtcblxudmFyIENvbnRlbnRMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb250ZW50OiBbXVxuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Q29udGVudEFjdGlvbnMubG9hZENvbnRlbnQoKTtcblx0XHRDb250ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHRcdHRoaXMuX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMoKTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2NvbXBvbmVudERpZFVubW91bnQnKTtcblx0XHRDb250ZW50U3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcblxuICAgIH0sXG5cbiAgXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICBcdFx0dGhpcy5zZXRTdGF0ZSh7XG4gIFx0XHRcdGNvbnRlbnQ6IENvbnRlbnRTdG9yZS5nZXRDb250ZW50KClcbiAgXHRcdH0pO1xuXG4gIFx0XHQvLyBUT0RPOiBiZXR0ZXIgUmVhY3QgaW50ZWdyYXRpb24gZm9yIHRoZSBzd2lwZXJcblxuICBcdFx0aWYgKCF0aGlzLnN3aXBlcikge1xuICBcdFx0XHR0aGlzLl9pbml0U2xpZGVyKCk7XG4gIFx0XHR9XG5cbiAgXHRcdHRoaXMuX3BvcHVsYXRlU2xpZGVyKClcblxuXHRcdC8vIHZhciBzbGlkZV9pbmRleCA9ICQoJ2Rpdi5zd2lwZXItc2xpZGUnKS5sZW5ndGg7XG4gICAgICAgIHRoaXMuc3dpcGVyLnNsaWRlVG8oMCk7XG4gIFx0fSxcblxuICBcdF9pbml0U2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgXHRcdHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5Td2lwZXIpO1xuXHRcdHRoaXMuc3dpcGVyID0gbmV3IFN3aXBlcihlbCwge1xuXHQgICAgICAgIHNsaWRlc1BlclZpZXc6IDMsXG5cdCAgICAgICAgc3BhY2VCZXR3ZWVuOiA1MCxcblx0ICAgICAgICBjZW50ZXJlZFNsaWRlczogdHJ1ZSxcblx0ICAgICAgICAvLyBmcmVlTW9kZTogdHJ1ZSxcblx0ICAgICAgICAvLyBmcmVlTW9kZU1vbWVudHVtOiB0cnVlLFxuXHQgICAgICAgIC8vIGZyZWVNb2RlTW9tZW50dW1SYXRpbzogMC41LFxuXHQgICAgICAgIC8vIGZyZWVNb2RlU3RpY2t5OnRydWUsXG5cdCAgICAgICAgLy8gbG9vcDogdHJ1ZSxcblx0ICAgICAgICAvLyBsb29wZWRTbGlkZXM6IDUsXG5cdCAgICAgICAga2V5Ym9hcmRDb250cm9sOiB0cnVlLFxuXHQgICAgICAgIG9uU2xpZGVDaGFuZ2VFbmQ6IHRoaXMuX3NsaWRlQ2hhbmdlRW5kXG5cdCAgICB9KTtcbiAgXHR9LFxuXG4gIFx0X3BvcHVsYXRlU2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc3dpcGVyLnJlbW92ZUFsbFNsaWRlcygpO1xuICBcdFx0dGhpcy5zdGF0ZS5jb250ZW50LmZvckVhY2godGhpcy5fYWRkU2xpZGUpO1xuICBcdH0sXG5cbiAgXHRfYWRkU2xpZGU6IGZ1bmN0aW9uKGNvbnRlbnRJdGVtKSB7XG4gIFx0XHR2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwic3dpcGVyLXNsaWRlIGNvbnRlbnQtc2xpZGVcIiBkYXRhLWNvbnRlbnRpZD1cIicgKyBjb250ZW50SXRlbS5faWQgKyAnXCI+PGltZyBzcmM9JyArIGNvbnRlbnRJdGVtLnVybCArICcgLz48L2Rpdj4nXG5cdFx0ICB0aGlzLnN3aXBlci5wcmVwZW5kU2xpZGUoaHRtbCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICBcdFx0dGhpcy5zd2lwZXIuc2xpZGVUbyhpbmRleCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc2xpZGVyKSB7XG4gIFx0XHR2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICBcdFx0XHRjb250ZW50X2lkID0gc2xpZGUuZGF0YXNldC5jb250ZW50aWQ7XG4gIFx0XHRjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgY29udGVudF9pZCk7XG4gIFx0XHRDb250ZW50QWN0aW9ucy5zbGlkZUNoYW5nZWQoY29udGVudF9pZCk7XG4gIFx0fSxcblxuICAgIF91cGRhdGVDb250YWluZXJEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcbiAgICBcdGNvbnNvbGUubG9nKCdfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucycpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcylcbiAgICAgICAgICAgIGggPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgcGFkZGluZyA9IDQwLFxuICAgICAgICAgICAgbmV3SCA9IGggLSBwYWRkaW5nO1xuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBuZXdIKydweCc7XG4gICAgICAgIC8vIGNvbnRhaW5lci5zdHlsZS50b3AgPSAnMHB4JztcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlQ29udGVudFNsaWRlKGNvbnRlbnRJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY3JlYXRpbmcgc2xpZGU6ICcsIGNvbnRlbnRJdGVtKTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBrZXk9e2NvbnRlbnRJdGVtLl9pZC4kb2lkfSBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2NvbnRlbnRJdGVtLnVybH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLW91dGVyLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLWNvbnRhaW5lclwiIHJlZj1cIlN3aXBlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci13cmFwcGVyXCI+XG5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRMaXN0OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItbGVmdCdcblx0XHR9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0VUlBY3Rpb25zLnRvZ2dsZU1lbnUoZmFsc2UpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRNZW51U3RhdGUoKSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBiYXNlQ2xhc3MgPSAndmlzaWJsZS14cyBtZW51LWRyYXdlcic7XG5cdFx0dmFyIG9wZW5DbGFzcyA9IHRoaXMuc3RhdGUub3BlbiA/ICdtZW51LWRyYXdlci1vcGVuJyA6ICdtZW51LWRyYXdlci1jbG9zZWQnO1xuXHRcdHZhciBzaWRlQ2xhc3MgPSB0aGlzLnByb3BzLnNpZGVDbGFzcztcblx0XHR2YXIgZnVsbENsYXNzID0gW2Jhc2VDbGFzcywgb3BlbkNsYXNzLCBzaWRlQ2xhc3NdLmpvaW4oJyAnKTtcblxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtmdWxsQ2xhc3N9PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1lbnUtZHJhd2VyLWlubmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJvZi1uYXYtZml4ZWQgb2YtbmF2LWRyYXdlclwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ1c2VybmFtZSB0ZXh0LWNlbnRlclwiPntPRl9VU0VSTkFNRX08L2Rpdj5cblx0XHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IHZpc2libGUteHMgcHVsbC1yaWdodFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsb3NlTWVudUNsaWNrfSA+XG5cdFx0ICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE5hdkZyYW1lTGlzdCBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXdlcjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRm9vdGVyTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRVSUFjdGlvbnMudG9nZ2xlTWVudShmYWxzZSk7XG5cdH0sXG5cblx0X2hhbmRsZUNvbGxlY3Rpb25DbGljazogZnVuY3Rpb24oKSB7XG5cdFx0VUlBY3Rpb25zLnNldFNlbGVjdGlvblBhbmVsKFwiY29sbGVjdGlvblwiKTtcblx0fSxcblxuXHRfaGFuZGxlRnJhbWVzQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFVJQWN0aW9ucy5zZXRTZWxlY3Rpb25QYW5lbChcImZyYW1lc1wiKTtcblx0fSxcblxuXHRfaGFuZGxlQWRkQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFVJQWN0aW9ucy5vcGVuQWRkQ29udGVudE1vZGFsKCk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgfSxcblxuXHQvKipcblx0ICogVE9ETzogZmlndXJlIG91dCBzdGF0ZSBtYW5hZ2VtZW50LiBTdG9yZT9cblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uID0gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgb2YtbmF2LWZpeGVkIG9mLW5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWNvbGxlY3Rpb24gYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDb2xsZWN0aW9uQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY29sbGVjdGlvblwiPmNvbGxlY3Rpb248L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWZyYW1lc1wiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlRnJhbWVzQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZnJhbWVzXCI+ZnJhbWVzPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyLWFkZCBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENsaWNrfT4rPC9hPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblxuXHRcdHZhciBmcmFtZXMgPSAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItY29sbGVjdGlvblwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ29sbGVjdGlvbkNsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvbGxlY3Rpb25cIj5jb2xsZWN0aW9uPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1mcmFtZXMgYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVGcmFtZXNDbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJmcmFtZXNcIj5mcmFtZXM8L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdFx0dmFyIHBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbDtcblx0XHRjb25zb2xlLmxvZygnUEFORUw6ICcsIHRoaXMuc3RhdGUsIHBhbmVsKTtcblx0XHRyZXR1cm4gcGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbGxlY3Rpb24gOiBmcmFtZXM7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9vdGVyTmF2O1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBGcmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpO1xuXHRcdEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIj48L2Rpdj5cblx0XHR9XG5cdFx0dGhpcy53X2hfcmF0aW8gPSB0aGlzLnN0YXRlLmZyYW1lICYmIHRoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MgPyB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLndfaF9yYXRpbyA6IDE7XG5cblx0XHR2YXIgdXJsID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudCA/IHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50LnVybCA6ICcnO1xuXHRcdHZhciBkaXZTdHlsZSA9IHtcblx0XHRcdGJhY2tncm91bmRJbWFnZTogJ3VybCgnICsgdXJsICsgJyknLFxuXHRcdH07XG5cblx0XHRjb25zb2xlLmxvZyh0aGlzLndfaF9yYXRpbyk7XG5cblx0XHR2YXIgd2hTdHlsZSA9IHtcblx0XHRcdHBhZGRpbmdCb3R0b206ICgxL3RoaXMud19oX3JhdGlvKSAqIDEwMCArICclJ1xuXHRcdH07XG5cblx0XHR2YXIgYWN0aXZlID0gdGhpcy5zdGF0ZS5mcmFtZS5hY3RpdmUgPyAnKicgOiAnJztcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIiByZWY9XCJmcmFtZUNvbnRhaW5lclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14bC0xMiBmcmFtZS1vdXRlci1jb250YWluZXJcIiByZWY9XCJmcmFtZU91dGVyQ29udGFpbmVyXCI+XG5cdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi14cyBidG4tc2V0dGluZ3MgaGlkZVwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNteU1vZGFsXCI+UzwvYnV0dG9uPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZnJhbWUtaW5uZXItY29udGFpbmVyXCIgcmVmPVwiZnJhbWVJbm5lckNvbnRhaW5lclwiPlxuXHRcdCAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZVwiIHN0eWxlPXtkaXZTdHlsZX0gcmVmPVwiZnJhbWVcIi8+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG5cdFx0ICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHZhciBzZWxlY3RlZEZyYW1lID0gRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCk7XG4gIFx0XHRjb25zb2xlLmxvZygnc2VsZWN0ZWRGcmFtZTonLCBzZWxlY3RlZEZyYW1lKTtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRmcmFtZTogc2VsZWN0ZWRGcmFtZVxuICBcdFx0fSk7XG4gIFx0fSxcblxuICBcdF91cGRhdGVDb250YWluZXJEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcbiAgXHRcdHZhciBjb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzKSxcbiAgXHRcdFx0ZnJhbWVPdXRlckNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5mcmFtZU91dGVyQ29udGFpbmVyKSxcbiAgXHRcdFx0ZnJhbWVJbm5lckNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5mcmFtZUlubmVyQ29udGFpbmVyKSxcbiAgXHRcdFx0ZnJhbWUgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWUpLFxuXHRcdFx0dyA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aCxcblx0XHRcdGggPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuXHRcdFx0cGFkZGluZyA9IDUwLFxuXHRcdFx0bWF4VyA9IHcgLSAyKnBhZGRpbmcsXG5cdFx0XHRtYXhIID0gaCAtIDIqcGFkZGluZyxcblx0XHRcdGZyYW1lVywgZnJhbWVIO1xuXG5cdFx0aWYgKCh0aGlzLndfaF9yYXRpbyA+IDEgfHwgbWF4SCAqIHRoaXMud19oX3JhdGlvID4gbWF4VykgJiYgbWF4VyAvIHRoaXMud19oX3JhdGlvIDwgbWF4SCkge1xuXHRcdFx0Ly8gd2lkdGggPiBoZWlnaHQgb3IgdXNpbmcgZnVsbCBoZWlnaHQgd291bGQgZXh0ZW5kIGJleW9uZCBtYXhXXG5cdFx0XHRmcmFtZVcgPSBtYXhXO1xuXHRcdFx0ZnJhbWVIID0gKG1heFcgLyB0aGlzLndfaF9yYXRpbyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHdpZHRoIDwgaGVpZ2h0XG5cdFx0XHRmcmFtZUggPSBtYXhIO1xuXHRcdFx0ZnJhbWVXID0gKG1heEggKiB0aGlzLndfaF9yYXRpbyk7XG5cdFx0fVxuXG5cdFx0ZnJhbWUuc3R5bGUud2lkdGggPSBmcmFtZVcgKyAncHgnO1xuXHRcdGZyYW1lLnN0eWxlLmhlaWdodCA9IGZyYW1lSCArICdweCc7XG5cblx0XHRmcmFtZU91dGVyQ29udGFpbmVyLnN0eWxlLndpZHRoID0gbWF4VysncHgnO1xuXHRcdGZyYW1lSW5uZXJDb250YWluZXIuc3R5bGUudG9wID0gKChoIC0gZnJhbWVIKSAvIDIpICsgJ3B4Jztcblx0XHQvLyBmcmFtZUlubmVyQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGZyYW1lLnN0eWxlLmhlaWdodDtcblxuXG5cblx0XHRjb25zb2xlLmxvZygnZnJhbWVPdXRlckNvbnRhaW5lcjonLCBmcmFtZU91dGVyQ29udGFpbmVyKTtcblx0XHRjb25zb2xlLmxvZygnY29udGFpbmVyOicsIHcsIGgsIG1heFcsIG1heEgpO1xuICBcdH1cblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRTd2lwZXIgPSByZXF1aXJlKCdzd2lwZXInKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBGcmFtZXNMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuXHRcdFx0ZnJhbWVzOiBbXSxcbiAgICAgICAgICAgIGN1cnJlbnRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIG93bmVyOiAnJ1xuICAgICAgICAgICAgfVxuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0RnJhbWVBY3Rpb25zLmxvYWRWaXNpYmxlRnJhbWVzKCk7XG5cdFx0RnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICB9LFxuXG4gICAgX2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuU3dpcGVyKTtcbiAgICAgICAgdGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiAzLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiA1MCxcbiAgICAgICAgICAgIHByZWxvYWRJbWFnZXM6IHRydWUsXG4gICAgICAgICAgICBjZW50ZXJlZFNsaWRlczogdHJ1ZSxcbiAgICAgICAgICAgIGZyZWVNb2RlOiB0cnVlLFxuICAgICAgICAgICAgZnJlZU1vZGVNb21lbnR1bTogdHJ1ZSxcbiAgICAgICAgICAgIGZyZWVNb2RlTW9tZW50dW1SYXRpbzogLjI1LFxuICAgICAgICAgICAgZnJlZU1vZGVTdGlja3k6dHJ1ZSxcbiAgICAgICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZSxcbiAgICAgICAgICAgIG9uU2xpZGVDaGFuZ2VFbmQ6IHRoaXMuX3NsaWRlQ2hhbmdlRW5kXG4gICAgICAgIH0pO1xuXG5cbiAgICB9LFxuXG4gICAgX3BvcHVsYXRlU2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zd2lwZXIucmVtb3ZlQWxsU2xpZGVzKCk7XG4gICAgICAgIHRoaXMuc3RhdGUuZnJhbWVzLmZvckVhY2godGhpcy5fYWRkU2xpZGUpO1xuICAgIH0sXG5cbiAgICBfYWRkU2xpZGU6IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGN1cnJlbnQgY29udGVudCBzZXQgb24gdGhlIGZyYW1lLlxuICAgICAgICBpZiAoZnJhbWUuY3VycmVudF9jb250ZW50ICYmIGZyYW1lLmN1cnJlbnRfY29udGVudC51cmwpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gJycgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwic3dpcGVyLXNsaWRlIGZyYW1lLXNsaWRlXCIgZGF0YS1mcmFtZWlkPVwiJyArIGZyYW1lLl9pZCArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3JjPScgKyBmcmFtZS5jdXJyZW50X2NvbnRlbnQudXJsICsgJyAvPicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuXG4gICAgICAgICAgICB0aGlzLnN3aXBlci5hcHBlbmRTbGlkZShodG1sKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2xpZGVUbzogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgdGhpcy5zd2lwZXIuc2xpZGVUbyhpbmRleCk7XG4gICAgfSxcblxuICAgIF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc2xpZGVyKSB7XG4gICAgICAgIHZhciBzbGlkZSA9IHRoaXMuc3dpcGVyLnNsaWRlc1t0aGlzLnN3aXBlci5hY3RpdmVJbmRleF0sXG4gICAgICAgICAgICBmcmFtZV9pZCA9IHNsaWRlLmRhdGFzZXQuZnJhbWVpZDtcbiAgICAgICAgY29uc29sZS5sb2coJ19zbGlkZUNoYW5nZUVuZCcsIGZyYW1lX2lkKTtcbiAgICAgICAgRnJhbWVBY3Rpb25zLnNsaWRlQ2hhbmdlZChmcmFtZV9pZCk7XG4gICAgfSxcblxuICAgICBfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLnJlZnMuY29udGFpbmVyLmdldERPTU5vZGUoKSxcbiAgICAgICAgICAgIGggPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgcGFkZGluZyA9IDEwMCxcbiAgICAgICAgICAgIG5ld0ggPSBoIC0gcGFkZGluZztcblxuICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gbmV3SCsncHgnO1xuICAgICAgICAvLyBjb250YWluZXIuc3R5bGUudG9wID0gJzBweCc7XG4gICAgfSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0ZnJhbWVzOiBGcmFtZVN0b3JlLmdldFZpc2libGVGcmFtZXMoKSxcbiAgICAgICAgICAgIGN1cnJlbnRGcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZFZpc2libGVGcmFtZSgpXG4gIFx0XHR9KTtcblxuICBcdFx0Ly8gVE9ETzogYmV0dGVyIFJlYWN0IGludGVncmF0aW9uIGZvciB0aGUgc3dpcGVyXG4gICAgICAgIC8vIE1heWJlIGEgc2xpZGUgY29tcG9uZW50P1xuXG4gIFx0XHRpZiAoIXRoaXMuc3dpcGVyKSB7XG4gIFx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgXHRcdCAgICB0aGlzLl9wb3B1bGF0ZVNsaWRlcigpXG4gICAgICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKDApO1xuICAgICAgICB9XG4gIFx0fSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtaXJyb3JpbmdfY291bnQgPSAnJztcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50RnJhbWUgJiYgdGhpcy5zdGF0ZS5jdXJyZW50RnJhbWUubWlycm9yaW5nX2NvdW50KSB7XG4gICAgICAgICAgICBtaXJyb3JpbmdfY291bnQgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLXN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9mLWljb24tbWlycm9yXCI+PC9zcGFuPiB7dGhpcy5zdGF0ZS5jdXJyZW50RnJhbWUubWlycm9yaW5nX2NvdW50fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdtaXJyb3JpbmdfY291bnQ6ICcsIHRoaXMuc3RhdGUuY3VycmVudEZyYW1lLm1pcnJvcmluZ19jb3VudClcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItb3V0ZXItY29udGFpbmVyXCIgcmVmPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLWNvbnRhaW5lclwiIHJlZj1cIlN3aXBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItd3JhcHBlclwiPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmcmFtZS1zbGlkZS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtbmFtZVwiPnt0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLXVzZXJcIj5AIHt0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZS5vd25lcn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfY291bnR9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZXNMaXN0O1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpbmsgPSByZXF1aXJlKCcuL05hdkZyYW1lTGluaycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lczogW11cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGcmFtZUxpbmsoZnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZTogJywgZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBCcmFuZCBhbmQgdG9nZ2xlIGdldCBncm91cGVkIGZvciBiZXR0ZXIgbW9iaWxlIGRpc3BsYXkgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm5hdmJhci10b2dnbGUgY29sbGFwc2VkIHB1bGwtbGVmdFwiIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+VG9nZ2xlIG5hdmlnYXRpb248L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1tdXRlZCBoaWRkZW4teHNcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cImJzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIC8ubmF2YmFyLWNvbGxhcHNlICovfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKTtcblxudmFyIE5hdkZyYW1lTGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlRnJhbWVTZWxlY3Rpb246IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2VsZWN0KHRoaXMucHJvcHMuZnJhbWUpO1xuXHRcdGlmICh0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXIpIHtcblx0XHRcdHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcigpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmVDbGFzcyA9ICdub3QtY29ubmVjdGVkJyxcblx0XHRcdGFjdGl2ZVRleHQgPSAnbm90IGNvbm5lY3RlZCc7XG5cdFx0aWYgKHRoaXMucHJvcHMuZnJhbWUuYWN0aXZlKSB7XG5cdFx0XHRhY3RpdmVDbGFzcyA9IGFjdGl2ZVRleHQgPSAnY29ubmVjdGVkJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc1NlbGVjdGVkKHNlbGVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPyAnaWNvbi1jaGVjaycgOiAnc3BhY2UnO1xuICAgICAgICB9XG5cblx0XHR2YXIgY2xhc3NlcyA9ICdwdWxsLXJpZ2h0IHN0YXR1cyAnICsgYWN0aXZlQ2xhc3M7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBvbkNsaWNrPXt0aGlzLmhhbmRsZUZyYW1lU2VsZWN0aW9ufT5cblx0XHRcdFx0PGEgaHJlZj1cIiNcIj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2lzU2VsZWN0ZWQodGhpcy5wcm9wcy5mcmFtZS5zZWxlY3RlZCl9IC8+IHt0aGlzLnByb3BzLmZyYW1lLm5hbWV9XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPXtjbGFzc2VzfT57YWN0aXZlVGV4dH08L3NwYW4+XG5cdFx0XHRcdDwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaW5rOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG52YXIgTmF2RnJhbWVMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIFx0cmV0dXJuIHtcbiAgICBcdFx0ZXh0cmFDbGFzc2VzOiAnJyxcbiAgICBcdFx0aW5jbHVkZUxvZ291dDogdHJ1ZSxcbiAgICBcdFx0bGlua0NsaWNrSGFuZGxlcjogZnVuY3Rpb24oKSB7XG4gICAgXHRcdFx0Y29uc29sZS5sb2coJ2xpbmsgY2xpY2tlZCcpO1xuICAgIFx0XHR9XG4gICAgXHR9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gbGlua0NsaWNrSGFuZGxlcj17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSAvPlxuICAgICAgICB9XG5cblx0XHR2YXIgY2xhc3NlcyA9IHRoaXMucHJvcHMuZXh0cmFDbGFzc2VzICsgJyBuYXYtZnJhbWUtbGlzdCBkcmF3ZXItY29udGVudCc7XG5cblx0XHR2YXIgbG9nb3V0ID0gJyc7XG5cdFx0aWYgKHRoaXMucHJvcHMuaW5jbHVkZUxvZ291dCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2luY2x1ZGVMb2dvdXQnKTtcblx0XHRcdGxvZ291dCA9IChcblx0XHRcdFx0PGxpPlxuXHRcdFx0XHRcdDxhIG9uQ2xpY2s9e3RoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcn0gY2xhc3NOYW1lPVwiYnRuLWxvZ291dFwiIGhyZWY9XCIvbG9nb3V0XCI+bG9nIG91dDwvYT5cblx0XHRcdFx0PC9saT5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx1bCBjbGFzc05hbWU9e2NsYXNzZXN9IHJvbGU9XCJtZW51XCI+XG4gICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAge2xvZ291dH1cbiAgICAgICAgICAgIDwvdWw+XG5cdFx0KTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkZyYW1lTGlzdDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIFNldHRpbmdzTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNldHRpbmdzT3BlbjogZmFsc2UsXG5cdFx0XHRmcmFtZToge1xuXHRcdFx0XHRuYW1lOiAnJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICcnLFxuXHRcdFx0XHRzZXR0aW5nczoge1xuXHRcdFx0XHRcdHZpc2libGU6IHRydWUsXG5cdFx0XHRcdFx0cm90YXRpb246IDBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vblVJQ2hhbmdlKTtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkZyYW1lQ2hhbmdlKTtcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgICAgICBcdFVJQWN0aW9ucy5zZXR0aW5nc01vZGFsQ2xvc2VkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFZlcnRpY2FsbHkgY2VudGVyIG1vZGFsc1xuXHRcdC8qIGNlbnRlciBtb2RhbCAqL1xuXHRcdGZ1bmN0aW9uIGNlbnRlck1vZGFscygpe1xuXHRcdCAgICAkKCcubW9kYWwnKS5lYWNoKGZ1bmN0aW9uKGkpe1xuXHRcdCAgICAgICAgdmFyICRjbG9uZSA9ICQodGhpcykuY2xvbmUoKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5hcHBlbmRUbygnYm9keScpO1xuXHRcdCAgICAgICAgdmFyIHRvcCA9IE1hdGgucm91bmQoKCRjbG9uZS5oZWlnaHQoKSAtICRjbG9uZS5maW5kKCcubW9kYWwtY29udGVudCcpLmhlaWdodCgpKSAvIDIpO1xuXHRcdCAgICAgICAgdG9wID0gdG9wID4gMCA/IHRvcCA6IDA7XG5cdFx0ICAgICAgICAkY2xvbmUucmVtb3ZlKCk7XG5cdFx0ICAgICAgICAkKHRoaXMpLmZpbmQoJy5tb2RhbC1jb250ZW50JykuY3NzKFwibWFyZ2luLXRvcFwiLCB0b3ApO1xuXHRcdCAgICB9KTtcblx0XHR9XG5cdFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignc2hvdy5icy5tb2RhbCcsIGNlbnRlck1vZGFscyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uVUlDaGFuZ2UpO1xuICAgICAgICBGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uRnJhbWVDaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9mZignaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgfSxcblxuXHRfaGFuZGxlTmFtZUNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUubmFtZSA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlRGVzY3JpcHRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLmRlc2NyaXB0aW9uID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC5jaGVja2VkLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLnNldHRpbmdzLnZpc2libGUgPSB2YWw7XG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0X2hhbmRsZVJvdGF0aW9uQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHN0YXRlID0gdGhpcy5zdGF0ZTtcblx0XHRzdGF0ZS5mcmFtZS5zZXR0aW5ncy5yb3RhdGlvbiA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlU2F2ZTogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy5zYXZlRnJhbWUodGhpcy5zdGF0ZS5mcmFtZSk7XG5cdH0sXG5cblx0X29uVUlDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFVJU3RvcmUuZ2V0U2V0dGluZ3NNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLnNldHRpbmdzT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uRnJhbWVDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgXHRmcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKClcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDQ0NDQ0NDQ0NDIC0tLS0+ICcsIHRoaXMuc3RhdGUuZnJhbWUpO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1zZXR0aW5nc1wiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5TZXR0aW5nczwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+TmFtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwibmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUubmFtZX0gb25DaGFuZ2U9e3RoaXMuX2hhbmRsZU5hbWVDaGFuZ2V9IC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RGVzY3JpcHRpb24gKG9wdGlvbmFsKTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPlVzZWZ1bCBpZiB5b3VyIGZyYW1lIGZvbGxvd3MgYSB0aGVtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdHJlZj1cImRlc2NyaXB0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLmRlc2NyaXB0aW9ufVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZURlc2NyaXB0aW9uQ2hhbmdlfVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0cGxhY2Vob2xkZXI9XCJlLmcuIGphcGFuZXNlIGFydCwgOTBzIHBvc3RlcnNcIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTlcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+VmlzaWJsZSB0byBvdGhlciBwZW9wbGU8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsLXN1YnRleHRcIj5Zb3VyIGZyYW1lIHdpbGwgYXBwZWFyIG9uIEZyYW1lcyBhbmQgb3RoZXJzIGNhbiBtaXJyb3IgaXQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtM1wiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXQtY2hlY2tib3hcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInZpc2liaWxpdHlcIiB0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0Y2hlY2tlZD17dGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy52aXNpYmxlfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVZpc2liaWxpdHlDaGFuZ2V9Lz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkIHJvdy1mb3JtLWZpZWxkLXJvdGF0aW9uXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0tbGFiZWxcIj5Sb3RhdGlvbjwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNiBmb3JtLWlucHV0LXNlbGVjdFwiPlxuXHRcdFx0XHRcdCAgICBcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJyb3RhdGlvblwiXG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mucm90YXRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVJvdGF0aW9uQ2hhbmdlfSA+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwXCI+MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTYXZlfSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0U2F2ZVxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzTW9kYWw7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpc3QgPSByZXF1aXJlKCcuL05hdkZyYW1lTGlzdCcpLFxuICAgIFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cblxudmFyIFNpbXBsZU5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBtaXJyb3Jpbmc6IG51bGwsXG4gICAgICAgICAgICAgICAgbWlycm9yaW5nX2NvdW50OiBudWxsLFxuICAgICAgICAgICAgICAgIG1pcnJvcl9tZXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBvd25lcjogJydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZyYW1lTmFtZSA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5uYW1lLFxuICAgICAgICAgICAgbWlycm9yaW5nID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLm1pcnJvcmluZyxcbiAgICAgICAgICAgIG1pcnJvcl9tZXRhID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLm1pcnJvcl9tZXRhLFxuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb250ZW50ID0gJycsXG4gICAgICAgICAgICBtaXJyb3JpbmdfY291bnQgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubWlycm9yaW5nX2NvdW50O1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbm5lY3RlZChhY3RpdmUpIHtcbiAgICAgICAgICAgIHZhciBjb25uZWN0ZWQgPSAnJztcbiAgICAgICAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0ZWQgPSAnJmJ1bGw7ICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge19faHRtbDogY29ubmVjdGVkfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtaXJyb3JpbmdfY291bnQpIHtcbiAgICAgICAgICAgIG1pcnJvcmluZ19pY29uID0gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9mLWljb24tbWlycm9yXCI+PC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb250ZW50ID0gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1pcnJvcmluZy1tZXRhXCI+e21pcnJvcmluZ19jb3VudH08L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1pcnJvcmluZykge1xuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLW1ldGFcIj5Ae21pcnJvcl9tZXRhLm93bmVyfSA6IHttaXJyb3JfbWV0YS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuXG5cblxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9mLW5hdi1maXhlZCBvZi1uYXYtdG9wXCI+XG4gICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImZyYW1lLW5hbWUgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29ubmVjdGVkXCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e2Nvbm5lY3RlZCh0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUuYWN0aXZlKX0gLz5cbiAgICAgICAgICAgICAgICAgICAge2ZyYW1lTmFtZX1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfaWNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHttaXJyb3JpbmdfY29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvaDY+XG5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tbWVudSB2aXNpYmxlLXhzIHB1bGwtbGVmdFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5NZW51Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWhhbWJ1cmdlclwiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgYnRuLXNldHRpbmcgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3BlblNldHRpbmdzfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jb2dcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14cyBwdWxsLWxlZnRcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuXG5cbiAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXYgbmF2YmFyLXJpZ2h0IGhpZGRlbi14c1wiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwiZHJvcGRvd25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHJvbGU9XCJidXR0b25cIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj5GcmFtZXMgPHNwYW4gY2xhc3NOYW1lPVwiY2FyZXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxOYXZGcmFtZUxpc3QgZXh0cmFDbGFzc2VzPVwiZHJvcGRvd24tbWVudVwiIGluY2x1ZGVMb2dvdXQ9e2ZhbHNlfS8+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjc2V0dGluZ3NcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVPcGVuU2V0dGluZ3N9PlNldHRpbmdzPC9hPlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiL2xvZ291dFwiPkxvZyBPdXQ8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlT3Blbk1lbnVDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5NZW51Q2xpY2snKTtcbiAgICAgICAgVUlBY3Rpb25zLnRvZ2dsZU1lbnUodHJ1ZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuU2V0dGluZ3M6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ19oYW5kbGVPcGVuU2V0dGluZ3MnKTtcbiAgICAgICAgVUlBY3Rpb25zLm9wZW5TZXR0aW5nc01vZGFsKCk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcrKysrKysgZ2V0IHNlbGVjdGVkIGZyYW1lJywgRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG4gICAgQ29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKTtcblxudmFyIFRyYW5zZmVyQnV0dG9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2VsZWN0aW9uUGFuZWw6IFwiY29sbGVjdGlvblwiXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRTZWxlY3Rpb25QYW5lbFN0YXRlKCkpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlU2VuZENsaWNrZWQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ19oYW5kbGVTZW5kQ2xpY2tlZCcsIENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKSk7XG4gICAgICAgIEZyYW1lQWN0aW9ucy51cGRhdGVDb250ZW50KENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKSk7XG4gICAgfSxcblxuXHRfaGFuZGxlTWlycm9yQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU1pcnJvckNsaWNrZWQnKTtcblx0XHRGcmFtZUFjdGlvbnMubWlycm9yRnJhbWUoRnJhbWVTdG9yZS5nZXRTZWxlY3RlZFZpc2libGVGcmFtZSgpKTtcblx0fSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpY29uLCBoYW5kbGVyO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbCA9PT0gJ2NvbGxlY3Rpb24nKSB7XG4gICAgICAgICAgICBpY29uID0gJ2ljb24tdXAnO1xuICAgICAgICAgICAgaGFuZGxlciA9IHRoaXMuX2hhbmRsZVNlbmRDbGlja2VkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWNvbiA9ICdvZi1pY29uLW1pcnJvcic7XG4gICAgICAgICAgICBoYW5kbGVyID0gdGhpcy5faGFuZGxlTWlycm9yQ2xpY2tlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgdHJhbnNmZXItYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnRuLWdyb3VwXCIgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIi4uLlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIiBvbkNsaWNrPXtoYW5kbGVyfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2ljb259IGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPiAqL31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZmVyQnV0dG9ucztcbiIsInZhciBjb25mID0ge1xuXHRkb21haW46ICdsb2NhbGhvc3QnLFxuXHRwb3J0OiAnODg4OCcsXG5cdG5hdmJhckg6IDUwXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZjsiLCJ2YXIga2V5bWlycm9yID0gcmVxdWlyZSgna2V5bWlycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5bWlycm9yKHtcblxuXHQvLyBmcmFtZSBhY3Rpb24gdHlwZXNcblx0RlJBTUVfTE9BRDogbnVsbCxcblx0RlJBTUVfTE9BRF9ET05FOiBudWxsLFxuXHRGUkFNRV9MT0FEX0ZBSUw6IG51bGwsXG5cdEZSQU1FX0xPQURfVklTSUJMRTogbnVsbCxcblx0RlJBTUVfTE9BRF9WSVNJQkxFX0RPTkU6IG51bGwsXG5cdEZSQU1FX0xPQURfVklTSUJMRV9GQUlMOiBudWxsLFxuXHRGUkFNRV9TRUxFQ1Q6IG51bGwsXG5cdEZSQU1FX1VQREFURV9DT05URU5UOiBudWxsLFxuXHRGUkFNRV9TRVRUSU5HU19DT05URU5UOiBudWxsLFxuXHRGUkFNRV9DT05URU5UX1VQREFURUQ6IG51bGwsXG5cdEZSQU1FX0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX0RJU0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX1NBVkU6IG51bGwsXG5cdEZSQU1FX1NBVkVfRE9ORTogbnVsbCxcblx0RlJBTUVfU0FWRV9GQUlMOiBudWxsLFxuXHRGUkFNRV9TTElERV9DSEFOR0VEOiBudWxsLFxuXHRGUkFNRV9NSVJST1JFRDogbnVsbCxcblxuXHQvLyBjb250ZW50IGFjdGlvbiB0eXBlc1xuXHRDT05URU5UX0xPQUQ6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9ET05FOiBudWxsLFxuXHRDT05URU5UX0xPQURfRkFJTDogbnVsbCxcblx0Q09OVEVOVF9TRU5EOiBudWxsLFxuXHRDT05URU5UX1NMSURFX0NIQU5HRUQ6IG51bGwsXG5cdENPTlRFTlRfQUREOiBudWxsLFxuXHRDT05URU5UX0FERF9ET05FOiBudWxsLFxuXHRDT05URU5UX0FERF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRE9ORTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRkFJTDogbnVsbCxcblxuXHQvLyBVSSBhY3Rpb24gdHlwZXNcblx0VUlfTUVOVV9UT0dHTEU6IG51bGwsXG5cdFVJX1NFVF9TRUxFQ1RJT05fUEFORUw6IG51bGwsXG5cdFVJX09QRU5fQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX0NMT1NFX0FERF9DT05URU5UOiBudWxsLFxuXHRVSV9PUEVOX1NFVFRJTkdTOiBudWxsLFxuXHRVSV9DTE9TRV9TRVRUSU5HUzogbnVsbCxcblxuXHQvLyBlbWl0dGVkIGJ5IHN0b3Jlc1xuXHRDSEFOR0VfRVZFTlQ6IG51bGxcbn0pOyIsInZhciBEaXNwYXRjaGVyID0gcmVxdWlyZSgnZmx1eCcpLkRpc3BhdGNoZXI7XG5cbnZhciBBcHBEaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcblxuLyoqXG4qIEEgYnJpZGdlIGZ1bmN0aW9uIGJldHdlZW4gdGhlIHZpZXdzIGFuZCB0aGUgZGlzcGF0Y2hlciwgbWFya2luZyB0aGUgYWN0aW9uXG4qIGFzIGEgdmlldyBhY3Rpb24uICBBbm90aGVyIHZhcmlhbnQgaGVyZSBjb3VsZCBiZSBoYW5kbGVTZXJ2ZXJBY3Rpb24uXG4qIEBwYXJhbSAge29iamVjdH0gYWN0aW9uIFRoZSBkYXRhIGNvbWluZyBmcm9tIHRoZSB2aWV3LlxuKi9cbkFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXHRhY3Rpb24uc291cmNlID0gJ1ZJRVdfQUNUSU9OJztcblx0dGhpcy5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5cbi8qKlxuKiBBIGJyaWRnZSBmdW5jdGlvbiBiZXR3ZWVuIHRoZSBzZXJ2ZXIgYW5kIHRoZSBkaXNwYXRjaGVyLCBtYXJraW5nIHRoZSBhY3Rpb25cbiogYXMgYSBzZXJ2ZXIgYWN0aW9uLlxuKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbiBUaGUgZGF0YSBjb21pbmcgZnJvbSB0aGUgc2VydmVyLlxuKi9cbkFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uID0gZnVuY3Rpb24oYWN0aW9uKSB7XG5cdGFjdGlvbi5zb3VyY2UgPSAnU0VSVkVSX0FDVElPTic7XG5cdHRoaXMuZGlzcGF0Y2goYWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBcHBEaXNwYXRjaGVyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIEFwcCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9BcHAuanMnKSxcbiAgICBicm93c2VyX3N0YXRlID0gcmVxdWlyZSgnLi9icm93c2VyX3N0YXRlX21hbmFnZXInKSxcbiAgICBGYXN0Q2xpY2sgPSByZXF1aXJlKCdmYXN0Y2xpY2snKTtcblxuLy8gaW5pdCBqYXZhc2NyaXB0IG1lZGlhIHF1ZXJ5LWxpa2Ugc3RhdGUgZGV0ZWN0aW9uXG5icm93c2VyX3N0YXRlLmluaXQoKTtcblxuLy8gVHVybiBvbiB0b3VjaCBldmVudHMgZm9yIFJlYWN0LlxuLy8gUmVhY3QuaW5pdGlhbGl6ZVRvdWNoRXZlbnRzKHRydWUpO1xuXG4vLyBGYXN0Q2xpY2sgcmVtb3ZlcyB0aGUgMzAwcyBkZWxheSBvbiBzdHVwaWQgaU9TIGRldmljZXNcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdhdHRhY2hpbmcgRmFzdENsaWNrJyk7XG5cdEZhc3RDbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG59KTtcblxuUmVhY3QucmVuZGVyKFxuXHQ8QXBwIC8+LFxuXHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnT3BlbkZyYW1lJylcbikiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfY29udGVudCA9IFtdLFxuXHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IG51bGw7XG5cblxudmFyIENvbnRlbnRTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IGNvbnRlbnQ7XG5cdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBfY29udGVudFswXS5faWQ7XG5cdFx0Y29uc29sZS5sb2coJ2luaXQnLCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdH0sXG5cblx0YWRkQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50LnB1c2goY29udGVudCk7XG5cdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBjb250ZW50Ll9pZDtcblx0fSxcblxuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQgPSBfLnJlbW92ZShfY29udGVudCwge19pZDogY29udGVudC5faWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHRnZXRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2NvbnRlbnQ7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyBjb25zb2xlLmxvZygnZ2V0U2VsZWN0ZWRDb250ZW50OicsIF9jb250ZW50LCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdFx0cmV0dXJuIF8uZmluZChfY29udGVudCwgeydfaWQnOiBfc2VsZWN0ZWRfY29udGVudF9pZH0pO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG5cbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgbG9hZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuaW5pdChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRDpcblx0XHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjaGFuZ2VkLi4uJyk7XG5cdFx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGFjdGlvbi5jb250ZW50X2lkO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREOlxuXHRcdFx0Y29uc29sZS5sb2coJ2FkZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBhZGRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmFkZENvbnRlbnQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGJlIGFkZGVkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcblxuXHRcdFx0Ly8gQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgfVxuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1k6XG5cdCAgICAvLyAgIGRlc3Ryb3koYWN0aW9uLmlkKTtcblx0ICAgIC8vICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZX0NPTVBMRVRFRDpcblx0ICAgIC8vICAgZGVzdHJveUNvbXBsZXRlZCgpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudFN0b3JlOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9mcmFtZXMgPSB7fSxcblx0Ly8gdGhlc2UgdHdvIGFyZSBmb3IgdGhlIHN3aXBlciBvZiB2aXNpYmxlIGZyYW1lczpcblx0X3Zpc2libGVGcmFtZXMgPSBbXSxcblx0X3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQgPSBudWxsOztcblxudmFyIGFkZEZyYW1lID0gZnVuY3Rpb24oZnJhbWUsIHNlbGVjdCkge1xuXHRfZnJhbWVzW2ZyYW1lLl9pZF0gPSBmcmFtZTtcblx0aWYgKHNlbGVjdCAhPT0gZmFsc2UpIHNlbGVjdEZyYW1lKGZyYW1lKTtcbn1cblxudmFyIHJlbW92ZUZyYW1lID0gZnVuY3Rpb24oZnJhbWUpe1xuXHRjb25zb2xlLmxvZygncmVtb3ZlRnJhbWUnLCBmcmFtZSk7XG5cdHZhciBpZCA9IGZyYW1lLl9pZDtcblx0aWYgKGlkIGluIF9mcmFtZXMpIGRlbGV0ZSBfZnJhbWVzW2lkXTtcblx0Y29uc29sZS5sb2coX2ZyYW1lcyk7XG59O1xuXG52YXIgc2VsZWN0RnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuXHRjb25zb2xlLmxvZygnc2VsZWN0RnJhbWU6ICcsIGZyYW1lKTtcblxuXHQvLyB1bnNlbGVjdCBjdXJyZW50bHkgc2VsZWN0ZWRcblx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0aWYgKHNlbGVjdGVkRnJhbWUpIHtcblx0XHRzZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gZmFsc2U7XG5cdH1cblxuXHQvLyBub3cgc2V0IHRoZSBuZXcgc2VsZWN0ZWQgZnJhbWVcblx0dmFyIF9zZWxlY3RlZEZyYW1lID0gXy5maW5kKF9mcmFtZXMsIHtfaWQ6IGZyYW1lLl9pZH0pO1xuXHRfc2VsZWN0ZWRGcmFtZS5zZWxlY3RlZCA9IHRydWU7XG59XG5cbnZhciBGcmFtZVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0Xy5lYWNoKGZyYW1lcywgYWRkRnJhbWUpO1xuXG5cdFx0Ly8gc2VlIGlmIGFueSBmcmFtZSBpcyBtYXJrZWQgYXMgc2VsZWN0ZWQgZnJvbSBkYixcblx0XHQvLyBvdGhlcndpc2Ugc2VsZWN0IHRoZSBmaXJzdCBmcmFtZS5cblx0XHRpZiAoIV8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KSkge1xuXHRcdFx0Xy5zYW1wbGUoX2ZyYW1lcykuc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXG5cdGdldEZyYW1lOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiBfZnJhbWVzW2lkXTtcblx0fSxcblxuXHRnZXRBbGxGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdnZXRBbGxGcmFtZXM6ICcsIF9mcmFtZXMpO1xuXHRcdHJldHVybiBfLm1hcChfZnJhbWVzLCBmdW5jdGlvbihmcmFtZSkge1xuXHRcdFx0cmV0dXJuIGZyYW1lO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkRnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmZpbmQoX2ZyYW1lcywge3NlbGVjdGVkOiB0cnVlfSk7XG5cdH0sXG5cblx0Z2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRmcmFtZXM6IF9mcmFtZXMsXG5cdFx0XHRzZWxlY3RlZEZyYW1lOiB0aGlzLmdldFNlbGVjdGVkRnJhbWUoKVxuXHRcdH07XG5cdH0sXG5cblx0aW5pdFZpc2libGVGcmFtZXM6IGZ1bmN0aW9uKHZpc2libGVGcmFtZXMpIHtcblx0XHRfdmlzaWJsZUZyYW1lcyA9IHZpc2libGVGcmFtZXM7XG5cdFx0X3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQgPSBfdmlzaWJsZUZyYW1lc1swXS5faWQ7XG5cdFx0Y29uc29sZS5sb2coJ2luaXRWaXNpYmxlRnJhbWVzJywgX3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQpO1xuXHR9LFxuXG5cdGFkZFZpc2libGVGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRfdmlzaWJsZUZyYW1lcy5wdXNoKGZyYW1lKTtcblx0XHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IGZyYW1lLl9pZDtcblx0fSxcblxuXHRyZW1vdmVWaXNpYmxlRnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0X3Zpc2libGVGcmFtZXMgPSBfLnJlbW92ZShfdmlzaWJsZUZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG5cdH0sXG5cblx0Z2V0VmlzaWJsZUZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF92aXNpYmxlRnJhbWVzO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkVmlzaWJsZUZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5maW5kKF92aXNpYmxlRnJhbWVzLCB7J19pZCc6IF9zZWxlY3RlZF92aXNpYmxlX2ZyYW1lX2lkfSk7XG5cdH0sXG5cblx0ZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgaGFzIGNvbm5lY3RlZC4gU2ltcGx5IHVwZGF0ZWQgdGhlIGZyYW1lIG9iamVjdCBpbiBvdXIgY29sbGVjdGlvbi5cblx0ICovXG5cdGNvbm5lY3RGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHQvLyBhZGRGcmFtZSB3aWxsIG92ZXJ3cml0ZSBwcmV2aW91cyBmcmFtZVxuXHRcdGNvbnNvbGUubG9nKCdjb25uZWN0RnJhbWU6ICcsIGZyYW1lKTtcblx0XHRhZGRGcmFtZShmcmFtZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgaGFzIGRpc2Nvbm5lY3RlZC4gU2ltcGx5IHVwZGF0ZWQgdGhlIGZyYW1lIG9iamVjdCBpbiBvdXIgY29sbGVjdGlvbi5cblx0ICovXG5cdGRpc2Nvbm5lY3RGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHQvLyBhZGRGcmFtZSB3aWxsIG92ZXJ3cml0ZSBwcmV2aW91cyBmcmFtZVxuXHRcdGFkZEZyYW1lKGZyYW1lLCBmYWxzZSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcblxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgZnJhbWVzLi4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuaW5pdChhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRTpcblx0XHRcdGNvbnNvbGUubG9nKCdsb2FkaW5nIHZpc2libGUgZnJhbWVzLi4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ3Zpc2libGUgZnJhbWVzIGxvYWRlZDogJywgYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRGcmFtZVN0b3JlLmluaXRWaXNpYmxlRnJhbWVzKGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9WSVNJQkxFX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygndmlzaWJsZSBmcmFtZXMgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQ6XG5cdFx0XHRGcmFtZVN0b3JlLmRpc2Nvbm5lY3RGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TRUxFQ1Q6XG4gICAgXHRcdHNlbGVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TTElERV9DSEFOR0VEOlxuXHRcdFx0Y29uc29sZS5sb2coJ3NsaWRlIGNoYW5nZWQuLi4nLCBhY3Rpb24pO1xuXHRcdFx0X3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQgPSBhY3Rpb24uZnJhbWVfaWQ7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG4gICAgXHRcdEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpLmNvbnRlbnQgPSBhY3Rpb24uY29udGVudDtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRDpcblx0XHRcdC8vIGFkZGluZyB0aGUgdXBkYXRlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX01JUlJPUkVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcblx0XHRcdC8vIGFkZGluZyB0aGUgc2F2ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0RPTkU6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHQvLyBub29wIChvcHRpbWlzdGljIHVpIHVwZGF0ZSBhbHJlYWR5IGhhcHBlbmVkIG9uIEZSQU1FX1NBVkUpXG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9GQUlMOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmYWlsZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdC8vIFRPRE86IGhhbmRsZSB0aGlzIGJ5IHJldmVydGluZyAoaW1tdXRhYmxlLmpzIHdvdWxkIGhlbHApXG5cdFx0XHRjb25zb2xlLmxvZygnZmFpbGVkIHRvIHNhdmUgZnJhbWUnLCBhY3Rpb24uZnJhbWUpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lU3RvcmU7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcbiAgICBPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuICAgIGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9tZW51T3BlbiA9IGZhbHNlLFxuICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZSxcbiAgICBfYWRkT3BlbiA9IGZhbHNlLFxuICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZSxcbiAgICBfc2VsZWN0aW9uUGFuZWwgPSBcImNvbGxlY3Rpb25cIjtcblxudmFyIF90b2dnbGVNZW51ID0gZnVuY3Rpb24ob3Blbikge1xuICAgIF9tZW51T3BlbiA9ICEhb3Blbjtcbn1cblxuXG52YXIgVUlTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG4gICAgZ2V0TWVudVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wZW46IF9tZW51T3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZXR0aW5nc1N0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wZW46IF9zZXR0aW5nc09wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2VsZWN0aW9uUGFuZWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZWxlY3Rpb25QYW5lbDogX3NlbGVjdGlvblBhbmVsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEFkZE1vZGFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWRkT3BlbjogX2FkZE9wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2V0dGluZ3NNb2RhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz09PT09PT09JywgX3NldHRpbmdzT3Blbik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXR0aW5nc09wZW46IF9zZXR0aW5nc09wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuICAgIH0sXG5cbiAgICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH0sXG5cbiAgICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgICBzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZU1lbnUoYWN0aW9uLm9wZW4pO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZVNldHRpbmdzKCk7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfU0VUX1NFTEVDVElPTl9QQU5FTDpcbiAgICAgICAgICAgIF9zZWxlY3Rpb25QYW5lbCA9IGFjdGlvbi5wYW5lbDtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX0FERF9DT05URU5UOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX0FERF9DT05URU5UOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfT1BFTl9TRVRUSU5HUzpcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFOlxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVUlTdG9yZTsiXX0=
