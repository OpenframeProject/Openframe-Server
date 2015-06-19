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
	FrameStore = require('../stores/FrameStore');

var endpoints = {
	users_frames: '/frames/user/' + OF_USERNAME,
	visible_frames: '/frames/visible'
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

		// WebSocket event handler for frame:content_updated triggers the dispatch
	},

	saveFrame: function(frame) {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.FRAME_SAVE,
			frame: frame
		});
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

},{"../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (window.jQuery)

var MenuActions = {

	toggleMenu: function() {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.MENU_TOGGLE
		});
	},

	toggleSettings: function() {
		AppDispatcher.handleViewAction({
			actionType: OFConstants.SETTINGS_TOGGLE
		});
	}
	
}

module.exports = MenuActions;

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/UIActions.js":[function(require,module,exports){
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
	SettingsDrawer = require('./SettingsDrawer.js'),
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
        Socker.on('frame:content_updated', FrameActions.frameContentUpdated);
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

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./AddContentForm.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./AddContentModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js","./ContentList.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./Drawer.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Drawer.js","./FooterNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./FramesList.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FramesList.js","./Nav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./SettingsDrawer.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsDrawer.js","./SettingsModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js","./SimpleNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js","./TransferButtons.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
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


	},

	componentWillUnmount: function() {
		console.log('componentDidUnmount');
		ContentStore.removeChangeListener(this._onChange);
	},

    componentDidUpdate: function() {
        this._updateContainerDimensions();
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
	        freeMode: true,
	        freeModeMomentum: true,
	        freeModeMomentumRatio: .25,
	        freeModeSticky:true,
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
		console.log('_handleCloseMenuClick');
		UIActions.toggleMenu(false);
	},

	_handleCollectionClick: function() {
		console.log(UIActions);
		UIActions.setSelectionPanel("collection");
	},

	_handleFramesClick: function() {
		UIActions.setSelectionPanel("frames");
	},

	_handleAddClick: function(e) {
		console.log('_handleAddClick');
		e.stopPropagation();
		UIActions.openAddContentModal();
	},

	_onChange: function() {
		console.log('updating footer nav', this.state);
        this.setState(UIStore.getSelectionPanelState());
        console.log('updated state', this.state);
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
	UIStore = require('../stores/UIStore');

var FramesList = React.createClass({displayName: "FramesList",
	getInitialState: function() {
		return {
			frames: [],
            currentFrame: {
                name: 'test',
                owner: 'jonwohl',
                mirrored_by: [1,2,3,4,5]
            }
		}
	},

	componentDidMount: function() {
		FrameActions.loadVisibleFrames();
		FrameStore.addChangeListener(this._onChange);
	},

	componentWillUnmount: function() {
		FrameStore.removeChangeListener(this._onChange);
	},

    componentDidUpdate: function() {
        this._updateContainerDimensions();
    },

  	_onChange: function() {
  		this.setState({
  			frames: FrameStore.getVisibleFrames()
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
        var html = '' +
            '<div class="swiper-slide frame-slide" data-contentid="' + frame._id + '">' +
                '<img src=' + frame.current_content.url + ' />' +
            '</div>';

		this.swiper.prependSlide(html);
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

    render: function() {
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
                        React.createElement("div", {className: "visible-frame-stats"}, 
                            React.createElement("span", {className: "of-icon-mirror"}), " ", this.state.currentFrame.mirrored_by.length
                        )
                    )
                )
            )
        );
    }

});

module.exports = FramesList;

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Nav.js":[function(require,module,exports){
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
            console.log('frame: ', frame);
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

},{"../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsDrawer.js":[function(require,module,exports){
var React = (window.React),
	MenuActions = require('../actions/MenuActions'),
	MenuStore = require('../stores/MenuStore'),
	SettingsForm = require('./SettingsForm');

var SettingsDrawer = React.createClass({displayName: "SettingsDrawer",
	getInitialState: function() {
		return {
			open: false
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-right'
		}
	},
	
	componentDidMount: function() {
        MenuStore.addChangeListener(this._onChange);
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
		                    React.createElement("span", {className: "glyphicon glyphicon-menu-right"})
		                )
					), 
					React.createElement("div", {className: "drawer-content"}, 
						React.createElement(SettingsForm, null)
					)
				)
			)
		);
	},

	_handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		MenuActions.toggleSettings();
	},

	_onChange: function() {
        this.setState(MenuStore.getSettingsState());
    }

});

module.exports = SettingsDrawer;

},{"../actions/MenuActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/MenuStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/MenuStore.js","./SettingsForm":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsForm.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsForm.js":[function(require,module,exports){
var React = (window.React)
	MenuActions = require('../actions/MenuActions'),
	FrameStore = require('../stores/FrameStore');

var SettingsDrawer = React.createClass({displayName: "SettingsDrawer",
	getInitialState: function() {
		return {
			frame: {
				settings: {
					on_time: '06:00:00',
					off_time: '12:00:00',
					rotation: 180,
					visibility: 'public'
				},
				user: [
					'jonwohl',
					'ishback',
					'andy'
				]
			}
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-right'
		}
	},
	
	componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

	render: function() {
		return (
			React.createElement("div", {className: "settings-fields"}, 
				React.createElement("div", {className: "row row-settings"}, 
					React.createElement("div", {className: "col-xs-2"}, "Users"), 
					React.createElement("div", {className: "col-xs-8"}, 
						React.createElement("input", {className: "users-input", type: "text", ref: "newUser"})
					), 
					React.createElement("div", {className: "col-xs-2"}, 
						React.createElement("button", {className: "btn btn-xs btn-default pull-right"}, "Add")
					), 
					React.createElement("div", {className: "col-xs-12"}, 
						this.state.frame.users
					)
				), 
				React.createElement("div", {className: "row row-settings"}, 
					React.createElement("div", {className: "col-xs-2"}, "Turn on"), 
					React.createElement("div", {className: "col-xs-10"}, 
						React.createElement("select", {className: "pull-right", ref: "turnOn", value: this.state.frame.settings.on_time}, 
							React.createElement("option", {value: "05:00:00"}, "5am"), 
							React.createElement("option", {value: "06:00:00"}, "6am"), 
							React.createElement("option", {value: "07:00:00"}, "7am"), 
							React.createElement("option", {value: "08:00:00"}, "8am"), 
							React.createElement("option", {value: "09:00:00"}, "9am"), 
							React.createElement("option", {value: "10:00:00"}, "10am"), 
							React.createElement("option", {value: "11:00:00"}, "11am"), 
							React.createElement("option", {value: "12:00:00"}, "12pm")
						)
					)
				), 
				React.createElement("div", {className: "row row-settings"}, 
					React.createElement("div", {className: "col-xs-2"}, "Turn on"), 
					React.createElement("div", {className: "col-xs-10"}, 
						React.createElement("select", {className: "pull-right", ref: "turnOff", value: this.state.frame.settings.off_time}, 
							React.createElement("option", {value: "05:00:00"}, "5pm"), 
							React.createElement("option", {value: "06:00:00"}, "6pm"), 
							React.createElement("option", {value: "07:00:00"}, "7pm"), 
							React.createElement("option", {value: "08:00:00"}, "8pm"), 
							React.createElement("option", {value: "09:00:00"}, "9pm"), 
							React.createElement("option", {value: "10:00:00"}, "10pm"), 
							React.createElement("option", {value: "11:00:00"}, "11pm"), 
							React.createElement("option", {value: "12:00:00"}, "12pm")
						)
					)
				), 
				React.createElement("div", {className: "row row-settings"}, 
					React.createElement("div", {className: "col-xs-2"}, "Rotate"), 
					React.createElement("div", {className: "col-xs-10"}, 
						React.createElement("select", {className: "pull-right", ref: "rotate", value: this.state.frame.settings.rotation}, 
							React.createElement("option", {value: "0"}, "none"), 
							React.createElement("option", {value: "90"}, "90°"), 
							React.createElement("option", {value: "-90"}, "-90°"), 
							React.createElement("option", {value: "180"}, "180°")
						)
					)
				), 
				React.createElement("div", {className: "row row-settings"}, 
					React.createElement("div", {className: "col-xs-2"}, "Visibility"), 
					React.createElement("div", {className: "col-xs-10"}, 
						React.createElement("select", {className: "pull-right", ref: "turnOff", value: this.state.frame.settings.visibility}, 
							React.createElement("option", {value: "public"}, "public"), 
							React.createElement("option", {value: "private"}, "private")
						)
					)
				)
			)
		);
	},

	_onChange: function() {

    }

});

module.exports = SettingsDrawer;

},{"../actions/MenuActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js":[function(require,module,exports){
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
                name: ''
            }
        }
    },

    render: function() {
        var frameName = this.state.selectedFrame.name;

        function connected(active) {
            var connected = '';
            if (active) {
                connected = '&bull; ';
            }
            return {__html: connected};
        }

        return (
            React.createElement("div", {className: "of-nav-fixed of-nav-top"}, 
                React.createElement("h6", {className: "frame-name text-center"}, React.createElement("span", {className: "connected", dangerouslySetInnerHTML: connected(this.state.selectedFrame.active)}), frameName), 

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
	ContentStore = require('../stores/ContentStore');

var TransferButtons = React.createClass({displayName: "TransferButtons",

	render: function() {
		return (
			React.createElement("div", {className: "row transfer-buttons"}, 
                React.createElement("div", {className: "col-xs-12 text-center"}, 
                    React.createElement("div", {className: "btn-group", role: "group", "aria-label": "..."}, 
                        React.createElement("button", {type: "button", className: "btn btn-xs btn-default btn-send btn-transfer", onClick: this.sendClicked}, 
                            React.createElement("span", {className: "icon-up icon-send", "aria-hidden": "true"})
                        )
                        /* <button type="button" class="btn btn-xs btn-default btn-send btn-transfer">
                                                <span class="icon icon-send" aria-hidden="true"></span>
                                        </button> */
                    )
                )
            )
		);
	},

	sendClicked: function(e) {
		FrameActions.updateContent(ContentStore.getSelectedContent());
	}

});

module.exports = TransferButtons;

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/ContentStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js":[function(require,module,exports){
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
			console.log('slide changed...');
			_selected_visible_frame_id = action.frame_id;
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

},{"../constants/OFConstants":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Users/jon/Projects/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/MenuStore.js":[function(require,module,exports){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (window._).assign,
	_ = (window._);


var _menuOpen = false,
	_settingsOpen = false;

var _toggleMenu = function() {
	_menuOpen = !_menuOpen;
}

var _toggleSettings = function() {
	_settingsOpen = !_settingsOpen;
}


var MenuStore = assign({}, EventEmitter.prototype, {

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

	getFooterNavState: function() {
		return {

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

		case OFConstants.MENU_TOGGLE:
    		_toggleMenu();
			MenuStore.emitChange();
			break;
		
		case OFConstants.SETTINGS_TOGGLE:
    		_toggleSettings();
			MenuStore.emitChange();
			break;

	    default:
    		// no op
  }
});

module.exports = MenuStore;

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9GcmFtZUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL01lbnVBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9VSUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYnJvd3Nlcl9zdGF0ZV9tYW5hZ2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BZGRDb250ZW50Rm9ybS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudE1vZGFsLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BcHAuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0NvbnRlbnRMaXN0LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9EcmF3ZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lc0xpc3QuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaW5rLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9OYXZGcmFtZUxpc3QuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzRHJhd2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TZXR0aW5nc0Zvcm0uanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzTW9kYWwuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NpbXBsZU5hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvVHJhbnNmZXJCdXR0b25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uZmlnLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uc3RhbnRzL09GQ29uc3RhbnRzLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvcmVhY3QtbWFpbi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9Db250ZW50U3RvcmUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvRnJhbWVTdG9yZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9NZW51U3RvcmUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvVUlTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREEsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDO0NB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QUFDakMsWUFBWSxNQUFNOztBQUVsQixRQUFRLEtBQUssV0FBVyxDQUFDLG9CQUFvQjs7WUFFakMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUM3QixZQUFZLE1BQU07O1FBRVYsS0FBSyxXQUFXLENBQUMsZ0JBQWdCO1lBQzdCLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDckIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLFlBQVksTUFBTTs7QUFFbEIsUUFBUSxLQUFLLFdBQVcsQ0FBQyxpQkFBaUI7O1lBRTlCLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDbEMsWUFBWSxNQUFNOztRQUVWLEtBQUssV0FBVyxDQUFDLGdCQUFnQjtZQUM3QixRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O1FBRVYsS0FBSyxXQUFXLENBQUMsVUFBVTtZQUN2QixhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O0FBRWxCLFFBQVEsUUFBUTs7R0FFYjtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHRhbGxfY29udGVudDogJy9jb250ZW50L3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBDb250ZW50QWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGNvbnRlbnQgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKi9cblx0bG9hZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudHMoKScpO1xuXHRcdC8vIGRpc3BhdGNoIGFuIGFjdGlvbiBpbmRpY2F0aW5nIHRoYXQgd2UncmUgbG9hZGluZyB0aGUgY29udGVudFxuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BREQsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoY29udGVudCksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0dXNlcnNfZnJhbWVzOiAnL2ZyYW1lcy91c2VyLycgKyBPRl9VU0VSTkFNRSxcblx0dmlzaWJsZV9mcmFtZXM6ICcvZnJhbWVzL3Zpc2libGUnXG59XG5cbnZhciBGcmFtZUFjdGlvbnMgPSB7XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSBmcmFtZXMgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpJyk7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBmcmFtZXNcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMudXNlcnNfZnJhbWVzKVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXM6ICcsIGZyYW1lcyk7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBGZXRjaCBhbGwgZnJhbWVzIG1hcmtlZCAndmlzaWJsZSdcblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRsb2FkVmlzaWJsZUZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSB2aXNpYmxlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMudmlzaWJsZV9mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lczogJywgZnJhbWVzKTtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRE9ORSxcblx0XHRcdFx0XHRmcmFtZXM6IGZyYW1lc1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0Ly8gbG9hZCBmYWlsdXJlLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgYSBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzZWxlY3QnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGNvbnRlbnQgb24gdGhlIHNlbGVjdGVkIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdHVwZGF0ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHR2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0XHRjb25zb2xlLmxvZyhmcmFtZSwgY29udGVudCk7XG5cdFx0Ly8gdmFyIGNvbnRlbnQgPSBDb250ZW50U3RvcmUuZ2V0U2VsZWN0ZWRDb250ZW50KCk7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgZnJhbWVfaWQ6IGZyYW1lLl9pZCxcbiAgICAgICAgICAgIGNvbnRlbnRfaWQ6IGNvbnRlbnQuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTp1cGRhdGVfY29udGVudCcsIGRhdGEpO1xuXG5cdFx0Ly8gV2ViU29ja2V0IGV2ZW50IGhhbmRsZXIgZm9yIGZyYW1lOmNvbnRlbnRfdXBkYXRlZCB0cmlnZ2VycyB0aGUgZGlzcGF0Y2hcblx0fSxcblxuXHRzYXZlRnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkUsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2ZyYW1lcy8nK2ZyYW1lLl9pZCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShmcmFtZSksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRE9ORSxcblx0XHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0ZBSUwsXG5cdFx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdFx0fSk7XG4gICAgICAgIH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZURpc2Nvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgZGlzY29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29udGVudFVwZGF0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIENvbnRlbnQgdXBkYXRlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdHNldHVwOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGZyYW1lID0gZGF0YS5mcmFtZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFNldHVwJywgZnJhbWUpO1xuICAgICAgICAvLyB0aGlzIGlzIGEgbGl0dGxlIHdlaXJkIC0tIHdoeSBpc24ndCBzZXR1cCBqdXN0IHBhcnQgb2YgdGhlIGluaXRpYWxcbiAgICAgICAgLy8gY29ubmVjdGVkIGV2ZW50P1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWxseT8gRG9lcyB0aGUgdmlldyBkaW1lbnNpb24gbmVlZCB0byBiZSBwYXJ0IG9mIHRoZSBzdGF0ZT9cbiAgICAgKiBQcm9iYWJsZSBub3QuIE5vdCB1c2VkIHByZXNlbnRseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gdyBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBoIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIHNldHVwRnJhbWVWaWV3OiBmdW5jdGlvbih3LCBoKSB7XG4gICAgXHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VUVVBfVklFVyxcblx0XHRcdHc6IHcsXG5cdFx0XHRoOiBoXG5cdFx0fSk7XG4gICAgfSxcblxuICAgIHNsaWRlQ2hhbmdlZDogZnVuY3Rpb24oZnJhbWVfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0xJREVfQ0hBTkdFRCxcblx0XHRcdGZyYW1lX2lkOiBmcmFtZV9pZFxuXHRcdH0pO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUFjdGlvbnM7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbnZhciBNZW51QWN0aW9ucyA9IHtcblxuXHR0b2dnbGVNZW51OiBmdW5jdGlvbigpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuTUVOVV9UT0dHTEVcblx0XHR9KTtcblx0fSxcblxuXHR0b2dnbGVTZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlNFVFRJTkdTX1RPR0dMRVxuXHRcdH0pO1xuXHR9XG5cdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG4gICAgT0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JylcblxudmFyIFVJQWN0aW9ucyA9IHtcblxuICAgIHRvZ2dsZU1lbnU6IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICAgICAgLy8gaWYgb3BlbiB0cnVlLCBvcGVuLiBpZiBmYWxzZSwgY2xvc2UuXG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9NRU5VX1RPR0dMRSxcbiAgICAgICAgICAgIG9wZW46IG9wZW5cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNldHRpbmdzOiBmdW5jdGlvbihvcGVuKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9TRVRUSU5HU19UT0dHTEUsXG4gICAgICAgICAgICBvcGVuOiBvcGVuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRTZWxlY3Rpb25QYW5lbDogZnVuY3Rpb24ocGFuZWwpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX1NFVF9TRUxFQ1RJT05fUEFORUwsXG4gICAgICAgICAgICBwYW5lbDogcGFuZWxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5BZGRDb250ZW50TW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnb3BlbkFkZENvbnRlbnRNb2RhbCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9BRERfQ09OVEVOVFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWRkQ29udGVudE1vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2FkZENvbnRlbnRNb2RhbENsb3NlZCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfQ0xPU0VfQUREX0NPTlRFTlRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5TZXR0aW5nc01vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ29wZW5TZXR0aW5nc01vZGFsJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9PUEVOX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nc01vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3NldHRpbmdzTW9kYWxDbG9zZWQnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJQWN0aW9uczsiLCJTb2NrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9zZWxmID0ge30sXG4gICAgICAgIF9ldmVudEhhbmRsZXJzID0ge30sXG4gICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZSxcbiAgICAgICAgX29wdHMgPSB7XG4gICAgICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBjaGVja0ludGVydmFsOiAxMDAwMFxuICAgICAgICB9LFxuICAgICAgICBfdXJsLFxuICAgICAgICBfd3MsXG4gICAgICAgIF90aW1lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdlYnNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdXJsICBUaGUgc2VydmVyIFVSTC5cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdHMgT3B0aW9uYWwgc2V0dGluZ3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY29ubmVjdCh1cmwsIG9wdHMpIHtcbiAgICAgICAgX3VybCA9IHVybDtcbiAgICAgICAgaWYgKG9wdHMpIF9leHRlbmQoX29wdHMsIG9wdHMpO1xuICAgICAgICBfd3MgPSBuZXcgV2ViU29ja2V0KHVybCk7XG5cbiAgICAgICAgX3dzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gb3BlbmVkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbk9wZW4pIF9vcHRzLm9uT3BlbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbkNsb3NlKSBfb3B0cy5vbkNsb3NlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gbWVzc2FnZS5uYW1lLFxuICAgICAgICAgICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBldmVudCBoYW5kbGVyLCBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2V2ZW50SGFuZGxlcnNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV1baV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgXCIgZXZlbnQgbm90IGhhbmRsZWQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfb3B0cy5rZWVwQWxpdmUpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgICAgIF90aW1lciA9IHNldEludGVydmFsKF9jaGVja0Nvbm5lY3Rpb24sIF9vcHRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdID0gW2NhbGxiYWNrXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29mZihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9ldmVudEhhbmRsZXJzW25hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZGF0YSBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc2VuZChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Muc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIElmIG5vdCwgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hlY2tDb25uZWN0aW9uKCkge1xuICAgICAgICBpZiAoIV9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIF9jb25uZWN0KF91cmwsIF9vcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIGV4dGVuZGluZyBhbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZXh0ZW5kKG9iaikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBfc2VsZi5vbiA9IF9vbjtcbiAgICBfc2VsZi5vZmYgPSBfb2ZmO1xuICAgIF9zZWxmLnNlbmQgPSBfc2VuZDtcbiAgICBfc2VsZi5jb25uZWN0ID0gX2Nvbm5lY3Q7XG4gICAgcmV0dXJuIF9zZWxmO1xufSkoKTtcblxuLy8gQ09NTU9OLkpTXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBTb2NrZXI7IiwidmFyIHNzbSA9IHJlcXVpcmUoJ3NzbScpXG5cdGNvbmYgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuXG5mdW5jdGlvbiBfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQoKSB7XG5cdGNvbnNvbGUubG9nKCdfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQnKTtcblxuXHRfc2V0dXBTY3JlZW5TaXplKCk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAneHMnLFxuXHQgICAgbWF4V2lkdGg6IDc2Nyxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIHhzJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICd4cyc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ3NtJyxcblx0ICAgIG1pbldpZHRoOiA3NjgsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBzbScpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnc20nO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdtZCcsXG5cdCAgICBtaW5XaWR0aDogOTkyLFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgbWQnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ21kJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnbGcnLFxuXHQgICAgbWluV2lkdGg6IDEyMDAsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBsZycpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnbGcnO1xuXHQgICAgfVxuXHR9KTtcdFxuXG5cdHNzbS5yZWFkeSgpO1xufVxuXG5mdW5jdGlvbiBfc2V0dXBTY3JlZW5TaXplKCkge1xuXHRjb25mLndXID0gd2luZG93LmlubmVyV2lkdGg7XG5cdGNvbmYud0ggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdGNvbnNvbGUubG9nKGNvbmYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdDogX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50XG59XG5cbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgQ29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyk7XG5cbnZhciBBZGRDb250ZW50Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBoYW5kbGVGb3JtU3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHVybCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlO1xuXG4gICAgICAgIGlmICghdXJsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWJtaXR0aW5nIGNvbnRlbnQ6ICcsIGNvbnRlbnQpO1xuICAgICAgICBDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlID0gJyc7XG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLmZvY3VzKCk7XG4gICAgfSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgaGlkZGVuLXhzIGFkZC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1pbmxpbmVcIiBpZD1cImFkZC1mb3JtXCIgb25TdWJtaXQ9e3RoaXMuaGFuZGxlRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxsYWJlbCBmb3I9XCJTZW5kVG9Vc2VyXCI+VVJMPC9sYWJlbD4gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIGlkPVwiVVJMXCIgcGxhY2Vob2xkZXI9XCJlbnRlciBVUkxcIiByZWY9XCJVUkxcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHQgYnRuLWFkZC1jb250ZW50XCIgaHJlZj1cIiNhZGQtY29udGVudFwiIGlkPVwiYWRkLWNvbnRlbnQtYnV0dG9uXCI+QWRkIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRGb3JtOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgQWRkQ29udGVudE1vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhZGRPcGVuOiBmYWxzZVxuXHRcdH1cblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgICAgICBcdHRoYXQuX3Jlc2V0Rm9ybSgpO1xuICAgICAgICBcdFVJQWN0aW9ucy5hZGRDb250ZW50TW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcblx0XHQvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIGNlbnRlck1vZGFscyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vZmYoJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgIH0sXG5cblx0X2hhbmRsZUFkZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSxcblx0XHRcdHRhZ3MgPSB0aGlzLnJlZnMudGFncy5nZXRET01Ob2RlKCkudmFsdWU7XG5cblx0XHRpZiAoIXVybC50cmltKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0YWdzID0gdGFncy50cmltKCkuc3BsaXQoJyMnKTtcblxuXHRcdF8ucmVtb3ZlKHRhZ3MsIGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0cmV0dXJuIHRhZy50cmltKCkgPT0gJyc7XG5cdFx0fSk7XG5cblx0XHRfLmVhY2godGFncywgZnVuY3Rpb24odGFnLCBpKSB7XG5cdFx0XHR0YWdzW2ldID0gdGFnLnRyaW0oKTtcblx0XHR9KTtcblxuXHRcdGNvbnNvbGUubG9nKHRhZ3MpO1xuXG5cdFx0dmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdLFxuICAgICAgICAgICAgdGFnczogdGFnc1xuICAgICAgICB9O1xuXHRcdENvbnRlbnRBY3Rpb25zLmFkZENvbnRlbnQoY29udGVudCk7XG5cblx0fSxcblxuXHRfaGFuZGxlT25Gb2N1czogZnVuY3Rpb24oZSkge1xuXHRcdHZhciBlbCA9IGUuY3VycmVudFRhcmdldDtcblx0XHRpZiAoZWwudmFsdWUudHJpbSgpID09ICcnKSB7XG5cdFx0XHRlbC52YWx1ZSA9ICcjJztcblx0XHR9XG5cdH0sXG5cblx0X2hhbmRsZVRhZ3NDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgZWwgPSBlLmN1cnJlbnRUYXJnZXQsXG5cdFx0XHR2YWwgPSBlbC52YWx1ZTtcblxuXHRcdGlmIChlbC52YWx1ZSA9PSAnJykge1xuXHRcdFx0ZWwudmFsdWUgPSAnIyc7XG5cdFx0fVxuXG5cdFx0aWYgKHZhbFt2YWwubGVuZ3RoLTFdID09PSAnICcpIHtcblx0XHRcdGVsLnZhbHVlICs9ICcjJ1xuXHRcdH1cblx0XHQvLyBoYWNrIGJlY2F1c2UgSSBjYW4ndCBzZWVtIHRvIGdldCB0aGUgYXV0b2NhcGl0YWxpemU9XCJvZmZcIiB0byB3b3JrXG5cdFx0Ly8gZm9yIHRoZSB0YWdzIGZpZWxkID8/XG5cdFx0ZWwudmFsdWUgPSBlbC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXG5cdF9oYW5kbGVLZXlEb3duOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGUuY3VycmVudFRhcmdldC52YWx1ZTtcblx0XHRpZiAodmFsWzBdICE9ICcjJykge1xuXHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsID0gJyMnICsgdmFsO1xuXG5cdFx0fVxuXHRcdGlmIChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgdmFsICE9PSAnIycpIHtcblx0XHRcdGlmICh2YWxbdmFsLmxlbmd0aCAtIDFdID09PSAnIycpIHtcblx0XHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsLnN1YnN0cmluZygwLCB2YWwubGVuZ3RoIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9yZXNldEZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVmcy51cmwuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdFx0dGhpcy5yZWZzLnRhZ3MuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldEFkZE1vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuYWRkT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1hZGQtY29udGVudFwiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5BZGQgQ29udGVudDwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5FbnRlciBVUkw8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWlucHV0XCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0PGlucHV0IHJlZj1cInVybFwiIHR5cGU9XCJ1cmxcIiBhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiIHBsYWNlaG9sZGVyPVwiaHR0cDovLy4uLlwiIC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0XHQgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgZGVzY3JpcHRpb24gd2l0aCB0YWdzPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ0YWdzXCIgdHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiXG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHBsYWNlaG9sZGVyPVwiI3Bob3RvICNSb2RjaGVua28gIzE5NDFcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkZvY3VzPXt0aGlzLl9oYW5kbGVPbkZvY3VzfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlVGFnc0NoYW5nZX1cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25LZXlEb3duPXt0aGlzLl9oYW5kbGVLZXlEb3dufSAvPlxuXHRcdFx0XHQgICAgXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENvbnRlbnR9IHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLWFkZC1jb250ZW50XCI+XG5cdFx0XHRcdCAgICBcdFx0XHRBZGQgVG8gQ29sbGVjdGlvblxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRNb2RhbDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cblx0TmF2ID0gcmVxdWlyZSgnLi9OYXYuanMnKSxcblx0U2ltcGxlTmF2ID0gcmVxdWlyZSgnLi9TaW1wbGVOYXYuanMnKSxcblx0RnJhbWUgPSByZXF1aXJlKCcuL0ZyYW1lLmpzJyksXG5cdFRyYW5zZmVyQnV0dG9ucyA9IHJlcXVpcmUoJy4vVHJhbnNmZXJCdXR0b25zLmpzJyksXG5cdEFkZENvbnRlbnRGb3JtID0gcmVxdWlyZSgnLi9BZGRDb250ZW50Rm9ybS5qcycpLFxuXHRDb250ZW50TGlzdCA9IHJlcXVpcmUoJy4vQ29udGVudExpc3QuanMnKSxcblx0RnJhbWVzTGlzdCA9IHJlcXVpcmUoJy4vRnJhbWVzTGlzdC5qcycpLFxuXHRGb290ZXJOYXYgPSByZXF1aXJlKCcuL0Zvb3Rlck5hdi5qcycpLFxuXHREcmF3ZXIgPSByZXF1aXJlKCcuL0RyYXdlci5qcycpLFxuXHRTZXR0aW5nc0RyYXdlciA9IHJlcXVpcmUoJy4vU2V0dGluZ3NEcmF3ZXIuanMnKSxcblx0QWRkQ29udGVudE1vZGFsID0gcmVxdWlyZSgnLi9BZGRDb250ZW50TW9kYWwuanMnKSxcblx0U2V0dGluZ3NNb2RhbCA9IHJlcXVpcmUoJy4vU2V0dGluZ3NNb2RhbC5qcycpLFxuXG5cdEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKSxcblxuXHRjb25mID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbi8qKlxuICogVGhlIEFwcCBpcyB0aGUgcm9vdCBjb21wb25lbnQgcmVzcG9uc2libGUgZm9yOlxuICogLSBzZXR0aW5nIHVwIHN0cnVjdHVyZSBvZiBjaGlsZCBjb21wb25lbnRzXG4gKlxuICogSW5kaXZpZHVhbCBjb21wb25lbnRzIHJlZ2lzdGVyIGZvciBTdG9yZSBzdGF0ZSBjaGFuZ2UgZXZlbnRzXG4gKi9cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGlvblBhbmVsOiBcImNvbGxlY3Rpb25cIlxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIWdsb2JhbC5PRl9VU0VSTkFNRSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ09GX1VTRVJOQU1FIG5vdCBkZWZpbmVkLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdFNvY2tlci5jb25uZWN0KFwid3M6Ly9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgXCIvYWRtaW4vd3MvXCIgKyBPRl9VU0VSTkFNRSk7XG5cblx0XHQvLyBUT0RPOiB0aGVzZSBzaG91bGQgbW92ZSB0byB0aGUgY29ycmVzcG9uZGluZyBBY3Rpb25zIGNyZWF0b3IgKGUuZy4gRnJhbWVBY3Rpb25zKVxuXHRcdFNvY2tlci5vbignZnJhbWU6Y29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lQ29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpkaXNjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVEaXNjb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmNvbnRlbnRfdXBkYXRlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIEZyYW1lQWN0aW9ucy5zZXR1cCk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gY29uc29sZS5sb2coJ2NvbXBvbmVudERpZE1vdW50JywgJCgnLm5hdi1mb290ZXInKS5oZWlnaHQoKSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ2NvbXBvbmVudERpZE1vdW50JywgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLm5hdkZvb3Rlcikub2Zmc2V0SGVpZ2h0KTtcblx0XHRVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblxuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYW5lbCA9IFVJU3RvcmUuZ2V0U2VsZWN0aW9uUGFuZWxTdGF0ZSgpO1xuXHRcdHRoaXMuc2V0U3RhdGUocGFuZWwpO1xuXHR9LFxuXG4gIFx0cmVuZGVyOiBmdW5jdGlvbigpe1xuICBcdFx0dmFyIGNvbnRlbnRMaXN0ID0gPENvbnRlbnRMaXN0IC8+LFxuICBcdFx0XHRmcmFtZUxpc3QgPSA8RnJhbWVzTGlzdCAvPjtcbiAgXHRcdHZhciBzZWxlY3Rpb25QYW5lbCA9IHRoaXMuc3RhdGUuc2VsZWN0aW9uUGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbnRlbnRMaXN0IDogZnJhbWVMaXN0O1xuXHQgICAgcmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXIgYXBwJz5cblx0XHRcdFx0PFNpbXBsZU5hdiAvPlxuXHRcdFx0XHQ8RnJhbWUgLz5cblx0XHRcdFx0PFRyYW5zZmVyQnV0dG9ucyAvPlxuXHRcdFx0XHQ8ZGl2PntzZWxlY3Rpb25QYW5lbH08L2Rpdj5cblx0XHRcdFx0PEZvb3Rlck5hdiByZWY9XCJuYXZGb290ZXJcIi8+XG5cdFx0XHRcdDxEcmF3ZXIgLz5cblx0XHRcdFx0PFNldHRpbmdzTW9kYWwgLz5cblx0XHRcdFx0PEFkZENvbnRlbnRNb2RhbCAvPlxuXHRcdFx0PC9kaXY+XG5cdCAgICApXG4gIFx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuXHRDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKSxcblx0Q29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpO1xuXG52YXIgQ29udGVudExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRlbnQ6IFtdXG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudCgpO1xuXHRcdENvbnRlbnRTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cblxuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnY29tcG9uZW50RGlkVW5tb3VudCcpO1xuXHRcdENvbnRlbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG4gICAgfSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0Y29udGVudDogQ29udGVudFN0b3JlLmdldENvbnRlbnQoKVxuICBcdFx0fSk7XG5cbiAgXHRcdC8vIFRPRE86IGJldHRlciBSZWFjdCBpbnRlZ3JhdGlvbiBmb3IgdGhlIHN3aXBlclxuXG4gIFx0XHRpZiAoIXRoaXMuc3dpcGVyKSB7XG4gIFx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgXHRcdH1cblxuICBcdFx0dGhpcy5fcG9wdWxhdGVTbGlkZXIoKVxuXG5cdFx0Ly8gdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmxlbmd0aDtcbiAgICAgICAgdGhpcy5zd2lwZXIuc2xpZGVUbygwKTtcbiAgXHR9LFxuXG4gIFx0X2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG5cdFx0dGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG5cdCAgICAgICAgc2xpZGVzUGVyVmlldzogMyxcblx0ICAgICAgICBzcGFjZUJldHdlZW46IDUwLFxuXHQgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlTW9tZW50dW06IHRydWUsXG5cdCAgICAgICAgZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAuMjUsXG5cdCAgICAgICAgZnJlZU1vZGVTdGlja3k6dHJ1ZSxcblx0ICAgICAgICAvLyBsb29wOiB0cnVlLFxuXHQgICAgICAgIC8vIGxvb3BlZFNsaWRlczogNSxcblx0ICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG5cdCAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcblx0ICAgIH0pO1xuICBcdH0sXG5cbiAgXHRfcG9wdWxhdGVTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dGhpcy5zd2lwZXIucmVtb3ZlQWxsU2xpZGVzKCk7XG4gIFx0XHR0aGlzLnN0YXRlLmNvbnRlbnQuZm9yRWFjaCh0aGlzLl9hZGRTbGlkZSk7XG4gIFx0fSxcblxuICBcdF9hZGRTbGlkZTogZnVuY3Rpb24oY29udGVudEl0ZW0pIHtcbiAgXHRcdHZhciBodG1sID0gJzxkaXYgY2xhc3M9XCJzd2lwZXItc2xpZGUgY29udGVudC1zbGlkZVwiIGRhdGEtY29udGVudGlkPVwiJyArIGNvbnRlbnRJdGVtLl9pZCArICdcIj48aW1nIHNyYz0nICsgY29udGVudEl0ZW0udXJsICsgJyAvPjwvZGl2Pidcblx0XHR0aGlzLnN3aXBlci5wcmVwZW5kU2xpZGUoaHRtbCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICBcdFx0dGhpcy5zd2lwZXIuc2xpZGVUbyhpbmRleCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc2xpZGVyKSB7XG4gIFx0XHR2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICBcdFx0XHRjb250ZW50X2lkID0gc2xpZGUuZGF0YXNldC5jb250ZW50aWQ7XG4gIFx0XHRjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgY29udGVudF9pZCk7XG4gIFx0XHRDb250ZW50QWN0aW9ucy5zbGlkZUNoYW5nZWQoY29udGVudF9pZCk7XG4gIFx0fSxcblxuICAgIF91cGRhdGVDb250YWluZXJEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpXG4gICAgICAgICAgICBoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHBhZGRpbmcgPSA0MCxcbiAgICAgICAgICAgIG5ld0ggPSBoIC0gcGFkZGluZztcblxuICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gbmV3SCsncHgnO1xuICAgICAgICAvLyBjb250YWluZXIuc3R5bGUudG9wID0gJzBweCc7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbnRlbnRTbGlkZShjb250ZW50SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIHNsaWRlOiAnLCBjb250ZW50SXRlbSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtjb250ZW50SXRlbS5faWQuJG9pZH0gY2xhc3NOYW1lPVwic3dpcGVyLXNsaWRlXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtjb250ZW50SXRlbS51cmx9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1jb250YWluZXJcIiByZWY9XCJTd2lwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItd3JhcHBlclwiPlxuXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50TGlzdDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHROYXZGcmFtZUxpc3QgPSByZXF1aXJlKCcuL05hdkZyYW1lTGlzdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKTtcblxudmFyIERyYXdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0b3BlbjogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNpZGVDbGFzczogJ21lbnUtZHJhd2VyLWxlZnQnXG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVDbG9zZU1lbnVDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ19oYW5kbGVDbG9zZU1lbnVDbGljaycpO1xuXHRcdFVJQWN0aW9ucy50b2dnbGVNZW51KGZhbHNlKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFVJU3RvcmUuZ2V0TWVudVN0YXRlKCkpO1xuICAgIH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYmFzZUNsYXNzID0gJ3Zpc2libGUteHMgbWVudS1kcmF3ZXInO1xuXHRcdHZhciBvcGVuQ2xhc3MgPSB0aGlzLnN0YXRlLm9wZW4gPyAnbWVudS1kcmF3ZXItb3BlbicgOiAnbWVudS1kcmF3ZXItY2xvc2VkJztcblx0XHR2YXIgc2lkZUNsYXNzID0gdGhpcy5wcm9wcy5zaWRlQ2xhc3M7XG5cdFx0dmFyIGZ1bGxDbGFzcyA9IFtiYXNlQ2xhc3MsIG9wZW5DbGFzcywgc2lkZUNsYXNzXS5qb2luKCcgJyk7XG5cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17ZnVsbENsYXNzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtZW51LWRyYXdlci1pbm5lclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi1kcmF3ZXJcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidXNlcm5hbWUgdGV4dC1jZW50ZXJcIj57T0ZfVVNFUk5BTUV9PC9kaXY+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gPlxuXHRcdCAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIC8+XG5cdFx0ICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxOYXZGcmFtZUxpc3QgbGlua0NsaWNrSGFuZGxlcj17dGhpcy5faGFuZGxlQ2xvc2VNZW51Q2xpY2t9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmF3ZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKTtcblxudmFyIEZvb3Rlck5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0aW9uUGFuZWw6IFwiY29sbGVjdGlvblwiXG5cdFx0fTtcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVDbG9zZU1lbnVDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ19oYW5kbGVDbG9zZU1lbnVDbGljaycpO1xuXHRcdFVJQWN0aW9ucy50b2dnbGVNZW51KGZhbHNlKTtcblx0fSxcblxuXHRfaGFuZGxlQ29sbGVjdGlvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyhVSUFjdGlvbnMpO1xuXHRcdFVJQWN0aW9ucy5zZXRTZWxlY3Rpb25QYW5lbChcImNvbGxlY3Rpb25cIik7XG5cdH0sXG5cblx0X2hhbmRsZUZyYW1lc0NsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRVSUFjdGlvbnMuc2V0U2VsZWN0aW9uUGFuZWwoXCJmcmFtZXNcIik7XG5cdH0sXG5cblx0X2hhbmRsZUFkZENsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0Y29uc29sZS5sb2coJ19oYW5kbGVBZGRDbGljaycpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0VUlBY3Rpb25zLm9wZW5BZGRDb250ZW50TW9kYWwoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCd1cGRhdGluZyBmb290ZXIgbmF2JywgdGhpcy5zdGF0ZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRTZWxlY3Rpb25QYW5lbFN0YXRlKCkpO1xuICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlZCBzdGF0ZScsIHRoaXMuc3RhdGUpO1xuICAgIH0sXG5cblx0LyoqXG5cdCAqIFRPRE86IGZpZ3VyZSBvdXQgc3RhdGUgbWFuYWdlbWVudC4gU3RvcmU/XG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29sbGVjdGlvbiA9IChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IG9mLW5hdi1maXhlZCBvZi1uYXYtZm9vdGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1jb2xsZWN0aW9uIGFjdGl2ZVwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ29sbGVjdGlvbkNsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvbGxlY3Rpb25cIj5jb2xsZWN0aW9uPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1mcmFtZXNcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUZyYW1lc0NsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImZyYW1lc1wiPmZyYW1lczwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3Rlci1hZGQgYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVBZGRDbGlja30+KzwvYT5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cblx0XHR2YXIgZnJhbWVzID0gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgb2YtbmF2LWZpeGVkIG9mLW5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWNvbGxlY3Rpb25cIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNvbGxlY3Rpb25DbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJjb2xsZWN0aW9uXCI+Y29sbGVjdGlvbjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItZnJhbWVzIGFjdGl2ZVwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlRnJhbWVzQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZnJhbWVzXCI+ZnJhbWVzPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHRcdHZhciBwYW5lbCA9IHRoaXMuc3RhdGUuc2VsZWN0aW9uUGFuZWw7XG5cdFx0Y29uc29sZS5sb2coJ1BBTkVMOiAnLCB0aGlzLnN0YXRlLCBwYW5lbCk7XG5cdFx0cmV0dXJuIHBhbmVsID09PSAnY29sbGVjdGlvbicgPyBjb2xsZWN0aW9uIDogZnJhbWVzO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3Rlck5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIEZyYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCk7XG5cdFx0RnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUuZnJhbWUpIHtcblx0XHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInJvdyBmcmFtZXMtbGlzdFwiPjwvZGl2PlxuXHRcdH1cblx0XHR0aGlzLndfaF9yYXRpbyA9IHRoaXMuc3RhdGUuZnJhbWUgJiYgdGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncyA/IHRoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mud19oX3JhdGlvIDogMTtcblxuXHRcdHZhciB1cmwgPSB0aGlzLnN0YXRlLmZyYW1lICYmIHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50ID8gdGhpcy5zdGF0ZS5mcmFtZS5jdXJyZW50X2NvbnRlbnQudXJsIDogJyc7XG5cdFx0dmFyIGRpdlN0eWxlID0ge1xuXHRcdFx0YmFja2dyb3VuZEltYWdlOiAndXJsKCcgKyB1cmwgKyAnKScsXG5cdFx0fTtcblxuXHRcdGNvbnNvbGUubG9nKHRoaXMud19oX3JhdGlvKTtcblxuXHRcdHZhciB3aFN0eWxlID0ge1xuXHRcdFx0cGFkZGluZ0JvdHRvbTogKDEvdGhpcy53X2hfcmF0aW8pICogMTAwICsgJyUnXG5cdFx0fTtcblxuXHRcdHZhciBhY3RpdmUgPSB0aGlzLnN0YXRlLmZyYW1lLmFjdGl2ZSA/ICcqJyA6ICcnO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBmcmFtZXMtbGlzdFwiIHJlZj1cImZyYW1lQ29udGFpbmVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhsLTEyIGZyYW1lLW91dGVyLWNvbnRhaW5lclwiIHJlZj1cImZyYW1lT3V0ZXJDb250YWluZXJcIj5cblx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLXhzIGJ0bi1zZXR0aW5ncyBoaWRlXCIgZGF0YS10b2dnbGU9XCJtb2RhbFwiIGRhdGEtdGFyZ2V0PVwiI215TW9kYWxcIj5TPC9idXR0b24+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZS1pbm5lci1jb250YWluZXJcIiByZWY9XCJmcmFtZUlubmVyQ29udGFpbmVyXCI+XG5cdFx0ICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cImZyYW1lXCIgc3R5bGU9e2RpdlN0eWxlfSByZWY9XCJmcmFtZVwiLz5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cblx0XHQgICAgICAgIDwvZGl2PlxuXHQgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cbiAgXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcbiAgXHRcdGNvbnNvbGUubG9nKCdzZWxlY3RlZEZyYW1lOicsIHNlbGVjdGVkRnJhbWUpO1xuICBcdFx0dGhpcy5zZXRTdGF0ZSh7XG4gIFx0XHRcdGZyYW1lOiBzZWxlY3RlZEZyYW1lXG4gIFx0XHR9KTtcbiAgXHR9LFxuXG4gIFx0X3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpLFxuICBcdFx0XHRmcmFtZU91dGVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lT3V0ZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZUlubmVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lSW5uZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5mcmFtZSksXG5cdFx0XHR3ID0gY29udGFpbmVyLm9mZnNldFdpZHRoLFxuXHRcdFx0aCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG5cdFx0XHRwYWRkaW5nID0gNTAsXG5cdFx0XHRtYXhXID0gdyAtIDIqcGFkZGluZyxcblx0XHRcdG1heEggPSBoIC0gMipwYWRkaW5nLFxuXHRcdFx0ZnJhbWVXLCBmcmFtZUg7XG5cblx0XHRpZiAoKHRoaXMud19oX3JhdGlvID4gMSB8fCBtYXhIICogdGhpcy53X2hfcmF0aW8gPiBtYXhXKSAmJiBtYXhXIC8gdGhpcy53X2hfcmF0aW8gPCBtYXhIKSB7XG5cdFx0XHQvLyB3aWR0aCA+IGhlaWdodCBvciB1c2luZyBmdWxsIGhlaWdodCB3b3VsZCBleHRlbmQgYmV5b25kIG1heFdcblx0XHRcdGZyYW1lVyA9IG1heFc7XG5cdFx0XHRmcmFtZUggPSAobWF4VyAvIHRoaXMud19oX3JhdGlvKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2lkdGggPCBoZWlnaHRcblx0XHRcdGZyYW1lSCA9IG1heEg7XG5cdFx0XHRmcmFtZVcgPSAobWF4SCAqIHRoaXMud19oX3JhdGlvKTtcblx0XHR9XG5cblx0XHRmcmFtZS5zdHlsZS53aWR0aCA9IGZyYW1lVyArICdweCc7XG5cdFx0ZnJhbWUuc3R5bGUuaGVpZ2h0ID0gZnJhbWVIICsgJ3B4JztcblxuXHRcdGZyYW1lT3V0ZXJDb250YWluZXIuc3R5bGUud2lkdGggPSBtYXhXKydweCc7XG5cdFx0ZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS50b3AgPSAoKGggLSBmcmFtZUgpIC8gMikgKyAncHgnO1xuXHRcdC8vIGZyYW1lSW5uZXJDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZnJhbWUuc3R5bGUuaGVpZ2h0O1xuXG5cblxuXHRcdGNvbnNvbGUubG9nKCdmcmFtZU91dGVyQ29udGFpbmVyOicsIGZyYW1lT3V0ZXJDb250YWluZXIpO1xuXHRcdGNvbnNvbGUubG9nKCdjb250YWluZXI6JywgdywgaCwgbWF4VywgbWF4SCk7XG4gIFx0fVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKTtcblxudmFyIEZyYW1lc0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogW10sXG4gICAgICAgICAgICBjdXJyZW50RnJhbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgb3duZXI6ICdqb253b2hsJyxcbiAgICAgICAgICAgICAgICBtaXJyb3JlZF9ieTogWzEsMiwzLDQsNV1cbiAgICAgICAgICAgIH1cblx0XHR9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lQWN0aW9ucy5sb2FkVmlzaWJsZUZyYW1lcygpO1xuXHRcdEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMoKTtcbiAgICB9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0VmlzaWJsZUZyYW1lcygpXG4gIFx0XHR9KTtcblxuICBcdFx0Ly8gVE9ETzogYmV0dGVyIFJlYWN0IGludGVncmF0aW9uIGZvciB0aGUgc3dpcGVyXG5cbiAgXHRcdGlmICghdGhpcy5zd2lwZXIpIHtcbiAgXHRcdFx0dGhpcy5faW5pdFNsaWRlcigpO1xuICBcdFx0fVxuXG4gIFx0XHR0aGlzLl9wb3B1bGF0ZVNsaWRlcigpXG5cblx0XHQvLyB2YXIgc2xpZGVfaW5kZXggPSAkKCdkaXYuc3dpcGVyLXNsaWRlJykubGVuZ3RoO1xuICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKDApO1xuICBcdH0sXG5cbiAgXHRfaW5pdFNsaWRlcjogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuU3dpcGVyKTtcblx0XHR0aGlzLnN3aXBlciA9IG5ldyBTd2lwZXIoZWwsIHtcblx0ICAgICAgICBzbGlkZXNQZXJWaWV3OiAzLFxuXHQgICAgICAgIHNwYWNlQmV0d2VlbjogNTAsXG4gICAgICAgICAgICBwcmVsb2FkSW1hZ2VzOiB0cnVlLFxuXHQgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlTW9tZW50dW06IHRydWUsXG5cdCAgICAgICAgZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAuMjUsXG5cdCAgICAgICAgZnJlZU1vZGVTdGlja3k6dHJ1ZSxcblx0ICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG5cdCAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcblx0ICAgIH0pO1xuXG5cbiAgXHR9LFxuXG4gIFx0X3BvcHVsYXRlU2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc3dpcGVyLnJlbW92ZUFsbFNsaWRlcygpO1xuICBcdFx0dGhpcy5zdGF0ZS5mcmFtZXMuZm9yRWFjaCh0aGlzLl9hZGRTbGlkZSk7XG4gIFx0fSxcblxuICBcdF9hZGRTbGlkZTogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgdmFyIGh0bWwgPSAnJyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInN3aXBlci1zbGlkZSBmcmFtZS1zbGlkZVwiIGRhdGEtY29udGVudGlkPVwiJyArIGZyYW1lLl9pZCArICdcIj4nICtcbiAgICAgICAgICAgICAgICAnPGltZyBzcmM9JyArIGZyYW1lLmN1cnJlbnRfY29udGVudC51cmwgKyAnIC8+JyArXG4gICAgICAgICAgICAnPC9kaXY+JztcblxuXHRcdHRoaXMuc3dpcGVyLnByZXBlbmRTbGlkZShodG1sKTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlVG86IGZ1bmN0aW9uKGluZGV4KSB7XG4gIFx0XHR0aGlzLnN3aXBlci5zbGlkZVRvKGluZGV4KTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlQ2hhbmdlRW5kOiBmdW5jdGlvbihzbGlkZXIpIHtcbiAgXHRcdHZhciBzbGlkZSA9IHRoaXMuc3dpcGVyLnNsaWRlc1t0aGlzLnN3aXBlci5hY3RpdmVJbmRleF0sXG4gIFx0XHRcdGZyYW1lX2lkID0gc2xpZGUuZGF0YXNldC5mcmFtZWlkO1xuICBcdFx0Y29uc29sZS5sb2coJ19zbGlkZUNoYW5nZUVuZCcsIGZyYW1lX2lkKTtcbiAgXHRcdEZyYW1lQWN0aW9ucy5zbGlkZUNoYW5nZWQoZnJhbWVfaWQpO1xuICBcdH0sXG5cbiAgICAgX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5yZWZzLmNvbnRhaW5lci5nZXRET01Ob2RlKCksXG4gICAgICAgICAgICBoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHBhZGRpbmcgPSAxMDAsXG4gICAgICAgICAgICBuZXdIID0gaCAtIHBhZGRpbmc7XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IG5ld0grJ3B4JztcbiAgICAgICAgLy8gY29udGFpbmVyLnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIiByZWY9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci13cmFwcGVyXCI+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZyYW1lLXNsaWRlLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS1uYW1lXCI+e3RoaXMuc3RhdGUuY3VycmVudEZyYW1lLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtdXNlclwiPkAge3RoaXMuc3RhdGUuY3VycmVudEZyYW1lLm93bmVyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLXN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+IHt0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZS5taXJyb3JlZF9ieS5sZW5ndGh9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lc0xpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpbmsgPSByZXF1aXJlKCcuL05hdkZyYW1lTGluaycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lczogW11cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGcmFtZUxpbmsoZnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZTogJywgZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBCcmFuZCBhbmQgdG9nZ2xlIGdldCBncm91cGVkIGZvciBiZXR0ZXIgbW9iaWxlIGRpc3BsYXkgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm5hdmJhci10b2dnbGUgY29sbGFwc2VkIHB1bGwtbGVmdFwiIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+VG9nZ2xlIG5hdmlnYXRpb248L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1tdXRlZCBoaWRkZW4teHNcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cImJzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIC8ubmF2YmFyLWNvbGxhcHNlICovfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKTtcblxudmFyIE5hdkZyYW1lTGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlRnJhbWVTZWxlY3Rpb246IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2VsZWN0KHRoaXMucHJvcHMuZnJhbWUpO1xuXHRcdGlmICh0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXIpIHtcblx0XHRcdHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcigpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmVDbGFzcyA9ICdub3QtY29ubmVjdGVkJyxcblx0XHRcdGFjdGl2ZVRleHQgPSAnbm90IGNvbm5lY3RlZCc7XG5cdFx0aWYgKHRoaXMucHJvcHMuZnJhbWUuYWN0aXZlKSB7XG5cdFx0XHRhY3RpdmVDbGFzcyA9IGFjdGl2ZVRleHQgPSAnY29ubmVjdGVkJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc1NlbGVjdGVkKHNlbGVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPyAnaWNvbi1jaGVjaycgOiAnc3BhY2UnO1xuICAgICAgICB9XG5cblx0XHR2YXIgY2xhc3NlcyA9ICdwdWxsLXJpZ2h0IHN0YXR1cyAnICsgYWN0aXZlQ2xhc3M7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBvbkNsaWNrPXt0aGlzLmhhbmRsZUZyYW1lU2VsZWN0aW9ufT5cblx0XHRcdFx0PGEgaHJlZj1cIiNcIj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2lzU2VsZWN0ZWQodGhpcy5wcm9wcy5mcmFtZS5zZWxlY3RlZCl9IC8+IHt0aGlzLnByb3BzLmZyYW1lLm5hbWV9XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPXtjbGFzc2VzfT57YWN0aXZlVGV4dH08L3NwYW4+XG5cdFx0XHRcdDwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaW5rOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG52YXIgTmF2RnJhbWVMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIFx0cmV0dXJuIHtcbiAgICBcdFx0ZXh0cmFDbGFzc2VzOiAnJyxcbiAgICBcdFx0aW5jbHVkZUxvZ291dDogdHJ1ZSxcbiAgICBcdFx0bGlua0NsaWNrSGFuZGxlcjogZnVuY3Rpb24oKSB7XG4gICAgXHRcdFx0Y29uc29sZS5sb2coJ2xpbmsgY2xpY2tlZCcpO1xuICAgIFx0XHR9XG4gICAgXHR9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lOiAnLCBmcmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IC8+XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5leHRyYUNsYXNzZXMgKyAnIG5hdi1mcmFtZS1saXN0IGRyYXdlci1jb250ZW50JztcblxuXHRcdHZhciBsb2dvdXQgPSAnJztcblx0XHRpZiAodGhpcy5wcm9wcy5pbmNsdWRlTG9nb3V0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaW5jbHVkZUxvZ291dCcpO1xuXHRcdFx0bG9nb3V0ID0gKFxuXHRcdFx0XHQ8bGk+XG5cdFx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSBjbGFzc05hbWU9XCJidG4tbG9nb3V0XCIgaHJlZj1cIi9sb2dvdXRcIj5sb2cgb3V0PC9hPlxuXHRcdFx0XHQ8L2xpPlxuXHRcdFx0KTtcdFxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPXtjbGFzc2VzfSByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgIHtsb2dvdXR9XG4gICAgICAgICAgICA8L3VsPlxuXHRcdCk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TWVudUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL01lbnVBY3Rpb25zJyksXG5cdE1lbnVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9NZW51U3RvcmUnKSxcblx0U2V0dGluZ3NGb3JtID0gcmVxdWlyZSgnLi9TZXR0aW5nc0Zvcm0nKTtcblxudmFyIFNldHRpbmdzRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItcmlnaHQnXG5cdFx0fVxuXHR9LFxuXHRcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNZW51U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYmFzZUNsYXNzID0gJ3Zpc2libGUteHMgbWVudS1kcmF3ZXInO1xuXHRcdHZhciBvcGVuQ2xhc3MgPSB0aGlzLnN0YXRlLm9wZW4gPyAnbWVudS1kcmF3ZXItb3BlbicgOiAnbWVudS1kcmF3ZXItY2xvc2VkJztcblx0XHR2YXIgc2lkZUNsYXNzID0gdGhpcy5wcm9wcy5zaWRlQ2xhc3M7XG5cdFx0dmFyIGZ1bGxDbGFzcyA9IFtiYXNlQ2xhc3MsIG9wZW5DbGFzcywgc2lkZUNsYXNzXS5qb2luKCcgJyk7XG5cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17ZnVsbENsYXNzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtZW51LWRyYXdlci1pbm5lclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi1kcmF3ZXJcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidXNlcm5hbWUgdGV4dC1jZW50ZXJcIj57T0ZfVVNFUk5BTUV9PC9kaXY+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gPlxuXHRcdCAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1tZW51LXJpZ2h0XCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkcmF3ZXItY29udGVudFwiPlxuXHRcdFx0XHRcdFx0PFNldHRpbmdzRm9ybSAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cblx0X2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0TWVudUFjdGlvbnMudG9nZ2xlU2V0dGluZ3MoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKE1lbnVTdG9yZS5nZXRTZXR0aW5nc1N0YXRlKCkpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NEcmF3ZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKVxuXHRNZW51QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVudUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBTZXR0aW5nc0RyYXdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZnJhbWU6IHtcblx0XHRcdFx0c2V0dGluZ3M6IHtcblx0XHRcdFx0XHRvbl90aW1lOiAnMDY6MDA6MDAnLFxuXHRcdFx0XHRcdG9mZl90aW1lOiAnMTI6MDA6MDAnLFxuXHRcdFx0XHRcdHJvdGF0aW9uOiAxODAsXG5cdFx0XHRcdFx0dmlzaWJpbGl0eTogJ3B1YmxpYydcblx0XHRcdFx0fSxcblx0XHRcdFx0dXNlcjogW1xuXHRcdFx0XHRcdCdqb253b2hsJyxcblx0XHRcdFx0XHQnaXNoYmFjaycsXG5cdFx0XHRcdFx0J2FuZHknXG5cdFx0XHRcdF1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNpZGVDbGFzczogJ21lbnUtZHJhd2VyLXJpZ2h0J1xuXHRcdH1cblx0fSxcblx0XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNldHRpbmdzLWZpZWxkc1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VXNlcnM8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy04XCI+XG5cdFx0XHRcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwidXNlcnMtaW5wdXRcIiB0eXBlPVwidGV4dFwiIHJlZj1cIm5ld1VzZXJcIiAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTJcIj5cblx0XHRcdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBwdWxsLXJpZ2h0XCI+QWRkPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdHt0aGlzLnN0YXRlLmZyYW1lLnVzZXJzfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9uXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mub25fdGltZX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNTowMDowMFwiPjVhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDY6MDA6MDBcIj42YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA3OjAwOjAwXCI+N2FtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwODowMDowMFwiPjhhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDk6MDA6MDBcIj45YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEwOjAwOjAwXCI+MTBhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTE6MDA6MDBcIj4xMWFtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMjowMDowMFwiPjEycG08L29wdGlvbj5cblx0XHRcdFx0XHRcdDwvc2VsZWN0PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9mZlwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLm9mZl90aW1lfT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA1OjAwOjAwXCI+NXBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNjowMDowMFwiPjZwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDc6MDA6MDBcIj43cG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA4OjAwOjAwXCI+OHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwOTowMDowMFwiPjlwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTA6MDA6MDBcIj4xMHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMTowMDowMFwiPjExcG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEyOjAwOjAwXCI+MTJwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+Um90YXRlPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTBcIj5cblx0XHRcdFx0XHRcdDxzZWxlY3QgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInJvdGF0ZVwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9ufT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjBcIj5ub25lPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VmlzaWJpbGl0eTwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEwXCI+XG5cdFx0XHRcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJ0dXJuT2ZmXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJpbGl0eX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCJwdWJsaWNcIj5wdWJsaWM8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cInByaXZhdGVcIj5wcml2YXRlPC9vcHRpb24+XG5cdFx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzRHJhd2VyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgU2V0dGluZ3NNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3NPcGVuOiBmYWxzZSxcblx0XHRcdGZyYW1lOiB7XG5cdFx0XHRcdG5hbWU6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJycsXG5cdFx0XHRcdHNldHRpbmdzOiB7XG5cdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRyb3RhdGlvbjogMFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uVUlDaGFuZ2UpO1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uRnJhbWVDaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZygnaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgICAgIFx0VUlBY3Rpb25zLnNldHRpbmdzTW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVub3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25VSUNoYW5nZSk7XG4gICAgICAgIEZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25GcmFtZUNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVOYW1lQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHN0YXRlID0gdGhpcy5zdGF0ZTtcblx0XHRzdGF0ZS5mcmFtZS5uYW1lID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVEZXNjcmlwdGlvbkNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuZGVzY3JpcHRpb24gPSB2YWw7XG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0X2hhbmRsZVZpc2liaWxpdHlDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJsZSA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlUm90YXRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9uID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVTYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnNhdmVGcmFtZSh0aGlzLnN0YXRlLmZyYW1lKTtcblx0fSxcblxuXHRfb25VSUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRTZXR0aW5nc01vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2V0dGluZ3NPcGVuKSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoJ2hpZGUnKTtcblx0ICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25GcmFtZUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBcdGZyYW1lOiBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0NDQ0NDQ0NDQ0MgLS0tLT4gJywgdGhpcy5zdGF0ZS5mcmFtZSk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbCBmYWRlIG1vZGFsLXNldHRpbmdzXCIgcmVmPVwibW9kYWxcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1kaWFsb2dcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWNvbnRlbnRcIj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCIgYXJpYS1sYWJlbD1cIkNsb3NlXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuXHRcdFx0ICAgIFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHRcdCAgICBcdDxoNCBjbGFzc05hbWU9XCJtb2RhbC10aXRsZVwiPlNldHRpbmdzPC9oND5cblx0XHRcdFx0XHQgIFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWJvZHlcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5OYW1lPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT17dGhpcy5zdGF0ZS5mcmFtZS5uYW1lfSBvbkNoYW5nZT17dGhpcy5faGFuZGxlTmFtZUNoYW5nZX0gLz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5EZXNjcmlwdGlvbiAob3B0aW9uYWwpPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1sYWJlbC1zdWJ0ZXh0XCI+VXNlZnVsIGlmIHlvdXIgZnJhbWUgZm9sbG93cyBhIHRoZW1lPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0cmVmPVwiZGVzY3JpcHRpb25cIlxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0dHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuZGVzY3JpcHRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlRGVzY3JpcHRpb25DaGFuZ2V9XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRwbGFjZWhvbGRlcj1cImUuZy4gamFwYW5lc2UgYXJ0LCA5MHMgcG9zdGVyc1wiIC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtOVwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5WaXNpYmxlIHRvIG90aGVyIHBlb3BsZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPllvdXIgZnJhbWUgd2lsbCBhcHBlYXIgb24gRnJhbWVzIGFuZCBvdGhlcnMgY2FuIG1pcnJvciBpdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0zXCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dC1jaGVja2JveFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidmlzaWJpbGl0eVwiIHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRjaGVja2VkPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLnZpc2libGV9XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlVmlzaWJpbGl0eUNoYW5nZX0vPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGQgcm93LWZvcm0tZmllbGQtcm90YXRpb25cIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTYgZm9ybS1sYWJlbFwiPlJvdGF0aW9uPC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0taW5wdXQtc2VsZWN0XCI+XG5cdFx0XHRcdFx0ICAgIFx0XHRcdDxzZWxlY3QgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInJvdGF0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHR2YWx1ZT17dGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy5yb3RhdGlvbn1cblx0XHRcdFx0XHQgICAgXHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlUm90YXRpb25DaGFuZ2V9ID5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjBcIj4wJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjkwXCI+OTAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiLTkwXCI+LTkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjE4MFwiPjE4MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZVNhdmV9IHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLWFkZC1jb250ZW50XCI+XG5cdFx0XHRcdCAgICBcdFx0XHRTYXZlXG5cdFx0XHRcdCAgICBcdFx0PC9idXR0b24+XG5cdFx0XHRcdCAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NNb2RhbDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG4gICAgVUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgU2ltcGxlTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZyYW1lTmFtZSA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5uYW1lO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbm5lY3RlZChhY3RpdmUpIHtcbiAgICAgICAgICAgIHZhciBjb25uZWN0ZWQgPSAnJztcbiAgICAgICAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0ZWQgPSAnJmJ1bGw7ICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge19faHRtbDogY29ubmVjdGVkfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9mLW5hdi1maXhlZCBvZi1uYXYtdG9wXCI+XG4gICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImZyYW1lLW5hbWUgdGV4dC1jZW50ZXJcIj48c3BhbiBjbGFzc05hbWU9XCJjb25uZWN0ZWRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17Y29ubmVjdGVkKHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5hY3RpdmUpfSAvPntmcmFtZU5hbWV9PC9oNj5cblxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IGJ0bi1tZW51IHZpc2libGUteHMgcHVsbC1sZWZ0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3Blbk1lbnVDbGlja30+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24taGFtYnVyZ2VyXCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tc2V0dGluZyB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVPcGVuU2V0dGluZ3N9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNvZ1wiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQgaGlkZGVuLXhzIHB1bGwtbGVmdFwiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj57T0ZfVVNFUk5BTUV9PC9zcGFuPjwvaDM+XG5cblxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHQgaGlkZGVuLXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJkcm9wZG93blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPE5hdkZyYW1lTGlzdCBleHRyYUNsYXNzZXM9XCJkcm9wZG93bi1tZW51XCIgaW5jbHVkZUxvZ291dD17ZmFsc2V9Lz5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNzZXR0aW5nc1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5TZXR0aW5nc30+U2V0dGluZ3M8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+TG9nIE91dDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuTWVudUNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlT3Blbk1lbnVDbGljaycpO1xuICAgICAgICBVSUFjdGlvbnMudG9nZ2xlTWVudSh0cnVlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU9wZW5TZXR0aW5nczogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5TZXR0aW5ncycpO1xuICAgICAgICBVSUFjdGlvbnMub3BlblNldHRpbmdzTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJysrKysrKyBnZXQgc2VsZWN0ZWQgZnJhbWUnLCBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0Q29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpO1xuXG52YXIgVHJhbnNmZXJCdXR0b25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHRyYW5zZmVyLWJ1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1ncm91cFwiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCIuLi5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCIgb25DbGljaz17dGhpcy5zZW5kQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi11cCBpY29uLXNlbmRcIiBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tc2VuZFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4gKi99XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblxuXHRzZW5kQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy51cGRhdGVDb250ZW50KENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKSk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmZXJCdXR0b25zOyIsInZhciBjb25mID0ge1xuXHRkb21haW46ICdsb2NhbGhvc3QnLFxuXHRwb3J0OiAnODg4OCcsXG5cdG5hdmJhckg6IDUwXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZjsiLCJ2YXIga2V5bWlycm9yID0gcmVxdWlyZSgna2V5bWlycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5bWlycm9yKHtcblxuXHQvLyBmcmFtZSBhY3Rpb24gdHlwZXNcblx0RlJBTUVfTE9BRDogbnVsbCxcblx0RlJBTUVfTE9BRF9ET05FOiBudWxsLFxuXHRGUkFNRV9MT0FEX0ZBSUw6IG51bGwsXG5cdEZSQU1FX0xPQURfVklTSUJMRTogbnVsbCxcblx0RlJBTUVfTE9BRF9WSVNJQkxFX0RPTkU6IG51bGwsXG5cdEZSQU1FX0xPQURfVklTSUJMRV9GQUlMOiBudWxsLFxuXHRGUkFNRV9TRUxFQ1Q6IG51bGwsXG5cdEZSQU1FX1VQREFURV9DT05URU5UOiBudWxsLFxuXHRGUkFNRV9TRVRUSU5HU19DT05URU5UOiBudWxsLFxuXHRGUkFNRV9DT05URU5UX1VQREFURUQ6IG51bGwsXG5cdEZSQU1FX0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX0RJU0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX1NBVkU6IG51bGwsXG5cdEZSQU1FX1NBVkVfRE9ORTogbnVsbCxcblx0RlJBTUVfU0FWRV9GQUlMOiBudWxsLFxuXHRGUkFNRV9TTElERV9DSEFOR0VEOiBudWxsLFxuXG5cdC8vIGNvbnRlbnQgYWN0aW9uIHR5cGVzXG5cdENPTlRFTlRfTE9BRDogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1NFTkQ6IG51bGwsXG5cdENPTlRFTlRfU0xJREVfQ0hBTkdFRDogbnVsbCxcblx0Q09OVEVOVF9BREQ6IG51bGwsXG5cdENPTlRFTlRfQUREX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfQUREX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9ET05FOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9GQUlMOiBudWxsLFxuXG5cdC8vIFVJIGFjdGlvbiB0eXBlc1xuXHRVSV9NRU5VX1RPR0dMRTogbnVsbCxcblx0VUlfU0VUX1NFTEVDVElPTl9QQU5FTDogbnVsbCxcblx0VUlfT1BFTl9BRERfQ09OVEVOVDogbnVsbCxcblx0VUlfQ0xPU0VfQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX09QRU5fU0VUVElOR1M6IG51bGwsXG5cdFVJX0NMT1NFX1NFVFRJTkdTOiBudWxsLFxuXG5cdC8vIGVtaXR0ZWQgYnkgc3RvcmVzXG5cdENIQU5HRV9FVkVOVDogbnVsbFxufSk7IiwidmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCdmbHV4JykuRGlzcGF0Y2hlcjtcblxudmFyIEFwcERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuXG4vKipcbiogQSBicmlkZ2UgZnVuY3Rpb24gYmV0d2VlbiB0aGUgdmlld3MgYW5kIHRoZSBkaXNwYXRjaGVyLCBtYXJraW5nIHRoZSBhY3Rpb25cbiogYXMgYSB2aWV3IGFjdGlvbi4gIEFub3RoZXIgdmFyaWFudCBoZXJlIGNvdWxkIGJlIGhhbmRsZVNlcnZlckFjdGlvbi5cbiogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb24gVGhlIGRhdGEgY29taW5nIGZyb20gdGhlIHZpZXcuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uID0gZnVuY3Rpb24oYWN0aW9uKSB7XG5cdGFjdGlvbi5zb3VyY2UgPSAnVklFV19BQ1RJT04nO1xuXHR0aGlzLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cblxuLyoqXG4qIEEgYnJpZGdlIGZ1bmN0aW9uIGJldHdlZW4gdGhlIHNlcnZlciBhbmQgdGhlIGRpc3BhdGNoZXIsIG1hcmtpbmcgdGhlIGFjdGlvblxuKiBhcyBhIHNlcnZlciBhY3Rpb24uXG4qIEBwYXJhbSAge29iamVjdH0gYWN0aW9uIFRoZSBkYXRhIGNvbWluZyBmcm9tIHRoZSBzZXJ2ZXIuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcblx0YWN0aW9uLnNvdXJjZSA9ICdTRVJWRVJfQUNUSU9OJztcblx0dGhpcy5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcERpc3BhdGNoZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcC5qcycpLFxuICAgIGJyb3dzZXJfc3RhdGUgPSByZXF1aXJlKCcuL2Jyb3dzZXJfc3RhdGVfbWFuYWdlcicpLFxuICAgIEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG4vLyBpbml0IGphdmFzY3JpcHQgbWVkaWEgcXVlcnktbGlrZSBzdGF0ZSBkZXRlY3Rpb25cbmJyb3dzZXJfc3RhdGUuaW5pdCgpO1xuXG4vLyBUdXJuIG9uIHRvdWNoIGV2ZW50cyBmb3IgUmVhY3QuXG4vLyBSZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbi8vIEZhc3RDbGljayByZW1vdmVzIHRoZSAzMDBzIGRlbGF5IG9uIHN0dXBpZCBpT1MgZGV2aWNlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coJ2F0dGFjaGluZyBGYXN0Q2xpY2snKTtcblx0RmFzdENsaWNrLmF0dGFjaChkb2N1bWVudC5ib2R5KTtcbn0pO1xuXG5SZWFjdC5yZW5kZXIoXG5cdDxBcHAgLz4sXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdPcGVuRnJhbWUnKVxuKSIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9jb250ZW50ID0gW10sXG5cdF9zZWxlY3RlZF9jb250ZW50X2lkID0gbnVsbDtcblxuXG52YXIgQ29udGVudFN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gY29udGVudDtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IF9jb250ZW50WzBdLl9pZDtcblx0XHRjb25zb2xlLmxvZygnaW5pdCcsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0fSxcblxuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQucHVzaChjb250ZW50KTtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGNvbnRlbnQuX2lkO1xuXHR9LFxuXG5cdHJlbW92ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IF8ucmVtb3ZlKF9jb250ZW50LCB7X2lkOiBjb250ZW50Ll9pZH0pO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGdldENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY29udGVudDtcblx0fSxcblxuXHRnZXRTZWxlY3RlZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKCdnZXRTZWxlY3RlZENvbnRlbnQ6JywgX2NvbnRlbnQsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0XHRyZXR1cm4gXy5maW5kKF9jb250ZW50LCB7J19pZCc6IF9zZWxlY3RlZF9jb250ZW50X2lkfSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcblxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRDpcblx0XHRcdGNvbnNvbGUubG9nKCdsb2FkaW5nIGNvbnRlbnQuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBsb2FkZWQ6ICcsIGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5pbml0KGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygnY29udGVudCBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VEOlxuXHRcdFx0Y29uc29sZS5sb2coJ3NsaWRlIGNoYW5nZWQuLi4nKTtcblx0XHRcdF9zZWxlY3RlZF9jb250ZW50X2lkID0gYWN0aW9uLmNvbnRlbnRfaWQ7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BREQ6XG5cdFx0XHRjb25zb2xlLmxvZygnYWRkaW5nIGNvbnRlbnQuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGFkZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuYWRkQ29udGVudChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygnY29udGVudCBmYWlsZWQgdG8gYmUgYWRkZWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9TRU5EOlxuXG5cdFx0XHQvLyBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19VUERBVEVfVEVYVDpcblx0ICAgIC8vICAgdGV4dCA9IGFjdGlvbi50ZXh0LnRyaW0oKTtcblx0ICAgIC8vICAgaWYgKHRleHQgIT09ICcnKSB7XG5cdCAgICAvLyAgICAgdXBkYXRlKGFjdGlvbi5pZCwge3RleHQ6IHRleHR9KTtcblx0ICAgIC8vICAgICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICB9XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWTpcblx0ICAgIC8vICAgZGVzdHJveShhY3Rpb24uaWQpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50U3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2ZyYW1lcyA9IHt9LFxuXHQvLyB0aGVzZSB0d28gYXJlIGZvciB0aGUgc3dpcGVyIG9mIHZpc2libGUgZnJhbWVzOlxuXHRfdmlzaWJsZUZyYW1lcyA9IFtdLFxuXHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IG51bGw7O1xuXG52YXIgYWRkRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgc2VsZWN0KSB7XG5cdF9mcmFtZXNbZnJhbWUuX2lkXSA9IGZyYW1lO1xuXHRpZiAoc2VsZWN0ICE9PSBmYWxzZSkgc2VsZWN0RnJhbWUoZnJhbWUpO1xufVxuXG52YXIgcmVtb3ZlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSl7XG5cdGNvbnNvbGUubG9nKCdyZW1vdmVGcmFtZScsIGZyYW1lKTtcblx0dmFyIGlkID0gZnJhbWUuX2lkO1xuXHRpZiAoaWQgaW4gX2ZyYW1lcykgZGVsZXRlIF9mcmFtZXNbaWRdO1xuXHRjb25zb2xlLmxvZyhfZnJhbWVzKTtcbn07XG5cbnZhciBzZWxlY3RGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdGNvbnNvbGUubG9nKCdzZWxlY3RGcmFtZTogJywgZnJhbWUpO1xuXG5cdC8vIHVuc2VsZWN0IGN1cnJlbnRseSBzZWxlY3RlZFxuXHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRpZiAoc2VsZWN0ZWRGcmFtZSkge1xuXHRcdHNlbGVjdGVkRnJhbWUuc2VsZWN0ZWQgPSBmYWxzZTtcblx0fVxuXG5cdC8vIG5vdyBzZXQgdGhlIG5ldyBzZWxlY3RlZCBmcmFtZVxuXHR2YXIgX3NlbGVjdGVkRnJhbWUgPSBfLmZpbmQoX2ZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG5cdF9zZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gdHJ1ZTtcbn1cblxudmFyIEZyYW1lU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHRpbml0OiBmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRfLmVhY2goZnJhbWVzLCBhZGRGcmFtZSk7XG5cblx0XHQvLyBzZWUgaWYgYW55IGZyYW1lIGlzIG1hcmtlZCBhcyBzZWxlY3RlZCBmcm9tIGRiLFxuXHRcdC8vIG90aGVyd2lzZSBzZWxlY3QgdGhlIGZpcnN0IGZyYW1lLlxuXHRcdGlmICghXy5maW5kKF9mcmFtZXMsIHtzZWxlY3RlZDogdHJ1ZX0pKSB7XG5cdFx0XHRfLnNhbXBsZShfZnJhbWVzKS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0RnJhbWU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIF9mcmFtZXNbaWRdO1xuXHR9LFxuXG5cdGdldEFsbEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2dldEFsbEZyYW1lczogJywgX2ZyYW1lcyk7XG5cdFx0cmV0dXJuIF8ubWFwKF9mcmFtZXMsIGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gZnJhbWU7XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KTtcblx0fSxcblxuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogX2ZyYW1lcyxcblx0XHRcdHNlbGVjdGVkRnJhbWU6IHRoaXMuZ2V0U2VsZWN0ZWRGcmFtZSgpXG5cdFx0fTtcblx0fSxcblxuXHRpbml0VmlzaWJsZUZyYW1lczogZnVuY3Rpb24odmlzaWJsZUZyYW1lcykge1xuXHRcdF92aXNpYmxlRnJhbWVzID0gdmlzaWJsZUZyYW1lcztcblx0XHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IF92aXNpYmxlRnJhbWVzWzBdLl9pZDtcblx0XHRjb25zb2xlLmxvZygnaW5pdFZpc2libGVGcmFtZXMnLCBfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCk7XG5cdH0sXG5cblx0YWRkVmlzaWJsZUZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdF92aXNpYmxlRnJhbWVzLnB1c2goZnJhbWUpO1xuXHRcdF9zZWxlY3RlZF92aXNpYmxlX2ZyYW1lX2lkID0gZnJhbWUuX2lkO1xuXHR9LFxuXG5cdHJlbW92ZVZpc2libGVGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRfdmlzaWJsZUZyYW1lcyA9IF8ucmVtb3ZlKF92aXNpYmxlRnJhbWVzLCB7X2lkOiBmcmFtZS5faWR9KTtcblx0fSxcblxuXHRnZXRWaXNpYmxlRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX3Zpc2libGVGcmFtZXM7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRWaXNpYmxlRnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmZpbmQoX3Zpc2libGVGcmFtZXMsIHsnX2lkJzogX3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0Y29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0Y29uc29sZS5sb2coJ2Nvbm5lY3RGcmFtZTogJywgZnJhbWUpO1xuXHRcdGFkZEZyYW1lKGZyYW1lKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgZGlzY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0ZGlzY29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0YWRkRnJhbWUoZnJhbWUsIGZhbHNlKTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuXG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBsb2FkZWQ6ICcsIGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5pbml0KGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9WSVNJQkxFOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgdmlzaWJsZSBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygndmlzaWJsZSBmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuaW5pdFZpc2libGVGcmFtZXMoYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCd2aXNpYmxlIGZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5jb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuZGlzY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVDpcbiAgICBcdFx0c2VsZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicpO1xuXHRcdFx0X3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWQgPSBhY3Rpb24uZnJhbWVfaWQ7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9TRU5EOlxuICAgIFx0XHRGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKS5jb250ZW50ID0gYWN0aW9uLmNvbnRlbnQ7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9DT05URU5UX1VQREFURUQ6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIHVwZGF0ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBzYXZlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRE9ORTpcblx0XHRcdC8vIGFkZGluZyB0aGUgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdC8vIG5vb3AgKG9wdGltaXN0aWMgdWkgdXBkYXRlIGFscmVhZHkgaGFwcGVuZWQgb24gRlJBTUVfU0FWRSlcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0ZBSUw6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIGZhaWxlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0Ly8gVE9ETzogaGFuZGxlIHRoaXMgYnkgcmV2ZXJ0aW5nIChpbW11dGFibGUuanMgd291bGQgaGVscClcblx0XHRcdGNvbnNvbGUubG9nKCdmYWlsZWQgdG8gc2F2ZSBmcmFtZScsIGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVTdG9yZTsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfbWVudU9wZW4gPSBmYWxzZSxcblx0X3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuXG52YXIgX3RvZ2dsZU1lbnUgPSBmdW5jdGlvbigpIHtcblx0X21lbnVPcGVuID0gIV9tZW51T3Blbjtcbn1cblxudmFyIF90b2dnbGVTZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xuXHRfc2V0dGluZ3NPcGVuID0gIV9zZXR0aW5nc09wZW47XG59XG5cblxudmFyIE1lbnVTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGdldE1lbnVTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IF9tZW51T3BlblxuXHRcdH07XG5cdH0sXG5cblx0Z2V0U2V0dGluZ3NTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IF9zZXR0aW5nc09wZW5cblx0XHR9O1xuXHR9LFxuXG5cdGdldEZvb3Rlck5hdlN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXG5cdFx0fTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblx0XG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG4gIFx0XG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuTUVOVV9UT0dHTEU6XG4gICAgXHRcdF90b2dnbGVNZW51KCk7XG5cdFx0XHRNZW51U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cdFx0XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5TRVRUSU5HU19UT0dHTEU6XG4gICAgXHRcdF90b2dnbGVTZXR0aW5ncygpO1xuXHRcdFx0TWVudVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51U3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG4gICAgT0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcbiAgICBhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfbWVudU9wZW4gPSBmYWxzZSxcbiAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2UsXG4gICAgX2FkZE9wZW4gPSBmYWxzZSxcbiAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2UsXG4gICAgX3NlbGVjdGlvblBhbmVsID0gXCJjb2xsZWN0aW9uXCI7XG5cbnZhciBfdG9nZ2xlTWVudSA9IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICBfbWVudU9wZW4gPSAhIW9wZW47XG59XG5cblxudmFyIFVJU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuICAgIGdldE1lbnVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcGVuOiBfbWVudU9wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2V0dGluZ3NTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcGVuOiBfc2V0dGluZ3NPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNlbGVjdGlvblBhbmVsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2VsZWN0aW9uUGFuZWw6IF9zZWxlY3Rpb25QYW5lbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRBZGRNb2RhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZE9wZW46IF9hZGRPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNldHRpbmdzTW9kYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT09PT09PScsIF9zZXR0aW5nc09wZW4pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2V0dGluZ3NPcGVuOiBfc2V0dGluZ3NPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcbiAgICB9LFxuXG4gICAgYWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICAgICAgdGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgICB9XG5cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgc3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9NRU5VX1RPR0dMRTpcbiAgICAgICAgICAgIF90b2dnbGVNZW51KGFjdGlvbi5vcGVuKTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9NRU5VX1RPR0dMRTpcbiAgICAgICAgICAgIF90b2dnbGVTZXR0aW5ncygpO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX1NFVF9TRUxFQ1RJT05fUEFORUw6XG4gICAgICAgICAgICBfc2VsZWN0aW9uUGFuZWwgPSBhY3Rpb24ucGFuZWw7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfT1BFTl9BRERfQ09OVEVOVDpcbiAgICAgICAgICAgIF9hZGRPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9DTE9TRV9BRERfQ09OVEVOVDpcbiAgICAgICAgICAgIC8vIG1vZGFsIGFscmVhZHkgY2xvc2luZywgbm8gY2hhbmdlIGVtbWlzc2lvbiBuZWVkZWRcbiAgICAgICAgICAgIF9hZGRPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX09QRU5fU0VUVElOR1M6XG4gICAgICAgICAgICBfc2V0dGluZ3NPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9DTE9TRV9TRVRUSU5HUzpcbiAgICAgICAgICAgIC8vIG1vZGFsIGFscmVhZHkgY2xvc2luZywgbm8gY2hhbmdlIGVtbWlzc2lvbiBuZWVkZWRcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORTpcbiAgICAgICAgICAgIF9hZGRPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJU3RvcmU7Il19
