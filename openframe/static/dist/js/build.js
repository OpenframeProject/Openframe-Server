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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9GcmFtZUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL1VJQWN0aW9ucy5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwaS9Tb2NrZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9icm93c2VyX3N0YXRlX21hbmFnZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FkZENvbnRlbnRGb3JtLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BZGRDb250ZW50TW9kYWwuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FwcC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQ29udGVudExpc3QuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0RyYXdlci5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRm9vdGVyTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9GcmFtZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVzTGlzdC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9OYXZGcmFtZUxpbmsuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdkZyYW1lTGlzdC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvU2V0dGluZ3NNb2RhbC5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvU2ltcGxlTmF2LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25maWcuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25zdGFudHMvT0ZDb25zdGFudHMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9yZWFjdC1tYWluLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0NvbnRlbnRTdG9yZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9GcmFtZVN0b3JlLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL1VJU3RvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QWEsR0FBRyxLQUFLLENBQUM7QUFDbEMsWUFBWSxNQUFNOztRQUVWLEtBQUssV0FBVyxDQUFDLGdCQUFnQjtZQUM3QixRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O1FBRVYsS0FBSyxXQUFXLENBQUMsVUFBVTtZQUN2QixhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O0FBRWxCLFFBQVEsUUFBUTs7R0FFYjtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHRhbGxfY29udGVudDogJy9jb250ZW50L3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBDb250ZW50QWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGNvbnRlbnQgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKi9cblx0bG9hZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudHMoKScpO1xuXHRcdC8vIGRpc3BhdGNoIGFuIGFjdGlvbiBpbmRpY2F0aW5nIHRoYXQgd2UncmUgbG9hZGluZyB0aGUgY29udGVudFxuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BREQsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoY29udGVudCksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdHVzZXJzX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUUsXG5cdHZpc2libGVfZnJhbWVzOiAnL2ZyYW1lcy92aXNpYmxlP3Y9MSdcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy51c2Vyc19mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lczogJywgZnJhbWVzKTtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkUsXG5cdFx0XHRcdFx0ZnJhbWVzOiBmcmFtZXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdC8vIGxvYWQgZmFpbHVyZSwgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZldGNoIGFsbCBmcmFtZXMgbWFya2VkICd2aXNpYmxlJ1xuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRWaXNpYmxlRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRVxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIHZpc2libGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy52aXNpYmxlX2ZyYW1lcylcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnZnJhbWVzOiAnLCBmcmFtZXMpO1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNlbGVjdCBhIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGZyYW1lXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ3NlbGVjdCcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VMRUNULFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgY29udGVudCBvbiB0aGUgc2VsZWN0ZWQgZnJhbWUuXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29udGVudFxuXHQgKi9cblx0dXBkYXRlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdHZhciBmcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRcdGNvbnNvbGUubG9nKGZyYW1lLCBjb250ZW50KTtcblx0XHQvLyB2YXIgY29udGVudCA9IENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZV9pZDogZnJhbWUuX2lkLFxuICAgICAgICAgICAgY29udGVudF9pZDogY29udGVudC5faWRcbiAgICAgICAgfTtcbiAgICAgICAgU29ja2VyLnNlbmQoJ2ZyYW1lOnVwZGF0ZV9jb250ZW50JywgZGF0YSk7XG5cblx0XHQvLyBXZWJTb2NrZXQgZXZlbnQgaGFuZGxlciBmb3IgZnJhbWU6ZnJhbWVfdXBkYXRlZCB0cmlnZ2VycyB0aGUgZGlzcGF0Y2hcblx0fSxcblxuICAgIG1pcnJvckZyYW1lOiBmdW5jdGlvbihtaXJyb3JlZF9mcmFtZSkge1xuICAgICAgICB2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblxuICAgICAgICBpZiAoXy5pc0FycmF5KG1pcnJvcmVkX2ZyYW1lLm1pcnJvcmVkX2J5KSkge1xuICAgICAgICAgICAgbWlycm9yZWRfZnJhbWUubWlycm9yZWRfYnkucHVzaChmcmFtZS5faWQpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lX2lkOiBmcmFtZS5faWQsXG4gICAgICAgICAgICBtaXJyb3JlZF9mcmFtZV9pZDogbWlycm9yZWRfZnJhbWUuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTptaXJyb3JfZnJhbWUnLCBkYXRhKVxuICAgIH0sXG5cblx0c2F2ZUZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFLFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cbiAgICAgICAgLy8gaGFjayBzbyB0aGF0IHNlbGVjdGVkIGRvZXNuJ3QgZ2V0IHBlcnNpc3RlZFxuICAgICAgICBmcmFtZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvZnJhbWVzLycrZnJhbWUuX2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGZyYW1lKSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9ET05FLFxuXHRcdFx0XHRmcmFtZTogZnJhbWVcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRkFJTCxcblx0XHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZnJhbWUuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRmcmFtZUNvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0ZnJhbWVEaXNjb25uZWN0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIGRpc2Nvbm5lY3RlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZUNvbnRlbnRVcGRhdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb250ZW50IHVwZGF0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05URU5UX1VQREFURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuICAgIGZyYW1lVXBkYXRlZDogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFVwZGF0ZWQ6ICcsIGZyYW1lKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfVVBEQVRFRCxcbiAgICAgICAgICAgIGZyYW1lOiBmcmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZnJhbWVNaXJyb3JlZDogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIG1pcnJvcmVkOiAnLCBmcmFtZSk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX01JUlJPUkVELFxuICAgICAgICAgICAgZnJhbWU6IGZyYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cblx0c2V0dXA6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgZnJhbWUgPSBkYXRhLmZyYW1lO1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgU2V0dXAnLCBmcmFtZSk7XG4gICAgICAgIC8vIHRoaXMgaXMgYSBsaXR0bGUgd2VpcmQgLS0gd2h5IGlzbid0IHNldHVwIGp1c3QgcGFydCBvZiB0aGUgaW5pdGlhbFxuICAgICAgICAvLyBjb25uZWN0ZWQgZXZlbnQ/XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhbGx5PyBEb2VzIHRoZSB2aWV3IGRpbWVuc2lvbiBuZWVkIHRvIGJlIHBhcnQgb2YgdGhlIHN0YXRlP1xuICAgICAqIFByb2JhYmxlIG5vdC4gTm90IHVzZWQgcHJlc2VudGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSB3IFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGggW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgc2V0dXBGcmFtZVZpZXc6IGZ1bmN0aW9uKHcsIGgpIHtcbiAgICBcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TRVRVUF9WSUVXLFxuXHRcdFx0dzogdyxcblx0XHRcdGg6IGhcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgc2xpZGVDaGFuZ2VkOiBmdW5jdGlvbihmcmFtZV9pZCkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TTElERV9DSEFOR0VELFxuXHRcdFx0ZnJhbWVfaWQ6IGZyYW1lX2lkXG5cdFx0fSk7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lQWN0aW9ucztcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG4gICAgT0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JylcblxudmFyIFVJQWN0aW9ucyA9IHtcblxuICAgIHRvZ2dsZU1lbnU6IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICAgICAgLy8gaWYgb3BlbiB0cnVlLCBvcGVuLiBpZiBmYWxzZSwgY2xvc2UuXG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9NRU5VX1RPR0dMRSxcbiAgICAgICAgICAgIG9wZW46IG9wZW5cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNldHRpbmdzOiBmdW5jdGlvbihvcGVuKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9TRVRUSU5HU19UT0dHTEUsXG4gICAgICAgICAgICBvcGVuOiBvcGVuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRTZWxlY3Rpb25QYW5lbDogZnVuY3Rpb24ocGFuZWwpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX1NFVF9TRUxFQ1RJT05fUEFORUwsXG4gICAgICAgICAgICBwYW5lbDogcGFuZWxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5BZGRDb250ZW50TW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnb3BlbkFkZENvbnRlbnRNb2RhbCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9BRERfQ09OVEVOVFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWRkQ29udGVudE1vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2FkZENvbnRlbnRNb2RhbENsb3NlZCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfQ0xPU0VfQUREX0NPTlRFTlRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9wZW5TZXR0aW5nc01vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ29wZW5TZXR0aW5nc01vZGFsJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9PUEVOX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nc01vZGFsQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3NldHRpbmdzTW9kYWxDbG9zZWQnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTXG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJQWN0aW9uczsiLCJTb2NrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9zZWxmID0ge30sXG4gICAgICAgIF9ldmVudEhhbmRsZXJzID0ge30sXG4gICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZSxcbiAgICAgICAgX29wdHMgPSB7XG4gICAgICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBjaGVja0ludGVydmFsOiAxMDAwMFxuICAgICAgICB9LFxuICAgICAgICBfdXJsLFxuICAgICAgICBfd3MsXG4gICAgICAgIF90aW1lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdlYnNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdXJsICBUaGUgc2VydmVyIFVSTC5cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdHMgT3B0aW9uYWwgc2V0dGluZ3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY29ubmVjdCh1cmwsIG9wdHMpIHtcbiAgICAgICAgX3VybCA9IHVybDtcbiAgICAgICAgaWYgKG9wdHMpIF9leHRlbmQoX29wdHMsIG9wdHMpO1xuICAgICAgICBfd3MgPSBuZXcgV2ViU29ja2V0KHVybCk7XG5cbiAgICAgICAgX3dzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gb3BlbmVkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbk9wZW4pIF9vcHRzLm9uT3BlbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbkNsb3NlKSBfb3B0cy5vbkNsb3NlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gbWVzc2FnZS5uYW1lLFxuICAgICAgICAgICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBldmVudCBoYW5kbGVyLCBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2V2ZW50SGFuZGxlcnNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV1baV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgXCIgZXZlbnQgbm90IGhhbmRsZWQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfb3B0cy5rZWVwQWxpdmUpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgICAgIF90aW1lciA9IHNldEludGVydmFsKF9jaGVja0Nvbm5lY3Rpb24sIF9vcHRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdID0gW2NhbGxiYWNrXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29mZihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9ldmVudEhhbmRsZXJzW25hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZGF0YSBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc2VuZChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Muc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIElmIG5vdCwgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hlY2tDb25uZWN0aW9uKCkge1xuICAgICAgICBpZiAoIV9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIF9jb25uZWN0KF91cmwsIF9vcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIGV4dGVuZGluZyBhbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZXh0ZW5kKG9iaikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBfc2VsZi5vbiA9IF9vbjtcbiAgICBfc2VsZi5vZmYgPSBfb2ZmO1xuICAgIF9zZWxmLnNlbmQgPSBfc2VuZDtcbiAgICBfc2VsZi5jb25uZWN0ID0gX2Nvbm5lY3Q7XG4gICAgcmV0dXJuIF9zZWxmO1xufSkoKTtcblxuLy8gQ09NTU9OLkpTXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBTb2NrZXI7IiwidmFyIHNzbSA9IHJlcXVpcmUoJ3NzbScpXG5cdGNvbmYgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuXG5mdW5jdGlvbiBfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQoKSB7XG5cdGNvbnNvbGUubG9nKCdfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnQnKTtcblxuXHRfc2V0dXBTY3JlZW5TaXplKCk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAneHMnLFxuXHQgICAgbWF4V2lkdGg6IDc2Nyxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIHhzJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICd4cyc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ3NtJyxcblx0ICAgIG1pbldpZHRoOiA3NjgsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBzbScpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnc20nO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdtZCcsXG5cdCAgICBtaW5XaWR0aDogOTkyLFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgbWQnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ21kJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnbGcnLFxuXHQgICAgbWluV2lkdGg6IDEyMDAsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBsZycpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnbGcnO1xuXHQgICAgfVxuXHR9KTtcdFxuXG5cdHNzbS5yZWFkeSgpO1xufVxuXG5mdW5jdGlvbiBfc2V0dXBTY3JlZW5TaXplKCkge1xuXHRjb25mLndXID0gd2luZG93LmlubmVyV2lkdGg7XG5cdGNvbmYud0ggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdGNvbnNvbGUubG9nKGNvbmYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdDogX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50XG59XG5cbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgQ29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyk7XG5cbnZhciBBZGRDb250ZW50Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBoYW5kbGVGb3JtU3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHVybCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlO1xuXG4gICAgICAgIGlmICghdXJsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWJtaXR0aW5nIGNvbnRlbnQ6ICcsIGNvbnRlbnQpO1xuICAgICAgICBDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlID0gJyc7XG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLmZvY3VzKCk7XG4gICAgfSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgaGlkZGVuLXhzIGFkZC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1pbmxpbmVcIiBpZD1cImFkZC1mb3JtXCIgb25TdWJtaXQ9e3RoaXMuaGFuZGxlRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxsYWJlbCBmb3I9XCJTZW5kVG9Vc2VyXCI+VVJMPC9sYWJlbD4gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIGlkPVwiVVJMXCIgcGxhY2Vob2xkZXI9XCJlbnRlciBVUkxcIiByZWY9XCJVUkxcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHQgYnRuLWFkZC1jb250ZW50XCIgaHJlZj1cIiNhZGQtY29udGVudFwiIGlkPVwiYWRkLWNvbnRlbnQtYnV0dG9uXCI+QWRkIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRGb3JtOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRVSVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1VJU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgQWRkQ29udGVudE1vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhZGRPcGVuOiBmYWxzZVxuXHRcdH1cblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgICAgICBcdHRoYXQuX3Jlc2V0Rm9ybSgpO1xuICAgICAgICBcdFVJQWN0aW9ucy5hZGRDb250ZW50TW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcblx0XHQvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIGNlbnRlck1vZGFscyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vZmYoJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgIH0sXG5cblx0X2hhbmRsZUFkZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSxcblx0XHRcdHRhZ3MgPSB0aGlzLnJlZnMudGFncy5nZXRET01Ob2RlKCkudmFsdWU7XG5cblx0XHRpZiAoIXVybC50cmltKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0YWdzID0gdGFncy50cmltKCkuc3BsaXQoJyMnKTtcblxuXHRcdF8ucmVtb3ZlKHRhZ3MsIGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0cmV0dXJuIHRhZy50cmltKCkgPT0gJyc7XG5cdFx0fSk7XG5cblx0XHRfLmVhY2godGFncywgZnVuY3Rpb24odGFnLCBpKSB7XG5cdFx0XHR0YWdzW2ldID0gdGFnLnRyaW0oKTtcblx0XHR9KTtcblxuXHRcdGNvbnNvbGUubG9nKHRhZ3MpO1xuXG5cdFx0dmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdLFxuICAgICAgICAgICAgdGFnczogdGFnc1xuICAgICAgICB9O1xuXHRcdENvbnRlbnRBY3Rpb25zLmFkZENvbnRlbnQoY29udGVudCk7XG5cblx0fSxcblxuXHRfaGFuZGxlT25Gb2N1czogZnVuY3Rpb24oZSkge1xuXHRcdHZhciBlbCA9IGUuY3VycmVudFRhcmdldDtcblx0XHRpZiAoZWwudmFsdWUudHJpbSgpID09ICcnKSB7XG5cdFx0XHRlbC52YWx1ZSA9ICcjJztcblx0XHR9XG5cdH0sXG5cblx0X2hhbmRsZVRhZ3NDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgZWwgPSBlLmN1cnJlbnRUYXJnZXQsXG5cdFx0XHR2YWwgPSBlbC52YWx1ZTtcblxuXHRcdGlmIChlbC52YWx1ZSA9PSAnJykge1xuXHRcdFx0ZWwudmFsdWUgPSAnIyc7XG5cdFx0fVxuXG5cdFx0aWYgKHZhbFt2YWwubGVuZ3RoLTFdID09PSAnICcpIHtcblx0XHRcdGVsLnZhbHVlICs9ICcjJ1xuXHRcdH1cblx0XHQvLyBoYWNrIGJlY2F1c2UgSSBjYW4ndCBzZWVtIHRvIGdldCB0aGUgYXV0b2NhcGl0YWxpemU9XCJvZmZcIiB0byB3b3JrXG5cdFx0Ly8gZm9yIHRoZSB0YWdzIGZpZWxkID8/XG5cdFx0ZWwudmFsdWUgPSBlbC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXG5cdF9oYW5kbGVLZXlEb3duOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGUuY3VycmVudFRhcmdldC52YWx1ZTtcblx0XHRpZiAodmFsWzBdICE9ICcjJykge1xuXHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsID0gJyMnICsgdmFsO1xuXG5cdFx0fVxuXHRcdGlmIChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgdmFsICE9PSAnIycpIHtcblx0XHRcdGlmICh2YWxbdmFsLmxlbmd0aCAtIDFdID09PSAnIycpIHtcblx0XHRcdFx0ZS5jdXJyZW50VGFyZ2V0LnZhbHVlID0gdmFsLnN1YnN0cmluZygwLCB2YWwubGVuZ3RoIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9yZXNldEZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVmcy51cmwuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdFx0dGhpcy5yZWZzLnRhZ3MuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJyc7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldEFkZE1vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuYWRkT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1hZGQtY29udGVudFwiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5BZGQgQ29udGVudDwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5FbnRlciBVUkw8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWlucHV0XCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0PGlucHV0IHJlZj1cInVybFwiIHR5cGU9XCJ1cmxcIiBhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiIHBsYWNlaG9sZGVyPVwiaHR0cDovLy4uLlwiIC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0XHQgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgZGVzY3JpcHRpb24gd2l0aCB0YWdzPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ0YWdzXCIgdHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiXG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHBsYWNlaG9sZGVyPVwiI3Bob3RvICNSb2RjaGVua28gIzE5NDFcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkZvY3VzPXt0aGlzLl9oYW5kbGVPbkZvY3VzfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlVGFnc0NoYW5nZX1cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25LZXlEb3duPXt0aGlzLl9oYW5kbGVLZXlEb3dufSAvPlxuXHRcdFx0XHQgICAgXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0ICAgIFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENvbnRlbnR9IHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLWFkZC1jb250ZW50XCI+XG5cdFx0XHRcdCAgICBcdFx0XHRBZGQgVG8gQ29sbGVjdGlvblxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRNb2RhbDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cblx0TmF2ID0gcmVxdWlyZSgnLi9OYXYuanMnKSxcblx0U2ltcGxlTmF2ID0gcmVxdWlyZSgnLi9TaW1wbGVOYXYuanMnKSxcblx0RnJhbWUgPSByZXF1aXJlKCcuL0ZyYW1lLmpzJyksXG5cdFRyYW5zZmVyQnV0dG9ucyA9IHJlcXVpcmUoJy4vVHJhbnNmZXJCdXR0b25zLmpzJyksXG5cdEFkZENvbnRlbnRGb3JtID0gcmVxdWlyZSgnLi9BZGRDb250ZW50Rm9ybS5qcycpLFxuXHRDb250ZW50TGlzdCA9IHJlcXVpcmUoJy4vQ29udGVudExpc3QuanMnKSxcblx0RnJhbWVzTGlzdCA9IHJlcXVpcmUoJy4vRnJhbWVzTGlzdC5qcycpLFxuXHRGb290ZXJOYXYgPSByZXF1aXJlKCcuL0Zvb3Rlck5hdi5qcycpLFxuXHREcmF3ZXIgPSByZXF1aXJlKCcuL0RyYXdlci5qcycpLFxuXHRBZGRDb250ZW50TW9kYWwgPSByZXF1aXJlKCcuL0FkZENvbnRlbnRNb2RhbC5qcycpLFxuXHRTZXR0aW5nc01vZGFsID0gcmVxdWlyZSgnLi9TZXR0aW5nc01vZGFsLmpzJyksXG5cblx0QXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG5cblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXG5cdGNvbmYgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxuLyoqXG4gKiBUaGUgQXBwIGlzIHRoZSByb290IGNvbXBvbmVudCByZXNwb25zaWJsZSBmb3I6XG4gKiAtIHNldHRpbmcgdXAgc3RydWN0dXJlIG9mIGNoaWxkIGNvbXBvbmVudHNcbiAqXG4gKiBJbmRpdmlkdWFsIGNvbXBvbmVudHMgcmVnaXN0ZXIgZm9yIFN0b3JlIHN0YXRlIGNoYW5nZSBldmVudHNcbiAqL1xudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0aW9uUGFuZWw6IFwiY29sbGVjdGlvblwiXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghZ2xvYmFsLk9GX1VTRVJOQU1FKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT0ZfVVNFUk5BTUUgbm90IGRlZmluZWQuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0U29ja2VyLmNvbm5lY3QoXCJ3czovL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9hZG1pbi93cy9cIiArIE9GX1VTRVJOQU1FKTtcblxuXHRcdC8vIFRPRE86IHRoZXNlIHNob3VsZCBtb3ZlIHRvIHRoZSBjb3JyZXNwb25kaW5nIEFjdGlvbnMgY3JlYXRvciAoZS5nLiBGcmFtZUFjdGlvbnMpXG5cdFx0U29ja2VyLm9uKCdmcmFtZTpjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmRpc2Nvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZURpc2Nvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6ZnJhbWVfdXBkYXRlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIEZyYW1lQWN0aW9ucy5zZXR1cCk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gY29uc29sZS5sb2coJ2NvbXBvbmVudERpZE1vdW50JywgJCgnLm5hdi1mb290ZXInKS5oZWlnaHQoKSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ2NvbXBvbmVudERpZE1vdW50JywgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLm5hdkZvb3Rlcikub2Zmc2V0SGVpZ2h0KTtcblx0XHRVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblxuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYW5lbCA9IFVJU3RvcmUuZ2V0U2VsZWN0aW9uUGFuZWxTdGF0ZSgpO1xuXHRcdHRoaXMuc2V0U3RhdGUocGFuZWwpO1xuXHR9LFxuXG4gIFx0cmVuZGVyOiBmdW5jdGlvbigpe1xuICBcdFx0dmFyIGNvbnRlbnRMaXN0ID0gPENvbnRlbnRMaXN0IC8+LFxuICBcdFx0XHRmcmFtZUxpc3QgPSA8RnJhbWVzTGlzdCAvPjtcbiAgXHRcdHZhciBzZWxlY3Rpb25QYW5lbCA9IHRoaXMuc3RhdGUuc2VsZWN0aW9uUGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbnRlbnRMaXN0IDogZnJhbWVMaXN0O1xuXHQgICAgcmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXIgYXBwJz5cblx0XHRcdFx0PFNpbXBsZU5hdiAvPlxuXHRcdFx0XHQ8RnJhbWUgLz5cblx0XHRcdFx0PFRyYW5zZmVyQnV0dG9ucyAvPlxuXHRcdFx0XHQ8ZGl2PntzZWxlY3Rpb25QYW5lbH08L2Rpdj5cblx0XHRcdFx0PEZvb3Rlck5hdiByZWY9XCJuYXZGb290ZXJcIi8+XG5cdFx0XHRcdDxEcmF3ZXIgLz5cblx0XHRcdFx0PFNldHRpbmdzTW9kYWwgLz5cblx0XHRcdFx0PEFkZENvbnRlbnRNb2RhbCAvPlxuXHRcdFx0PC9kaXY+XG5cdCAgICApXG4gIFx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuXHRDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKSxcblx0Q29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpO1xuXG52YXIgQ29udGVudExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRlbnQ6IFtdXG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudCgpO1xuXHRcdENvbnRlbnRTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdFx0dGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnY29tcG9uZW50RGlkVW5tb3VudCcpO1xuXHRcdENvbnRlbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuXG4gICAgfSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0Y29udGVudDogQ29udGVudFN0b3JlLmdldENvbnRlbnQoKVxuICBcdFx0fSk7XG5cbiAgXHRcdC8vIFRPRE86IGJldHRlciBSZWFjdCBpbnRlZ3JhdGlvbiBmb3IgdGhlIHN3aXBlclxuXG4gIFx0XHRpZiAoIXRoaXMuc3dpcGVyKSB7XG4gIFx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgXHRcdH1cblxuICBcdFx0dGhpcy5fcG9wdWxhdGVTbGlkZXIoKVxuXG5cdFx0Ly8gdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmxlbmd0aDtcbiAgICAgICAgdGhpcy5zd2lwZXIuc2xpZGVUbygwKTtcbiAgXHR9LFxuXG4gIFx0X2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG5cdFx0dGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG5cdCAgICAgICAgc2xpZGVzUGVyVmlldzogMyxcblx0ICAgICAgICBzcGFjZUJldHdlZW46IDUwLFxuXHQgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuXHQgICAgICAgIC8vIGZyZWVNb2RlOiB0cnVlLFxuXHQgICAgICAgIC8vIGZyZWVNb2RlTW9tZW50dW06IHRydWUsXG5cdCAgICAgICAgLy8gZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAwLjUsXG5cdCAgICAgICAgLy8gZnJlZU1vZGVTdGlja3k6dHJ1ZSxcblx0ICAgICAgICAvLyBsb29wOiB0cnVlLFxuXHQgICAgICAgIC8vIGxvb3BlZFNsaWRlczogNSxcblx0ICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG5cdCAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcblx0ICAgIH0pO1xuICBcdH0sXG5cbiAgXHRfcG9wdWxhdGVTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dGhpcy5zd2lwZXIucmVtb3ZlQWxsU2xpZGVzKCk7XG4gIFx0XHR0aGlzLnN0YXRlLmNvbnRlbnQuZm9yRWFjaCh0aGlzLl9hZGRTbGlkZSk7XG4gIFx0fSxcblxuICBcdF9hZGRTbGlkZTogZnVuY3Rpb24oY29udGVudEl0ZW0pIHtcbiAgXHRcdHZhciBodG1sID0gJzxkaXYgY2xhc3M9XCJzd2lwZXItc2xpZGUgY29udGVudC1zbGlkZVwiIGRhdGEtY29udGVudGlkPVwiJyArIGNvbnRlbnRJdGVtLl9pZCArICdcIj48aW1nIHNyYz0nICsgY29udGVudEl0ZW0udXJsICsgJyAvPjwvZGl2Pidcblx0XHQgIHRoaXMuc3dpcGVyLnByZXBlbmRTbGlkZShodG1sKTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlVG86IGZ1bmN0aW9uKGluZGV4KSB7XG4gIFx0XHR0aGlzLnN3aXBlci5zbGlkZVRvKGluZGV4KTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlQ2hhbmdlRW5kOiBmdW5jdGlvbihzbGlkZXIpIHtcbiAgXHRcdHZhciBzbGlkZSA9IHRoaXMuc3dpcGVyLnNsaWRlc1t0aGlzLnN3aXBlci5hY3RpdmVJbmRleF0sXG4gIFx0XHRcdGNvbnRlbnRfaWQgPSBzbGlkZS5kYXRhc2V0LmNvbnRlbnRpZDtcbiAgXHRcdGNvbnNvbGUubG9nKCdfc2xpZGVDaGFuZ2VFbmQnLCBjb250ZW50X2lkKTtcbiAgXHRcdENvbnRlbnRBY3Rpb25zLnNsaWRlQ2hhbmdlZChjb250ZW50X2lkKTtcbiAgXHR9LFxuXG4gICAgX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICAgIFx0Y29uc29sZS5sb2coJ191cGRhdGVDb250YWluZXJEaW1lbnNpb25zJyk7XG4gICAgICAgIHZhciBjb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzKVxuICAgICAgICAgICAgaCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG4gICAgICAgICAgICBwYWRkaW5nID0gNDAsXG4gICAgICAgICAgICBuZXdIID0gaCAtIHBhZGRpbmc7XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IG5ld0grJ3B4JztcbiAgICAgICAgLy8gY29udGFpbmVyLnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVDb250ZW50U2xpZGUoY29udGVudEl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGluZyBzbGlkZTogJywgY29udGVudEl0ZW0pO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17Y29udGVudEl0ZW0uX2lkLiRvaWR9IGNsYXNzTmFtZT1cInN3aXBlci1zbGlkZVwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y29udGVudEl0ZW0udXJsfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItb3V0ZXItY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cblxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2RnJhbWVMaXN0ID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpc3QnKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyk7XG5cbnZhciBEcmF3ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaWRlQ2xhc3M6ICdtZW51LWRyYXdlci1sZWZ0J1xuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ2xvc2VNZW51Q2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdfaGFuZGxlQ2xvc2VNZW51Q2xpY2snKTtcblx0XHRVSUFjdGlvbnMudG9nZ2xlTWVudShmYWxzZSk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldE1lbnVTdGF0ZSgpKTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJhc2VDbGFzcyA9ICd2aXNpYmxlLXhzIG1lbnUtZHJhd2VyJztcblx0XHR2YXIgb3BlbkNsYXNzID0gdGhpcy5zdGF0ZS5vcGVuID8gJ21lbnUtZHJhd2VyLW9wZW4nIDogJ21lbnUtZHJhd2VyLWNsb3NlZCc7XG5cdFx0dmFyIHNpZGVDbGFzcyA9IHRoaXMucHJvcHMuc2lkZUNsYXNzO1xuXHRcdHZhciBmdWxsQ2xhc3MgPSBbYmFzZUNsYXNzLCBvcGVuQ2xhc3MsIHNpZGVDbGFzc10uam9pbignICcpO1xuXG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2Z1bGxDbGFzc30+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibWVudS1kcmF3ZXItaW5uZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm9mLW5hdi1maXhlZCBvZi1uYXYtZHJhd2VyXCI+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInVzZXJuYW1lIHRleHQtY2VudGVyXCI+e09GX1VTRVJOQU1FfTwvZGl2PlxuXHRcdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xvc2VNZW51Q2xpY2t9ID5cblx0XHQgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiAvPlxuXHRcdCAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8TmF2RnJhbWVMaXN0IGxpbmtDbGlja0hhbmRsZXI9e3RoaXMuX2hhbmRsZUNsb3NlTWVudUNsaWNrfSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhd2VyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0VUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyk7XG5cbnZhciBGb290ZXJOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGlvblBhbmVsOiBcImNvbGxlY3Rpb25cIlxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge31cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ2xvc2VNZW51Q2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFVJQWN0aW9ucy50b2dnbGVNZW51KGZhbHNlKTtcblx0fSxcblxuXHRfaGFuZGxlQ29sbGVjdGlvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRVSUFjdGlvbnMuc2V0U2VsZWN0aW9uUGFuZWwoXCJjb2xsZWN0aW9uXCIpO1xuXHR9LFxuXG5cdF9oYW5kbGVGcmFtZXNDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0VUlBY3Rpb25zLnNldFNlbGVjdGlvblBhbmVsKFwiZnJhbWVzXCIpO1xuXHR9LFxuXG5cdF9oYW5kbGVBZGRDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0VUlBY3Rpb25zLm9wZW5BZGRDb250ZW50TW9kYWwoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFVJU3RvcmUuZ2V0U2VsZWN0aW9uUGFuZWxTdGF0ZSgpKTtcbiAgICB9LFxuXG5cdC8qKlxuXHQgKiBUT0RPOiBmaWd1cmUgb3V0IHN0YXRlIG1hbmFnZW1lbnQuIFN0b3JlP1xuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbGxlY3Rpb24gPSAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItY29sbGVjdGlvbiBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNvbGxlY3Rpb25DbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJjb2xsZWN0aW9uXCI+Y29sbGVjdGlvbjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItZnJhbWVzXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVGcmFtZXNDbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJmcmFtZXNcIj5mcmFtZXM8L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXItYWRkIGFjdGl2ZVwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQWRkQ2xpY2t9Pis8L2E+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXG5cdFx0dmFyIGZyYW1lcyA9IChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IG9mLW5hdi1maXhlZCBvZi1uYXYtZm9vdGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1jb2xsZWN0aW9uXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDb2xsZWN0aW9uQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY29sbGVjdGlvblwiPmNvbGxlY3Rpb248L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWZyYW1lcyBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUZyYW1lc0NsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImZyYW1lc1wiPmZyYW1lczwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0XHR2YXIgcGFuZWwgPSB0aGlzLnN0YXRlLnNlbGVjdGlvblBhbmVsO1xuXHRcdGNvbnNvbGUubG9nKCdQQU5FTDogJywgdGhpcy5zdGF0ZSwgcGFuZWwpO1xuXHRcdHJldHVybiBwYW5lbCA9PT0gJ2NvbGxlY3Rpb24nID8gY29sbGVjdGlvbiA6IGZyYW1lcztcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXJOYXY7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIEZyYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCk7XG5cdFx0RnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUuZnJhbWUpIHtcblx0XHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInJvdyBmcmFtZXMtbGlzdFwiPjwvZGl2PlxuXHRcdH1cblx0XHR0aGlzLndfaF9yYXRpbyA9IHRoaXMuc3RhdGUuZnJhbWUgJiYgdGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncyA/IHRoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mud19oX3JhdGlvIDogMTtcblxuXHRcdHZhciB1cmwgPSB0aGlzLnN0YXRlLmZyYW1lICYmIHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50ID8gdGhpcy5zdGF0ZS5mcmFtZS5jdXJyZW50X2NvbnRlbnQudXJsIDogJyc7XG5cdFx0dmFyIGRpdlN0eWxlID0ge1xuXHRcdFx0YmFja2dyb3VuZEltYWdlOiAndXJsKCcgKyB1cmwgKyAnKScsXG5cdFx0fTtcblxuXHRcdGNvbnNvbGUubG9nKHRoaXMud19oX3JhdGlvKTtcblxuXHRcdHZhciB3aFN0eWxlID0ge1xuXHRcdFx0cGFkZGluZ0JvdHRvbTogKDEvdGhpcy53X2hfcmF0aW8pICogMTAwICsgJyUnXG5cdFx0fTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBmcmFtZXMtbGlzdFwiIHJlZj1cImZyYW1lQ29udGFpbmVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhsLTEyIGZyYW1lLW91dGVyLWNvbnRhaW5lclwiIHJlZj1cImZyYW1lT3V0ZXJDb250YWluZXJcIj5cblx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLXhzIGJ0bi1zZXR0aW5ncyBoaWRlXCIgZGF0YS10b2dnbGU9XCJtb2RhbFwiIGRhdGEtdGFyZ2V0PVwiI215TW9kYWxcIj5TPC9idXR0b24+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZS1pbm5lci1jb250YWluZXJcIiByZWY9XCJmcmFtZUlubmVyQ29udGFpbmVyXCI+XG5cdFx0ICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cImZyYW1lXCIgc3R5bGU9e2RpdlN0eWxlfSByZWY9XCJmcmFtZVwiLz5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cblx0XHQgICAgICAgIDwvZGl2PlxuXHQgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cbiAgXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcbiAgXHRcdGNvbnNvbGUubG9nKCdzZWxlY3RlZEZyYW1lOicsIHNlbGVjdGVkRnJhbWUpO1xuICBcdFx0dGhpcy5zZXRTdGF0ZSh7XG4gIFx0XHRcdGZyYW1lOiBzZWxlY3RlZEZyYW1lXG4gIFx0XHR9KTtcbiAgXHR9LFxuXG4gIFx0X3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpLFxuICBcdFx0XHRmcmFtZU91dGVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lT3V0ZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZUlubmVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lSW5uZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5mcmFtZSksXG5cdFx0XHR3ID0gY29udGFpbmVyLm9mZnNldFdpZHRoLFxuXHRcdFx0aCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG5cdFx0XHRwYWRkaW5nID0gNTAsXG5cdFx0XHRtYXhXID0gdyAtIDIqcGFkZGluZyxcblx0XHRcdG1heEggPSBoIC0gMipwYWRkaW5nLFxuXHRcdFx0ZnJhbWVXLCBmcmFtZUg7XG5cblx0XHRpZiAoKHRoaXMud19oX3JhdGlvID4gMSB8fCBtYXhIICogdGhpcy53X2hfcmF0aW8gPiBtYXhXKSAmJiBtYXhXIC8gdGhpcy53X2hfcmF0aW8gPCBtYXhIKSB7XG5cdFx0XHQvLyB3aWR0aCA+IGhlaWdodCBvciB1c2luZyBmdWxsIGhlaWdodCB3b3VsZCBleHRlbmQgYmV5b25kIG1heFdcblx0XHRcdGZyYW1lVyA9IG1heFc7XG5cdFx0XHRmcmFtZUggPSAobWF4VyAvIHRoaXMud19oX3JhdGlvKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2lkdGggPCBoZWlnaHRcblx0XHRcdGZyYW1lSCA9IG1heEg7XG5cdFx0XHRmcmFtZVcgPSAobWF4SCAqIHRoaXMud19oX3JhdGlvKTtcblx0XHR9XG5cblx0XHRmcmFtZS5zdHlsZS53aWR0aCA9IGZyYW1lVyArICdweCc7XG5cdFx0ZnJhbWUuc3R5bGUuaGVpZ2h0ID0gZnJhbWVIICsgJ3B4JztcblxuXHRcdGZyYW1lT3V0ZXJDb250YWluZXIuc3R5bGUud2lkdGggPSBtYXhXKydweCc7XG5cdFx0ZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS50b3AgPSAoKGggLSBmcmFtZUgpIC8gMikgKyAncHgnO1xuXHRcdC8vIGZyYW1lSW5uZXJDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZnJhbWUuc3R5bGUuaGVpZ2h0O1xuXG5cblxuXHRcdGNvbnNvbGUubG9nKCdmcmFtZU91dGVyQ29udGFpbmVyOicsIGZyYW1lT3V0ZXJDb250YWluZXIpO1xuXHRcdGNvbnNvbGUubG9nKCdjb250YWluZXI6JywgdywgaCwgbWF4VywgbWF4SCk7XG4gIFx0fVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIEZyYW1lc0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG5cdFx0XHRmcmFtZXM6IFtdLFxuICAgICAgICAgICAgY3VycmVudEZyYW1lOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgb3duZXI6ICcnXG4gICAgICAgICAgICB9XG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZUFjdGlvbnMubG9hZFZpc2libGVGcmFtZXMoKTtcblx0XHRGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGFpbmVyRGltZW5zaW9ucygpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgICBfaW5pdFNsaWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5Td2lwZXIpO1xuICAgICAgICB0aGlzLnN3aXBlciA9IG5ldyBTd2lwZXIoZWwsIHtcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IDMsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IDUwLFxuICAgICAgICAgICAgcHJlbG9hZEltYWdlczogdHJ1ZSxcbiAgICAgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuICAgICAgICAgICAgZnJlZU1vZGU6IHRydWUsXG4gICAgICAgICAgICBmcmVlTW9kZU1vbWVudHVtOiB0cnVlLFxuICAgICAgICAgICAgZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAuMjUsXG4gICAgICAgICAgICBmcmVlTW9kZVN0aWNreTp0cnVlLFxuICAgICAgICAgICAga2V5Ym9hcmRDb250cm9sOiB0cnVlLFxuICAgICAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcbiAgICAgICAgfSk7XG5cblxuICAgIH0sXG5cbiAgICBfcG9wdWxhdGVTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN3aXBlci5yZW1vdmVBbGxTbGlkZXMoKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5mcmFtZXMuZm9yRWFjaCh0aGlzLl9hZGRTbGlkZSk7XG4gICAgfSxcblxuICAgIF9hZGRTbGlkZTogZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgY3VycmVudCBjb250ZW50IHNldCBvbiB0aGUgZnJhbWUuXG4gICAgICAgIGlmIChmcmFtZS5jdXJyZW50X2NvbnRlbnQgJiYgZnJhbWUuY3VycmVudF9jb250ZW50LnVybCkge1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJzd2lwZXItc2xpZGUgZnJhbWUtc2xpZGVcIiBkYXRhLWZyYW1laWQ9XCInICsgZnJhbWUuX2lkICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGltZyBzcmM9JyArIGZyYW1lLmN1cnJlbnRfY29udGVudC51cmwgKyAnIC8+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2Pic7XG5cbiAgICAgICAgICAgIHRoaXMuc3dpcGVyLmFwcGVuZFNsaWRlKGh0bWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKGluZGV4KTtcbiAgICB9LFxuXG4gICAgX3NsaWRlQ2hhbmdlRW5kOiBmdW5jdGlvbihzbGlkZXIpIHtcbiAgICAgICAgdmFyIHNsaWRlID0gdGhpcy5zd2lwZXIuc2xpZGVzW3RoaXMuc3dpcGVyLmFjdGl2ZUluZGV4XSxcbiAgICAgICAgICAgIGZyYW1lX2lkID0gc2xpZGUuZGF0YXNldC5mcmFtZWlkO1xuICAgICAgICBjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgZnJhbWVfaWQpO1xuICAgICAgICBGcmFtZUFjdGlvbnMuc2xpZGVDaGFuZ2VkKGZyYW1lX2lkKTtcbiAgICB9LFxuXG4gICAgIF91cGRhdGVDb250YWluZXJEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMucmVmcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpLFxuICAgICAgICAgICAgaCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG4gICAgICAgICAgICBwYWRkaW5nID0gMTAwLFxuICAgICAgICAgICAgbmV3SCA9IGggLSBwYWRkaW5nO1xuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBuZXdIKydweCc7XG4gICAgICAgIC8vIGNvbnRhaW5lci5zdHlsZS50b3AgPSAnMHB4JztcbiAgICB9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0VmlzaWJsZUZyYW1lcygpLFxuICAgICAgICAgICAgY3VycmVudEZyYW1lOiBGcmFtZVN0b3JlLmdldFNlbGVjdGVkVmlzaWJsZUZyYW1lKClcbiAgXHRcdH0pO1xuXG4gIFx0XHQvLyBUT0RPOiBiZXR0ZXIgUmVhY3QgaW50ZWdyYXRpb24gZm9yIHRoZSBzd2lwZXJcbiAgICAgICAgLy8gTWF5YmUgYSBzbGlkZSBjb21wb25lbnQ/XG5cbiAgXHRcdGlmICghdGhpcy5zd2lwZXIpIHtcbiAgXHRcdFx0dGhpcy5faW5pdFNsaWRlcigpO1xuICBcdFx0ICAgIHRoaXMuX3BvcHVsYXRlU2xpZGVyKClcbiAgICAgICAgICAgIHRoaXMuc3dpcGVyLnNsaWRlVG8oMCk7XG4gICAgICAgIH1cbiAgXHR9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1pcnJvcmluZ19jb3VudCA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZSAmJiB0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZS5taXJyb3JpbmdfY291bnQpIHtcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb3VudCA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtc3RhdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+IHt0aGlzLnN0YXRlLmN1cnJlbnRGcmFtZS5taXJyb3JpbmdfY291bnR9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ21pcnJvcmluZ19jb3VudDogJywgdGhpcy5zdGF0ZS5jdXJyZW50RnJhbWUubWlycm9yaW5nX2NvdW50KVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIiByZWY9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci13cmFwcGVyXCI+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZyYW1lLXNsaWRlLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aXNpYmxlLWZyYW1lLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidmlzaWJsZS1mcmFtZS1uYW1lXCI+e3RoaXMuc3RhdGUuY3VycmVudEZyYW1lLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInZpc2libGUtZnJhbWUtdXNlclwiPkAge3RoaXMuc3RhdGUuY3VycmVudEZyYW1lLm93bmVyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19jb3VudH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lc0xpc3Q7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cblxudmFyIE5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lOiAnLCBmcmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSAvPlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwibmF2YmFyIG5hdmJhci1kZWZhdWx0XCI+XG4gICAgICAgICAgICAgICAgey8qIEJyYW5kIGFuZCB0b2dnbGUgZ2V0IGdyb3VwZWQgZm9yIGJldHRlciBtb2JpbGUgZGlzcGxheSAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdmJhci1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwibmF2YmFyLXRvZ2dsZSBjb2xsYXBzZWQgcHVsbC1sZWZ0XCIgZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI2JzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNyLW9ubHlcIj5Ub2dnbGUgbmF2aWdhdGlvbjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14c1wiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj57T0ZfVVNFUk5BTUV9PC9zcGFuPjwvaDM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIENvbGxlY3QgdGhlIG5hdiBsaW5rcywgZm9ybXMsIGFuZCBvdGhlciBjb250ZW50IGZvciB0b2dnbGluZyAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbGxhcHNlIG5hdmJhci1jb2xsYXBzZVwiIGlkPVwiYnMtZXhhbXBsZS1uYXZiYXItY29sbGFwc2UtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXYgbmF2YmFyLXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwiZHJvcGRvd25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiByb2xlPVwiYnV0dG9uXCIgYXJpYS1leHBhbmRlZD1cImZhbHNlXCI+RnJhbWVzIDxzcGFuIGNsYXNzTmFtZT1cImNhcmV0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImRyb3Bkb3duLW1lbnVcIiByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5mcmFtZXMubWFwKGNyZWF0ZUZyYW1lTGluay5iaW5kKHRoaXMpKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiL2xvZ291dFwiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tbG9nLW91dFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogLy5uYXZiYXItY29sbGFwc2UgKi99XG4gICAgICAgICAgICA8L25hdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpO1xuXG52YXIgTmF2RnJhbWVMaW5rID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRoYW5kbGVGcmFtZVNlbGVjdGlvbjogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy5zZWxlY3QodGhpcy5wcm9wcy5mcmFtZSk7XG5cdFx0aWYgKHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcikge1xuXHRcdFx0dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZUNsYXNzID0gJ25vdC1jb25uZWN0ZWQnLFxuXHRcdFx0YWN0aXZlVGV4dCA9ICdub3QgY29ubmVjdGVkJztcblx0XHRpZiAodGhpcy5wcm9wcy5mcmFtZS5jb25uZWN0ZWQpIHtcblx0XHRcdGFjdGl2ZUNsYXNzID0gYWN0aXZlVGV4dCA9ICdjb25uZWN0ZWQnO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzU2VsZWN0ZWQoc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA/ICdpY29uLWNoZWNrJyA6ICdzcGFjZSc7XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gJ3B1bGwtcmlnaHQgc3RhdHVzICcgKyBhY3RpdmVDbGFzcztcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGxpIG9uQ2xpY2s9e3RoaXMuaGFuZGxlRnJhbWVTZWxlY3Rpb259PlxuXHRcdFx0XHQ8YSBocmVmPVwiI1wiPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT17aXNTZWxlY3RlZCh0aGlzLnByb3BzLmZyYW1lLnNlbGVjdGVkKX0gLz4ge3RoaXMucHJvcHMuZnJhbWUubmFtZX1cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2NsYXNzZXN9PnthY3RpdmVUZXh0fTwvc3Bhbj5cblx0XHRcdFx0PC9hPlxuXHRcdFx0PC9saT5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpbms7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2RnJhbWVMaW5rID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpbmsnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBOYXZGcmFtZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgXHRyZXR1cm4ge1xuICAgIFx0XHRleHRyYUNsYXNzZXM6ICcnLFxuICAgIFx0XHRpbmNsdWRlTG9nb3V0OiB0cnVlLFxuICAgIFx0XHRsaW5rQ2xpY2tIYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICBcdFx0XHRjb25zb2xlLmxvZygnbGluayBjbGlja2VkJyk7XG4gICAgXHRcdH1cbiAgICBcdH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdXG4gICAgICAgIH1cbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0ZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IC8+XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5leHRyYUNsYXNzZXMgKyAnIG5hdi1mcmFtZS1saXN0IGRyYXdlci1jb250ZW50JztcblxuXHRcdHZhciBsb2dvdXQgPSAnJztcblx0XHRpZiAodGhpcy5wcm9wcy5pbmNsdWRlTG9nb3V0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaW5jbHVkZUxvZ291dCcpO1xuXHRcdFx0bG9nb3V0ID0gKFxuXHRcdFx0XHQ8bGk+XG5cdFx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSBjbGFzc05hbWU9XCJidG4tbG9nb3V0XCIgaHJlZj1cIi9sb2dvdXRcIj5sb2cgb3V0PC9hPlxuXHRcdFx0XHQ8L2xpPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHVsIGNsYXNzTmFtZT17Y2xhc3Nlc30gcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5mcmFtZXMubWFwKGNyZWF0ZUZyYW1lTGluay5iaW5kKHRoaXMpKX1cbiAgICAgICAgICAgICAgICB7bG9nb3V0fVxuICAgICAgICAgICAgPC91bD5cblx0XHQpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaXN0OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgU2V0dGluZ3NNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3NPcGVuOiBmYWxzZSxcblx0XHRcdGZyYW1lOiB7XG5cdFx0XHRcdG5hbWU6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJycsXG5cdFx0XHRcdHNldHRpbmdzOiB7XG5cdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRyb3RhdGlvbjogMFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uVUlDaGFuZ2UpO1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uRnJhbWVDaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZygnaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgICAgIFx0VUlBY3Rpb25zLnNldHRpbmdzTW9kYWxDbG9zZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmVydGljYWxseSBjZW50ZXIgbW9kYWxzXG5cdFx0LyogY2VudGVyIG1vZGFsICovXG5cdFx0ZnVuY3Rpb24gY2VudGVyTW9kYWxzKCl7XG5cdFx0ICAgICQoJy5tb2RhbCcpLmVhY2goZnVuY3Rpb24oaSl7XG5cdFx0ICAgICAgICB2YXIgJGNsb25lID0gJCh0aGlzKS5jbG9uZSgpLmNzcygnZGlzcGxheScsICdibG9jaycpLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0ICAgICAgICB2YXIgdG9wID0gTWF0aC5yb3VuZCgoJGNsb25lLmhlaWdodCgpIC0gJGNsb25lLmZpbmQoJy5tb2RhbC1jb250ZW50JykuaGVpZ2h0KCkpIC8gMik7XG5cdFx0ICAgICAgICB0b3AgPSB0b3AgPiAwID8gdG9wIDogMDtcblx0XHQgICAgICAgICRjbG9uZS5yZW1vdmUoKTtcblx0XHQgICAgICAgICQodGhpcykuZmluZCgnLm1vZGFsLWNvbnRlbnQnKS5jc3MoXCJtYXJnaW4tdG9wXCIsIHRvcCk7XG5cdFx0ICAgIH0pO1xuXHRcdH1cblx0XHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9uKCdzaG93LmJzLm1vZGFsJywgY2VudGVyTW9kYWxzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVub3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25VSUNoYW5nZSk7XG4gICAgICAgIEZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25GcmFtZUNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVOYW1lQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHN0YXRlID0gdGhpcy5zdGF0ZTtcblx0XHRzdGF0ZS5mcmFtZS5uYW1lID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVEZXNjcmlwdGlvbkNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuZGVzY3JpcHRpb24gPSB2YWw7XG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0X2hhbmRsZVZpc2liaWxpdHlDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJsZSA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlUm90YXRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9uID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVTYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnNhdmVGcmFtZSh0aGlzLnN0YXRlLmZyYW1lKTtcblx0fSxcblxuXHRfb25VSUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRTZXR0aW5nc01vZGFsU3RhdGUoKSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2V0dGluZ3NPcGVuKSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoJ2hpZGUnKTtcblx0ICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25GcmFtZUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBcdGZyYW1lOiBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0NDQ0NDQ0NDQ0MgLS0tLT4gJywgdGhpcy5zdGF0ZS5mcmFtZSk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbCBmYWRlIG1vZGFsLXNldHRpbmdzXCIgcmVmPVwibW9kYWxcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1kaWFsb2dcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWNvbnRlbnRcIj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCIgYXJpYS1sYWJlbD1cIkNsb3NlXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuXHRcdFx0ICAgIFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHRcdCAgICBcdDxoNCBjbGFzc05hbWU9XCJtb2RhbC10aXRsZVwiPlNldHRpbmdzPC9oND5cblx0XHRcdFx0XHQgIFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWJvZHlcIj5cblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5OYW1lPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT17dGhpcy5zdGF0ZS5mcmFtZS5uYW1lfSBvbkNoYW5nZT17dGhpcy5faGFuZGxlTmFtZUNoYW5nZX0gLz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMlwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5EZXNjcmlwdGlvbiAob3B0aW9uYWwpPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1sYWJlbC1zdWJ0ZXh0XCI+VXNlZnVsIGlmIHlvdXIgZnJhbWUgZm9sbG93cyBhIHRoZW1lPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0cmVmPVwiZGVzY3JpcHRpb25cIlxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0dHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuZGVzY3JpcHRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlRGVzY3JpcHRpb25DaGFuZ2V9XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRwbGFjZWhvbGRlcj1cImUuZy4gamFwYW5lc2UgYXJ0LCA5MHMgcG9zdGVyc1wiIC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtOVwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWxcIj5WaXNpYmxlIHRvIG90aGVyIHBlb3BsZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPllvdXIgZnJhbWUgd2lsbCBhcHBlYXIgb24gRnJhbWVzIGFuZCBvdGhlcnMgY2FuIG1pcnJvciBpdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0zXCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dC1jaGVja2JveFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidmlzaWJpbGl0eVwiIHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRjaGVja2VkPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLnZpc2libGV9XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlVmlzaWJpbGl0eUNoYW5nZX0vPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGQgcm93LWZvcm0tZmllbGQtcm90YXRpb25cIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTYgZm9ybS1sYWJlbFwiPlJvdGF0aW9uPC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0taW5wdXQtc2VsZWN0XCI+XG5cdFx0XHRcdFx0ICAgIFx0XHRcdDxzZWxlY3QgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInJvdGF0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHR2YWx1ZT17dGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy5yb3RhdGlvbn1cblx0XHRcdFx0XHQgICAgXHRcdFx0XHRvbkNoYW5nZT17dGhpcy5faGFuZGxlUm90YXRpb25DaGFuZ2V9ID5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjBcIj4wJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjkwXCI+OTAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiLTkwXCI+LTkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjE4MFwiPjE4MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXJcIj5cblx0XHRcdFx0ICAgIFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZVNhdmV9IHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLWFkZC1jb250ZW50XCI+XG5cdFx0XHRcdCAgICBcdFx0XHRTYXZlXG5cdFx0XHRcdCAgICBcdFx0PC9idXR0b24+XG5cdFx0XHRcdCAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NNb2RhbDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG4gICAgVUlBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9VSUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgU2ltcGxlTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIG1pcnJvcmluZzogbnVsbCxcbiAgICAgICAgICAgICAgICBtaXJyb3JpbmdfY291bnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbWlycm9yX21ldGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyOiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZnJhbWVOYW1lID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLm5hbWUsXG4gICAgICAgICAgICBtaXJyb3JpbmcgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubWlycm9yaW5nLFxuICAgICAgICAgICAgbWlycm9yX21ldGEgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubWlycm9yX21ldGEsXG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9ICcnLFxuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAnJyxcbiAgICAgICAgICAgIG1pcnJvcmluZ19jb3VudCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5taXJyb3JpbmdfY291bnQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY29ubmVjdGVkKGNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdmFyIGNvbm5lY3RlZF9jb250ZW50ID0gJyc7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGVkX2NvbnRlbnQgPSAnJmJ1bGw7ICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge19faHRtbDogY29ubmVjdGVkX2NvbnRlbnR9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1pcnJvcmluZ19jb3VudCkge1xuICAgICAgICAgICAgbWlycm9yaW5nX2ljb24gPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib2YtaWNvbi1taXJyb3JcIj48L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWlycm9yaW5nX2NvbnRlbnQgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWlycm9yaW5nLW1ldGFcIj57bWlycm9yaW5nX2NvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWlycm9yaW5nKSB7XG4gICAgICAgICAgICBtaXJyb3JpbmdfaWNvbiA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvZi1pY29uLW1pcnJvclwiPjwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtaXJyb3JpbmdfY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctbWV0YVwiPkB7bWlycm9yX21ldGEub3duZXJ9IDoge21pcnJvcl9tZXRhLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG5cblxuXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi10b3BcIj5cbiAgICAgICAgICAgICAgICA8aDYgY2xhc3NOYW1lPVwiZnJhbWUtbmFtZSB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25uZWN0ZWRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17Y29ubmVjdGVkKHRoaXMuc3RhdGUuc2VsZWN0ZWRGcmFtZS5jb25uZWN0ZWQpfSAvPlxuICAgICAgICAgICAgICAgICAgICB7ZnJhbWVOYW1lfVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtaXJyb3JpbmctY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19pY29ufVxuICAgICAgICAgICAgICAgICAgICAgICAge21pcnJvcmluZ19jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9oNj5cblxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IGJ0bi1tZW51IHZpc2libGUteHMgcHVsbC1sZWZ0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3Blbk1lbnVDbGlja30+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24taGFtYnVyZ2VyXCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tc2V0dGluZyB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVPcGVuU2V0dGluZ3N9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNvZ1wiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQgaGlkZGVuLXhzIHB1bGwtbGVmdFwiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj57T0ZfVVNFUk5BTUV9PC9zcGFuPjwvaDM+XG5cblxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHQgaGlkZGVuLXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJkcm9wZG93blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPE5hdkZyYW1lTGlzdCBleHRyYUNsYXNzZXM9XCJkcm9wZG93bi1tZW51XCIgaW5jbHVkZUxvZ291dD17ZmFsc2V9Lz5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNzZXR0aW5nc1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5TZXR0aW5nc30+U2V0dGluZ3M8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+TG9nIE91dDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuTWVudUNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlT3Blbk1lbnVDbGljaycpO1xuICAgICAgICBVSUFjdGlvbnMudG9nZ2xlTWVudSh0cnVlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU9wZW5TZXR0aW5nczogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5TZXR0aW5ncycpO1xuICAgICAgICBVSUFjdGlvbnMub3BlblNldHRpbmdzTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJysrKysrKyBnZXQgc2VsZWN0ZWQgZnJhbWUnLCBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcbiAgICBDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgVHJhbnNmZXJCdXR0b25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVTZW5kQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZVNlbmRDbGlja2VkJywgQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICAgICAgRnJhbWVBY3Rpb25zLnVwZGF0ZUNvbnRlbnQoQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVNaXJyb3JDbGlja2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfaGFuZGxlTWlycm9yQ2xpY2tlZCcpO1xuXHRcdEZyYW1lQWN0aW9ucy5taXJyb3JGcmFtZShGcmFtZVN0b3JlLmdldFNlbGVjdGVkVmlzaWJsZUZyYW1lKCkpO1xuXHR9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGljb24sIGhhbmRsZXI7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGlvblBhbmVsID09PSAnY29sbGVjdGlvbicpIHtcbiAgICAgICAgICAgIGljb24gPSAnaWNvbi11cCc7XG4gICAgICAgICAgICBoYW5kbGVyID0gdGhpcy5faGFuZGxlU2VuZENsaWNrZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpY29uID0gJ29mLWljb24tbWlycm9yJztcbiAgICAgICAgICAgIGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVNaXJyb3JDbGlja2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdyB0cmFuc2Zlci1idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIiByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPVwiLi4uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiIG9uQ2xpY2s9e2hhbmRsZXJ9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17aWNvbn0gYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLXNlbmRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+ICovfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmZXJCdXR0b25zO1xuIiwidmFyIGNvbmYgPSB7XG5cdGRvbWFpbjogJ2xvY2FsaG9zdCcsXG5cdHBvcnQ6ICc4ODg4Jyxcblx0bmF2YmFySDogNTBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25mOyIsInZhciBrZXltaXJyb3IgPSByZXF1aXJlKCdrZXltaXJyb3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXltaXJyb3Ioe1xuXG5cdC8vIGZyYW1lIGFjdGlvbiB0eXBlc1xuXHRGUkFNRV9MT0FEOiBudWxsLFxuXHRGUkFNRV9MT0FEX0RPTkU6IG51bGwsXG5cdEZSQU1FX0xPQURfRkFJTDogbnVsbCxcblx0RlJBTUVfTE9BRF9WSVNJQkxFOiBudWxsLFxuXHRGUkFNRV9MT0FEX1ZJU0lCTEVfRE9ORTogbnVsbCxcblx0RlJBTUVfTE9BRF9WSVNJQkxFX0ZBSUw6IG51bGwsXG5cdEZSQU1FX1NFTEVDVDogbnVsbCxcblx0RlJBTUVfVVBEQVRFX0NPTlRFTlQ6IG51bGwsXG5cdEZSQU1FX1NFVFRJTkdTX0NPTlRFTlQ6IG51bGwsXG5cdEZSQU1FX0NPTlRFTlRfVVBEQVRFRDogbnVsbCxcblx0RlJBTUVfQ09OTkVDVDogbnVsbCxcblx0RlJBTUVfRElTQ09OTkVDVDogbnVsbCxcblx0RlJBTUVfU0FWRTogbnVsbCxcblx0RlJBTUVfU0FWRV9ET05FOiBudWxsLFxuXHRGUkFNRV9TQVZFX0ZBSUw6IG51bGwsXG5cdEZSQU1FX1NMSURFX0NIQU5HRUQ6IG51bGwsXG5cdEZSQU1FX01JUlJPUkVEOiBudWxsLFxuXG5cdC8vIGNvbnRlbnQgYWN0aW9uIHR5cGVzXG5cdENPTlRFTlRfTE9BRDogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1NFTkQ6IG51bGwsXG5cdENPTlRFTlRfU0xJREVfQ0hBTkdFRDogbnVsbCxcblx0Q09OVEVOVF9BREQ6IG51bGwsXG5cdENPTlRFTlRfQUREX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfQUREX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9ET05FOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9GQUlMOiBudWxsLFxuXG5cdC8vIFVJIGFjdGlvbiB0eXBlc1xuXHRVSV9NRU5VX1RPR0dMRTogbnVsbCxcblx0VUlfU0VUX1NFTEVDVElPTl9QQU5FTDogbnVsbCxcblx0VUlfT1BFTl9BRERfQ09OVEVOVDogbnVsbCxcblx0VUlfQ0xPU0VfQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX09QRU5fU0VUVElOR1M6IG51bGwsXG5cdFVJX0NMT1NFX1NFVFRJTkdTOiBudWxsLFxuXG5cdC8vIGVtaXR0ZWQgYnkgc3RvcmVzXG5cdENIQU5HRV9FVkVOVDogbnVsbFxufSk7IiwidmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCdmbHV4JykuRGlzcGF0Y2hlcjtcblxudmFyIEFwcERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuXG4vKipcbiogQSBicmlkZ2UgZnVuY3Rpb24gYmV0d2VlbiB0aGUgdmlld3MgYW5kIHRoZSBkaXNwYXRjaGVyLCBtYXJraW5nIHRoZSBhY3Rpb25cbiogYXMgYSB2aWV3IGFjdGlvbi4gIEFub3RoZXIgdmFyaWFudCBoZXJlIGNvdWxkIGJlIGhhbmRsZVNlcnZlckFjdGlvbi5cbiogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb24gVGhlIGRhdGEgY29taW5nIGZyb20gdGhlIHZpZXcuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uID0gZnVuY3Rpb24oYWN0aW9uKSB7XG5cdGFjdGlvbi5zb3VyY2UgPSAnVklFV19BQ1RJT04nO1xuXHR0aGlzLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cblxuLyoqXG4qIEEgYnJpZGdlIGZ1bmN0aW9uIGJldHdlZW4gdGhlIHNlcnZlciBhbmQgdGhlIGRpc3BhdGNoZXIsIG1hcmtpbmcgdGhlIGFjdGlvblxuKiBhcyBhIHNlcnZlciBhY3Rpb24uXG4qIEBwYXJhbSAge29iamVjdH0gYWN0aW9uIFRoZSBkYXRhIGNvbWluZyBmcm9tIHRoZSBzZXJ2ZXIuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcblx0YWN0aW9uLnNvdXJjZSA9ICdTRVJWRVJfQUNUSU9OJztcblx0dGhpcy5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcERpc3BhdGNoZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcC5qcycpLFxuICAgIGJyb3dzZXJfc3RhdGUgPSByZXF1aXJlKCcuL2Jyb3dzZXJfc3RhdGVfbWFuYWdlcicpLFxuICAgIEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG4vLyBpbml0IGphdmFzY3JpcHQgbWVkaWEgcXVlcnktbGlrZSBzdGF0ZSBkZXRlY3Rpb25cbmJyb3dzZXJfc3RhdGUuaW5pdCgpO1xuXG4vLyBUdXJuIG9uIHRvdWNoIGV2ZW50cyBmb3IgUmVhY3QuXG4vLyBSZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbi8vIEZhc3RDbGljayByZW1vdmVzIHRoZSAzMDBzIGRlbGF5IG9uIHN0dXBpZCBpT1MgZGV2aWNlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coJ2F0dGFjaGluZyBGYXN0Q2xpY2snKTtcblx0RmFzdENsaWNrLmF0dGFjaChkb2N1bWVudC5ib2R5KTtcbn0pO1xuXG5SZWFjdC5yZW5kZXIoXG5cdDxBcHAgLz4sXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdPcGVuRnJhbWUnKVxuKSIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9jb250ZW50ID0gW10sXG5cdF9zZWxlY3RlZF9jb250ZW50X2lkID0gbnVsbDtcblxuXG52YXIgQ29udGVudFN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gY29udGVudDtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IF9jb250ZW50WzBdLl9pZDtcblx0XHRjb25zb2xlLmxvZygnaW5pdCcsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0fSxcblxuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQucHVzaChjb250ZW50KTtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGNvbnRlbnQuX2lkO1xuXHR9LFxuXG5cdHJlbW92ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IF8ucmVtb3ZlKF9jb250ZW50LCB7X2lkOiBjb250ZW50Ll9pZH0pO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGdldENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY29udGVudDtcblx0fSxcblxuXHRnZXRTZWxlY3RlZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKCdnZXRTZWxlY3RlZENvbnRlbnQ6JywgX2NvbnRlbnQsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0XHRyZXR1cm4gXy5maW5kKF9jb250ZW50LCB7J19pZCc6IF9zZWxlY3RlZF9jb250ZW50X2lkfSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcblxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRDpcblx0XHRcdGNvbnNvbGUubG9nKCdsb2FkaW5nIGNvbnRlbnQuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBsb2FkZWQ6ICcsIGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5pbml0KGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygnY29udGVudCBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VEOlxuXHRcdFx0Y29uc29sZS5sb2coJ3NsaWRlIGNoYW5nZWQuLi4nKTtcblx0XHRcdF9zZWxlY3RlZF9jb250ZW50X2lkID0gYWN0aW9uLmNvbnRlbnRfaWQ7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BREQ6XG5cdFx0XHRjb25zb2xlLmxvZygnYWRkaW5nIGNvbnRlbnQuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGFkZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuYWRkQ29udGVudChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygnY29udGVudCBmYWlsZWQgdG8gYmUgYWRkZWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9TRU5EOlxuXG5cdFx0XHQvLyBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19VUERBVEVfVEVYVDpcblx0ICAgIC8vICAgdGV4dCA9IGFjdGlvbi50ZXh0LnRyaW0oKTtcblx0ICAgIC8vICAgaWYgKHRleHQgIT09ICcnKSB7XG5cdCAgICAvLyAgICAgdXBkYXRlKGFjdGlvbi5pZCwge3RleHQ6IHRleHR9KTtcblx0ICAgIC8vICAgICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICB9XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWTpcblx0ICAgIC8vICAgZGVzdHJveShhY3Rpb24uaWQpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50U3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2ZyYW1lcyA9IHt9LFxuXHQvLyB0aGVzZSB0d28gYXJlIGZvciB0aGUgc3dpcGVyIG9mIHZpc2libGUgZnJhbWVzOlxuXHRfdmlzaWJsZUZyYW1lcyA9IFtdLFxuXHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IG51bGw7O1xuXG52YXIgYWRkRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgc2VsZWN0KSB7XG5cdF9mcmFtZXNbZnJhbWUuX2lkXSA9IGZyYW1lO1xuXHRpZiAoc2VsZWN0ICE9PSBmYWxzZSkgc2VsZWN0RnJhbWUoZnJhbWUpO1xufVxuXG52YXIgcmVtb3ZlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSl7XG5cdGNvbnNvbGUubG9nKCdyZW1vdmVGcmFtZScsIGZyYW1lKTtcblx0dmFyIGlkID0gZnJhbWUuX2lkO1xuXHRpZiAoaWQgaW4gX2ZyYW1lcykgZGVsZXRlIF9mcmFtZXNbaWRdO1xuXHRjb25zb2xlLmxvZyhfZnJhbWVzKTtcbn07XG5cbnZhciBzZWxlY3RGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdGNvbnNvbGUubG9nKCdzZWxlY3RGcmFtZTogJywgZnJhbWUpO1xuXG5cdC8vIHVuc2VsZWN0IGN1cnJlbnRseSBzZWxlY3RlZFxuXHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRpZiAoc2VsZWN0ZWRGcmFtZSkge1xuXHRcdHNlbGVjdGVkRnJhbWUuc2VsZWN0ZWQgPSBmYWxzZTtcblx0fVxuXG5cdC8vIG5vdyBzZXQgdGhlIG5ldyBzZWxlY3RlZCBmcmFtZVxuXHR2YXIgX3NlbGVjdGVkRnJhbWUgPSBfLmZpbmQoX2ZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG5cdF9zZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gdHJ1ZTtcbn1cblxudmFyIEZyYW1lU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHRpbml0OiBmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRfLmVhY2goZnJhbWVzLCBhZGRGcmFtZSk7XG5cblx0XHQvLyBzZWUgaWYgYW55IGZyYW1lIGlzIG1hcmtlZCBhcyBzZWxlY3RlZCBmcm9tIGRiLFxuXHRcdC8vIG90aGVyd2lzZSBzZWxlY3QgdGhlIGZpcnN0IGZyYW1lLlxuXHRcdGlmICghXy5maW5kKF9mcmFtZXMsIHtzZWxlY3RlZDogdHJ1ZX0pKSB7XG5cdFx0XHRfLnNhbXBsZShfZnJhbWVzKS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0RnJhbWU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIF9mcmFtZXNbaWRdO1xuXHR9LFxuXG5cdGdldEFsbEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2dldEFsbEZyYW1lczogJywgX2ZyYW1lcyk7XG5cdFx0cmV0dXJuIF8ubWFwKF9mcmFtZXMsIGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gZnJhbWU7XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KTtcblx0fSxcblxuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogX2ZyYW1lcyxcblx0XHRcdHNlbGVjdGVkRnJhbWU6IHRoaXMuZ2V0U2VsZWN0ZWRGcmFtZSgpXG5cdFx0fTtcblx0fSxcblxuXHRpbml0VmlzaWJsZUZyYW1lczogZnVuY3Rpb24odmlzaWJsZUZyYW1lcykge1xuXHRcdF92aXNpYmxlRnJhbWVzID0gdmlzaWJsZUZyYW1lcztcblx0XHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IF92aXNpYmxlRnJhbWVzWzBdLl9pZDtcblx0XHRjb25zb2xlLmxvZygnaW5pdFZpc2libGVGcmFtZXMnLCBfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCk7XG5cdH0sXG5cblx0YWRkVmlzaWJsZUZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdF92aXNpYmxlRnJhbWVzLnB1c2goZnJhbWUpO1xuXHRcdF9zZWxlY3RlZF92aXNpYmxlX2ZyYW1lX2lkID0gZnJhbWUuX2lkO1xuXHR9LFxuXG5cdHJlbW92ZVZpc2libGVGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRfdmlzaWJsZUZyYW1lcyA9IF8ucmVtb3ZlKF92aXNpYmxlRnJhbWVzLCB7X2lkOiBmcmFtZS5faWR9KTtcblx0fSxcblxuXHRnZXRWaXNpYmxlRnJhbWVzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX3Zpc2libGVGcmFtZXM7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRWaXNpYmxlRnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmZpbmQoX3Zpc2libGVGcmFtZXMsIHsnX2lkJzogX3NlbGVjdGVkX3Zpc2libGVfZnJhbWVfaWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0Y29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0Y29uc29sZS5sb2coJ2Nvbm5lY3RGcmFtZTogJywgZnJhbWUpO1xuXHRcdGFkZEZyYW1lKGZyYW1lKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgZGlzY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0ZGlzY29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0YWRkRnJhbWUoZnJhbWUsIGZhbHNlKTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuXG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBsb2FkZWQ6ICcsIGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5pbml0KGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9WSVNJQkxFOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgdmlzaWJsZSBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfVklTSUJMRV9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygndmlzaWJsZSBmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuaW5pdFZpc2libGVGcmFtZXMoYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX1ZJU0lCTEVfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCd2aXNpYmxlIGZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5jb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuZGlzY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVDpcbiAgICBcdFx0c2VsZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicsIGFjdGlvbik7XG5cdFx0XHRfc2VsZWN0ZWRfdmlzaWJsZV9mcmFtZV9pZCA9IGFjdGlvbi5mcmFtZV9pZDtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0RnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkuY29udGVudCA9IGFjdGlvbi5jb250ZW50O1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfVVBEQVRFRDpcblx0XHRcdC8vIGFkZGluZyB0aGUgdXBkYXRlZCBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX01JUlJPUkVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcblx0XHRcdC8vIGFkZGluZyB0aGUgc2F2ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0RPTkU6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHQvLyBub29wIChvcHRpbWlzdGljIHVpIHVwZGF0ZSBhbHJlYWR5IGhhcHBlbmVkIG9uIEZSQU1FX1NBVkUpXG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9GQUlMOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmYWlsZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdC8vIFRPRE86IGhhbmRsZSB0aGlzIGJ5IHJldmVydGluZyAoaW1tdXRhYmxlLmpzIHdvdWxkIGhlbHApXG5cdFx0XHRjb25zb2xlLmxvZygnZmFpbGVkIHRvIHNhdmUgZnJhbWUnLCBhY3Rpb24uZnJhbWUpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lU3RvcmU7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcbiAgICBPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuICAgIGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9tZW51T3BlbiA9IGZhbHNlLFxuICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZSxcbiAgICBfYWRkT3BlbiA9IGZhbHNlLFxuICAgIF9zZXR0aW5nc09wZW4gPSBmYWxzZSxcbiAgICBfc2VsZWN0aW9uUGFuZWwgPSBcImNvbGxlY3Rpb25cIjtcblxudmFyIF90b2dnbGVNZW51ID0gZnVuY3Rpb24ob3Blbikge1xuICAgIF9tZW51T3BlbiA9ICEhb3Blbjtcbn1cblxuXG52YXIgVUlTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG4gICAgZ2V0TWVudVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wZW46IF9tZW51T3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZXR0aW5nc1N0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wZW46IF9zZXR0aW5nc09wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2VsZWN0aW9uUGFuZWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZWxlY3Rpb25QYW5lbDogX3NlbGVjdGlvblBhbmVsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEFkZE1vZGFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWRkT3BlbjogX2FkZE9wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0U2V0dGluZ3NNb2RhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz09PT09PT09JywgX3NldHRpbmdzT3Blbik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXR0aW5nc09wZW46IF9zZXR0aW5nc09wZW5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuICAgIH0sXG5cbiAgICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH0sXG5cbiAgICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICAgIH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgICBzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZU1lbnUoYWN0aW9uLm9wZW4pO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX01FTlVfVE9HR0xFOlxuICAgICAgICAgICAgX3RvZ2dsZVNldHRpbmdzKCk7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfU0VUX1NFTEVDVElPTl9QQU5FTDpcbiAgICAgICAgICAgIF9zZWxlY3Rpb25QYW5lbCA9IGFjdGlvbi5wYW5lbDtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX0FERF9DT05URU5UOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX0FERF9DT05URU5UOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfT1BFTl9TRVRUSU5HUzpcbiAgICAgICAgICAgIF9zZXR0aW5nc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX0NMT1NFX1NFVFRJTkdTOlxuICAgICAgICAgICAgLy8gbW9kYWwgYWxyZWFkeSBjbG9zaW5nLCBubyBjaGFuZ2UgZW1taXNzaW9uIG5lZWRlZFxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgICAgICAgICAgX2FkZE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFOlxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVUlTdG9yZTsiXX0=
