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
	all_frames: '/frames/user/' + OF_USERNAME
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
		$.getJSON(endpoints.all_frames)
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
  			frameList = '';
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

},{"../actions/FrameActions":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","../stores/UIStore":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/stores/UIStore.js","./AddContentForm.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./AddContentModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/AddContentModal.js","./ContentList.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./Drawer.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Drawer.js","./FooterNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./Nav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./SettingsDrawer.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsDrawer.js","./SettingsModal.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SettingsModal.js","./SimpleNav.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js","./TransferButtons.js":"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Users/jon/Projects/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
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

	render: function() {
		function createContentSlide(contentItem) {
			console.log('creating slide: ', contentItem);
			return (
				React.createElement("div", {key: contentItem._id.$oid, className: "swiper-slide", onClick: null}, 
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
  		var html = '<div class="swiper-slide" data-contentid="' + contentItem._id + '"><img src=' + contentItem.url + ' /></div>'
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
					rotation: 90
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
	FRAME_SELECT: null,
	FRAME_UPDATE_CONTENT: null,
	FRAME_SETTINGS_CONTENT: null,
	FRAME_CONTENT_UPDATED: null,
	FRAME_CONNECT: null,
	FRAME_DISCONNECT: null,
	FRAME_SAVE: null,
	FRAME_SAVE_DONE: null,
	FRAME_SAVE_FAIL: null,

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


var _frames = {};

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9GcmFtZUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL01lbnVBY3Rpb25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9VSUFjdGlvbnMuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYnJvd3Nlcl9zdGF0ZV9tYW5hZ2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BZGRDb250ZW50Rm9ybS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudE1vZGFsLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BcHAuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0NvbnRlbnRMaXN0LmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9EcmF3ZXIuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL05hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaW5rLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9OYXZGcmFtZUxpc3QuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzRHJhd2VyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TZXR0aW5nc0Zvcm0uanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NldHRpbmdzTW9kYWwuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL1NpbXBsZU5hdi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvVHJhbnNmZXJCdXR0b25zLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uZmlnLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uc3RhbnRzL09GQ29uc3RhbnRzLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzIiwiL1VzZXJzL2pvbi9Qcm9qZWN0cy9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvcmVhY3QtbWFpbi5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9Db250ZW50U3RvcmUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvRnJhbWVTdG9yZS5qcyIsIi9Vc2Vycy9qb24vUHJvamVjdHMvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9NZW51U3RvcmUuanMiLCIvVXNlcnMvam9uL1Byb2plY3RzL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvVUlTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREEsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDO0NBQ3pELFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUM7Q0FDakQsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDdEIsQ0FBQyxN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LE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFZLE1BQU07O0FBRWxCLFFBQVEsUUFBUTs7R0FFYjtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpO1xuXG52YXIgZW5kcG9pbnRzID0ge1xuXHRhbGxfY29udGVudDogJy9jb250ZW50L3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBDb250ZW50QWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGNvbnRlbnQgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKi9cblx0bG9hZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDb250ZW50QWN0aW9ucy5sb2FkQ29udGVudHMoKScpO1xuXHRcdC8vIGRpc3BhdGNoIGFuIGFjdGlvbiBpbmRpY2F0aW5nIHRoYXQgd2UncmUgbG9hZGluZyB0aGUgY29udGVudFxuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BREQsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoY29udGVudCksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0YWxsX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUVcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfZnJhbWVzKVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXM6ICcsIGZyYW1lcyk7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgYSBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzZWxlY3QnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGNvbnRlbnQgb24gdGhlIHNlbGVjdGVkIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdHVwZGF0ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHR2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0XHRjb25zb2xlLmxvZyhmcmFtZSwgY29udGVudCk7XG5cdFx0Ly8gdmFyIGNvbnRlbnQgPSBDb250ZW50U3RvcmUuZ2V0U2VsZWN0ZWRDb250ZW50KCk7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgZnJhbWVfaWQ6IGZyYW1lLl9pZCxcbiAgICAgICAgICAgIGNvbnRlbnRfaWQ6IGNvbnRlbnQuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTp1cGRhdGVfY29udGVudCcsIGRhdGEpO1xuXG5cdFx0Ly8gV2ViU29ja2V0IGV2ZW50IGhhbmRsZXIgZm9yIGZyYW1lOmNvbnRlbnRfdXBkYXRlZCB0cmlnZ2VycyB0aGUgZGlzcGF0Y2hcblx0fSxcblxuXHRzYXZlRnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkUsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2ZyYW1lcy8nK2ZyYW1lLl9pZCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShmcmFtZSksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NBVkVfRE9ORSxcblx0XHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0ZBSUwsXG5cdFx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdFx0fSk7XG4gICAgICAgIH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZURpc2Nvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgZGlzY29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29udGVudFVwZGF0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIENvbnRlbnQgdXBkYXRlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdHNldHVwOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGZyYW1lID0gZGF0YS5mcmFtZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFNldHVwJywgZnJhbWUpO1xuICAgICAgICAvLyB0aGlzIGlzIGEgbGl0dGxlIHdlaXJkIC0tIHdoeSBpc24ndCBzZXR1cCBqdXN0IHBhcnQgb2YgdGhlIGluaXRpYWxcbiAgICAgICAgLy8gY29ubmVjdGVkIGV2ZW50P1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWxseT8gRG9lcyB0aGUgdmlldyBkaW1lbnNpb24gbmVlZCB0byBiZSBwYXJ0IG9mIHRoZSBzdGF0ZT9cbiAgICAgKiBQcm9iYWJsZSBub3QuIE5vdCB1c2VkIHByZXNlbnRseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gdyBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBoIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIHNldHVwRnJhbWVWaWV3OiBmdW5jdGlvbih3LCBoKSB7XG4gICAgXHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VUVVBfVklFVyxcblx0XHRcdHc6IHcsXG5cdFx0XHRoOiBoXG5cdFx0fSk7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKVxuXG52YXIgTWVudUFjdGlvbnMgPSB7XG5cblx0dG9nZ2xlTWVudTogZnVuY3Rpb24oKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLk1FTlVfVE9HR0xFXG5cdFx0fSk7XG5cdH0sXG5cblx0dG9nZ2xlU2V0dGluZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5TRVRUSU5HU19UT0dHTEVcblx0XHR9KTtcblx0fVxuXHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51QWN0aW9uczsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuICAgIE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbnZhciBVSUFjdGlvbnMgPSB7XG5cbiAgICB0b2dnbGVNZW51OiBmdW5jdGlvbihvcGVuKSB7XG4gICAgICAgIC8vIGlmIG9wZW4gdHJ1ZSwgb3Blbi4gaWYgZmFsc2UsIGNsb3NlLlxuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEUsXG4gICAgICAgICAgICBvcGVuOiBvcGVuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVTZXR0aW5nczogZnVuY3Rpb24ob3Blbikge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfU0VUVElOR1NfVE9HR0xFLFxuICAgICAgICAgICAgb3Blbjogb3BlblxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0U2VsZWN0aW9uUGFuZWw6IGZ1bmN0aW9uKHBhbmVsKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9TRVRfU0VMRUNUSU9OX1BBTkVMLFxuICAgICAgICAgICAgcGFuZWw6IHBhbmVsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuQWRkQ29udGVudE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ29wZW5BZGRDb250ZW50TW9kYWwnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX09QRU5fQUREX0NPTlRFTlRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFkZENvbnRlbnRNb2RhbENsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdhZGRDb250ZW50TW9kYWxDbG9zZWQnKTtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlVJX0NMT1NFX0FERF9DT05URU5UXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvcGVuU2V0dGluZ3NNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdvcGVuU2V0dGluZ3NNb2RhbCcpO1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogT0ZDb25zdGFudHMuVUlfT1BFTl9TRVRUSU5HU1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3NNb2RhbENsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzZXR0aW5nc01vZGFsQ2xvc2VkJyk7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5VSV9DTE9TRV9TRVRUSU5HU1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVSUFjdGlvbnM7IiwiU29ja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBfc2VsZiA9IHt9LFxuICAgICAgICBfZXZlbnRIYW5kbGVycyA9IHt9LFxuICAgICAgICBfY29ubmVjdGVkID0gZmFsc2UsXG4gICAgICAgIF9vcHRzID0ge1xuICAgICAgICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tJbnRlcnZhbDogMTAwMDBcbiAgICAgICAgfSxcbiAgICAgICAgX3VybCxcbiAgICAgICAgX3dzLFxuICAgICAgICBfdGltZXI7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSB3ZWJzb2NrZXQgY29ubmVjdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHVybCAgVGhlIHNlcnZlciBVUkwuXG4gICAgICogQHBhcmFtICB7b2JqZWN0fSBvcHRzIE9wdGlvbmFsIHNldHRpbmdzXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2Nvbm5lY3QodXJsLCBvcHRzKSB7XG4gICAgICAgIF91cmwgPSB1cmw7XG4gICAgICAgIGlmIChvcHRzKSBfZXh0ZW5kKF9vcHRzLCBvcHRzKTtcbiAgICAgICAgX3dzID0gbmV3IFdlYlNvY2tldCh1cmwpO1xuXG4gICAgICAgIF93cy5vbm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIG9wZW5lZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoX29wdHMub25PcGVuKSBfb3B0cy5vbk9wZW4oKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gY2xvc2VkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoX29wdHMub25DbG9zZSkgX29wdHMub25DbG9zZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldnQuZGF0YSksXG4gICAgICAgICAgICAgICAgbmFtZSA9IG1lc3NhZ2UubmFtZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbWVzc2FnZS5kYXRhO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggZXZlbnQgaGFuZGxlciwgY2FsbCB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9ldmVudEhhbmRsZXJzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdW2ldKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSArIFwiIGV2ZW50IG5vdCBoYW5kbGVkLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX29wdHMua2VlcEFsaXZlKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKF90aW1lcik7XG4gICAgICAgICAgICBfdGltZXIgPSBzZXRJbnRlcnZhbChfY2hlY2tDb25uZWN0aW9uLCBfb3B0cy5jaGVja0ludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXSA9IFtjYWxsYmFja107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vZmYobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBfZXZlbnRIYW5kbGVyc1tuYW1lXS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYW4gZXZlbnQuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBuYW1lIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGRhdGEgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX3NlbmQobmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLnNlbmQoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLiBJZiBub3QsIHRyeSB0byByZWNvbm5lY3QuXG4gICAgICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2NoZWNrQ29ubmVjdGlvbigpIHtcbiAgICAgICAgaWYgKCFfY29ubmVjdGVkKSB7XG4gICAgICAgICAgICBfY29ubmVjdChfdXJsLCBfb3B0cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVdGlsaXR5IGZ1bmN0aW9uIGZvciBleHRlbmRpbmcgYW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gb2JqIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2V4dGVuZChvYmopIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuXG4gICAgX3NlbGYub24gPSBfb247XG4gICAgX3NlbGYub2ZmID0gX29mZjtcbiAgICBfc2VsZi5zZW5kID0gX3NlbmQ7XG4gICAgX3NlbGYuY29ubmVjdCA9IF9jb25uZWN0O1xuICAgIHJldHVybiBfc2VsZjtcbn0pKCk7XG5cbi8vIENPTU1PTi5KU1xuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gU29ja2VyOyIsInZhciBzc20gPSByZXF1aXJlKCdzc20nKVxuXHRjb25mID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblxuZnVuY3Rpb24gX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50KCkge1xuXHRjb25zb2xlLmxvZygnX2luaXRCcm93c2VyU3RhdGVNYW5hZ2VtZW50Jyk7XG5cblx0X3NldHVwU2NyZWVuU2l6ZSgpO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ3hzJyxcblx0ICAgIG1heFdpZHRoOiA3NjcsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciB4cycpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAneHMnO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdzbScsXG5cdCAgICBtaW5XaWR0aDogNzY4LFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgc20nKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ3NtJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnbWQnLFxuXHQgICAgbWluV2lkdGg6IDk5Mixcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIG1kJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdtZCc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ2xnJyxcblx0ICAgIG1pbldpZHRoOiAxMjAwLFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgbGcnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ2xnJztcblx0ICAgIH1cblx0fSk7XHRcblxuXHRzc20ucmVhZHkoKTtcbn1cblxuZnVuY3Rpb24gX3NldHVwU2NyZWVuU2l6ZSgpIHtcblx0Y29uZi53VyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRjb25mLndIID0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRjb25zb2xlLmxvZyhjb25mKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IF9pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudFxufVxuXG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpO1xuXG52YXIgQWRkQ29udGVudEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgaGFuZGxlRm9ybVN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciB1cmwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZTtcblxuICAgICAgICBpZiAoIXVybCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICB1c2VyczogW09GX1VTRVJOQU1FXVxuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnc3VibWl0dGluZyBjb250ZW50OiAnLCBjb250ZW50KTtcbiAgICAgICAgQ29udGVudEFjdGlvbnMuYWRkQ29udGVudChjb250ZW50KTtcblxuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZSA9ICcnO1xuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS5mb2N1cygpO1xuICAgIH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGhpZGRlbi14cyBhZGQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT1cImZvcm0taW5saW5lXCIgaWQ9XCJhZGQtZm9ybVwiIG9uU3VibWl0PXt0aGlzLmhhbmRsZUZvcm1TdWJtaXR9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8bGFiZWwgZm9yPVwiU2VuZFRvVXNlclwiPlVSTDwvbGFiZWw+ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBpZD1cIlVSTFwiIHBsYWNlaG9sZGVyPVwiZW50ZXIgVVJMXCIgcmVmPVwiVVJMXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1hZGQtY29udGVudFwiIGhyZWY9XCIjYWRkLWNvbnRlbnRcIiBpZD1cImFkZC1jb250ZW50LWJ1dHRvblwiPkFkZCBDb250ZW50PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZGRDb250ZW50Rm9ybTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRVSUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1VJQWN0aW9ucycpLFxuXHRDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIEFkZENvbnRlbnRNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWRkT3BlbjogZmFsc2Vcblx0XHR9XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub24oJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBcdGNvbnNvbGUubG9nKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICAgICAgXHR0aGF0Ll9yZXNldEZvcm0oKTtcbiAgICAgICAgXHRVSUFjdGlvbnMuYWRkQ29udGVudE1vZGFsQ2xvc2VkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFZlcnRpY2FsbHkgY2VudGVyIG1vZGFsc1xuXHRcdC8qIGNlbnRlciBtb2RhbCAqL1xuXHRcdGZ1bmN0aW9uIGNlbnRlck1vZGFscygpe1xuXHRcdCAgICAkKCcubW9kYWwnKS5lYWNoKGZ1bmN0aW9uKGkpe1xuXHRcdCAgICAgICAgdmFyICRjbG9uZSA9ICQodGhpcykuY2xvbmUoKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5hcHBlbmRUbygnYm9keScpO1xuXHRcdCAgICAgICAgdmFyIHRvcCA9IE1hdGgucm91bmQoKCRjbG9uZS5oZWlnaHQoKSAtICRjbG9uZS5maW5kKCcubW9kYWwtY29udGVudCcpLmhlaWdodCgpKSAvIDIpO1xuXHRcdCAgICAgICAgdG9wID0gdG9wID4gMCA/IHRvcCA6IDA7XG5cdFx0ICAgICAgICAkY2xvbmUucmVtb3ZlKCk7XG5cdFx0ICAgICAgICAkKHRoaXMpLmZpbmQoJy5tb2RhbC1jb250ZW50JykuY3NzKFwibWFyZ2luLXRvcFwiLCB0b3ApO1xuXHRcdCAgICB9KTtcblx0XHR9XG5cdFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignc2hvdy5icy5tb2RhbCcsIGNlbnRlck1vZGFscyk7XG5cdFx0Ly8gJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBjZW50ZXJNb2RhbHMpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgICQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkub2ZmKCdoaWRkZW4uYnMubW9kYWwnKTtcbiAgICB9LFxuXG5cdF9oYW5kbGVBZGRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5yZWZzLnVybC5nZXRET01Ob2RlKCkudmFsdWUsXG5cdFx0XHR0YWdzID0gdGhpcy5yZWZzLnRhZ3MuZ2V0RE9NTm9kZSgpLnZhbHVlO1xuXG5cdFx0aWYgKCF1cmwudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGFncyA9IHRhZ3MudHJpbSgpLnNwbGl0KCcjJyk7XG5cblx0XHRfLnJlbW92ZSh0YWdzLCBmdW5jdGlvbih0YWcpIHtcblx0XHRcdHJldHVybiB0YWcudHJpbSgpID09ICcnO1xuXHRcdH0pO1xuXG5cdFx0Xy5lYWNoKHRhZ3MsIGZ1bmN0aW9uKHRhZywgaSkge1xuXHRcdFx0dGFnc1tpXSA9IHRhZy50cmltKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zb2xlLmxvZyh0YWdzKTtcblxuXHRcdHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICB1c2VyczogW09GX1VTRVJOQU1FXSxcbiAgICAgICAgICAgIHRhZ3M6IHRhZ3NcbiAgICAgICAgfTtcblx0XHRDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG5cdH0sXG5cblx0X2hhbmRsZU9uRm9jdXM6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgZWwgPSBlLmN1cnJlbnRUYXJnZXQ7XG5cdFx0aWYgKGVsLnZhbHVlLnRyaW0oKSA9PSAnJykge1xuXHRcdFx0ZWwudmFsdWUgPSAnIyc7XG5cdFx0fVxuXHR9LFxuXG5cdF9oYW5kbGVUYWdzQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIGVsID0gZS5jdXJyZW50VGFyZ2V0LFxuXHRcdFx0dmFsID0gZWwudmFsdWU7XG5cblx0XHRpZiAoZWwudmFsdWUgPT0gJycpIHtcblx0XHRcdGVsLnZhbHVlID0gJyMnO1xuXHRcdH1cblxuXHRcdGlmICh2YWxbdmFsLmxlbmd0aC0xXSA9PT0gJyAnKSB7XG5cdFx0XHRlbC52YWx1ZSArPSAnIydcblx0XHR9XG5cdFx0Ly8gaGFjayBiZWNhdXNlIEkgY2FuJ3Qgc2VlbSB0byBnZXQgdGhlIGF1dG9jYXBpdGFsaXplPVwib2ZmXCIgdG8gd29ya1xuXHRcdC8vIGZvciB0aGUgdGFncyBmaWVsZCA/P1xuXHRcdGVsLnZhbHVlID0gZWwudmFsdWUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXHRfaGFuZGxlS2V5RG93bjogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBlLmN1cnJlbnRUYXJnZXQudmFsdWU7XG5cdFx0aWYgKHZhbFswXSAhPSAnIycpIHtcblx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbCA9ICcjJyArIHZhbDtcblxuXHRcdH1cblx0XHRpZiAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIHZhbCAhPT0gJyMnKSB7XG5cdFx0XHRpZiAodmFsW3ZhbC5sZW5ndGggLSAxXSA9PT0gJyMnKSB7XG5cdFx0XHRcdGUuY3VycmVudFRhcmdldC52YWx1ZSA9IHZhbC5zdWJzdHJpbmcoMCwgdmFsLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfcmVzZXRGb3JtOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlZnMudXJsLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHRcdHRoaXMucmVmcy50YWdzLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRBZGRNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLmFkZE9wZW4pIHtcblx0ICAgICAgICBcdCQodGhpcy5yZWZzLm1vZGFsLmdldERPTU5vZGUoKSkubW9kYWwoKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnaGlkZScpO1xuXHQgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsIGZhZGUgbW9kYWwtYWRkLWNvbnRlbnRcIiByZWY9XCJtb2RhbFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWRpYWxvZ1wiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHQgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWhlYWRlclwiPlxuXHRcdFx0XHQgICAgXHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwibW9kYWxcIiBhcmlhLWxhYmVsPVwiQ2xvc2VcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImljb24tY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHQgICAgXHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0ICAgIFx0PGg0IGNsYXNzTmFtZT1cIm1vZGFsLXRpdGxlXCI+QWRkIENvbnRlbnQ8L2g0PlxuXHRcdFx0XHRcdCAgXHQ8L2Rpdj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtYm9keVwiPlxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RW50ZXIgVVJMPC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1pbnB1dFwiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdDxpbnB1dCByZWY9XCJ1cmxcIiB0eXBlPVwidXJsXCIgYXV0b2NhcGl0YWxpemU9XCJvZmZcIiBwbGFjZWhvbGRlcj1cImh0dHA6Ly8uLi5cIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyXCI+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1sYWJlbFwiPkVudGVyIGRlc2NyaXB0aW9uIHdpdGggdGFnczwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwidGFnc1wiIHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0YXV0b2NhcGl0YWxpemU9XCJvZmZcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0XHRwbGFjZWhvbGRlcj1cIiNwaG90byAjUm9kY2hlbmtvICMxOTQxXCJcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25Gb2N1cz17dGhpcy5faGFuZGxlT25Gb2N1c31cblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVRhZ3NDaGFuZ2V9XG5cdFx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdG9uS2V5RG93bj17dGhpcy5faGFuZGxlS2V5RG93bn0gLz5cblx0XHRcdFx0ICAgIFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdCAgICBcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVBZGRDb250ZW50fSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0QWRkIFRvIENvbGxlY3Rpb25cblx0XHRcdFx0ICAgIFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZGRDb250ZW50TW9kYWw7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXG5cdE5hdiA9IHJlcXVpcmUoJy4vTmF2LmpzJyksXG5cdFNpbXBsZU5hdiA9IHJlcXVpcmUoJy4vU2ltcGxlTmF2LmpzJyksXG5cdEZyYW1lID0gcmVxdWlyZSgnLi9GcmFtZS5qcycpLFxuXHRUcmFuc2ZlckJ1dHRvbnMgPSByZXF1aXJlKCcuL1RyYW5zZmVyQnV0dG9ucy5qcycpLFxuXHRBZGRDb250ZW50Rm9ybSA9IHJlcXVpcmUoJy4vQWRkQ29udGVudEZvcm0uanMnKSxcblx0Q29udGVudExpc3QgPSByZXF1aXJlKCcuL0NvbnRlbnRMaXN0LmpzJyksXG5cdEZvb3Rlck5hdiA9IHJlcXVpcmUoJy4vRm9vdGVyTmF2LmpzJyksXG5cdERyYXdlciA9IHJlcXVpcmUoJy4vRHJhd2VyLmpzJyksXG5cdFNldHRpbmdzRHJhd2VyID0gcmVxdWlyZSgnLi9TZXR0aW5nc0RyYXdlci5qcycpLFxuXHRBZGRDb250ZW50TW9kYWwgPSByZXF1aXJlKCcuL0FkZENvbnRlbnRNb2RhbC5qcycpLFxuXHRTZXR0aW5nc01vZGFsID0gcmVxdWlyZSgnLi9TZXR0aW5nc01vZGFsLmpzJyksXG5cblx0QXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0VUlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9VSVN0b3JlJyksXG5cblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXG5cdGNvbmYgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxuLyoqXG4gKiBUaGUgQXBwIGlzIHRoZSByb290IGNvbXBvbmVudCByZXNwb25zaWJsZSBmb3I6XG4gKiAtIHNldHRpbmcgdXAgc3RydWN0dXJlIG9mIGNoaWxkIGNvbXBvbmVudHNcbiAqXG4gKiBJbmRpdmlkdWFsIGNvbXBvbmVudHMgcmVnaXN0ZXIgZm9yIFN0b3JlIHN0YXRlIGNoYW5nZSBldmVudHNcbiAqL1xudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0aW9uUGFuZWw6IFwiY29sbGVjdGlvblwiXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghZ2xvYmFsLk9GX1VTRVJOQU1FKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT0ZfVVNFUk5BTUUgbm90IGRlZmluZWQuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0U29ja2VyLmNvbm5lY3QoXCJ3czovL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9hZG1pbi93cy9cIiArIE9GX1VTRVJOQU1FKTtcblxuXHRcdC8vIFRPRE86IHRoZXNlIHNob3VsZCBtb3ZlIHRvIHRoZSBjb3JyZXNwb25kaW5nIEFjdGlvbnMgY3JlYXRvciAoZS5nLiBGcmFtZUFjdGlvbnMpXG5cdFx0U29ja2VyLm9uKCdmcmFtZTpjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmRpc2Nvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZURpc2Nvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6Y29udGVudF91cGRhdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lQ29udGVudFVwZGF0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOnNldHVwJywgRnJhbWVBY3Rpb25zLnNldHVwKTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCAkKCcubmF2LWZvb3RlcicpLmhlaWdodCgpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMubmF2Rm9vdGVyKS5vZmZzZXRIZWlnaHQpO1xuXHRcdFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFVJU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhbmVsID0gVUlTdG9yZS5nZXRTZWxlY3Rpb25QYW5lbFN0YXRlKCk7XG5cdFx0dGhpcy5zZXRTdGF0ZShwYW5lbCk7XG5cdH0sXG5cbiAgXHRyZW5kZXI6IGZ1bmN0aW9uKCl7XG4gIFx0XHR2YXIgY29udGVudExpc3QgPSA8Q29udGVudExpc3QgLz4sXG4gIFx0XHRcdGZyYW1lTGlzdCA9ICcnO1xuICBcdFx0dmFyIHNlbGVjdGlvblBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbCA9PT0gJ2NvbGxlY3Rpb24nID8gY29udGVudExpc3QgOiBmcmFtZUxpc3Q7XG5cdCAgICByZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRhaW5lciBhcHAnPlxuXHRcdFx0XHQ8U2ltcGxlTmF2IC8+XG5cdFx0XHRcdDxGcmFtZSAvPlxuXHRcdFx0XHQ8VHJhbnNmZXJCdXR0b25zIC8+XG5cdFx0XHRcdDxkaXY+e3NlbGVjdGlvblBhbmVsfTwvZGl2PlxuXHRcdFx0XHQ8Rm9vdGVyTmF2IHJlZj1cIm5hdkZvb3RlclwiLz5cblx0XHRcdFx0PERyYXdlciAvPlxuXHRcdFx0XHQ8U2V0dGluZ3NNb2RhbCAvPlxuXHRcdFx0XHQ8QWRkQ29udGVudE1vZGFsIC8+XG5cdFx0XHQ8L2Rpdj5cblx0ICAgIClcbiAgXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBDb250ZW50TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udGVudDogW11cblx0XHR9XG5cdH0sXG5cdFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Q29udGVudEFjdGlvbnMubG9hZENvbnRlbnQoKTtcblx0XHRDb250ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnY29tcG9uZW50RGlkVW5tb3VudCcpO1xuXHRcdENvbnRlbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRmdW5jdGlvbiBjcmVhdGVDb250ZW50U2xpZGUoY29udGVudEl0ZW0pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdjcmVhdGluZyBzbGlkZTogJywgY29udGVudEl0ZW0pO1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PGRpdiBrZXk9e2NvbnRlbnRJdGVtLl9pZC4kb2lkfSBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIiBvbkNsaWNrPXtudWxsfT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2NvbnRlbnRJdGVtLnVybH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG5cdFx0fVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgICAgICAgICAgXG5cdCAgICAgICAgICAgICAgICA8L2Rpdj5cblx0ICAgICAgICAgICAgPC9kaXY+XG5cdCAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0Y29udGVudDogQ29udGVudFN0b3JlLmdldENvbnRlbnQoKVxuICBcdFx0fSk7XG4gIFx0XHRcbiAgXHRcdC8vIFRPRE86IGJldHRlciBSZWFjdCBpbnRlZ3JhdGlvbiBmb3IgdGhlIHN3aXBlclxuICBcdFx0XG4gIFx0XHRpZiAoIXRoaXMuc3dpcGVyKSB7XG4gIFx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgXHRcdH1cblxuICBcdFx0dGhpcy5fcG9wdWxhdGVTbGlkZXIoKVxuICBcdFx0XG5cdFx0Ly8gdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmxlbmd0aDtcbiAgICAgICAgdGhpcy5zd2lwZXIuc2xpZGVUbygwKTtcbiAgXHR9LFxuXG4gIFx0X2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG5cdFx0dGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG5cdCAgICAgICAgc2xpZGVzUGVyVmlldzogMyxcblx0ICAgICAgICBzcGFjZUJldHdlZW46IDUwLFxuXHQgICAgICAgIGNlbnRlcmVkU2xpZGVzOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlOiB0cnVlLFxuXHQgICAgICAgIGZyZWVNb2RlTW9tZW50dW06IHRydWUsXG5cdCAgICAgICAgZnJlZU1vZGVNb21lbnR1bVJhdGlvOiAuMjUsXG5cdCAgICAgICAgZnJlZU1vZGVTdGlja3k6dHJ1ZSxcblx0ICAgICAgICAvLyBsb29wOiB0cnVlLFxuXHQgICAgICAgIC8vIGxvb3BlZFNsaWRlczogNSxcblx0ICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWUsXG5cdCAgICAgICAgb25TbGlkZUNoYW5nZUVuZDogdGhpcy5fc2xpZGVDaGFuZ2VFbmRcblx0ICAgIH0pO1xuXG5cbiAgXHR9LFxuXG4gIFx0X3BvcHVsYXRlU2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc3dpcGVyLnJlbW92ZUFsbFNsaWRlcygpO1xuICBcdFx0dGhpcy5zdGF0ZS5jb250ZW50LmZvckVhY2godGhpcy5fYWRkU2xpZGUpO1xuICBcdH0sXG5cbiAgXHRfYWRkU2xpZGU6IGZ1bmN0aW9uKGNvbnRlbnRJdGVtKSB7XG4gIFx0XHR2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwic3dpcGVyLXNsaWRlXCIgZGF0YS1jb250ZW50aWQ9XCInICsgY29udGVudEl0ZW0uX2lkICsgJ1wiPjxpbWcgc3JjPScgKyBjb250ZW50SXRlbS51cmwgKyAnIC8+PC9kaXY+J1xuXHRcdHRoaXMuc3dpcGVyLnByZXBlbmRTbGlkZShodG1sKTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlVG86IGZ1bmN0aW9uKGluZGV4KSB7XG4gIFx0XHR0aGlzLnN3aXBlci5zbGlkZVRvKGluZGV4KTtcbiAgXHR9LFxuXG4gIFx0X3NsaWRlQ2hhbmdlRW5kOiBmdW5jdGlvbihzbGlkZXIpIHtcbiAgXHRcdHZhciBzbGlkZSA9IHRoaXMuc3dpcGVyLnNsaWRlc1t0aGlzLnN3aXBlci5hY3RpdmVJbmRleF0sXG4gIFx0XHRcdGNvbnRlbnRfaWQgPSBzbGlkZS5kYXRhc2V0LmNvbnRlbnRpZDtcbiAgXHRcdGNvbnNvbGUubG9nKCdfc2xpZGVDaGFuZ2VFbmQnLCBjb250ZW50X2lkKTtcbiAgXHRcdENvbnRlbnRBY3Rpb25zLnNsaWRlQ2hhbmdlZChjb250ZW50X2lkKTtcbiAgXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRMaXN0OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGlzdCA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaXN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItbGVmdCdcblx0XHR9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0VUlBY3Rpb25zLnRvZ2dsZU1lbnUoZmFsc2UpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoVUlTdG9yZS5nZXRNZW51U3RhdGUoKSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBiYXNlQ2xhc3MgPSAndmlzaWJsZS14cyBtZW51LWRyYXdlcic7XG5cdFx0dmFyIG9wZW5DbGFzcyA9IHRoaXMuc3RhdGUub3BlbiA/ICdtZW51LWRyYXdlci1vcGVuJyA6ICdtZW51LWRyYXdlci1jbG9zZWQnO1xuXHRcdHZhciBzaWRlQ2xhc3MgPSB0aGlzLnByb3BzLnNpZGVDbGFzcztcblx0XHR2YXIgZnVsbENsYXNzID0gW2Jhc2VDbGFzcywgb3BlbkNsYXNzLCBzaWRlQ2xhc3NdLmpvaW4oJyAnKTtcblxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtmdWxsQ2xhc3N9PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1lbnUtZHJhd2VyLWlubmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJvZi1uYXYtZml4ZWQgb2YtbmF2LWRyYXdlclwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ1c2VybmFtZSB0ZXh0LWNlbnRlclwiPntPRl9VU0VSTkFNRX08L2Rpdj5cblx0XHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IHZpc2libGUteHMgcHVsbC1yaWdodFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsb3NlTWVudUNsaWNrfSA+XG5cdFx0ICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE5hdkZyYW1lTGlzdCBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYXdlcjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpO1xuXG52YXIgRm9vdGVyTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3Rpb25QYW5lbDogXCJjb2xsZWN0aW9uXCJcblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0VUlBY3Rpb25zLnRvZ2dsZU1lbnUoZmFsc2UpO1xuXHR9LFxuXG5cdF9oYW5kbGVDb2xsZWN0aW9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKFVJQWN0aW9ucyk7XG5cdFx0VUlBY3Rpb25zLnNldFNlbGVjdGlvblBhbmVsKFwiY29sbGVjdGlvblwiKTtcblx0fSxcblxuXHRfaGFuZGxlRnJhbWVzQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFVJQWN0aW9ucy5zZXRTZWxlY3Rpb25QYW5lbChcImZyYW1lc1wiKTtcblx0fSxcblxuXHRfaGFuZGxlQWRkQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUFkZENsaWNrJyk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRVSUFjdGlvbnMub3BlbkFkZENvbnRlbnRNb2RhbCgpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ3VwZGF0aW5nIGZvb3RlciBuYXYnLCB0aGlzLnN0YXRlKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVSVN0b3JlLmdldFNlbGVjdGlvblBhbmVsU3RhdGUoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1cGRhdGVkIHN0YXRlJywgdGhpcy5zdGF0ZSk7XG4gICAgfSxcblxuXHQvKipcblx0ICogVE9ETzogZmlndXJlIG91dCBzdGF0ZSBtYW5hZ2VtZW50LiBTdG9yZT9cblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uID0gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgb2YtbmF2LWZpeGVkIG9mLW5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWNvbGxlY3Rpb24gYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDb2xsZWN0aW9uQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY29sbGVjdGlvblwiPmNvbGxlY3Rpb248L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGJ0bi1uYXYtZm9vdGVyLWZyYW1lc1wiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlRnJhbWVzQ2xpY2t9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZnJhbWVzXCI+ZnJhbWVzPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyLWFkZCBhY3RpdmVcIiBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUFkZENsaWNrfT4rPC9hPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblxuXHRcdHZhciBmcmFtZXMgPSAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYnRuLW5hdi1mb290ZXItY29sbGVjdGlvblwiIGhyZWY9XCIjXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ29sbGVjdGlvbkNsaWNrfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvbGxlY3Rpb25cIj5jb2xsZWN0aW9uPC9zcGFuPlxuXHRcdFx0XHRcdDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBidG4tbmF2LWZvb3Rlci1mcmFtZXMgYWN0aXZlXCIgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVGcmFtZXNDbGlja30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJmcmFtZXNcIj5mcmFtZXM8L3NwYW4+XG5cdFx0XHRcdFx0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdFx0dmFyIHBhbmVsID0gdGhpcy5zdGF0ZS5zZWxlY3Rpb25QYW5lbDtcblx0XHRjb25zb2xlLmxvZygnUEFORUw6ICcsIHRoaXMuc3RhdGUsIHBhbmVsKTtcblx0XHRyZXR1cm4gcGFuZWwgPT09ICdjb2xsZWN0aW9uJyA/IGNvbGxlY3Rpb24gOiBmcmFtZXM7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9vdGVyTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG52YXIgRnJhbWUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge31cblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0RnJhbWVBY3Rpb25zLmxvYWRGcmFtZXMoKTtcblx0XHRGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuXHRjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnMoKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5zdGF0ZS5mcmFtZSkge1xuXHRcdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwicm93IGZyYW1lcy1saXN0XCI+PC9kaXY+XG5cdFx0fVxuXHRcdHRoaXMud19oX3JhdGlvID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzID8gdGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy53X2hfcmF0aW8gOiAxO1xuXG5cdFx0dmFyIHVybCA9IHRoaXMuc3RhdGUuZnJhbWUgJiYgdGhpcy5zdGF0ZS5mcmFtZS5jdXJyZW50X2NvbnRlbnQgPyB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudC51cmwgOiAnJztcblx0XHR2YXIgZGl2U3R5bGUgPSB7XG5cdFx0XHRiYWNrZ3JvdW5kSW1hZ2U6ICd1cmwoJyArIHVybCArICcpJyxcblx0XHR9O1xuXG5cdFx0Y29uc29sZS5sb2codGhpcy53X2hfcmF0aW8pO1xuXG5cdFx0dmFyIHdoU3R5bGUgPSB7XG5cdFx0XHRwYWRkaW5nQm90dG9tOiAoMS90aGlzLndfaF9yYXRpbykgKiAxMDAgKyAnJSdcblx0XHR9O1xuXG5cdFx0dmFyIGFjdGl2ZSA9IHRoaXMuc3RhdGUuZnJhbWUuYWN0aXZlID8gJyonIDogJyc7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGZyYW1lcy1saXN0XCIgcmVmPVwiZnJhbWVDb250YWluZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteGwtMTIgZnJhbWUtb3V0ZXItY29udGFpbmVyXCIgcmVmPVwiZnJhbWVPdXRlckNvbnRhaW5lclwiPlxuXHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSBidG4teHMgYnRuLXNldHRpbmdzIGhpZGVcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjbXlNb2RhbFwiPlM8L2J1dHRvbj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZyYW1lLWlubmVyLWNvbnRhaW5lclwiIHJlZj1cImZyYW1lSW5uZXJDb250YWluZXJcIj5cblx0XHQgICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwiZnJhbWVcIiBzdHlsZT17ZGl2U3R5bGV9IHJlZj1cImZyYW1lXCIvPlxuXHRcdCAgICAgICAgICAgIDwvZGl2PlxuXHRcdCAgICAgICAgPC9kaXY+XG5cdCAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuICBcdFx0Y29uc29sZS5sb2coJ3NlbGVjdGVkRnJhbWU6Jywgc2VsZWN0ZWRGcmFtZSk7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0ZnJhbWU6IHNlbGVjdGVkRnJhbWVcbiAgXHRcdH0pO1xuICBcdH0sXG5cbiAgXHRfdXBkYXRlQ29udGFpbmVyRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgY29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcyksXG4gIFx0XHRcdGZyYW1lT3V0ZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVPdXRlckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lSW5uZXJDb250YWluZXIgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZnJhbWVJbm5lckNvbnRhaW5lciksXG4gIFx0XHRcdGZyYW1lID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lKSxcblx0XHRcdHcgPSBjb250YWluZXIub2Zmc2V0V2lkdGgsXG5cdFx0XHRoID0gY29udGFpbmVyLm9mZnNldEhlaWdodCxcblx0XHRcdHBhZGRpbmcgPSA1MCxcblx0XHRcdG1heFcgPSB3IC0gMipwYWRkaW5nLFxuXHRcdFx0bWF4SCA9IGggLSAyKnBhZGRpbmcsXG5cdFx0XHRmcmFtZVcsIGZyYW1lSDtcblxuXHRcdGlmICgodGhpcy53X2hfcmF0aW8gPiAxIHx8IG1heEggKiB0aGlzLndfaF9yYXRpbyA+IG1heFcpICYmIG1heFcgLyB0aGlzLndfaF9yYXRpbyA8IG1heEgpIHtcblx0XHRcdC8vIHdpZHRoID4gaGVpZ2h0IG9yIHVzaW5nIGZ1bGwgaGVpZ2h0IHdvdWxkIGV4dGVuZCBiZXlvbmQgbWF4V1xuXHRcdFx0ZnJhbWVXID0gbWF4Vztcblx0XHRcdGZyYW1lSCA9IChtYXhXIC8gdGhpcy53X2hfcmF0aW8pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB3aWR0aCA8IGhlaWdodFxuXHRcdFx0ZnJhbWVIID0gbWF4SDtcblx0XHRcdGZyYW1lVyA9IChtYXhIICogdGhpcy53X2hfcmF0aW8pO1xuXHRcdH1cblxuXHRcdGZyYW1lLnN0eWxlLndpZHRoID0gZnJhbWVXICsgJ3B4Jztcblx0XHRmcmFtZS5zdHlsZS5oZWlnaHQgPSBmcmFtZUggKyAncHgnO1xuXG5cdFx0ZnJhbWVPdXRlckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IG1heFcrJ3B4Jztcblx0XHRmcmFtZUlubmVyQ29udGFpbmVyLnN0eWxlLnRvcCA9ICgoaCAtIGZyYW1lSCkgLyAyKSArICdweCc7XG5cdFx0Ly8gZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBmcmFtZS5zdHlsZS5oZWlnaHQ7XG5cblxuXG5cdFx0Y29uc29sZS5sb2coJ2ZyYW1lT3V0ZXJDb250YWluZXI6JywgZnJhbWVPdXRlckNvbnRhaW5lcik7XG5cdFx0Y29uc29sZS5sb2coJ2NvbnRhaW5lcjonLCB3LCBoLCBtYXhXLCBtYXhIKTtcbiAgXHR9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpbmsgPSByZXF1aXJlKCcuL05hdkZyYW1lTGluaycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lczogW11cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGcmFtZUxpbmsoZnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZTogJywgZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBCcmFuZCBhbmQgdG9nZ2xlIGdldCBncm91cGVkIGZvciBiZXR0ZXIgbW9iaWxlIGRpc3BsYXkgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm5hdmJhci10b2dnbGUgY29sbGFwc2VkIHB1bGwtbGVmdFwiIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+VG9nZ2xlIG5hdmlnYXRpb248L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1tdXRlZCBoaWRkZW4teHNcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cImJzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIC8ubmF2YmFyLWNvbGxhcHNlICovfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKTtcblxudmFyIE5hdkZyYW1lTGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlRnJhbWVTZWxlY3Rpb246IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2VsZWN0KHRoaXMucHJvcHMuZnJhbWUpO1xuXHRcdGlmICh0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXIpIHtcblx0XHRcdHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcigpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmVDbGFzcyA9ICdub3QtY29ubmVjdGVkJyxcblx0XHRcdGFjdGl2ZVRleHQgPSAnbm90IGNvbm5lY3RlZCc7XG5cdFx0aWYgKHRoaXMucHJvcHMuZnJhbWUuYWN0aXZlKSB7XG5cdFx0XHRhY3RpdmVDbGFzcyA9IGFjdGl2ZVRleHQgPSAnY29ubmVjdGVkJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc1NlbGVjdGVkKHNlbGVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPyAnaWNvbi1jaGVjaycgOiAnc3BhY2UnO1xuICAgICAgICB9XG5cblx0XHR2YXIgY2xhc3NlcyA9ICdwdWxsLXJpZ2h0IHN0YXR1cyAnICsgYWN0aXZlQ2xhc3M7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBvbkNsaWNrPXt0aGlzLmhhbmRsZUZyYW1lU2VsZWN0aW9ufT5cblx0XHRcdFx0PGEgaHJlZj1cIiNcIj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2lzU2VsZWN0ZWQodGhpcy5wcm9wcy5mcmFtZS5zZWxlY3RlZCl9IC8+IHt0aGlzLnByb3BzLmZyYW1lLm5hbWV9XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPXtjbGFzc2VzfT57YWN0aXZlVGV4dH08L3NwYW4+XG5cdFx0XHRcdDwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaW5rOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG52YXIgTmF2RnJhbWVMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIFx0cmV0dXJuIHtcbiAgICBcdFx0ZXh0cmFDbGFzc2VzOiAnJyxcbiAgICBcdFx0aW5jbHVkZUxvZ291dDogdHJ1ZSxcbiAgICBcdFx0bGlua0NsaWNrSGFuZGxlcjogZnVuY3Rpb24oKSB7XG4gICAgXHRcdFx0Y29uc29sZS5sb2coJ2xpbmsgY2xpY2tlZCcpO1xuICAgIFx0XHR9XG4gICAgXHR9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lOiAnLCBmcmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IC8+XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5leHRyYUNsYXNzZXMgKyAnIG5hdi1mcmFtZS1saXN0IGRyYXdlci1jb250ZW50JztcblxuXHRcdHZhciBsb2dvdXQgPSAnJztcblx0XHRpZiAodGhpcy5wcm9wcy5pbmNsdWRlTG9nb3V0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaW5jbHVkZUxvZ291dCcpO1xuXHRcdFx0bG9nb3V0ID0gKFxuXHRcdFx0XHQ8bGk+XG5cdFx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSBjbGFzc05hbWU9XCJidG4tbG9nb3V0XCIgaHJlZj1cIi9sb2dvdXRcIj5sb2cgb3V0PC9hPlxuXHRcdFx0XHQ8L2xpPlxuXHRcdFx0KTtcdFxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPXtjbGFzc2VzfSByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgIHtsb2dvdXR9XG4gICAgICAgICAgICA8L3VsPlxuXHRcdCk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TWVudUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL01lbnVBY3Rpb25zJyksXG5cdE1lbnVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9NZW51U3RvcmUnKSxcblx0U2V0dGluZ3NGb3JtID0gcmVxdWlyZSgnLi9TZXR0aW5nc0Zvcm0nKTtcblxudmFyIFNldHRpbmdzRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItcmlnaHQnXG5cdFx0fVxuXHR9LFxuXHRcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNZW51U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYmFzZUNsYXNzID0gJ3Zpc2libGUteHMgbWVudS1kcmF3ZXInO1xuXHRcdHZhciBvcGVuQ2xhc3MgPSB0aGlzLnN0YXRlLm9wZW4gPyAnbWVudS1kcmF3ZXItb3BlbicgOiAnbWVudS1kcmF3ZXItY2xvc2VkJztcblx0XHR2YXIgc2lkZUNsYXNzID0gdGhpcy5wcm9wcy5zaWRlQ2xhc3M7XG5cdFx0dmFyIGZ1bGxDbGFzcyA9IFtiYXNlQ2xhc3MsIG9wZW5DbGFzcywgc2lkZUNsYXNzXS5qb2luKCcgJyk7XG5cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17ZnVsbENsYXNzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtZW51LWRyYXdlci1pbm5lclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi1kcmF3ZXJcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidXNlcm5hbWUgdGV4dC1jZW50ZXJcIj57T0ZfVVNFUk5BTUV9PC9kaXY+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gPlxuXHRcdCAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1tZW51LXJpZ2h0XCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkcmF3ZXItY29udGVudFwiPlxuXHRcdFx0XHRcdFx0PFNldHRpbmdzRm9ybSAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cblx0X2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0TWVudUFjdGlvbnMudG9nZ2xlU2V0dGluZ3MoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKE1lbnVTdG9yZS5nZXRTZXR0aW5nc1N0YXRlKCkpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NEcmF3ZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKVxuXHRNZW51QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVudUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBTZXR0aW5nc0RyYXdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZnJhbWU6IHtcblx0XHRcdFx0c2V0dGluZ3M6IHtcblx0XHRcdFx0XHRvbl90aW1lOiAnMDY6MDA6MDAnLFxuXHRcdFx0XHRcdG9mZl90aW1lOiAnMTI6MDA6MDAnLFxuXHRcdFx0XHRcdHJvdGF0aW9uOiAxODAsXG5cdFx0XHRcdFx0dmlzaWJpbGl0eTogJ3B1YmxpYydcblx0XHRcdFx0fSxcblx0XHRcdFx0dXNlcjogW1xuXHRcdFx0XHRcdCdqb253b2hsJyxcblx0XHRcdFx0XHQnaXNoYmFjaycsXG5cdFx0XHRcdFx0J2FuZHknXG5cdFx0XHRcdF1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNpZGVDbGFzczogJ21lbnUtZHJhd2VyLXJpZ2h0J1xuXHRcdH1cblx0fSxcblx0XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNldHRpbmdzLWZpZWxkc1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VXNlcnM8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy04XCI+XG5cdFx0XHRcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwidXNlcnMtaW5wdXRcIiB0eXBlPVwidGV4dFwiIHJlZj1cIm5ld1VzZXJcIiAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTJcIj5cblx0XHRcdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBwdWxsLXJpZ2h0XCI+QWRkPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdHt0aGlzLnN0YXRlLmZyYW1lLnVzZXJzfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9uXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mub25fdGltZX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNTowMDowMFwiPjVhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDY6MDA6MDBcIj42YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA3OjAwOjAwXCI+N2FtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwODowMDowMFwiPjhhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDk6MDA6MDBcIj45YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEwOjAwOjAwXCI+MTBhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTE6MDA6MDBcIj4xMWFtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMjowMDowMFwiPjEycG08L29wdGlvbj5cblx0XHRcdFx0XHRcdDwvc2VsZWN0PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9mZlwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLm9mZl90aW1lfT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA1OjAwOjAwXCI+NXBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNjowMDowMFwiPjZwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDc6MDA6MDBcIj43cG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA4OjAwOjAwXCI+OHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwOTowMDowMFwiPjlwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTA6MDA6MDBcIj4xMHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMTowMDowMFwiPjExcG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEyOjAwOjAwXCI+MTJwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+Um90YXRlPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTBcIj5cblx0XHRcdFx0XHRcdDxzZWxlY3QgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInJvdGF0ZVwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9ufT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjBcIj5ub25lPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VmlzaWJpbGl0eTwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEwXCI+XG5cdFx0XHRcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJ0dXJuT2ZmXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJpbGl0eX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCJwdWJsaWNcIj5wdWJsaWM8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cInByaXZhdGVcIj5wcml2YXRlPC9vcHRpb24+XG5cdFx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzRHJhd2VyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdFVJU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvVUlTdG9yZScpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgU2V0dGluZ3NNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3NPcGVuOiBmYWxzZSxcblx0XHRcdGZyYW1lOiB7XG5cdFx0XHRcdG5hbWU6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJycsXG5cdFx0XHRcdHNldHRpbmdzOiB7XG5cdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRyb3RhdGlvbjogOTBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVUlTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vblVJQ2hhbmdlKTtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkZyYW1lQ2hhbmdlKTtcbiAgICAgICAgJCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coJ2hpZGRlbi5icy5tb2RhbCcpO1xuICAgICAgICBcdFVJQWN0aW9ucy5zZXR0aW5nc01vZGFsQ2xvc2VkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFZlcnRpY2FsbHkgY2VudGVyIG1vZGFsc1xuXHRcdC8qIGNlbnRlciBtb2RhbCAqL1xuXHRcdGZ1bmN0aW9uIGNlbnRlck1vZGFscygpe1xuXHRcdCAgICAkKCcubW9kYWwnKS5lYWNoKGZ1bmN0aW9uKGkpe1xuXHRcdCAgICAgICAgdmFyICRjbG9uZSA9ICQodGhpcykuY2xvbmUoKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5hcHBlbmRUbygnYm9keScpO1xuXHRcdCAgICAgICAgdmFyIHRvcCA9IE1hdGgucm91bmQoKCRjbG9uZS5oZWlnaHQoKSAtICRjbG9uZS5maW5kKCcubW9kYWwtY29udGVudCcpLmhlaWdodCgpKSAvIDIpO1xuXHRcdCAgICAgICAgdG9wID0gdG9wID4gMCA/IHRvcCA6IDA7XG5cdFx0ICAgICAgICAkY2xvbmUucmVtb3ZlKCk7XG5cdFx0ICAgICAgICAkKHRoaXMpLmZpbmQoJy5tb2RhbC1jb250ZW50JykuY3NzKFwibWFyZ2luLXRvcFwiLCB0b3ApO1xuXHRcdCAgICB9KTtcblx0XHR9XG5cdFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5vbignc2hvdy5icy5tb2RhbCcsIGNlbnRlck1vZGFscyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBVSVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uVUlDaGFuZ2UpO1xuICAgICAgICBGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uRnJhbWVDaGFuZ2UpO1xuICAgICAgICAkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm9mZignaGlkZGVuLmJzLm1vZGFsJyk7XG4gICAgfSxcblxuXHRfaGFuZGxlTmFtZUNoYW5nZTogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB2YWwgPSBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0c3RhdGUuZnJhbWUubmFtZSA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlRGVzY3JpcHRpb25DaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgdmFsID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLmRlc2NyaXB0aW9uID0gdmFsO1xuXHRcdHRoaXMuc2V0U3RhdGUoc3RhdGUpO1xuXHR9LFxuXG5cdF9oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC5jaGVja2VkLFxuXHRcdFx0c3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHN0YXRlLmZyYW1lLnNldHRpbmdzLnZpc2libGUgPSB2YWw7XG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0X2hhbmRsZVJvdGF0aW9uQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHZhbCA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHN0YXRlID0gdGhpcy5zdGF0ZTtcblx0XHRzdGF0ZS5mcmFtZS5zZXR0aW5ncy5yb3RhdGlvbiA9IHZhbDtcblx0XHR0aGlzLnNldFN0YXRlKHN0YXRlKTtcblx0fSxcblxuXHRfaGFuZGxlU2F2ZTogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy5zYXZlRnJhbWUodGhpcy5zdGF0ZS5mcmFtZSk7XG5cdH0sXG5cblx0X29uVUlDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKFVJU3RvcmUuZ2V0U2V0dGluZ3NNb2RhbFN0YXRlKCksIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmICh0aGlzLnN0YXRlLnNldHRpbmdzT3Blbikge1xuXHQgICAgICAgIFx0JCh0aGlzLnJlZnMubW9kYWwuZ2V0RE9NTm9kZSgpKS5tb2RhbCgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHQkKHRoaXMucmVmcy5tb2RhbC5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XG5cdCAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uRnJhbWVDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgXHRmcmFtZTogRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKClcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdDQ0NDQ0NDQ0NDIC0tLS0+ICcsIHRoaXMuc3RhdGUuZnJhbWUpO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwgZmFkZSBtb2RhbC1zZXR0aW5nc1wiIHJlZj1cIm1vZGFsXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZGlhbG9nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiIGFyaWEtbGFiZWw9XCJDbG9zZVwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdCAgICBcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHQgICAgXHQ8aDQgY2xhc3NOYW1lPVwibW9kYWwtdGl0bGVcIj5TZXR0aW5nczwvaDQ+XG5cdFx0XHRcdFx0ICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5XCI+XG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkXCI+XG5cdFx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+TmFtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgcmVmPVwibmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUubmFtZX0gb25DaGFuZ2U9e3RoaXMuX2hhbmRsZU5hbWVDaGFuZ2V9IC8+XG5cdFx0XHRcdFx0XHQgICAgXHRcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cdFx0XHRcdFx0ICAgIFx0PC9kaXY+XG5cblx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctZm9ybS1maWVsZFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+RGVzY3JpcHRpb24gKG9wdGlvbmFsKTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0tbGFiZWwtc3VidGV4dFwiPlVzZWZ1bCBpZiB5b3VyIGZyYW1lIGZvbGxvd3MgYSB0aGVtZTwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXRcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdCAgICBcdFx0XHRcdHJlZj1cImRlc2NyaXB0aW9uXCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHQgICAgXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLmRlc2NyaXB0aW9ufVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZURlc2NyaXB0aW9uQ2hhbmdlfVxuXHRcdFx0XHRcdCAgICBcdFx0XHRcdFx0cGxhY2Vob2xkZXI9XCJlLmcuIGphcGFuZXNlIGFydCwgOTBzIHBvc3RlcnNcIiAvPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXG5cdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LWZvcm0tZmllbGRcIj5cblx0XHRcdFx0ICAgIFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTlcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsXCI+VmlzaWJsZSB0byBvdGhlciBwZW9wbGU8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJmb3JtLWxhYmVsLXN1YnRleHRcIj5Zb3VyIGZyYW1lIHdpbGwgYXBwZWFyIG9uIEZyYW1lcyBhbmQgb3RoZXJzIGNhbiBtaXJyb3IgaXQ8L2Rpdj5cblx0XHRcdFx0XHRcdCAgICBcdDwvZGl2PlxuXHRcdFx0XHRcdFx0ICAgIFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtM1wiPlxuXHRcdFx0XHRcdFx0ICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZvcm0taW5wdXQtY2hlY2tib3hcIj5cblx0XHRcdFx0XHRcdCAgICBcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInZpc2liaWxpdHlcIiB0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0Y2hlY2tlZD17dGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy52aXNpYmxlfVxuXHRcdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVZpc2liaWxpdHlDaGFuZ2V9Lz5cblx0XHRcdFx0XHRcdCAgICBcdFx0PC9kaXY+XG5cdFx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblxuXHRcdFx0XHQgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHJvdy1mb3JtLWZpZWxkIHJvdy1mb3JtLWZpZWxkLXJvdGF0aW9uXCI+XG5cdFx0XHRcdCAgICBcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy02IGZvcm0tbGFiZWxcIj5Sb3RhdGlvbjwvZGl2PlxuXHRcdFx0XHRcdCAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNiBmb3JtLWlucHV0LXNlbGVjdFwiPlxuXHRcdFx0XHRcdCAgICBcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJyb3RhdGlvblwiXG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mucm90YXRpb259XG5cdFx0XHRcdFx0ICAgIFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuX2hhbmRsZVJvdGF0aW9uQ2hhbmdlfSA+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwXCI+MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0ICAgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQgICAgXHQ8L2Rpdj5cblx0XHRcdFx0ICBcdFx0PC9kaXY+XG5cdFx0XHRcdCAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyXCI+XG5cdFx0XHRcdCAgICBcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVTYXZlfSB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hZGQtY29udGVudFwiPlxuXHRcdFx0XHQgICAgXHRcdFx0U2F2ZVxuXHRcdFx0XHQgICAgXHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQgIFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzTW9kYWw7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpc3QgPSByZXF1aXJlKCcuL05hdkZyYW1lTGlzdCcpLFxuICAgIFVJQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVUlBY3Rpb25zJyksXG4gICAgRnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cblxudmFyIFNpbXBsZU5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmcmFtZU5hbWUgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUubmFtZTtcblxuICAgICAgICBmdW5jdGlvbiBjb25uZWN0ZWQoYWN0aXZlKSB7XG4gICAgICAgICAgICB2YXIgY29ubmVjdGVkID0gJyc7XG4gICAgICAgICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGVkID0gJyZidWxsOyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtfX2h0bWw6IGNvbm5lY3RlZH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvZi1uYXYtZml4ZWQgb2YtbmF2LXRvcFwiPlxuICAgICAgICAgICAgICAgIDxoNiBjbGFzc05hbWU9XCJmcmFtZS1uYW1lIHRleHQtY2VudGVyXCI+PHNwYW4gY2xhc3NOYW1lPVwiY29ubmVjdGVkXCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e2Nvbm5lY3RlZCh0aGlzLnN0YXRlLnNlbGVjdGVkRnJhbWUuYWN0aXZlKX0gLz57ZnJhbWVOYW1lfTwvaDY+XG5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tbWVudSB2aXNpYmxlLXhzIHB1bGwtbGVmdFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5NZW51Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWhhbWJ1cmdlclwiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgYnRuLXNldHRpbmcgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3BlblNldHRpbmdzfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jb2dcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14cyBwdWxsLWxlZnRcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuXG5cbiAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXYgbmF2YmFyLXJpZ2h0IGhpZGRlbi14c1wiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwiZHJvcGRvd25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHJvbGU9XCJidXR0b25cIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj5GcmFtZXMgPHNwYW4gY2xhc3NOYW1lPVwiY2FyZXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxOYXZGcmFtZUxpc3QgZXh0cmFDbGFzc2VzPVwiZHJvcGRvd24tbWVudVwiIGluY2x1ZGVMb2dvdXQ9e2ZhbHNlfS8+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjc2V0dGluZ3NcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVPcGVuU2V0dGluZ3N9PlNldHRpbmdzPC9hPlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiL2xvZ291dFwiPkxvZyBPdXQ8L2E+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlT3Blbk1lbnVDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5NZW51Q2xpY2snKTtcbiAgICAgICAgVUlBY3Rpb25zLnRvZ2dsZU1lbnUodHJ1ZSk7XG4gICAgfSxcblxuICAgIF9oYW5kbGVPcGVuU2V0dGluZ3M6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ19oYW5kbGVPcGVuU2V0dGluZ3MnKTtcbiAgICAgICAgVUlBY3Rpb25zLm9wZW5TZXR0aW5nc01vZGFsKCk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcrKysrKysgZ2V0IHNlbGVjdGVkIGZyYW1lJywgRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWU6IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKTtcblxudmFyIFRyYW5zZmVyQnV0dG9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyB0cmFuc2Zlci1idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIiByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPVwiLi4uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiIG9uQ2xpY2s9e3RoaXMuc2VuZENsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tdXAgaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLXNlbmRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+ICovfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cblx0c2VuZENsaWNrZWQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMudXBkYXRlQ29udGVudChDb250ZW50U3RvcmUuZ2V0U2VsZWN0ZWRDb250ZW50KCkpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZmVyQnV0dG9uczsiLCJ2YXIgY29uZiA9IHtcblx0ZG9tYWluOiAnbG9jYWxob3N0Jyxcblx0cG9ydDogJzg4ODgnLFxuXHRuYXZiYXJIOiA1MFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmY7IiwidmFyIGtleW1pcnJvciA9IHJlcXVpcmUoJ2tleW1pcnJvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleW1pcnJvcih7XG5cblx0Ly8gZnJhbWUgYWN0aW9uIHR5cGVzXG5cdEZSQU1FX0xPQUQ6IG51bGwsXG5cdEZSQU1FX0xPQURfRE9ORTogbnVsbCxcblx0RlJBTUVfTE9BRF9GQUlMOiBudWxsLFxuXHRGUkFNRV9TRUxFQ1Q6IG51bGwsXG5cdEZSQU1FX1VQREFURV9DT05URU5UOiBudWxsLFxuXHRGUkFNRV9TRVRUSU5HU19DT05URU5UOiBudWxsLFxuXHRGUkFNRV9DT05URU5UX1VQREFURUQ6IG51bGwsXG5cdEZSQU1FX0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX0RJU0NPTk5FQ1Q6IG51bGwsXG5cdEZSQU1FX1NBVkU6IG51bGwsXG5cdEZSQU1FX1NBVkVfRE9ORTogbnVsbCxcblx0RlJBTUVfU0FWRV9GQUlMOiBudWxsLFxuXG5cdC8vIGNvbnRlbnQgYWN0aW9uIHR5cGVzXG5cdENPTlRFTlRfTE9BRDogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1NFTkQ6IG51bGwsXG5cdENPTlRFTlRfU0xJREVfQ0hBTkdFRDogbnVsbCxcblx0Q09OVEVOVF9BREQ6IG51bGwsXG5cdENPTlRFTlRfQUREX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfQUREX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9ET05FOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9GQUlMOiBudWxsLFxuXG5cdC8vIFVJIGFjdGlvbiB0eXBlc1xuXHRVSV9NRU5VX1RPR0dMRTogbnVsbCxcblx0VUlfU0VUX1NFTEVDVElPTl9QQU5FTDogbnVsbCxcblx0VUlfT1BFTl9BRERfQ09OVEVOVDogbnVsbCxcblx0VUlfQ0xPU0VfQUREX0NPTlRFTlQ6IG51bGwsXG5cdFVJX09QRU5fU0VUVElOR1M6IG51bGwsXG5cdFVJX0NMT1NFX1NFVFRJTkdTOiBudWxsLFxuXG5cdC8vIGVtaXR0ZWQgYnkgc3RvcmVzXG5cdENIQU5HRV9FVkVOVDogbnVsbFxufSk7IiwidmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCdmbHV4JykuRGlzcGF0Y2hlcjtcblxudmFyIEFwcERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuXG4vKipcbiogQSBicmlkZ2UgZnVuY3Rpb24gYmV0d2VlbiB0aGUgdmlld3MgYW5kIHRoZSBkaXNwYXRjaGVyLCBtYXJraW5nIHRoZSBhY3Rpb25cbiogYXMgYSB2aWV3IGFjdGlvbi4gIEFub3RoZXIgdmFyaWFudCBoZXJlIGNvdWxkIGJlIGhhbmRsZVNlcnZlckFjdGlvbi5cbiogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb24gVGhlIGRhdGEgY29taW5nIGZyb20gdGhlIHZpZXcuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uID0gZnVuY3Rpb24oYWN0aW9uKSB7XG5cdGFjdGlvbi5zb3VyY2UgPSAnVklFV19BQ1RJT04nO1xuXHR0aGlzLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cblxuLyoqXG4qIEEgYnJpZGdlIGZ1bmN0aW9uIGJldHdlZW4gdGhlIHNlcnZlciBhbmQgdGhlIGRpc3BhdGNoZXIsIG1hcmtpbmcgdGhlIGFjdGlvblxuKiBhcyBhIHNlcnZlciBhY3Rpb24uXG4qIEBwYXJhbSAge29iamVjdH0gYWN0aW9uIFRoZSBkYXRhIGNvbWluZyBmcm9tIHRoZSBzZXJ2ZXIuXG4qL1xuQXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcblx0YWN0aW9uLnNvdXJjZSA9ICdTRVJWRVJfQUNUSU9OJztcblx0dGhpcy5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcERpc3BhdGNoZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcC5qcycpLFxuICAgIGJyb3dzZXJfc3RhdGUgPSByZXF1aXJlKCcuL2Jyb3dzZXJfc3RhdGVfbWFuYWdlcicpLFxuICAgIEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG4vLyBpbml0IGphdmFzY3JpcHQgbWVkaWEgcXVlcnktbGlrZSBzdGF0ZSBkZXRlY3Rpb25cbmJyb3dzZXJfc3RhdGUuaW5pdCgpO1xuXG4vLyBUdXJuIG9uIHRvdWNoIGV2ZW50cyBmb3IgUmVhY3QuXG4vLyBSZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbi8vIEZhc3RDbGljayByZW1vdmVzIHRoZSAzMDBzIGRlbGF5IG9uIHN0dXBpZCBpT1MgZGV2aWNlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coJ2F0dGFjaGluZyBGYXN0Q2xpY2snKTtcblx0RmFzdENsaWNrLmF0dGFjaChkb2N1bWVudC5ib2R5KTtcbn0pO1xuXG5SZWFjdC5yZW5kZXIoXG5cdDxBcHAgLz4sXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdPcGVuRnJhbWUnKVxuKSIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9jb250ZW50ID0gW10sXG5cdF9zZWxlY3RlZF9jb250ZW50X2lkID0gbnVsbDtcblxuXG52YXIgQ29udGVudFN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gY29udGVudDtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IF9jb250ZW50WzBdLl9pZDtcblx0XHRjb25zb2xlLmxvZygnaW5pdCcsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0fSxcblxuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQucHVzaChjb250ZW50KTtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGNvbnRlbnQuX2lkO1xuXHR9LFxuXG5cdHJlbW92ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IF8ucmVtb3ZlKF9jb250ZW50LCB7X2lkOiBjb250ZW50Ll9pZH0pO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGdldENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY29udGVudDtcblx0fSxcblxuXHRnZXRTZWxlY3RlZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKCdnZXRTZWxlY3RlZENvbnRlbnQ6JywgX2NvbnRlbnQsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0XHRyZXR1cm4gXy5maW5kKF9jb250ZW50LCB7J19pZCc6IF9zZWxlY3RlZF9jb250ZW50X2lkfSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcbiAgXHRcbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgbG9hZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuaW5pdChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRDpcblx0XHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjaGFuZ2VkLi4uJyk7XG5cdFx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGFjdGlvbi5jb250ZW50X2lkO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREOlxuXHRcdFx0Y29uc29sZS5sb2coJ2FkZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBhZGRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmFkZENvbnRlbnQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGJlIGFkZGVkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0XG5cdFx0XHQvLyBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19VUERBVEVfVEVYVDpcblx0ICAgIC8vICAgdGV4dCA9IGFjdGlvbi50ZXh0LnRyaW0oKTtcblx0ICAgIC8vICAgaWYgKHRleHQgIT09ICcnKSB7XG5cdCAgICAvLyAgICAgdXBkYXRlKGFjdGlvbi5pZCwge3RleHQ6IHRleHR9KTtcblx0ICAgIC8vICAgICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICB9XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWTpcblx0ICAgIC8vICAgZGVzdHJveShhY3Rpb24uaWQpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50U3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2ZyYW1lcyA9IHt9O1xuXG52YXIgYWRkRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgc2VsZWN0KSB7XG5cdF9mcmFtZXNbZnJhbWUuX2lkXSA9IGZyYW1lO1xuXHRpZiAoc2VsZWN0ICE9PSBmYWxzZSkgc2VsZWN0RnJhbWUoZnJhbWUpO1xufVxuXG52YXIgcmVtb3ZlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSl7XG5cdGNvbnNvbGUubG9nKCdyZW1vdmVGcmFtZScsIGZyYW1lKTtcblx0dmFyIGlkID0gZnJhbWUuX2lkO1xuXHRpZiAoaWQgaW4gX2ZyYW1lcykgZGVsZXRlIF9mcmFtZXNbaWRdO1xuXHRjb25zb2xlLmxvZyhfZnJhbWVzKTtcbn07XG5cbnZhciBzZWxlY3RGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdGNvbnNvbGUubG9nKCdzZWxlY3RGcmFtZTogJywgZnJhbWUpO1xuXG5cdC8vIHVuc2VsZWN0IGN1cnJlbnRseSBzZWxlY3RlZFxuXHR2YXIgc2VsZWN0ZWRGcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRpZiAoc2VsZWN0ZWRGcmFtZSkge1xuXHRcdHNlbGVjdGVkRnJhbWUuc2VsZWN0ZWQgPSBmYWxzZTtcblx0fVxuXG5cdC8vIG5vdyBzZXQgdGhlIG5ldyBzZWxlY3RlZCBmcmFtZVxuXHR2YXIgX3NlbGVjdGVkRnJhbWUgPSBfLmZpbmQoX2ZyYW1lcywge19pZDogZnJhbWUuX2lkfSk7XG5cdF9zZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gdHJ1ZTtcbn1cblxudmFyIEZyYW1lU3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHRpbml0OiBmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRfLmVhY2goZnJhbWVzLCBhZGRGcmFtZSk7XG5cblx0XHQvLyBzZWUgaWYgYW55IGZyYW1lIGlzIG1hcmtlZCBhcyBzZWxlY3RlZCBmcm9tIGRiLFxuXHRcdC8vIG90aGVyd2lzZSBzZWxlY3QgdGhlIGZpcnN0IGZyYW1lLlxuXHRcdGlmICghXy5maW5kKF9mcmFtZXMsIHtzZWxlY3RlZDogdHJ1ZX0pKSB7XG5cdFx0XHRfLnNhbXBsZShfZnJhbWVzKS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0RnJhbWU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIF9mcmFtZXNbaWRdO1xuXHR9LFxuXG5cdGdldEFsbEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2dldEFsbEZyYW1lczogJywgX2ZyYW1lcyk7XG5cdFx0cmV0dXJuIF8ubWFwKF9mcmFtZXMsIGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gZnJhbWU7XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KTtcblx0fSxcblxuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogX2ZyYW1lcyxcblx0XHRcdHNlbGVjdGVkRnJhbWU6IHRoaXMuZ2V0U2VsZWN0ZWRGcmFtZSgpXG5cdFx0fTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0Y29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0Y29uc29sZS5sb2coJ2Nvbm5lY3RGcmFtZTogJywgZnJhbWUpO1xuXHRcdGFkZEZyYW1lKGZyYW1lKTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgZGlzY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0ZGlzY29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0YWRkRnJhbWUoZnJhbWUsIGZhbHNlKTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuXG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBsb2FkZWQ6ICcsIGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5pbml0KGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5jb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuZGlzY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVDpcbiAgICBcdFx0c2VsZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0RnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkuY29udGVudCA9IGFjdGlvbi5jb250ZW50O1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSB1cGRhdGVkIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHRhZGRGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRTpcblx0XHRcdC8vIGFkZGluZyB0aGUgc2F2ZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdGFkZEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TQVZFX0RPTkU6XG5cdFx0XHQvLyBhZGRpbmcgdGhlIGZyYW1lIHNpbmNlIGl0IHdpbGwgcmVwbGFjZSBjdXJyZW50IGluc3RhbmNlXG5cdFx0XHQvLyBub29wIChvcHRpbWlzdGljIHVpIHVwZGF0ZSBhbHJlYWR5IGhhcHBlbmVkIG9uIEZSQU1FX1NBVkUpXG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0FWRV9GQUlMOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmYWlsZWQgZnJhbWUgc2luY2UgaXQgd2lsbCByZXBsYWNlIGN1cnJlbnQgaW5zdGFuY2Vcblx0XHRcdC8vIFRPRE86IGhhbmRsZSB0aGlzIGJ5IHJldmVydGluZyAoaW1tdXRhYmxlLmpzIHdvdWxkIGhlbHApXG5cdFx0XHRjb25zb2xlLmxvZygnZmFpbGVkIHRvIHNhdmUgZnJhbWUnLCBhY3Rpb24uZnJhbWUpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lU3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX21lbnVPcGVuID0gZmFsc2UsXG5cdF9zZXR0aW5nc09wZW4gPSBmYWxzZTtcblxudmFyIF90b2dnbGVNZW51ID0gZnVuY3Rpb24oKSB7XG5cdF9tZW51T3BlbiA9ICFfbWVudU9wZW47XG59XG5cbnZhciBfdG9nZ2xlU2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcblx0X3NldHRpbmdzT3BlbiA9ICFfc2V0dGluZ3NPcGVuO1xufVxuXG5cbnZhciBNZW51U3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHRnZXRNZW51U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBfbWVudU9wZW5cblx0XHR9O1xuXHR9LFxuXG5cdGdldFNldHRpbmdzU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBfc2V0dGluZ3NPcGVuXG5cdFx0fTtcblx0fSxcblxuXHRnZXRGb290ZXJOYXZTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblxuXHRcdH07XG5cdH0sXG5cblx0ZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG5cdH0sXG5cdFxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuICBcdFxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLk1FTlVfVE9HR0xFOlxuICAgIFx0XHRfdG9nZ2xlTWVudSgpO1xuXHRcdFx0TWVudVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXHRcdFxuXHRcdGNhc2UgT0ZDb25zdGFudHMuU0VUVElOR1NfVE9HR0xFOlxuICAgIFx0XHRfdG9nZ2xlU2V0dGluZ3MoKTtcblx0XHRcdE1lbnVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudVN0b3JlOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuICAgIE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG4gICAgYXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX21lbnVPcGVuID0gZmFsc2UsXG4gICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlLFxuICAgIF9hZGRPcGVuID0gZmFsc2UsXG4gICAgX3NldHRpbmdzT3BlbiA9IGZhbHNlLFxuICAgIF9zZWxlY3Rpb25QYW5lbCA9IFwiY29sbGVjdGlvblwiO1xuXG52YXIgX3RvZ2dsZU1lbnUgPSBmdW5jdGlvbihvcGVuKSB7XG4gICAgX21lbnVPcGVuID0gISFvcGVuO1xufVxuXG5cbnZhciBVSVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cbiAgICBnZXRNZW51U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3BlbjogX21lbnVPcGVuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFNldHRpbmdzU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3BlbjogX3NldHRpbmdzT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZWxlY3Rpb25QYW5lbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNlbGVjdGlvblBhbmVsOiBfc2VsZWN0aW9uUGFuZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0QWRkTW9kYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhZGRPcGVuOiBfYWRkT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRTZXR0aW5nc01vZGFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnPT09PT09PT0nLCBfc2V0dGluZ3NPcGVuKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNldHRpbmdzT3BlbjogX3NldHRpbmdzT3BlblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG4gICAgfSxcblxuICAgIGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgICAgIHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gICAgfSxcblxuICAgIHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gICAgfVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICAgIHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEU6XG4gICAgICAgICAgICBfdG9nZ2xlTWVudShhY3Rpb24ub3Blbik7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfTUVOVV9UT0dHTEU6XG4gICAgICAgICAgICBfdG9nZ2xlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIFVJU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9TRVRfU0VMRUNUSU9OX1BBTkVMOlxuICAgICAgICAgICAgX3NlbGVjdGlvblBhbmVsID0gYWN0aW9uLnBhbmVsO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLlVJX09QRU5fQUREX0NPTlRFTlQ6XG4gICAgICAgICAgICBfYWRkT3BlbiA9IHRydWU7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfQ0xPU0VfQUREX0NPTlRFTlQ6XG4gICAgICAgICAgICAvLyBtb2RhbCBhbHJlYWR5IGNsb3NpbmcsIG5vIGNoYW5nZSBlbW1pc3Npb24gbmVlZGVkXG4gICAgICAgICAgICBfYWRkT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBPRkNvbnN0YW50cy5VSV9PUEVOX1NFVFRJTkdTOlxuICAgICAgICAgICAgX3NldHRpbmdzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgT0ZDb25zdGFudHMuVUlfQ0xPU0VfU0VUVElOR1M6XG4gICAgICAgICAgICAvLyBtb2RhbCBhbHJlYWR5IGNsb3NpbmcsIG5vIGNoYW5nZSBlbW1pc3Npb24gbmVlZGVkXG4gICAgICAgICAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkU6XG4gICAgICAgICAgICBfYWRkT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgVUlTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NBVkU6XG4gICAgICAgICAgICBfc2V0dGluZ3NPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBVSVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBVSVN0b3JlOyJdfQ==
