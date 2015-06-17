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
				AppDispatcher.handleViewAction({
					actionType: OFConstants.CONTENT_LOAD_DONE,
					content: content
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.handleViewAction({
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
            AppDispatcher.handleViewAction({
				actionType: OFConstants.CONTENT_ADD_DONE,
				content: resp
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.handleViewAction({
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null)

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

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),

	Nav = require('./Nav.js'),
	SimpleNav = require('./SimpleNav.js'),
	Frame = require('./Frame.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),
	FooterNav = require('./FooterNav.js'),
	Drawer = require('./Drawer.js'),
	SettingsDrawer = require('./SettingsDrawer.js'),

	AppDispatcher = require('../dispatcher/AppDispatcher'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore'),

	Socker = require('../api/Socker'),

	conf = require('../config');

/**
 * The App is the root component responsible for:
 * - setting up structure of child components
 *
 * Individual components register for Store state change events
 */
var App = React.createClass({displayName: "App",
	
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
		console.log('componentDidMount', React.findDOMNode(this.refs.navFooter).offsetHeight);

	},

	componentWillUnmount: function() {
		FrameStore.removeChangeListener(this._onChange);
	},

  	render: function(){
	    return (
			React.createElement("div", {className: "container app"}, 
				React.createElement(SimpleNav, null), 
				React.createElement(Frame, null), 
				React.createElement(TransferButtons, null), 
				React.createElement(AddContentForm, null), 
				React.createElement(ContentList, null), 
				React.createElement(FooterNav, {ref: "navFooter"}), 
				React.createElement(Drawer, null), 
				React.createElement(SettingsDrawer, {sideClass: "menu-drawer-right"})
			)
	    )
  	}
});

module.exports = App;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./AddContentForm.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./ContentList.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./Drawer.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Drawer.js","./FooterNav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./Nav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./SettingsDrawer.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsDrawer.js","./SimpleNav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js","./TransferButtons.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null),
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
		// this._initSlider();
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Drawer.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	NavFrameList = require('./NavFrameList'),
	MenuActions = require('../actions/MenuActions'),
	MenuStore = require('../stores/MenuStore');

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
		                    React.createElement("span", {className: "icon-close"})
		                )
					), 
					React.createElement(NavFrameList, {linkClickHandler: this._handleCloseMenuClick})
				)
			)
		);
	},

	_handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		MenuActions.toggleMenu();
	},

	_onChange: function() {
        this.setState(MenuStore.getMenuState());
    }

});

module.exports = Drawer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MenuActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/MenuStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/MenuStore.js","./NavFrameList":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var FooterNav = React.createClass({displayName: "FooterNav",

	render: function() {
		return (
			React.createElement("div", {className: "row of-nav-fixed of-nav-footer"}, 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer active", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-stop"}))
				), 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-stop"}))
				), 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-search"}), " ", React.createElement("span", {className: "hidden-xs"}, "SEARCH"))
				)
			)
		);
	}

});

module.exports = FooterNav;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Frame.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
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
			return React.createElement("div", null, "No frames available.")
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
		            ), 
		            React.createElement("div", {className: "hidden-xs frame-name text-center"}, 
		                React.createElement("h6", null, this.state.frame.name, " ", active)
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js":[function(require,module,exports){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameLink":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameLink.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsDrawer.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MenuActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/MenuStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/MenuStore.js","./SettingsForm":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsForm.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SettingsForm.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MenuActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/SimpleNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    NavFrameList = require('./NavFrameList'),
    MenuActions = require('../actions/MenuActions'),
    FrameStore = require('../stores/FrameStore');


var SimpleNav = React.createClass({displayName: "SimpleNav",
    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getInitialState: function() {
        return {
            frames: [],
            selectedFrame: {
                name: 'HOME'
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
                React.createElement("button", {type: "button", className: "btn-simple-nav btn-menu visible-xs pull-left", onClick: this._handleOpenMenuClick}, 
                    React.createElement("span", {className: "icon-hamburger"})
                ), 
                React.createElement("button", {type: "button", className: "btn-simple-nav btn-setting visible-xs pull-right", onClick: this._handleOpenSettings}, 
                    React.createElement("span", {className: "icon-cog"})
                ), 
                React.createElement("h3", {className: "text-muted hidden-xs pull-left"}, React.createElement("span", {className: "openframe"}, "openframe/"), React.createElement("span", {className: "username"}, OF_USERNAME)), 

                React.createElement("h6", {className: "frame-name visible-xs text-center"}, React.createElement("span", {className: "connected", dangerouslySetInnerHTML: connected(this.state.selectedFrame.active)}), frameName), 

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
        MenuActions.toggleMenu();
    },

    _handleOpenSettings: function(e) {
        console.log('_handleOpenSettings');
        MenuActions.toggleSettings();
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

},{"../actions/MenuActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/MenuActions.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./NavFrameList":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/NavFrameList.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js":[function(require,module,exports){
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
	FRAME_CONNECT: null,
	FRAME_DISCONNECT: null,

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

	MENU_TOGGLE: null,
	SETTINGS_TOGGLE: null,

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


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
			// adding the frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;
	    // case OFConstants.TODO_UPDATE_TEXT:
	    //   text = action.text.trim();
	    //   if (text !== '') {
	    //     update(action.id, {text: text});
	    //     FrameStore.emitChange();
	    //   }
	    //   break;

	    // case OFConstants.TODO_DESTROY:
	    //   destroy(action.id);
	    //   FrameStore.emitChange();
	    //   break;

	    // case OFConstants.TODO_DESTROY_COMPLETED:
	    //   destroyCompleted();
	    //   FrameStore.emitChange();
	    //   break;

	    default:
    		// no op
  }
});

module.exports = FrameStore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/MenuStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"openframe/static/src/js/react-main.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager'),
    FastClick = (typeof window !== "undefined" ? window.FastClick : typeof global !== "undefined" ? global.FastClick : null);


browser_state.init();

React.initializeTouchEvents(true);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9Db250ZW50QWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL01lbnVBY3Rpb25zLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwaS9Tb2NrZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYnJvd3Nlcl9zdGF0ZV9tYW5hZ2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudEZvcm0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BcHAuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9Db250ZW50TGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0RyYXdlci5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2LmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaW5rLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaXN0LmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvU2V0dGluZ3NEcmF3ZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TZXR0aW5nc0Zvcm0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9TaW1wbGVOYXYuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29uZmlnLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbnN0YW50cy9PRkNvbnN0YW50cy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0NvbnRlbnRTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvRnJhbWVTdG9yZS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9zdG9yZXMvTWVudVN0b3JlLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3JlYWN0LW1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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SyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDeEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDckIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztJQUNwQyxhQUFhLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDO0FBQ3RELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNyQzs7QUFFQSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRXJCLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFbEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxXQUFXO0NBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztDQUNuQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQzs7QUFFSCxLQUFLLENBQUMsTUFBTTtDQUNYLG9CQUFDLEdBQUcsRUFBQSxJQUFBLENBQUcsQ0FBQTtDQUNQLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGVudW1lcmF0aW9uIHdpdGgga2V5cyBlcXVhbCB0byB0aGVpciB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgIHZhciBDT0xPUlMgPSBrZXlNaXJyb3Ioe2JsdWU6IG51bGwsIHJlZDogbnVsbH0pO1xuICogICB2YXIgbXlDb2xvciA9IENPTE9SUy5ibHVlO1xuICogICB2YXIgaXNDb2xvclZhbGlkID0gISFDT0xPUlNbbXlDb2xvcl07XG4gKlxuICogVGhlIGxhc3QgbGluZSBjb3VsZCBub3QgYmUgcGVyZm9ybWVkIGlmIHRoZSB2YWx1ZXMgb2YgdGhlIGdlbmVyYXRlZCBlbnVtIHdlcmVcbiAqIG5vdCBlcXVhbCB0byB0aGVpciBrZXlzLlxuICpcbiAqICAgSW5wdXQ6ICB7a2V5MTogdmFsMSwga2V5MjogdmFsMn1cbiAqICAgT3V0cHV0OiB7a2V5MToga2V5MSwga2V5Mjoga2V5Mn1cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbnZhciBrZXlNaXJyb3IgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIHJldCA9IHt9O1xuICB2YXIga2V5O1xuICBpZiAoIShvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2tleU1pcnJvciguLi4pOiBBcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgfVxuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV0W2tleV0gPSBrZXk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5TWlycm9yO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXHRTb2NrZXIgPSByZXF1aXJlKCcuLi9hcGkvU29ja2VyJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdGFsbF9jb250ZW50OiAnL2NvbnRlbnQvdXNlci8nICsgT0ZfVVNFUk5BTUVcbn1cblxudmFyIENvbnRlbnRBY3Rpb25zID0ge1xuXG5cdC8qKlxuXHQgKiBGZXRjaCB0aGUgY29udGVudCBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqL1xuXHRsb2FkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0NvbnRlbnRBY3Rpb25zLmxvYWRDb250ZW50cygpJyk7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBjb250ZW50XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIGNvbnRlbnRcblx0XHQkLmdldEpTT04oZW5kcG9pbnRzLmFsbF9jb250ZW50KVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oY29udGVudCkge1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORSxcblx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgYSBuZXcgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQURELFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORSxcblx0XHRcdFx0Y29udGVudDogcmVzcFxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRE9ORVxuXHRcdFx0fSk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0YWxsX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUVcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9MT0FEXG5cdFx0fSk7XG5cblx0XHQvLyBmZXRjaCB0aGUgZnJhbWVzXG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfZnJhbWVzKVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXM6ICcsIGZyYW1lcyk7XG5cdFx0XHRcdC8vIGxvYWQgc3VjY2VzcywgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbih7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgYSBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzZWxlY3QnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGNvbnRlbnQgb24gdGhlIHNlbGVjdGVkIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdHVwZGF0ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHR2YXIgZnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0XHRjb25zb2xlLmxvZyhmcmFtZSwgY29udGVudCk7XG5cdFx0Ly8gdmFyIGNvbnRlbnQgPSBDb250ZW50U3RvcmUuZ2V0U2VsZWN0ZWRDb250ZW50KCk7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgZnJhbWVfaWQ6IGZyYW1lLl9pZCxcbiAgICAgICAgICAgIGNvbnRlbnRfaWQ6IGNvbnRlbnQuX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNvY2tlci5zZW5kKCdmcmFtZTp1cGRhdGVfY29udGVudCcsIGRhdGEpO1xuXHRcdFxuXHRcdC8vIFdlYlNvY2tldCBldmVudCBoYW5kbGVyIGZvciBmcmFtZTpjb250ZW50X3VwZGF0ZWQgdHJpZ2dlcnMgdGhlIGRpc3BhdGNoXG5cdH0sXG5cblx0ZnJhbWVDb25uZWN0ZWQ6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIENvbm5lY3RlZDogJywgZnJhbWUpO1xuXHRcdEFwcERpc3BhdGNoZXIuaGFuZGxlU2VydmVyQWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lRGlzY29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBkaXNjb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfRElTQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0ZnJhbWVDb250ZW50VXBkYXRlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29udGVudCB1cGRhdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVTZXJ2ZXJBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0c2V0dXA6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgZnJhbWUgPSBkYXRhLmZyYW1lO1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgU2V0dXAnLCBmcmFtZSk7XG4gICAgICAgIC8vIHRoaXMgaXMgYSBsaXR0bGUgd2VpcmQgLS0gd2h5IGlzbid0IHNldHVwIGp1c3QgcGFydCBvZiB0aGUgaW5pdGlhbFxuICAgICAgICAvLyBjb25uZWN0ZWQgZXZlbnQ/XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhbGx5PyBEb2VzIHRoZSB2aWV3IGRpbWVuc2lvbiBuZWVkIHRvIGJlIHBhcnQgb2YgdGhlIHN0YXRlP1xuICAgICAqIFByb2JhYmxlIG5vdC4gTm90IHVzZWQgcHJlc2VudGx5LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gdyBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBoIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIHNldHVwRnJhbWVWaWV3OiBmdW5jdGlvbih3LCBoKSB7XG4gICAgXHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VUVVBfVklFVyxcblx0XHRcdHc6IHcsXG5cdFx0XHRoOiBoXG5cdFx0fSk7XG4gICAgfVxuXHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUFjdGlvbnM7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbnZhciBNZW51QWN0aW9ucyA9IHtcblxuXHR0b2dnbGVNZW51OiBmdW5jdGlvbigpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuTUVOVV9UT0dHTEVcblx0XHR9KTtcblx0fSxcblxuXHR0b2dnbGVTZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLlNFVFRJTkdTX1RPR0dMRVxuXHRcdH0pO1xuXHR9XG5cdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVBY3Rpb25zOyIsIlNvY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgX3NlbGYgPSB7fSxcbiAgICAgICAgX2V2ZW50SGFuZGxlcnMgPSB7fSxcbiAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlLFxuICAgICAgICBfb3B0cyA9IHtcbiAgICAgICAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNoZWNrSW50ZXJ2YWw6IDEwMDAwXG4gICAgICAgIH0sXG4gICAgICAgIF91cmwsXG4gICAgICAgIF93cyxcbiAgICAgICAgX3RpbWVyO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB1cmwgIFRoZSBzZXJ2ZXIgVVJMLlxuICAgICAqIEBwYXJhbSAge29iamVjdH0gb3B0cyBPcHRpb25hbCBzZXR0aW5nc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jb25uZWN0KHVybCwgb3B0cykge1xuICAgICAgICBfdXJsID0gdXJsO1xuICAgICAgICBpZiAob3B0cykgX2V4dGVuZChfb3B0cywgb3B0cyk7XG4gICAgICAgIF93cyA9IG5ldyBXZWJTb2NrZXQodXJsKTtcblxuICAgICAgICBfd3Mub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBvcGVuZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uT3BlbikgX29wdHMub25PcGVuKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIGNsb3NlZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uQ2xvc2UpIF9vcHRzLm9uQ2xvc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBtZXNzYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIGV2ZW50IGhhbmRsZXIsIGNhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfZXZlbnRIYW5kbGVyc1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXVtpXShkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyBcIiBldmVudCBub3QgaGFuZGxlZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9vcHRzLmtlZXBBbGl2ZSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChfdGltZXIpO1xuICAgICAgICAgICAgX3RpbWVyID0gc2V0SW50ZXJ2YWwoX2NoZWNrQ29ubmVjdGlvbiwgX29wdHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vbihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb2ZmKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gX2V2ZW50SGFuZGxlcnNbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGFuIGV2ZW50LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gbmFtZSBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBkYXRhIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9zZW5kKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC4gSWYgbm90LCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jaGVja0Nvbm5lY3Rpb24oKSB7XG4gICAgICAgIGlmICghX2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgX2Nvbm5lY3QoX3VybCwgX29wdHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXRpbGl0eSBmdW5jdGlvbiBmb3IgZXh0ZW5kaW5nIGFuIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9leHRlbmQob2JqKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cblxuICAgIF9zZWxmLm9uID0gX29uO1xuICAgIF9zZWxmLm9mZiA9IF9vZmY7XG4gICAgX3NlbGYuc2VuZCA9IF9zZW5kO1xuICAgIF9zZWxmLmNvbm5lY3QgPSBfY29ubmVjdDtcbiAgICByZXR1cm4gX3NlbGY7XG59KSgpO1xuXG4vLyBDT01NT04uSlNcbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IFNvY2tlcjsiLCJ2YXIgc3NtID0gcmVxdWlyZSgnc3NtJylcblx0Y29uZiA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbmZ1bmN0aW9uIF9pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudCgpIHtcblx0Y29uc29sZS5sb2coJ19pbml0QnJvd3NlclN0YXRlTWFuYWdlbWVudCcpO1xuXG5cdF9zZXR1cFNjcmVlblNpemUoKTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICd4cycsXG5cdCAgICBtYXhXaWR0aDogNzY3LFxuXHQgICAgb25FbnRlcjogZnVuY3Rpb24oKXtcblx0ICAgICAgICBjb25zb2xlLmxvZygnZW50ZXIgeHMnKTtcblx0ICAgICAgICBjb25mLnNjcmVlbl9zaXplID0gJ3hzJztcblx0ICAgIH1cblx0fSk7XG5cblx0c3NtLmFkZFN0YXRlKHtcblx0ICAgIGlkOiAnc20nLFxuXHQgICAgbWluV2lkdGg6IDc2OCxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIHNtJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdzbSc7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHNzbS5hZGRTdGF0ZSh7XG5cdCAgICBpZDogJ21kJyxcblx0ICAgIG1pbldpZHRoOiA5OTIsXG5cdCAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xuXHQgICAgICAgIGNvbnNvbGUubG9nKCdlbnRlciBtZCcpO1xuXHQgICAgICAgIGNvbmYuc2NyZWVuX3NpemUgPSAnbWQnO1xuXHQgICAgfVxuXHR9KTtcblxuXHRzc20uYWRkU3RhdGUoe1xuXHQgICAgaWQ6ICdsZycsXG5cdCAgICBtaW5XaWR0aDogMTIwMCxcblx0ICAgIG9uRW50ZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICAgICAgY29uc29sZS5sb2coJ2VudGVyIGxnJyk7XG5cdCAgICAgICAgY29uZi5zY3JlZW5fc2l6ZSA9ICdsZyc7XG5cdCAgICB9XG5cdH0pO1x0XG5cblx0c3NtLnJlYWR5KCk7XG59XG5cbmZ1bmN0aW9uIF9zZXR1cFNjcmVlblNpemUoKSB7XG5cdGNvbmYud1cgPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0Y29uZi53SCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0Y29uc29sZS5sb2coY29uZik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBfaW5pdEJyb3dzZXJTdGF0ZU1hbmFnZW1lbnRcbn1cblxuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKTtcblxudmFyIEFkZENvbnRlbnRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGhhbmRsZUZvcm1TdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgdXJsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkudmFsdWU7XG5cbiAgICAgICAgaWYgKCF1cmwpIHJldHVybjtcblxuICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgdXNlcnM6IFtPRl9VU0VSTkFNRV1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2coJ3N1Ym1pdHRpbmcgY29udGVudDogJywgY29udGVudCk7XG4gICAgICAgIENvbnRlbnRBY3Rpb25zLmFkZENvbnRlbnQoY29udGVudCk7XG5cbiAgICAgICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkudmFsdWUgPSAnJztcbiAgICAgICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlVSTCkuZm9jdXMoKTtcbiAgICB9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBoaWRkZW4teHMgYWRkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZVwiIGlkPVwiYWRkLWZvcm1cIiBvblN1Ym1pdD17dGhpcy5oYW5kbGVGb3JtU3VibWl0fT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGxhYmVsIGZvcj1cIlNlbmRUb1VzZXJcIj5VUkw8L2xhYmVsPiAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJVUkxcIiBwbGFjZWhvbGRlcj1cImVudGVyIFVSTFwiIHJlZj1cIlVSTFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdCBidG4tYWRkLWNvbnRlbnRcIiBocmVmPVwiI2FkZC1jb250ZW50XCIgaWQ9XCJhZGQtY29udGVudC1idXR0b25cIj5BZGQgQ29udGVudDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRkQ29udGVudEZvcm07IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXG5cdE5hdiA9IHJlcXVpcmUoJy4vTmF2LmpzJyksXG5cdFNpbXBsZU5hdiA9IHJlcXVpcmUoJy4vU2ltcGxlTmF2LmpzJyksXG5cdEZyYW1lID0gcmVxdWlyZSgnLi9GcmFtZS5qcycpLFxuXHRUcmFuc2ZlckJ1dHRvbnMgPSByZXF1aXJlKCcuL1RyYW5zZmVyQnV0dG9ucy5qcycpLFxuXHRBZGRDb250ZW50Rm9ybSA9IHJlcXVpcmUoJy4vQWRkQ29udGVudEZvcm0uanMnKSxcblx0Q29udGVudExpc3QgPSByZXF1aXJlKCcuL0NvbnRlbnRMaXN0LmpzJyksXG5cdEZvb3Rlck5hdiA9IHJlcXVpcmUoJy4vRm9vdGVyTmF2LmpzJyksXG5cdERyYXdlciA9IHJlcXVpcmUoJy4vRHJhd2VyLmpzJyksXG5cdFNldHRpbmdzRHJhd2VyID0gcmVxdWlyZSgnLi9TZXR0aW5nc0RyYXdlci5qcycpLFxuXG5cdEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyksXG5cblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXG5cdGNvbmYgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxuLyoqXG4gKiBUaGUgQXBwIGlzIHRoZSByb290IGNvbXBvbmVudCByZXNwb25zaWJsZSBmb3I6XG4gKiAtIHNldHRpbmcgdXAgc3RydWN0dXJlIG9mIGNoaWxkIGNvbXBvbmVudHNcbiAqXG4gKiBJbmRpdmlkdWFsIGNvbXBvbmVudHMgcmVnaXN0ZXIgZm9yIFN0b3JlIHN0YXRlIGNoYW5nZSBldmVudHNcbiAqL1xudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0XG5cdGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCFnbG9iYWwuT0ZfVVNFUk5BTUUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdPRl9VU0VSTkFNRSBub3QgZGVmaW5lZC4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRTb2NrZXIuY29ubmVjdChcIndzOi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArIFwiL2FkbWluL3dzL1wiICsgT0ZfVVNFUk5BTUUpO1xuXG5cdFx0Ly8gVE9ETzogdGhlc2Ugc2hvdWxkIG1vdmUgdG8gdGhlIGNvcnJlc3BvbmRpbmcgQWN0aW9ucyBjcmVhdG9yIChlLmcuIEZyYW1lQWN0aW9ucylcblx0XHRTb2NrZXIub24oJ2ZyYW1lOmNvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6ZGlzY29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lRGlzY29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpjb250ZW50X3VwZGF0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb250ZW50VXBkYXRlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6c2V0dXAnLCBGcmFtZUFjdGlvbnMuc2V0dXApO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRcblx0XHQvLyBjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCAkKCcubmF2LWZvb3RlcicpLmhlaWdodCgpKTtcblx0XHRjb25zb2xlLmxvZygnY29tcG9uZW50RGlkTW91bnQnLCBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMubmF2Rm9vdGVyKS5vZmZzZXRIZWlnaHQpO1xuXG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG4gIFx0cmVuZGVyOiBmdW5jdGlvbigpe1xuXHQgICAgcmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXIgYXBwJz5cblx0XHRcdFx0PFNpbXBsZU5hdiAvPlxuXHRcdFx0XHQ8RnJhbWUgLz5cblx0XHRcdFx0PFRyYW5zZmVyQnV0dG9ucyAvPlxuXHRcdFx0XHQ8QWRkQ29udGVudEZvcm0gLz5cblx0XHRcdFx0PENvbnRlbnRMaXN0IC8+XG5cdFx0XHRcdDxGb290ZXJOYXYgcmVmPVwibmF2Rm9vdGVyXCIvPlxuXHRcdFx0XHQ8RHJhd2VyIC8+XG5cdFx0XHRcdDxTZXR0aW5nc0RyYXdlciBzaWRlQ2xhc3M9XCJtZW51LWRyYXdlci1yaWdodFwiIC8+XG5cdFx0XHQ8L2Rpdj5cblx0ICAgIClcbiAgXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBDb250ZW50TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udGVudDogW11cblx0XHR9XG5cdH0sXG5cdFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Q29udGVudEFjdGlvbnMubG9hZENvbnRlbnQoKTtcblx0XHRDb250ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHRcdC8vIHRoaXMuX2luaXRTbGlkZXIoKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUNvbnRlbnRTbGlkZShjb250ZW50SXRlbSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NyZWF0aW5nIHNsaWRlOiAnLCBjb250ZW50SXRlbSk7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8ZGl2IGtleT17Y29udGVudEl0ZW0uX2lkLiRvaWR9IGNsYXNzTmFtZT1cInN3aXBlci1zbGlkZVwiIG9uQ2xpY2s9e251bGx9PlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y29udGVudEl0ZW0udXJsfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcblx0XHR9XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLW91dGVyLWNvbnRhaW5lclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1jb250YWluZXJcIiByZWY9XCJTd2lwZXJcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cblx0ICAgICAgICAgICAgICAgICAgICBcblx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuXHQgICAgICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRjb250ZW50OiBDb250ZW50U3RvcmUuZ2V0Q29udGVudCgpXG4gIFx0XHR9KTtcbiAgXHRcdFxuICBcdFx0Ly8gVE9ETzogYmV0dGVyIFJlYWN0IGludGVncmF0aW9uIGZvciB0aGUgc3dpcGVyXG4gIFx0XHRcbiAgXHRcdGlmICghdGhpcy5zd2lwZXIpIHtcbiAgXHRcdFx0dGhpcy5faW5pdFNsaWRlcigpO1xuICBcdFx0fVxuXG4gIFx0XHR0aGlzLl9wb3B1bGF0ZVNsaWRlcigpXG4gIFx0XHRcblx0XHQvLyB2YXIgc2xpZGVfaW5kZXggPSAkKCdkaXYuc3dpcGVyLXNsaWRlJykubGVuZ3RoO1xuICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKDApO1xuICBcdH0sXG5cbiAgXHRfaW5pdFNsaWRlcjogZnVuY3Rpb24oKSB7XG4gIFx0XHR2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuU3dpcGVyKTtcblx0XHR0aGlzLnN3aXBlciA9IG5ldyBTd2lwZXIoZWwsIHtcblx0ICAgICAgICBzbGlkZXNQZXJWaWV3OiAzLFxuXHQgICAgICAgIHNwYWNlQmV0d2VlbjogNTAsXG5cdCAgICAgICAgY2VudGVyZWRTbGlkZXM6IHRydWUsXG5cdCAgICAgICAgLy8gbG9vcDogdHJ1ZSxcblx0ICAgICAgICAvLyBsb29wZWRTbGlkZXM6IDUsXG5cdCAgICAgICAga2V5Ym9hcmRDb250cm9sOiB0cnVlLFxuXHQgICAgICAgIG9uU2xpZGVDaGFuZ2VFbmQ6IHRoaXMuX3NsaWRlQ2hhbmdlRW5kXG5cdCAgICB9KTtcblxuXG4gIFx0fSxcblxuICBcdF9wb3B1bGF0ZVNsaWRlcjogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnN3aXBlci5yZW1vdmVBbGxTbGlkZXMoKTtcbiAgXHRcdHRoaXMuc3RhdGUuY29udGVudC5mb3JFYWNoKHRoaXMuX2FkZFNsaWRlKTtcbiAgXHR9LFxuXG4gIFx0X2FkZFNsaWRlOiBmdW5jdGlvbihjb250ZW50SXRlbSkge1xuICBcdFx0dmFyIGh0bWwgPSAnPGRpdiBjbGFzcz1cInN3aXBlci1zbGlkZVwiIGRhdGEtY29udGVudGlkPVwiJyArIGNvbnRlbnRJdGVtLl9pZCArICdcIj48aW1nIHNyYz0nICsgY29udGVudEl0ZW0udXJsICsgJyAvPjwvZGl2Pidcblx0XHR0aGlzLnN3aXBlci5wcmVwZW5kU2xpZGUoaHRtbCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICBcdFx0dGhpcy5zd2lwZXIuc2xpZGVUbyhpbmRleCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc2xpZGVyKSB7XG4gIFx0XHR2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICBcdFx0XHRjb250ZW50X2lkID0gc2xpZGUuZGF0YXNldC5jb250ZW50aWQ7XG4gIFx0XHRjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgY29udGVudF9pZCk7XG4gIFx0XHRDb250ZW50QWN0aW9ucy5zbGlkZUNoYW5nZWQoY29udGVudF9pZCk7XG4gIFx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50TGlzdDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHROYXZGcmFtZUxpc3QgPSByZXF1aXJlKCcuL05hdkZyYW1lTGlzdCcpLFxuXHRNZW51QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVudUFjdGlvbnMnKSxcblx0TWVudVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL01lbnVTdG9yZScpO1xuXG52YXIgRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItbGVmdCdcblx0XHR9XG5cdH0sXG5cdFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIE1lbnVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBiYXNlQ2xhc3MgPSAndmlzaWJsZS14cyBtZW51LWRyYXdlcic7XG5cdFx0dmFyIG9wZW5DbGFzcyA9IHRoaXMuc3RhdGUub3BlbiA/ICdtZW51LWRyYXdlci1vcGVuJyA6ICdtZW51LWRyYXdlci1jbG9zZWQnO1xuXHRcdHZhciBzaWRlQ2xhc3MgPSB0aGlzLnByb3BzLnNpZGVDbGFzcztcblx0XHR2YXIgZnVsbENsYXNzID0gW2Jhc2VDbGFzcywgb3BlbkNsYXNzLCBzaWRlQ2xhc3NdLmpvaW4oJyAnKTtcblxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtmdWxsQ2xhc3N9PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1lbnUtZHJhd2VyLWlubmVyXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJvZi1uYXYtZml4ZWQgb2YtbmF2LWRyYXdlclwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ1c2VybmFtZSB0ZXh0LWNlbnRlclwiPntPRl9VU0VSTkFNRX08L2Rpdj5cblx0XHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0bi1zaW1wbGUtbmF2IHZpc2libGUteHMgcHVsbC1yaWdodFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsb3NlTWVudUNsaWNrfSA+XG5cdFx0ICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWNsb3NlXCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE5hdkZyYW1lTGlzdCBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdF9oYW5kbGVDbG9zZU1lbnVDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ19oYW5kbGVDbG9zZU1lbnVDbGljaycpO1xuXHRcdE1lbnVBY3Rpb25zLnRvZ2dsZU1lbnUoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKE1lbnVTdG9yZS5nZXRNZW51U3RhdGUoKSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmF3ZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIEZvb3Rlck5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBvZi1uYXYtZml4ZWQgb2YtbmF2LWZvb3RlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy00XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXIgYWN0aXZlXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXN0b3BcIiAvPjwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTRcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlclwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1zdG9wXCIgLz48L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy00XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXJcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tc2VhcmNoXCIgLz4gPHNwYW4gY2xhc3NOYW1lPVwiaGlkZGVuLXhzXCI+U0VBUkNIPC9zcGFuPjwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3Rlck5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIEZyYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCk7XG5cdFx0RnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl91cGRhdGVDb250YWluZXJEaW1lbnNpb25zKCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUuZnJhbWUpIHtcblx0XHRcdHJldHVybiA8ZGl2Pk5vIGZyYW1lcyBhdmFpbGFibGUuPC9kaXY+XG5cdFx0fVxuXHRcdHRoaXMud19oX3JhdGlvID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzID8gdGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy53X2hfcmF0aW8gOiAxO1xuXG5cdFx0dmFyIHVybCA9IHRoaXMuc3RhdGUuZnJhbWUgJiYgdGhpcy5zdGF0ZS5mcmFtZS5jdXJyZW50X2NvbnRlbnQgPyB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudC51cmwgOiAnJztcblx0XHR2YXIgZGl2U3R5bGUgPSB7XG5cdFx0XHRiYWNrZ3JvdW5kSW1hZ2U6ICd1cmwoJyArIHVybCArICcpJyxcblx0XHR9O1xuXG5cdFx0Y29uc29sZS5sb2codGhpcy53X2hfcmF0aW8pO1xuXG5cdFx0dmFyIHdoU3R5bGUgPSB7XG5cdFx0XHRwYWRkaW5nQm90dG9tOiAoMS90aGlzLndfaF9yYXRpbykgKiAxMDAgKyAnJSdcblx0XHR9O1xuXG5cdFx0dmFyIGFjdGl2ZSA9IHRoaXMuc3RhdGUuZnJhbWUuYWN0aXZlID8gJyonIDogJyc7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGZyYW1lcy1saXN0XCIgcmVmPVwiZnJhbWVDb250YWluZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteGwtMTIgZnJhbWUtb3V0ZXItY29udGFpbmVyXCIgcmVmPVwiZnJhbWVPdXRlckNvbnRhaW5lclwiPlxuXHRcdFx0XHRcdDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSBidG4teHMgYnRuLXNldHRpbmdzIGhpZGVcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjbXlNb2RhbFwiPlM8L2J1dHRvbj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZyYW1lLWlubmVyLWNvbnRhaW5lclwiIHJlZj1cImZyYW1lSW5uZXJDb250YWluZXJcIj5cblx0XHQgICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwiZnJhbWVcIiBzdHlsZT17ZGl2U3R5bGV9IHJlZj1cImZyYW1lXCIvPlxuXHRcdCAgICAgICAgICAgIDwvZGl2PlxuXHRcdCAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZGVuLXhzIGZyYW1lLW5hbWUgdGV4dC1jZW50ZXJcIj5cblx0XHQgICAgICAgICAgICAgICAgPGg2Pnt0aGlzLnN0YXRlLmZyYW1lLm5hbWV9IHthY3RpdmV9PC9oNj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cblx0XHQgICAgICAgIDwvZGl2PlxuXHQgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cbiAgXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcbiAgXHRcdGNvbnNvbGUubG9nKCdzZWxlY3RlZEZyYW1lOicsIHNlbGVjdGVkRnJhbWUpO1xuICBcdFx0dGhpcy5zZXRTdGF0ZSh7XG4gIFx0XHRcdGZyYW1lOiBzZWxlY3RlZEZyYW1lXG4gIFx0XHR9KTtcbiAgXHR9LFxuXG4gIFx0X3VwZGF0ZUNvbnRhaW5lckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGNvbnRhaW5lciA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpLFxuICBcdFx0XHRmcmFtZU91dGVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lT3V0ZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZUlubmVyQ29udGFpbmVyID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmZyYW1lSW5uZXJDb250YWluZXIpLFxuICBcdFx0XHRmcmFtZSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5mcmFtZSksXG5cdFx0XHR3ID0gY29udGFpbmVyLm9mZnNldFdpZHRoLFxuXHRcdFx0aCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG5cdFx0XHRwYWRkaW5nID0gNTAsXG5cdFx0XHRtYXhXID0gdyAtIDIqcGFkZGluZyxcblx0XHRcdG1heEggPSBoIC0gMipwYWRkaW5nLFxuXHRcdFx0ZnJhbWVXLCBmcmFtZUg7XG5cdFx0XG5cdFx0aWYgKCh0aGlzLndfaF9yYXRpbyA+IDEgfHwgbWF4SCAqIHRoaXMud19oX3JhdGlvID4gbWF4VykgJiYgbWF4VyAvIHRoaXMud19oX3JhdGlvIDwgbWF4SCkge1xuXHRcdFx0Ly8gd2lkdGggPiBoZWlnaHQgb3IgdXNpbmcgZnVsbCBoZWlnaHQgd291bGQgZXh0ZW5kIGJleW9uZCBtYXhXXG5cdFx0XHRmcmFtZVcgPSBtYXhXO1xuXHRcdFx0ZnJhbWVIID0gKG1heFcgLyB0aGlzLndfaF9yYXRpbyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHdpZHRoIDwgaGVpZ2h0XG5cdFx0XHRmcmFtZUggPSBtYXhIO1xuXHRcdFx0ZnJhbWVXID0gKG1heEggKiB0aGlzLndfaF9yYXRpbyk7XG5cdFx0fVxuXHRcdFxuXHRcdGZyYW1lLnN0eWxlLndpZHRoID0gZnJhbWVXICsgJ3B4Jztcblx0XHRmcmFtZS5zdHlsZS5oZWlnaHQgPSBmcmFtZUggKyAncHgnO1xuXG5cdFx0ZnJhbWVPdXRlckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IG1heFcrJ3B4Jztcblx0XHRmcmFtZUlubmVyQ29udGFpbmVyLnN0eWxlLnRvcCA9ICgoaCAtIGZyYW1lSCkgLyAyKSArICdweCc7XG5cdFx0Ly8gZnJhbWVJbm5lckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBmcmFtZS5zdHlsZS5oZWlnaHQ7XG5cblxuXG5cdFx0Y29uc29sZS5sb2coJ2ZyYW1lT3V0ZXJDb250YWluZXI6JywgZnJhbWVPdXRlckNvbnRhaW5lcik7XG5cdFx0Y29uc29sZS5sb2coJ2NvbnRhaW5lcjonLCB3LCBoLCBtYXhXLCBtYXhIKTtcbiAgXHR9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpbmsgPSByZXF1aXJlKCcuL05hdkZyYW1lTGluaycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lczogW11cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGcmFtZUxpbmsoZnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZTogJywgZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBCcmFuZCBhbmQgdG9nZ2xlIGdldCBncm91cGVkIGZvciBiZXR0ZXIgbW9iaWxlIGRpc3BsYXkgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm5hdmJhci10b2dnbGUgY29sbGFwc2VkIHB1bGwtbGVmdFwiIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+VG9nZ2xlIG5hdmlnYXRpb248L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1tdXRlZCBoaWRkZW4teHNcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cImJzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIC8ubmF2YmFyLWNvbGxhcHNlICovfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKTtcblxudmFyIE5hdkZyYW1lTGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlRnJhbWVTZWxlY3Rpb246IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2VsZWN0KHRoaXMucHJvcHMuZnJhbWUpO1xuXHRcdGlmICh0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXIpIHtcblx0XHRcdHRoaXMucHJvcHMubGlua0NsaWNrSGFuZGxlcigpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmVDbGFzcyA9ICdub3QtY29ubmVjdGVkJyxcblx0XHRcdGFjdGl2ZVRleHQgPSAnbm90IGNvbm5lY3RlZCc7XG5cdFx0aWYgKHRoaXMucHJvcHMuZnJhbWUuYWN0aXZlKSB7XG5cdFx0XHRhY3RpdmVDbGFzcyA9IGFjdGl2ZVRleHQgPSAnY29ubmVjdGVkJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc1NlbGVjdGVkKHNlbGVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPyAnaWNvbi1jaGVjaycgOiAnc3BhY2UnO1xuICAgICAgICB9XG5cblx0XHR2YXIgY2xhc3NlcyA9ICdwdWxsLXJpZ2h0IHN0YXR1cyAnICsgYWN0aXZlQ2xhc3M7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBvbkNsaWNrPXt0aGlzLmhhbmRsZUZyYW1lU2VsZWN0aW9ufT5cblx0XHRcdFx0PGEgaHJlZj1cIiNcIj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2lzU2VsZWN0ZWQodGhpcy5wcm9wcy5mcmFtZS5zZWxlY3RlZCl9IC8+IHt0aGlzLnByb3BzLmZyYW1lLm5hbWV9XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPXtjbGFzc2VzfT57YWN0aXZlVGV4dH08L3NwYW4+XG5cdFx0XHRcdDwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaW5rOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdkZyYW1lTGluayA9IHJlcXVpcmUoJy4vTmF2RnJhbWVMaW5rJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG52YXIgTmF2RnJhbWVMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIFx0cmV0dXJuIHtcbiAgICBcdFx0ZXh0cmFDbGFzc2VzOiAnJyxcbiAgICBcdFx0aW5jbHVkZUxvZ291dDogdHJ1ZSxcbiAgICBcdFx0bGlua0NsaWNrSGFuZGxlcjogZnVuY3Rpb24oKSB7XG4gICAgXHRcdFx0Y29uc29sZS5sb2coJ2xpbmsgY2xpY2tlZCcpO1xuICAgIFx0XHR9XG4gICAgXHR9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzOiBbXVxuICAgICAgICB9XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUZyYW1lTGluayhmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lOiAnLCBmcmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gPE5hdkZyYW1lTGluayBrZXk9e2ZyYW1lLl9pZH0gZnJhbWU9e2ZyYW1lfSBsaW5rQ2xpY2tIYW5kbGVyPXt0aGlzLnByb3BzLmxpbmtDbGlja0hhbmRsZXJ9IC8+XG4gICAgICAgIH1cblxuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5leHRyYUNsYXNzZXMgKyAnIG5hdi1mcmFtZS1saXN0IGRyYXdlci1jb250ZW50JztcblxuXHRcdHZhciBsb2dvdXQgPSAnJztcblx0XHRpZiAodGhpcy5wcm9wcy5pbmNsdWRlTG9nb3V0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnaW5jbHVkZUxvZ291dCcpO1xuXHRcdFx0bG9nb3V0ID0gKFxuXHRcdFx0XHQ8bGk+XG5cdFx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5wcm9wcy5saW5rQ2xpY2tIYW5kbGVyfSBjbGFzc05hbWU9XCJidG4tbG9nb3V0XCIgaHJlZj1cIi9sb2dvdXRcIj5sb2cgb3V0PC9hPlxuXHRcdFx0XHQ8L2xpPlxuXHRcdFx0KTtcdFxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPXtjbGFzc2VzfSByb2xlPVwibWVudVwiPlxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgIHtsb2dvdXR9XG4gICAgICAgICAgICA8L3VsPlxuXHRcdCk7XG5cdH0sXG5cblx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKClcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZGcmFtZUxpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TWVudUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL01lbnVBY3Rpb25zJyksXG5cdE1lbnVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9NZW51U3RvcmUnKSxcblx0U2V0dGluZ3NGb3JtID0gcmVxdWlyZSgnLi9TZXR0aW5nc0Zvcm0nKTtcblxudmFyIFNldHRpbmdzRHJhd2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvcGVuOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2lkZUNsYXNzOiAnbWVudS1kcmF3ZXItcmlnaHQnXG5cdFx0fVxuXHR9LFxuXHRcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBNZW51U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYmFzZUNsYXNzID0gJ3Zpc2libGUteHMgbWVudS1kcmF3ZXInO1xuXHRcdHZhciBvcGVuQ2xhc3MgPSB0aGlzLnN0YXRlLm9wZW4gPyAnbWVudS1kcmF3ZXItb3BlbicgOiAnbWVudS1kcmF3ZXItY2xvc2VkJztcblx0XHR2YXIgc2lkZUNsYXNzID0gdGhpcy5wcm9wcy5zaWRlQ2xhc3M7XG5cdFx0dmFyIGZ1bGxDbGFzcyA9IFtiYXNlQ2xhc3MsIG9wZW5DbGFzcywgc2lkZUNsYXNzXS5qb2luKCcgJyk7XG5cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17ZnVsbENsYXNzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJtZW51LWRyYXdlci1pbm5lclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi1kcmF3ZXJcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidXNlcm5hbWUgdGV4dC1jZW50ZXJcIj57T0ZfVVNFUk5BTUV9PC9kaXY+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiB2aXNpYmxlLXhzIHB1bGwtcmlnaHRcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbG9zZU1lbnVDbGlja30gPlxuXHRcdCAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1tZW51LXJpZ2h0XCIgLz5cblx0XHQgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkcmF3ZXItY29udGVudFwiPlxuXHRcdFx0XHRcdFx0PFNldHRpbmdzRm9ybSAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cblx0X2hhbmRsZUNsb3NlTWVudUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnX2hhbmRsZUNsb3NlTWVudUNsaWNrJyk7XG5cdFx0TWVudUFjdGlvbnMudG9nZ2xlU2V0dGluZ3MoKTtcblx0fSxcblxuXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKE1lbnVTdG9yZS5nZXRTZXR0aW5nc1N0YXRlKCkpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NEcmF3ZXI7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKVxuXHRNZW51QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVudUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBTZXR0aW5nc0RyYXdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZnJhbWU6IHtcblx0XHRcdFx0c2V0dGluZ3M6IHtcblx0XHRcdFx0XHRvbl90aW1lOiAnMDY6MDA6MDAnLFxuXHRcdFx0XHRcdG9mZl90aW1lOiAnMTI6MDA6MDAnLFxuXHRcdFx0XHRcdHJvdGF0aW9uOiAxODAsXG5cdFx0XHRcdFx0dmlzaWJpbGl0eTogJ3B1YmxpYydcblx0XHRcdFx0fSxcblx0XHRcdFx0dXNlcjogW1xuXHRcdFx0XHRcdCdqb253b2hsJyxcblx0XHRcdFx0XHQnaXNoYmFjaycsXG5cdFx0XHRcdFx0J2FuZHknXG5cdFx0XHRcdF1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNpZGVDbGFzczogJ21lbnUtZHJhd2VyLXJpZ2h0J1xuXHRcdH1cblx0fSxcblx0XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNldHRpbmdzLWZpZWxkc1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VXNlcnM8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy04XCI+XG5cdFx0XHRcdFx0XHQ8aW5wdXQgY2xhc3NOYW1lPVwidXNlcnMtaW5wdXRcIiB0eXBlPVwidGV4dFwiIHJlZj1cIm5ld1VzZXJcIiAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTJcIj5cblx0XHRcdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBwdWxsLXJpZ2h0XCI+QWRkPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cblx0XHRcdFx0XHRcdHt0aGlzLnN0YXRlLmZyYW1lLnVzZXJzfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9uXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3Mub25fdGltZX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNTowMDowMFwiPjVhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDY6MDA6MDBcIj42YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA3OjAwOjAwXCI+N2FtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwODowMDowMFwiPjhhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDk6MDA6MDBcIj45YW08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEwOjAwOjAwXCI+MTBhbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTE6MDA6MDBcIj4xMWFtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMjowMDowMFwiPjEycG08L29wdGlvbj5cblx0XHRcdFx0XHRcdDwvc2VsZWN0PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgcm93LXNldHRpbmdzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMlwiPlR1cm4gb248L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMFwiPlxuXHRcdFx0XHRcdFx0PHNlbGVjdCBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCIgcmVmPVwidHVybk9mZlwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLm9mZl90aW1lfT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA1OjAwOjAwXCI+NXBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwNjowMDowMFwiPjZwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMDc6MDA6MDBcIj43cG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjA4OjAwOjAwXCI+OHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwOTowMDowMFwiPjlwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMTA6MDA6MDBcIj4xMHBtPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxMTowMDowMFwiPjExcG08L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjEyOjAwOjAwXCI+MTJwbTwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+Um90YXRlPC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTBcIj5cblx0XHRcdFx0XHRcdDxzZWxlY3QgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiIHJlZj1cInJvdGF0ZVwiIHZhbHVlPXt0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLnJvdGF0aW9ufT5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjBcIj5ub25lPC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCI5MFwiPjkwJmRlZzs8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIi05MFwiPi05MCZkZWc7PC9vcHRpb24+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxODBcIj4xODAmZGVnOzwvb3B0aW9uPlxuXHRcdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyByb3ctc2V0dGluZ3NcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0yXCI+VmlzaWJpbGl0eTwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEwXCI+XG5cdFx0XHRcdFx0XHQ8c2VsZWN0IGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIiByZWY9XCJ0dXJuT2ZmXCIgdmFsdWU9e3RoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MudmlzaWJpbGl0eX0+XG5cdFx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCJwdWJsaWNcIj5wdWJsaWM8L29wdGlvbj5cblx0XHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cInByaXZhdGVcIj5wcml2YXRlPC9vcHRpb24+XG5cdFx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzRHJhd2VyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgTmF2RnJhbWVMaXN0ID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpc3QnKSxcbiAgICBNZW51QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVudUFjdGlvbnMnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgU2ltcGxlTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdLFxuICAgICAgICAgICAgc2VsZWN0ZWRGcmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdIT01FJ1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZnJhbWVOYW1lID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLm5hbWU7XG5cbiAgICAgICAgZnVuY3Rpb24gY29ubmVjdGVkKGFjdGl2ZSkge1xuICAgICAgICAgICAgdmFyIGNvbm5lY3RlZCA9ICcnO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIGNvbm5lY3RlZCA9ICcmYnVsbDsgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7X19odG1sOiBjb25uZWN0ZWR9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib2YtbmF2LWZpeGVkIG9mLW5hdi10b3BcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4tc2ltcGxlLW5hdiBidG4tbWVudSB2aXNpYmxlLXhzIHB1bGwtbGVmdFwiIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZU9wZW5NZW51Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWhhbWJ1cmdlclwiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuLXNpbXBsZS1uYXYgYnRuLXNldHRpbmcgdmlzaWJsZS14cyBwdWxsLXJpZ2h0XCIgb25DbGljaz17dGhpcy5faGFuZGxlT3BlblNldHRpbmdzfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1jb2dcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14cyBwdWxsLWxlZnRcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuXG4gICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImZyYW1lLW5hbWUgdmlzaWJsZS14cyB0ZXh0LWNlbnRlclwiPjxzcGFuIGNsYXNzTmFtZT1cImNvbm5lY3RlZFwiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXtjb25uZWN0ZWQodGhpcy5zdGF0ZS5zZWxlY3RlZEZyYW1lLmFjdGl2ZSl9IC8+e2ZyYW1lTmFtZX08L2g2PlxuXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodCBoaWRkZW4teHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiByb2xlPVwiYnV0dG9uXCIgYXJpYS1leHBhbmRlZD1cImZhbHNlXCI+RnJhbWVzIDxzcGFuIGNsYXNzTmFtZT1cImNhcmV0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8TmF2RnJhbWVMaXN0IGV4dHJhQ2xhc3Nlcz1cImRyb3Bkb3duLW1lbnVcIiBpbmNsdWRlTG9nb3V0PXtmYWxzZX0vPlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI3NldHRpbmdzXCIgb25DbGljaz17dGhpcy5faGFuZGxlT3BlblNldHRpbmdzfT5TZXR0aW5nczwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj5Mb2cgT3V0PC9hPlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU9wZW5NZW51Q2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ19oYW5kbGVPcGVuTWVudUNsaWNrJyk7XG4gICAgICAgIE1lbnVBY3Rpb25zLnRvZ2dsZU1lbnUoKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU9wZW5TZXR0aW5nczogZnVuY3Rpb24oZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnX2hhbmRsZU9wZW5TZXR0aW5ncycpO1xuICAgICAgICBNZW51QWN0aW9ucy50b2dnbGVTZXR0aW5ncygpO1xuICAgIH0sXG5cbiAgICBfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnKysrKysrIGdldCBzZWxlY3RlZCBmcmFtZScsIEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmcmFtZXM6IEZyYW1lU3RvcmUuZ2V0QWxsRnJhbWVzKCksXG4gICAgICAgICAgICBzZWxlY3RlZEZyYW1lOiBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZU5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBUcmFuc2ZlckJ1dHRvbnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgdHJhbnNmZXItYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnRuLWdyb3VwXCIgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIi4uLlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIiBvbkNsaWNrPXt0aGlzLnNlbmRDbGlja2VkfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLXVwIGljb24tc2VuZFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPiAqL31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdHNlbmRDbGlja2VkOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnVwZGF0ZUNvbnRlbnQoQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpKTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2ZlckJ1dHRvbnM7IiwidmFyIGNvbmYgPSB7XG5cdGRvbWFpbjogJ2xvY2FsaG9zdCcsXG5cdHBvcnQ6ICc4ODg4Jyxcblx0bmF2YmFySDogNTBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25mOyIsInZhciBrZXltaXJyb3IgPSByZXF1aXJlKCdrZXltaXJyb3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXltaXJyb3Ioe1xuXG5cdC8vIGZyYW1lIGFjdGlvbiB0eXBlc1xuXHRGUkFNRV9MT0FEOiBudWxsLFxuXHRGUkFNRV9MT0FEX0RPTkU6IG51bGwsXG5cdEZSQU1FX0xPQURfRkFJTDogbnVsbCxcblx0RlJBTUVfU0VMRUNUOiBudWxsLFxuXHRGUkFNRV9VUERBVEVfQ09OVEVOVDogbnVsbCxcblx0RlJBTUVfU0VUVElOR1NfQ09OVEVOVDogbnVsbCxcblx0RlJBTUVfQ09OVEVOVF9VUERBVEVEOiBudWxsLFxuXHRGUkFNRV9DT05ORUNUOiBudWxsLFxuXHRGUkFNRV9ESVNDT05ORUNUOiBudWxsLFxuXG5cdC8vIGNvbnRlbnQgYWN0aW9uIHR5cGVzXG5cdENPTlRFTlRfTE9BRDogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1NFTkQ6IG51bGwsXG5cdENPTlRFTlRfU0xJREVfQ0hBTkdFRDogbnVsbCxcblx0Q09OVEVOVF9BREQ6IG51bGwsXG5cdENPTlRFTlRfQUREX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfQUREX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9ET05FOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9GQUlMOiBudWxsLFxuXG5cdE1FTlVfVE9HR0xFOiBudWxsLFxuXHRTRVRUSU5HU19UT0dHTEU6IG51bGwsXG5cblx0Ly8gZW1pdHRlZCBieSBzdG9yZXNcblx0Q0hBTkdFX0VWRU5UOiBudWxsXG59KTsiLCJ2YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJ2ZsdXgnKS5EaXNwYXRjaGVyO1xuXG52YXIgQXBwRGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG5cbi8qKlxuKiBBIGJyaWRnZSBmdW5jdGlvbiBiZXR3ZWVuIHRoZSB2aWV3cyBhbmQgdGhlIGRpc3BhdGNoZXIsIG1hcmtpbmcgdGhlIGFjdGlvblxuKiBhcyBhIHZpZXcgYWN0aW9uLiAgQW5vdGhlciB2YXJpYW50IGhlcmUgY291bGQgYmUgaGFuZGxlU2VydmVyQWN0aW9uLlxuKiBAcGFyYW0gIHtvYmplY3R9IGFjdGlvbiBUaGUgZGF0YSBjb21pbmcgZnJvbSB0aGUgdmlldy5cbiovXG5BcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24pIHtcblx0YWN0aW9uLnNvdXJjZSA9ICdWSUVXX0FDVElPTic7XG5cdHRoaXMuZGlzcGF0Y2goYWN0aW9uKTtcbn1cblxuXG4vKipcbiogQSBicmlkZ2UgZnVuY3Rpb24gYmV0d2VlbiB0aGUgc2VydmVyIGFuZCB0aGUgZGlzcGF0Y2hlciwgbWFya2luZyB0aGUgYWN0aW9uXG4qIGFzIGEgc2VydmVyIGFjdGlvbi5cbiogQHBhcmFtICB7b2JqZWN0fSBhY3Rpb24gVGhlIGRhdGEgY29taW5nIGZyb20gdGhlIHNlcnZlci5cbiovXG5BcHBEaXNwYXRjaGVyLmhhbmRsZVNlcnZlckFjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXHRhY3Rpb24uc291cmNlID0gJ1NFUlZFUl9BQ1RJT04nO1xuXHR0aGlzLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwRGlzcGF0Y2hlcjsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfY29udGVudCA9IFtdLFxuXHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IG51bGw7XG5cblxudmFyIENvbnRlbnRTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IGNvbnRlbnQ7XG5cdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBfY29udGVudFswXS5faWQ7XG5cdFx0Y29uc29sZS5sb2coJ2luaXQnLCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdH0sXG5cblx0YWRkQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50LnB1c2goY29udGVudCk7XG5cdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBjb250ZW50Ll9pZDtcblx0fSxcblxuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQgPSBfLnJlbW92ZShfY29udGVudCwge19pZDogY29udGVudC5faWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHRnZXRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2NvbnRlbnQ7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyBjb25zb2xlLmxvZygnZ2V0U2VsZWN0ZWRDb250ZW50OicsIF9jb250ZW50LCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdFx0cmV0dXJuIF8uZmluZChfY29udGVudCwgeydfaWQnOiBfc2VsZWN0ZWRfY29udGVudF9pZH0pO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG4gIFx0XG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBcdHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGxvYWRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmluaXQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBsb2FkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicpO1xuXHRcdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBhY3Rpb24uY29udGVudF9pZDtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERDpcblx0XHRcdGNvbnNvbGUubG9nKCdhZGRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgYWRkZWQ6ICcsIGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5hZGRDb250ZW50KGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBiZSBhZGRlZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG4gICAgXHRcdFxuXHRcdFx0Ly8gQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgfVxuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1k6XG5cdCAgICAvLyAgIGRlc3Ryb3koYWN0aW9uLmlkKTtcblx0ICAgIC8vICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZX0NPTVBMRVRFRDpcblx0ICAgIC8vICAgZGVzdHJveUNvbXBsZXRlZCgpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudFN0b3JlOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9mcmFtZXMgPSB7fTtcblxudmFyIGFkZEZyYW1lID0gZnVuY3Rpb24oZnJhbWUsIHNlbGVjdCkge1xuXHRfZnJhbWVzW2ZyYW1lLl9pZF0gPSBmcmFtZTtcblx0aWYgKHNlbGVjdCAhPT0gZmFsc2UpIHNlbGVjdEZyYW1lKGZyYW1lKTtcbn1cblxudmFyIHJlbW92ZUZyYW1lID0gZnVuY3Rpb24oZnJhbWUpe1xuXHRjb25zb2xlLmxvZygncmVtb3ZlRnJhbWUnLCBmcmFtZSk7XG5cdHZhciBpZCA9IGZyYW1lLl9pZDtcblx0aWYgKGlkIGluIF9mcmFtZXMpIGRlbGV0ZSBfZnJhbWVzW2lkXTtcblx0Y29uc29sZS5sb2coX2ZyYW1lcyk7XG59O1xuXG52YXIgc2VsZWN0RnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuXHRjb25zb2xlLmxvZygnc2VsZWN0RnJhbWU6ICcsIGZyYW1lKTtcblxuXHQvLyB1bnNlbGVjdCBjdXJyZW50bHkgc2VsZWN0ZWRcblx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcblx0aWYgKHNlbGVjdGVkRnJhbWUpIHtcblx0XHRzZWxlY3RlZEZyYW1lLnNlbGVjdGVkID0gZmFsc2U7XG5cdH1cblxuXHQvLyBub3cgc2V0IHRoZSBuZXcgc2VsZWN0ZWQgZnJhbWUgXG5cdHZhciBfc2VsZWN0ZWRGcmFtZSA9IF8uZmluZChfZnJhbWVzLCB7X2lkOiBmcmFtZS5faWR9KTtcblx0X3NlbGVjdGVkRnJhbWUuc2VsZWN0ZWQgPSB0cnVlO1xufVxuXG52YXIgRnJhbWVTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdF8uZWFjaChmcmFtZXMsIGFkZEZyYW1lKTtcblxuXHRcdC8vIHNlZSBpZiBhbnkgZnJhbWUgaXMgbWFya2VkIGFzIHNlbGVjdGVkIGZyb20gZGIsIFxuXHRcdC8vIG90aGVyd2lzZSBzZWxlY3QgdGhlIGZpcnN0IGZyYW1lLlxuXHRcdGlmICghXy5maW5kKF9mcmFtZXMsIHtzZWxlY3RlZDogdHJ1ZX0pKSB7XG5cdFx0XHRfLnNhbXBsZShfZnJhbWVzKS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0RnJhbWU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIF9mcmFtZXNbaWRdO1xuXHR9LFxuXG5cdGdldEFsbEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2dldEFsbEZyYW1lczogJywgX2ZyYW1lcyk7XG5cdFx0cmV0dXJuIF8ubWFwKF9mcmFtZXMsIGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gZnJhbWU7XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmluZChfZnJhbWVzLCB7c2VsZWN0ZWQ6IHRydWV9KTtcblx0fSxcblxuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogX2ZyYW1lcyxcblx0XHRcdHNlbGVjdGVkRnJhbWU6IHRoaXMuZ2V0U2VsZWN0ZWRGcmFtZSgpXG5cdFx0fTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBBIGZyYW1lIGhhcyBjb25uZWN0ZWQuIFNpbXBseSB1cGRhdGVkIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCBvdmVyd3JpdGUgcHJldmlvdXMgZnJhbWVcblx0XHRjb25zb2xlLmxvZygnY29ubmVjdEZyYW1lOiAnLCBmcmFtZSk7XG5cdFx0YWRkRnJhbWUoZnJhbWUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBIGZyYW1lIGhhcyBkaXNjb25uZWN0ZWQuIFNpbXBseSB1cGRhdGVkIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRkaXNjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCBvdmVyd3JpdGUgcHJldmlvdXMgZnJhbWVcblx0XHRhZGRGcmFtZShmcmFtZSwgZmFsc2UpO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG4gIFx0XG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBmcmFtZXMuLi4nKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBsb2FkZWQ6ICcsIGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5pbml0KGFjdGlvbi5mcmFtZXMpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2ZyYW1lcyBmYWlsZWQgdG8gbG9hZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5jb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuZGlzY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX1NFTEVDVDpcbiAgICBcdFx0c2VsZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0RnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCkuY29udGVudCA9IGFjdGlvbi5jb250ZW50O1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVEOlxuXHRcdFx0Ly8gYWRkaW5nIHRoZSBmcmFtZSBzaW5jZSBpdCB3aWxsIHJlcGxhY2UgY3VycmVudCBpbnN0YW5jZVxuXHRcdFx0YWRkRnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgRnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIH1cblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZOlxuXHQgICAgLy8gICBkZXN0cm95KGFjdGlvbi5pZCk7XG5cdCAgICAvLyAgIEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVTdG9yZTsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdGFzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaCcpLmFzc2lnbixcblx0XyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbnZhciBfbWVudU9wZW4gPSBmYWxzZSxcblx0X3NldHRpbmdzT3BlbiA9IGZhbHNlO1xuXG52YXIgX3RvZ2dsZU1lbnUgPSBmdW5jdGlvbigpIHtcblx0X21lbnVPcGVuID0gIV9tZW51T3Blbjtcbn1cblxudmFyIF90b2dnbGVTZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xuXHRfc2V0dGluZ3NPcGVuID0gIV9zZXR0aW5nc09wZW47XG59XG5cblxudmFyIE1lbnVTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGdldE1lbnVTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IF9tZW51T3BlblxuXHRcdH07XG5cdH0sXG5cblx0Z2V0U2V0dGluZ3NTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG9wZW46IF9zZXR0aW5nc09wZW5cblx0XHR9O1xuXHR9LFxuXG5cdGdldEZvb3Rlck5hdlN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXG5cdFx0fTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblx0XG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG4gIFx0XG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cbi8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgdXBkYXRlc1xuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgXHRzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuTUVOVV9UT0dHTEU6XG4gICAgXHRcdF90b2dnbGVNZW51KCk7XG5cdFx0XHRNZW51U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cdFx0XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5TRVRUSU5HU19UT0dHTEU6XG4gICAgXHRcdF90b2dnbGVTZXR0aW5ncygpO1xuXHRcdFx0TWVudVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51U3RvcmU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcC5qcycpLFxuICAgIGJyb3dzZXJfc3RhdGUgPSByZXF1aXJlKCcuL2Jyb3dzZXJfc3RhdGVfbWFuYWdlcicpLFxuICAgIEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG5cbmJyb3dzZXJfc3RhdGUuaW5pdCgpO1xuXG5SZWFjdC5pbml0aWFsaXplVG91Y2hFdmVudHModHJ1ZSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdhdHRhY2hpbmcgRmFzdENsaWNrJyk7XG5cdEZhc3RDbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG59KTtcblxuUmVhY3QucmVuZGVyKFxuXHQ8QXBwIC8+LFxuXHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnT3BlbkZyYW1lJylcbikiXX0=
