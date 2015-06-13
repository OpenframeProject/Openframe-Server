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
		AppDispatcher.dispatch({
			actionType: OFConstants.CONTENT_LOAD
		});

		// fetch the content
		$.getJSON(endpoints.all_content)
			.done(function(content) {
				// load success, fire corresponding action
				AppDispatcher.dispatch({
					actionType: OFConstants.CONTENT_LOAD_DONE,
					content: content
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.dispatch({
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
		AppDispatcher.dispatch({
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
            AppDispatcher.dispatch({
				actionType: OFConstants.CONTENT_ADD_DONE,
				content: resp
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.dispatch({
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
		AppDispatcher.dispatch({
			actionType: OFConstants.CONTENT_REMOVE,
			content: content
		});
		$.ajax({
            url: '/content/' + content._id,
            method: 'DELETE',
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            AppDispatcher.dispatch({
				actionType: OFConstants.CONTENT_REMOVE_DONE
			});
        }).fail(function(err) {
        	console.log(err);
            AppDispatcher.dispatch({
				actionType: OFConstants.CONTENT_REMOVE_FAIL,
				content: content
			});
        });
	},

	slideChanged: function(content_id) {
		AppDispatcher.dispatch({
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
		AppDispatcher.dispatch({
			actionType: OFConstants.FRAME_LOAD
		});

		// fetch the frames
		$.getJSON(endpoints.all_frames)
			.done(function(frames) {
				// load success, fire corresponding action
				AppDispatcher.dispatch({
					actionType: OFConstants.FRAME_LOAD_DONE,
					frames: frames
				});
			})
			.fail(function(err) {
				// load failure, fire corresponding action
				AppDispatcher.dispatch({
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
		AppDispatcher.dispatch({
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
		AppDispatcher.dispatch({
			actionType: OFConstants.FRAME_CONNECTED,
			frame: frame
		});
	},

	frameDisconnected: function(frame) {
		console.log('Frame disconnected: ', frame);
		AppDispatcher.dispatch({
			actionType: OFConstants.FRAME_DISCONNECTED,
			frame: frame
		});
	},

	frameContentUpdated: function(data) {
		console.log('Frame Content updated: ', data);
		AppDispatcher.dispatch({
			actionType: OFConstants.FRAME_CONTENT_UPDATED,
			frame: data
		});
	},

	setup: function(data) {
		var frame = data.frame;
        console.log('Frame Setup', frame);
        // this is a little weird -- why isn't setup just part of the initial
        // connected event?
        AppDispatcher.dispatch({
			actionType: OFConstants.FRAME_CONNECTED,
			frame: frame
		});
    }
	
}

module.exports = FrameActions;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js":[function(require,module,exports){
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

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js":[function(require,module,exports){
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
			React.createElement("div", {className: "row hidden-xs", id: "add-content-div"}, 
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
	Nav = require('./Nav.js'),
	Frame = require('./Frame.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),
	FooterNav = require('./FooterNav.js'),

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

		Socker.on('frame:connected', FrameActions.frameConnected);
        Socker.on('frame:disconnected', FrameActions.frameDisconnected);
        Socker.on('frame:content_updated', FrameActions.frameContentUpdated);
        Socker.on('frame:setup', FrameActions.setup);
	},

	componentDidMount: function() {
		
	},

	componentWillUnmount: function() {
		FrameStore.removeChangeListener(this._onChange);
	},

  	render: function(){
	    return (
	    	React.createElement("div", {className: "container"}, 
				React.createElement("div", {className: "app"}, 
					React.createElement(Nav, null), 
					React.createElement(Frame, null), 
					React.createElement(TransferButtons, null), 
					React.createElement(AddContentForm, null), 
					React.createElement(ContentList, null)
				), 
				React.createElement(FooterNav, null)
			)
	    )
  	}
});

module.exports = App;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js","../api/Socker":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/api/Socker.js","../config":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/config.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","../stores/FrameStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/FrameStore.js","./AddContentForm.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./ContentList.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./FooterNav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js","./Frame.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Frame.js","./Nav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./TransferButtons.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
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
		this._initSlider();
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
  		
		var slide_index = $('div.swiper-slide').length;
        this.swiper.slideTo(slide_index);
  	},

  	_initSlider: function() {
  		var el = React.findDOMNode(this.refs.Swiper);
		this.swiper = new Swiper(el, {
	        slidesPerView: 1,
	        spaceBetween: 30,
	        loop: true,
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

},{"../actions/ContentActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/ContentActions.js","../stores/ContentStore":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FooterNav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var FooterNav = React.createClass({displayName: "FooterNav",

	render: function() {
		return (
			React.createElement("div", {className: "row nav-footer"}, 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer active", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-stop"}))
				), 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-stop"}))
				), 
				React.createElement("div", {className: "col-xs-4"}, 
					React.createElement("a", {className: "btn-nav-footer", href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-stop"}))
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

	render: function() {
		if (!this.state.frame) {
			return React.createElement("div", null, "No frames available.")
		}
		var w_h_ratio = this.state.frame && this.state.frame.settings ? this.state.frame.settings.w_h_ratio : 1;

		var url = this.state.frame && this.state.frame.current_content ? this.state.frame.current_content.url : '';
		var divStyle = {
			backgroundImage: 'url(' + url + ')',
		};

		console.log(w_h_ratio);

		var whStyle = {
			paddingBottom: (1/w_h_ratio) * 100 + '%'
		};

		var active = this.state.frame.active ? '*' : '';
		return (
			React.createElement("div", {className: "row frames-list"}, 
				React.createElement("div", {className: "col-xl-12 frame-outer-container"}, 
					React.createElement("button", {type: "button", className: "btn btn-primary btn-xs btn-settings hide", "data-toggle": "modal", "data-target": "#myModal"}, "S"), 
					React.createElement("div", {className: "frame-inner-container", style: whStyle}, 
		            	React.createElement("div", {className: "frame", style: divStyle})
		            ), 
		            React.createElement("div", {className: "frame-name text-center"}, 
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
	},

	render: function() {
		var active = this.props.frame.active ? '*' : '';
		return (
			React.createElement("li", {onClick: this.handleFrameSelection}, 
				React.createElement("a", {href: "#"}, this.props.frame.name, " ", active)
			)
		);
	}
});

module.exports = NavFrameLink;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/FrameActions":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/actions/FrameActions.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	FrameActions = require('../actions/FrameActions'),
	ContentStore = require('../stores/ContentStore');

var TransferButtons = React.createClass({displayName: "TransferButtons",

	render: function() {
		return (
			React.createElement("div", {className: "row visible-xs transfer-buttons"}, 
                React.createElement("div", {className: "col-xs-12 text-center"}, 
                    React.createElement("div", {className: "btn-group", role: "group", "aria-label": "..."}, 
                        React.createElement("button", {type: "button", className: "btn btn-xs btn-default btn-send btn-transfer", onClick: this.sendClicked}, 
                            React.createElement("span", {className: "icon icon-send", "aria-hidden": "true"})
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
	port: '8888'
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


	// emitted by stores
	CHANGE_EVENT: null
});

},{"keymirror":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/keymirror/index.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js":[function(require,module,exports){
(function (global){
var Dispatcher = (typeof window !== "undefined" ? window.Flux : typeof global !== "undefined" ? global.Flux : null).Dispatcher;

module.exports = new Dispatcher();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/stores/ContentStore.js":[function(require,module,exports){
(function (global){
var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null).assign,
	_ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);


var _content = [],
	_selected_content_id = 0;


var ContentStore = assign({}, EventEmitter.prototype, {

	init: function(content) {
		_content = content;
		_selected_content_id = _content[0]._id;
	},

	addContent: function(content) {
		_content.push(content);
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
	_selectedFrame = null;

var addFrame = function(frame) {
	// removeFrame(frame);
	_frames[frame._id] = frame;
};

var removeFrame = function(frame){
	console.log('removeFrame', frame);
	var id = frame._id;
	if (id in _frames) delete _frames[id];
	console.log(_frames);
};

var FrameStore = assign({}, EventEmitter.prototype, {

	init: function(frames) {
		_.each(frames, addFrame);

		// see if any a frame is marked as selected from db, 
		// otherwise select the first frame.
		var selected = _.find(_frames, {selected: true});
		_selectedFrame = selected || frames[0];
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
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
		return _selectedFrame;
	},

	getState: function() {
		return {
			frames: _frames,
			selectedFrame: _selectedFrame
		};
	},

	/**
	 * A frame has connected. Simply updated the frame object in our collection.
	 */
	connectFrame: function(frame) {
		// addFrame will overwrite previous frame
		console.log('connectFrame: ', frame);
		addFrame(frame);
		_selectedFrame = frame;
	},

	/**
	 * A frame has disconnected. Simply updated the frame object in our collection.
	 */
	disconnectFrame: function(frame) {
		// addFrame will overwrite previous frame
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
			_selectedFrame = action.frame;
			FrameStore.emitChange();
			break;

		case OFConstants.CONTENT_SEND:
    		_selectedFrame.content = action.content;
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_CONTENT_UPDATED:
    		_selectedFrame = action.frame;
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

},{"../constants/OFConstants":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/constants/OFConstants.js","../dispatcher/AppDispatcher":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/dispatcher/AppDispatcher.js","events":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/node_modules/browserify/node_modules/events/events.js"}],"openframe/static/src/js/react-main.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    App = require('./components/App.js');

React.render(
	React.createElement(App, null),
	document.getElementById('OpenFrame')
)

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./components/App.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js"}]},{},["openframe/static/src/js/react-main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9Db250ZW50QWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudEZvcm0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BcHAuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9Db250ZW50TGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2LmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaW5rLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvVHJhbnNmZXJCdXR0b25zLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbmZpZy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25zdGFudHMvT0ZDb25zdGFudHMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9Db250ZW50U3RvcmUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0ZyYW1lU3RvcmUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvcmVhY3QtbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsS0FBSyxRQUFROztHQUVWO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVOzs7Ozs7QUN2SjNCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDeEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDekIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7O0FBRXpDLEtBQUssQ0FBQyxNQUFNO0NBQ1gsb0JBQUMsR0FBRyxFQUFBLElBQUEsQ0FBRyxDQUFBO0NBQ1AsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYW4gZW51bWVyYXRpb24gd2l0aCBrZXlzIGVxdWFsIHRvIHRoZWlyIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgdmFyIENPTE9SUyA9IGtleU1pcnJvcih7Ymx1ZTogbnVsbCwgcmVkOiBudWxsfSk7XG4gKiAgIHZhciBteUNvbG9yID0gQ09MT1JTLmJsdWU7XG4gKiAgIHZhciBpc0NvbG9yVmFsaWQgPSAhIUNPTE9SU1tteUNvbG9yXTtcbiAqXG4gKiBUaGUgbGFzdCBsaW5lIGNvdWxkIG5vdCBiZSBwZXJmb3JtZWQgaWYgdGhlIHZhbHVlcyBvZiB0aGUgZ2VuZXJhdGVkIGVudW0gd2VyZVxuICogbm90IGVxdWFsIHRvIHRoZWlyIGtleXMuXG4gKlxuICogICBJbnB1dDogIHtrZXkxOiB2YWwxLCBrZXkyOiB2YWwyfVxuICogICBPdXRwdXQ6IHtrZXkxOiBrZXkxLCBrZXkyOiBrZXkyfVxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xudmFyIGtleU1pcnJvciA9IGZ1bmN0aW9uKG9iaikge1xuICB2YXIgcmV0ID0ge307XG4gIHZhciBrZXk7XG4gIGlmICghKG9iaiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheShvYmopKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigna2V5TWlycm9yKC4uLik6IEFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICB9XG4gIGZvciAoa2V5IGluIG9iaikge1xuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXRba2V5XSA9IGtleTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlNaXJyb3I7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0YWxsX2NvbnRlbnQ6ICcvY29udGVudC91c2VyLycgKyBPRl9VU0VSTkFNRVxufVxuXG52YXIgQ29udGVudEFjdGlvbnMgPSB7XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSBjb250ZW50IGFzeW5jaHJvbm91c2x5IGZyb20gdGhlIHNlcnZlci5cblx0ICovXG5cdGxvYWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnQ29udGVudEFjdGlvbnMubG9hZENvbnRlbnRzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGNvbnRlbnRcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIGNvbnRlbnRcblx0XHQkLmdldEpTT04oZW5kcG9pbnRzLmFsbF9jb250ZW50KVxuXHRcdFx0LmRvbmUoZnVuY3Rpb24oY29udGVudCkge1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0RPTkUsXG5cdFx0XHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0Ly8gbG9hZCBmYWlsdXJlLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhIG5ldyBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQURELFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0RPTkUsXG5cdFx0XHRcdGNvbnRlbnQ6IHJlc3Bcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRkFJTCxcblx0XHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdFx0fSk7XG4gICAgICAgIH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYSBjb250ZW50IGl0ZW0uIFBlcmZvcm1zIHNlcnZlciByZXF1ZXN0LlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRlbnRcblx0ICovXG5cdHJlbW92ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFLFxuXHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdH0pO1xuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudC8nICsgY29udGVudC5faWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0RPTkVcblx0XHRcdH0pO1xuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBcdGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9SRU1PVkVfRkFJTCxcblx0XHRcdFx0Y29udGVudDogY29udGVudFxuXHRcdFx0fSk7XG4gICAgICAgIH0pO1xuXHR9LFxuXG5cdHNsaWRlQ2hhbmdlZDogZnVuY3Rpb24oY29udGVudF9pZCkge1xuXHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuQ09OVEVOVF9TTElERV9DSEFOR0VELFxuXHRcdFx0Y29udGVudF9pZDogY29udGVudF9pZFxuXHRcdH0pO1xuXHR9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRBY3Rpb25zOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdE9GQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL09GQ29uc3RhbnRzJyksXG5cdCQgPSByZXF1aXJlKCdqcXVlcnknKSxcblx0U29ja2VyID0gcmVxdWlyZSgnLi4vYXBpL1NvY2tlcicpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIGVuZHBvaW50cyA9IHtcblx0YWxsX2ZyYW1lczogJy9mcmFtZXMvdXNlci8nICsgT0ZfVVNFUk5BTUVcbn1cblxudmFyIEZyYW1lQWN0aW9ucyA9IHtcblxuXHQvKipcblx0ICogRmV0Y2ggdGhlIGZyYW1lcyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0bG9hZEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCknKTtcblx0XHQvLyBkaXNwYXRjaCBhbiBhY3Rpb24gaW5kaWNhdGluZyB0aGF0IHdlJ3JlIGxvYWRpbmcgdGhlIGZyYW1lc1xuXHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRFxuXHRcdH0pO1xuXG5cdFx0Ly8gZmV0Y2ggdGhlIGZyYW1lc1xuXHRcdCQuZ2V0SlNPTihlbmRwb2ludHMuYWxsX2ZyYW1lcylcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdFx0XHQvLyBsb2FkIHN1Y2Nlc3MsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGZyYW1lczogZnJhbWVzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQvLyBsb2FkIGZhaWx1cmUsIGZpcmUgY29ycmVzcG9uZGluZyBhY3Rpb25cblx0XHRcdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9GQUlMLFxuXHRcdFx0XHRcdGVycjogZXJyXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNlbGVjdCBhIGZyYW1lLlxuXHQgKiBAcGFyYW0gIHtvYmplY3R9IGZyYW1lXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9TRUxFQ1QsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogVXBkYXRlIHRoZSBjb250ZW50IG9uIHRoZSBzZWxlY3RlZCBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHR1cGRhdGVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0dmFyIGZyYW1lID0gRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCk7XG5cdFx0Y29uc29sZS5sb2coZnJhbWUsIGNvbnRlbnQpO1xuXHRcdC8vIHZhciBjb250ZW50ID0gQ29udGVudFN0b3JlLmdldFNlbGVjdGVkQ29udGVudCgpO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lX2lkOiBmcmFtZS5faWQsXG4gICAgICAgICAgICBjb250ZW50X2lkOiBjb250ZW50Ll9pZFxuICAgICAgICB9O1xuICAgICAgICBTb2NrZXIuc2VuZCgnZnJhbWU6dXBkYXRlX2NvbnRlbnQnLCBkYXRhKTtcblx0XHRcblx0XHQvLyBXZWJTb2NrZXQgZXZlbnQgaGFuZGxlciBmb3IgZnJhbWU6Y29udGVudF91cGRhdGVkIHRyaWdnZXJzIHRoZSBkaXNwYXRjaFxuXHR9LFxuXG5cdGZyYW1lQ29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBDb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lRGlzY29ubmVjdGVkOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZSBkaXNjb25uZWN0ZWQ6ICcsIGZyYW1lKTtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0RJU0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGZyYW1lQ29udGVudFVwZGF0ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29udGVudCB1cGRhdGVkOiAnLCBkYXRhKTtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRCxcblx0XHRcdGZyYW1lOiBkYXRhXG5cdFx0fSk7XG5cdH0sXG5cblx0c2V0dXA6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgZnJhbWUgPSBkYXRhLmZyYW1lO1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhbWUgU2V0dXAnLCBmcmFtZSk7XG4gICAgICAgIC8vIHRoaXMgaXMgYSBsaXR0bGUgd2VpcmQgLS0gd2h5IGlzbid0IHNldHVwIGp1c3QgcGFydCBvZiB0aGUgaW5pdGlhbFxuICAgICAgICAvLyBjb25uZWN0ZWQgZXZlbnQ/XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfQ09OTkVDVEVELFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG4gICAgfVxuXHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZUFjdGlvbnM7IiwiU29ja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBfc2VsZiA9IHt9LFxuICAgICAgICBfZXZlbnRIYW5kbGVycyA9IHt9LFxuICAgICAgICBfY29ubmVjdGVkID0gZmFsc2UsXG4gICAgICAgIF9vcHRzID0ge1xuICAgICAgICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tJbnRlcnZhbDogMTAwMDBcbiAgICAgICAgfSxcbiAgICAgICAgX3VybCxcbiAgICAgICAgX3dzLFxuICAgICAgICBfdGltZXI7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSB3ZWJzb2NrZXQgY29ubmVjdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHVybCAgVGhlIHNlcnZlciBVUkwuXG4gICAgICogQHBhcmFtICB7b2JqZWN0fSBvcHRzIE9wdGlvbmFsIHNldHRpbmdzXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2Nvbm5lY3QodXJsLCBvcHRzKSB7XG4gICAgICAgIF91cmwgPSB1cmw7XG4gICAgICAgIGlmIChvcHRzKSBfZXh0ZW5kKF9vcHRzLCBvcHRzKTtcbiAgICAgICAgX3dzID0gbmV3IFdlYlNvY2tldCh1cmwpO1xuXG4gICAgICAgIF93cy5vbm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIG9wZW5lZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoX29wdHMub25PcGVuKSBfb3B0cy5vbk9wZW4oKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gY2xvc2VkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoX29wdHMub25DbG9zZSkgX29wdHMub25DbG9zZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldnQuZGF0YSksXG4gICAgICAgICAgICAgICAgbmFtZSA9IG1lc3NhZ2UubmFtZSxcbiAgICAgICAgICAgICAgICBkYXRhID0gbWVzc2FnZS5kYXRhO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggZXZlbnQgaGFuZGxlciwgY2FsbCB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9ldmVudEhhbmRsZXJzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdW2ldKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSArIFwiIGV2ZW50IG5vdCBoYW5kbGVkLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX29wdHMua2VlcEFsaXZlKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKF90aW1lcik7XG4gICAgICAgICAgICBfdGltZXIgPSBzZXRJbnRlcnZhbChfY2hlY2tDb25uZWN0aW9uLCBfb3B0cy5jaGVja0ludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXSA9IFtjYWxsYmFja107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vZmYobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBfZXZlbnRIYW5kbGVyc1tuYW1lXS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYW4gZXZlbnQuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBuYW1lIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGRhdGEgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX3NlbmQobmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLnNlbmQoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLiBJZiBub3QsIHRyeSB0byByZWNvbm5lY3QuXG4gICAgICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2NoZWNrQ29ubmVjdGlvbigpIHtcbiAgICAgICAgaWYgKCFfY29ubmVjdGVkKSB7XG4gICAgICAgICAgICBfY29ubmVjdChfdXJsLCBfb3B0cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVdGlsaXR5IGZ1bmN0aW9uIGZvciBleHRlbmRpbmcgYW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gb2JqIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2V4dGVuZChvYmopIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuXG4gICAgX3NlbGYub24gPSBfb247XG4gICAgX3NlbGYub2ZmID0gX29mZjtcbiAgICBfc2VsZi5zZW5kID0gX3NlbmQ7XG4gICAgX3NlbGYuY29ubmVjdCA9IF9jb25uZWN0O1xuICAgIHJldHVybiBfc2VsZjtcbn0pKCk7XG5cbi8vIENPTU1PTi5KU1xuaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gU29ja2VyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgQ29udGVudEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0NvbnRlbnRBY3Rpb25zJyk7XG5cbnZhciBBZGRDb250ZW50Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBoYW5kbGVGb3JtU3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHVybCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlO1xuXG4gICAgICAgIGlmICghdXJsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIHVzZXJzOiBbT0ZfVVNFUk5BTUVdXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWJtaXR0aW5nIGNvbnRlbnQ6ICcsIGNvbnRlbnQpO1xuICAgICAgICBDb250ZW50QWN0aW9ucy5hZGRDb250ZW50KGNvbnRlbnQpO1xuXG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLnZhbHVlID0gJyc7XG4gICAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5VUkwpLmZvY3VzKCk7XG4gICAgfSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgaGlkZGVuLXhzXCIgaWQ9XCJhZGQtY29udGVudC1kaXZcIj5cbiAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZVwiIGlkPVwiYWRkLWZvcm1cIiBvblN1Ym1pdD17dGhpcy5oYW5kbGVGb3JtU3VibWl0fT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGxhYmVsIGZvcj1cIlNlbmRUb1VzZXJcIj5VUkw8L2xhYmVsPiAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJVUkxcIiBwbGFjZWhvbGRlcj1cImVudGVyIFVSTFwiIHJlZj1cIlVSTFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdCBidG4tYWRkLWNvbnRlbnRcIiBocmVmPVwiI2FkZC1jb250ZW50XCIgaWQ9XCJhZGQtY29udGVudC1idXR0b25cIj5BZGQgQ29udGVudDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRkQ29udGVudEZvcm07IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2ID0gcmVxdWlyZSgnLi9OYXYuanMnKSxcblx0RnJhbWUgPSByZXF1aXJlKCcuL0ZyYW1lLmpzJyksXG5cdFRyYW5zZmVyQnV0dG9ucyA9IHJlcXVpcmUoJy4vVHJhbnNmZXJCdXR0b25zLmpzJyksXG5cdEFkZENvbnRlbnRGb3JtID0gcmVxdWlyZSgnLi9BZGRDb250ZW50Rm9ybS5qcycpLFxuXHRDb250ZW50TGlzdCA9IHJlcXVpcmUoJy4vQ29udGVudExpc3QuanMnKSxcblx0Rm9vdGVyTmF2ID0gcmVxdWlyZSgnLi9Gb290ZXJOYXYuanMnKSxcblxuXHRBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpLFxuXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKSxcblxuXHRjb25mID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbi8qKlxuICogVGhlIEFwcCBpcyB0aGUgcm9vdCBjb21wb25lbnQgcmVzcG9uc2libGUgZm9yOlxuICogLSBzZXR0aW5nIHVwIHN0cnVjdHVyZSBvZiBjaGlsZCBjb21wb25lbnRzXG4gKlxuICogSW5kaXZpZHVhbCBjb21wb25lbnRzIHJlZ2lzdGVyIGZvciBTdG9yZSBzdGF0ZSBjaGFuZ2UgZXZlbnRzXG4gKi9cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghZ2xvYmFsLk9GX1VTRVJOQU1FKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT0ZfVVNFUk5BTUUgbm90IGRlZmluZWQuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0U29ja2VyLmNvbm5lY3QoXCJ3czovL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9hZG1pbi93cy9cIiArIE9GX1VTRVJOQU1FKTtcblxuXHRcdFNvY2tlci5vbignZnJhbWU6Y29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lQ29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpkaXNjb25uZWN0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVEaXNjb25uZWN0ZWQpO1xuICAgICAgICBTb2NrZXIub24oJ2ZyYW1lOmNvbnRlbnRfdXBkYXRlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIEZyYW1lQWN0aW9ucy5zZXR1cCk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFxuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0fSxcblxuICBcdHJlbmRlcjogZnVuY3Rpb24oKXtcblx0ICAgIHJldHVybiAoXG5cdCAgICBcdDxkaXYgY2xhc3NOYW1lPVwiY29udGFpbmVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdhcHAnPlxuXHRcdFx0XHRcdDxOYXYgLz5cblx0XHRcdFx0XHQ8RnJhbWUgLz5cblx0XHRcdFx0XHQ8VHJhbnNmZXJCdXR0b25zIC8+XG5cdFx0XHRcdFx0PEFkZENvbnRlbnRGb3JtIC8+XG5cdFx0XHRcdFx0PENvbnRlbnRMaXN0IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8Rm9vdGVyTmF2IC8+XG5cdFx0XHQ8L2Rpdj5cblx0ICAgIClcbiAgXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyksXG5cdENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBDb250ZW50TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udGVudDogW11cblx0XHR9XG5cdH0sXG5cdFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Q29udGVudEFjdGlvbnMubG9hZENvbnRlbnQoKTtcblx0XHRDb250ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGZ1bmN0aW9uIGNyZWF0ZUNvbnRlbnRTbGlkZShjb250ZW50SXRlbSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NyZWF0aW5nIHNsaWRlOiAnLCBjb250ZW50SXRlbSk7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8ZGl2IGtleT17Y29udGVudEl0ZW0uX2lkLiRvaWR9IGNsYXNzTmFtZT1cInN3aXBlci1zbGlkZVwiIG9uQ2xpY2s9e251bGx9PlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y29udGVudEl0ZW0udXJsfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcblx0XHR9XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLW91dGVyLWNvbnRhaW5lclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1jb250YWluZXJcIiByZWY9XCJTd2lwZXJcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cblx0ICAgICAgICAgICAgICAgICAgICBcblx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuXHQgICAgICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRjb250ZW50OiBDb250ZW50U3RvcmUuZ2V0Q29udGVudCgpXG4gIFx0XHR9KTtcbiAgXHRcdFxuICBcdFx0Ly8gVE9ETzogYmV0dGVyIFJlYWN0IGludGVncmF0aW9uIGZvciB0aGUgc3dpcGVyXG4gIFx0XHRcbiAgXHRcdGlmICghdGhpcy5zd2lwZXIpIHtcbiAgXHRcdFx0dGhpcy5faW5pdFNsaWRlcigpO1xuICBcdFx0fVxuXG4gIFx0XHR0aGlzLl9wb3B1bGF0ZVNsaWRlcigpXG4gIFx0XHRcblx0XHR2YXIgc2xpZGVfaW5kZXggPSAkKCdkaXYuc3dpcGVyLXNsaWRlJykubGVuZ3RoO1xuICAgICAgICB0aGlzLnN3aXBlci5zbGlkZVRvKHNsaWRlX2luZGV4KTtcbiAgXHR9LFxuXG4gIFx0X2luaXRTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLlN3aXBlcik7XG5cdFx0dGhpcy5zd2lwZXIgPSBuZXcgU3dpcGVyKGVsLCB7XG5cdCAgICAgICAgc2xpZGVzUGVyVmlldzogMSxcblx0ICAgICAgICBzcGFjZUJldHdlZW46IDMwLFxuXHQgICAgICAgIGxvb3A6IHRydWUsXG5cdCAgICAgICAga2V5Ym9hcmRDb250cm9sOiB0cnVlLFxuXHQgICAgICAgIG9uU2xpZGVDaGFuZ2VFbmQ6IHRoaXMuX3NsaWRlQ2hhbmdlRW5kXG5cdCAgICB9KTtcblxuXG4gIFx0fSxcblxuICBcdF9wb3B1bGF0ZVNsaWRlcjogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnN3aXBlci5yZW1vdmVBbGxTbGlkZXMoKTtcbiAgXHRcdHRoaXMuc3RhdGUuY29udGVudC5mb3JFYWNoKHRoaXMuX2FkZFNsaWRlKTtcbiAgXHR9LFxuXG4gIFx0X2FkZFNsaWRlOiBmdW5jdGlvbihjb250ZW50SXRlbSkge1xuICBcdFx0dmFyIGh0bWwgPSAnPGRpdiBjbGFzcz1cInN3aXBlci1zbGlkZVwiIGRhdGEtY29udGVudGlkPVwiJyArIGNvbnRlbnRJdGVtLl9pZCArICdcIj48aW1nIHNyYz0nICsgY29udGVudEl0ZW0udXJsICsgJyAvPjwvZGl2Pidcblx0XHR0aGlzLnN3aXBlci5wcmVwZW5kU2xpZGUoaHRtbCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZVRvOiBmdW5jdGlvbihpbmRleCkge1xuICBcdFx0dGhpcy5zd2lwZXIuc2xpZGVUbyhpbmRleCk7XG4gIFx0fSxcblxuICBcdF9zbGlkZUNoYW5nZUVuZDogZnVuY3Rpb24oc2xpZGVyKSB7XG4gIFx0XHR2YXIgc2xpZGUgPSB0aGlzLnN3aXBlci5zbGlkZXNbdGhpcy5zd2lwZXIuYWN0aXZlSW5kZXhdLFxuICBcdFx0XHRjb250ZW50X2lkID0gc2xpZGUuZGF0YXNldC5jb250ZW50aWQ7XG4gIFx0XHRjb25zb2xlLmxvZygnX3NsaWRlQ2hhbmdlRW5kJywgY29udGVudF9pZCk7XG4gIFx0XHRDb250ZW50QWN0aW9ucy5zbGlkZUNoYW5nZWQoY29udGVudF9pZCk7XG4gIFx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50TGlzdDsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgRm9vdGVyTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IG5hdi1mb290ZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNFwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyIGFjdGl2ZVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1zdG9wXCIgLz48L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy00XCI+XG5cdFx0XHRcdFx0PGEgY2xhc3NOYW1lPVwiYnRuLW5hdi1mb290ZXJcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tc3RvcFwiIC8+PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNFwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXN0b3BcIiAvPjwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3Rlck5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxudmFyIEZyYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lQWN0aW9ucy5sb2FkRnJhbWVzKCk7XG5cdFx0RnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUuZnJhbWUpIHtcblx0XHRcdHJldHVybiA8ZGl2Pk5vIGZyYW1lcyBhdmFpbGFibGUuPC9kaXY+XG5cdFx0fVxuXHRcdHZhciB3X2hfcmF0aW8gPSB0aGlzLnN0YXRlLmZyYW1lICYmIHRoaXMuc3RhdGUuZnJhbWUuc2V0dGluZ3MgPyB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzLndfaF9yYXRpbyA6IDE7XG5cblx0XHR2YXIgdXJsID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudCA/IHRoaXMuc3RhdGUuZnJhbWUuY3VycmVudF9jb250ZW50LnVybCA6ICcnO1xuXHRcdHZhciBkaXZTdHlsZSA9IHtcblx0XHRcdGJhY2tncm91bmRJbWFnZTogJ3VybCgnICsgdXJsICsgJyknLFxuXHRcdH07XG5cblx0XHRjb25zb2xlLmxvZyh3X2hfcmF0aW8pO1xuXG5cdFx0dmFyIHdoU3R5bGUgPSB7XG5cdFx0XHRwYWRkaW5nQm90dG9tOiAoMS93X2hfcmF0aW8pICogMTAwICsgJyUnXG5cdFx0fTtcblxuXHRcdHZhciBhY3RpdmUgPSB0aGlzLnN0YXRlLmZyYW1lLmFjdGl2ZSA/ICcqJyA6ICcnO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBmcmFtZXMtbGlzdFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC14bC0xMiBmcmFtZS1vdXRlci1jb250YWluZXJcIj5cblx0XHRcdFx0XHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLXhzIGJ0bi1zZXR0aW5ncyBoaWRlXCIgZGF0YS10b2dnbGU9XCJtb2RhbFwiIGRhdGEtdGFyZ2V0PVwiI215TW9kYWxcIj5TPC9idXR0b24+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZS1pbm5lci1jb250YWluZXJcIiBzdHlsZT17d2hTdHlsZX0gPlxuXHRcdCAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJmcmFtZVwiIHN0eWxlPXtkaXZTdHlsZX0gLz5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cblx0XHQgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZyYW1lLW5hbWUgdGV4dC1jZW50ZXJcIj5cblx0XHQgICAgICAgICAgICAgICAgPGg2Pnt0aGlzLnN0YXRlLmZyYW1lLm5hbWV9IHthY3RpdmV9PC9oNj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cblx0XHQgICAgICAgIDwvZGl2PlxuXHQgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cbiAgXHRfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICBcdFx0dmFyIHNlbGVjdGVkRnJhbWUgPSBGcmFtZVN0b3JlLmdldFNlbGVjdGVkRnJhbWUoKTtcbiAgXHRcdGNvbnNvbGUubG9nKCdzZWxlY3RlZEZyYW1lOicsIHNlbGVjdGVkRnJhbWUpO1xuICBcdFx0dGhpcy5zZXRTdGF0ZSh7XG4gIFx0XHRcdGZyYW1lOiBzZWxlY3RlZEZyYW1lXG4gIFx0XHR9KTtcbiAgXHR9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBOYXZGcmFtZUxpbmsgPSByZXF1aXJlKCcuL05hdkZyYW1lTGluaycpLFxuICAgIEZyYW1lU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvRnJhbWVTdG9yZScpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcmFtZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lczogW11cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVGcmFtZUxpbmsoZnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZTogJywgZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIDxOYXZGcmFtZUxpbmsga2V5PXtmcmFtZS5faWR9IGZyYW1lPXtmcmFtZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBCcmFuZCBhbmQgdG9nZ2xlIGdldCBncm91cGVkIGZvciBiZXR0ZXIgbW9iaWxlIGRpc3BsYXkgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm5hdmJhci10b2dnbGUgY29sbGFwc2VkIHB1bGwtbGVmdFwiIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzci1vbmx5XCI+VG9nZ2xlIG5hdmlnYXRpb248L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1tdXRlZCBoaWRkZW4teHNcIj48c3BhbiBjbGFzc05hbWU9XCJvcGVuZnJhbWVcIj5vcGVuZnJhbWUvPC9zcGFuPjxzcGFuIGNsYXNzTmFtZT1cInVzZXJuYW1lXCI+e09GX1VTRVJOQU1FfTwvc3Bhbj48L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cImJzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgcm9sZT1cImJ1dHRvblwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPkZyYW1lcyA8c3BhbiBjbGFzc05hbWU9XCJjYXJldFwiIC8+PC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCIgcm9sZT1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuc3RhdGUuZnJhbWVzLm1hcChjcmVhdGVGcmFtZUxpbmsuYmluZCh0aGlzKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIi9sb2dvdXRcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey8qIC8ubmF2YmFyLWNvbGxhcHNlICovfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZnJhbWVzOiBGcmFtZVN0b3JlLmdldEFsbEZyYW1lcygpXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgRnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKTtcblxudmFyIE5hdkZyYW1lTGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlRnJhbWVTZWxlY3Rpb246IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMuc2VsZWN0KHRoaXMucHJvcHMuZnJhbWUpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZSA9IHRoaXMucHJvcHMuZnJhbWUuYWN0aXZlID8gJyonIDogJyc7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBvbkNsaWNrPXt0aGlzLmhhbmRsZUZyYW1lU2VsZWN0aW9ufT5cblx0XHRcdFx0PGEgaHJlZj1cIiNcIj57dGhpcy5wcm9wcy5mcmFtZS5uYW1lfSB7YWN0aXZlfTwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2RnJhbWVMaW5rOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyksXG5cdENvbnRlbnRTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Db250ZW50U3RvcmUnKTtcblxudmFyIFRyYW5zZmVyQnV0dG9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyB2aXNpYmxlLXhzIHRyYW5zZmVyLWJ1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC14cy0xMiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1ncm91cFwiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCIuLi5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCIgb25DbGljaz17dGhpcy5zZW5kQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLXNlbmRcIiBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tc2VuZFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4gKi99XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblxuXHRzZW5kQ2xpY2tlZDogZnVuY3Rpb24oZSkge1xuXHRcdEZyYW1lQWN0aW9ucy51cGRhdGVDb250ZW50KENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKSk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmZXJCdXR0b25zOyIsInZhciBjb25mID0ge1xuXHRkb21haW46ICdsb2NhbGhvc3QnLFxuXHRwb3J0OiAnODg4OCdcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25mOyIsInZhciBrZXltaXJyb3IgPSByZXF1aXJlKCdrZXltaXJyb3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXltaXJyb3Ioe1xuXG5cdC8vIGZyYW1lIGFjdGlvbiB0eXBlc1xuXHRGUkFNRV9MT0FEOiBudWxsLFxuXHRGUkFNRV9MT0FEX0RPTkU6IG51bGwsXG5cdEZSQU1FX0xPQURfRkFJTDogbnVsbCxcblx0RlJBTUVfU0VMRUNUOiBudWxsLFxuXHRGUkFNRV9VUERBVEVfQ09OVEVOVDogbnVsbCxcblx0RlJBTUVfQ09OVEVOVF9VUERBVEVEOiBudWxsLFxuXHRGUkFNRV9DT05ORUNUOiBudWxsLFxuXHRGUkFNRV9ESVNDT05ORUNUOiBudWxsLFxuXG5cdC8vIGNvbnRlbnQgYWN0aW9uIHR5cGVzXG5cdENPTlRFTlRfTE9BRDogbnVsbCxcblx0Q09OVEVOVF9MT0FEX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1NFTkQ6IG51bGwsXG5cdENPTlRFTlRfU0xJREVfQ0hBTkdFRDogbnVsbCxcblx0Q09OVEVOVF9BREQ6IG51bGwsXG5cdENPTlRFTlRfQUREX0RPTkU6IG51bGwsXG5cdENPTlRFTlRfQUREX0ZBSUw6IG51bGwsXG5cdENPTlRFTlRfUkVNT1ZFOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9ET05FOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRV9GQUlMOiBudWxsLFxuXG5cblx0Ly8gZW1pdHRlZCBieSBzdG9yZXNcblx0Q0hBTkdFX0VWRU5UOiBudWxsXG59KTsiLCJ2YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJ2ZsdXgnKS5EaXNwYXRjaGVyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBEaXNwYXRjaGVyKCk7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2NvbnRlbnQgPSBbXSxcblx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSAwO1xuXG5cbnZhciBDb250ZW50U3RvcmUgPSBhc3NpZ24oe30sIEV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcblxuXHRpbml0OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQgPSBjb250ZW50O1xuXHRcdF9zZWxlY3RlZF9jb250ZW50X2lkID0gX2NvbnRlbnRbMF0uX2lkO1xuXHR9LFxuXG5cdGFkZENvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudC5wdXNoKGNvbnRlbnQpO1xuXHR9LFxuXG5cdHJlbW92ZUNvbnRlbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRfY29udGVudCA9IF8ucmVtb3ZlKF9jb250ZW50LCB7X2lkOiBjb250ZW50Ll9pZH0pO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGdldENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY29udGVudDtcblx0fSxcblxuXHRnZXRTZWxlY3RlZENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKCdnZXRTZWxlY3RlZENvbnRlbnQ6JywgX2NvbnRlbnQsIF9zZWxlY3RlZF9jb250ZW50X2lkKTtcblx0XHRyZXR1cm4gXy5maW5kKF9jb250ZW50LCB7J19pZCc6IF9zZWxlY3RlZF9jb250ZW50X2lkfSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcbiAgXHRcbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgbG9hZGVkOiAnLCBhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuaW5pdChhY3Rpb24uY29udGVudCk7XG5cdFx0XHRDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRDpcblx0XHRcdGNvbnNvbGUubG9nKCdzbGlkZSBjaGFuZ2VkLi4uJyk7XG5cdFx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IGFjdGlvbi5jb250ZW50X2lkO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREOlxuXHRcdFx0Y29uc29sZS5sb2coJ2FkZGluZyBjb250ZW50Li4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnY29udGVudCBhZGRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmFkZENvbnRlbnQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERF9GQUlMOlxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgZmFpbGVkIHRvIGJlIGFkZGVkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG4gICAgXHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0XG5cdFx0XHQvLyBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19VUERBVEVfVEVYVDpcblx0ICAgIC8vICAgdGV4dCA9IGFjdGlvbi50ZXh0LnRyaW0oKTtcblx0ICAgIC8vICAgaWYgKHRleHQgIT09ICcnKSB7XG5cdCAgICAvLyAgICAgdXBkYXRlKGFjdGlvbi5pZCwge3RleHQ6IHRleHR9KTtcblx0ICAgIC8vICAgICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICB9XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWTpcblx0ICAgIC8vICAgZGVzdHJveShhY3Rpb24uaWQpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICBkZWZhdWx0OlxuICAgIFx0XHQvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50U3RvcmU7IiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0RXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHRhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gnKS5hc3NpZ24sXG5cdF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXG52YXIgX2ZyYW1lcyA9IHt9LFxuXHRfc2VsZWN0ZWRGcmFtZSA9IG51bGw7XG5cbnZhciBhZGRGcmFtZSA9IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdC8vIHJlbW92ZUZyYW1lKGZyYW1lKTtcblx0X2ZyYW1lc1tmcmFtZS5faWRdID0gZnJhbWU7XG59O1xuXG52YXIgcmVtb3ZlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSl7XG5cdGNvbnNvbGUubG9nKCdyZW1vdmVGcmFtZScsIGZyYW1lKTtcblx0dmFyIGlkID0gZnJhbWUuX2lkO1xuXHRpZiAoaWQgaW4gX2ZyYW1lcykgZGVsZXRlIF9mcmFtZXNbaWRdO1xuXHRjb25zb2xlLmxvZyhfZnJhbWVzKTtcbn07XG5cbnZhciBGcmFtZVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oZnJhbWVzKSB7XG5cdFx0Xy5lYWNoKGZyYW1lcywgYWRkRnJhbWUpO1xuXG5cdFx0Ly8gc2VlIGlmIGFueSBhIGZyYW1lIGlzIG1hcmtlZCBhcyBzZWxlY3RlZCBmcm9tIGRiLCBcblx0XHQvLyBvdGhlcndpc2Ugc2VsZWN0IHRoZSBmaXJzdCBmcmFtZS5cblx0XHR2YXIgc2VsZWN0ZWQgPSBfLmZpbmQoX2ZyYW1lcywge3NlbGVjdGVkOiB0cnVlfSk7XG5cdFx0X3NlbGVjdGVkRnJhbWUgPSBzZWxlY3RlZCB8fCBmcmFtZXNbMF07XG5cdH0sXG5cblx0ZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbWl0KE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCk7XG5cdH0sXG5cblx0Z2V0RnJhbWU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0cmV0dXJuIF9mcmFtZXNbaWRdO1xuXHR9LFxuXG5cdGdldEFsbEZyYW1lczogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ2dldEFsbEZyYW1lczogJywgX2ZyYW1lcyk7XG5cdFx0cmV0dXJuIF8ubWFwKF9mcmFtZXMsIGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gZnJhbWU7XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9zZWxlY3RlZEZyYW1lO1xuXHR9LFxuXG5cdGdldFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZnJhbWVzOiBfZnJhbWVzLFxuXHRcdFx0c2VsZWN0ZWRGcmFtZTogX3NlbGVjdGVkRnJhbWVcblx0XHR9O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBIGZyYW1lIGhhcyBjb25uZWN0ZWQuIFNpbXBseSB1cGRhdGVkIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCBvdmVyd3JpdGUgcHJldmlvdXMgZnJhbWVcblx0XHRjb25zb2xlLmxvZygnY29ubmVjdEZyYW1lOiAnLCBmcmFtZSk7XG5cdFx0YWRkRnJhbWUoZnJhbWUpO1xuXHRcdF9zZWxlY3RlZEZyYW1lID0gZnJhbWU7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgaGFzIGRpc2Nvbm5lY3RlZC4gU2ltcGx5IHVwZGF0ZWQgdGhlIGZyYW1lIG9iamVjdCBpbiBvdXIgY29sbGVjdGlvbi5cblx0ICovXG5cdGRpc2Nvbm5lY3RGcmFtZTogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHQvLyBhZGRGcmFtZSB3aWxsIG92ZXJ3cml0ZSBwcmV2aW91cyBmcmFtZVxuXHRcdGFkZEZyYW1lKGZyYW1lKTtcblx0fSxcblxuXHRhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5vbihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcbiAgXHR9LFxuICBcdFxuICBcdHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLnJlbW92ZUxpc3RlbmVyKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuXHR9XG5cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIFx0c3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgZnJhbWVzLi4uJyk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgbG9hZGVkOiAnLCBhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuaW5pdChhY3Rpb24uZnJhbWVzKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdmcmFtZXMgZmFpbGVkIHRvIGxvYWQ6ICcsIGFjdGlvbi5lcnIpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRDpcblx0XHRcdEZyYW1lU3RvcmUuY29ubmVjdEZyYW1lKGFjdGlvbi5mcmFtZSk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQ6XG5cdFx0XHRGcmFtZVN0b3JlLmRpc2Nvbm5lY3RGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9TRUxFQ1Q6XG5cdFx0XHRfc2VsZWN0ZWRGcmFtZSA9IGFjdGlvbi5mcmFtZTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkNPTlRFTlRfU0VORDpcbiAgICBcdFx0X3NlbGVjdGVkRnJhbWUuY29udGVudCA9IGFjdGlvbi5jb250ZW50O1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfQ09OVEVOVF9VUERBVEVEOlxuICAgIFx0XHRfc2VsZWN0ZWRGcmFtZSA9IGFjdGlvbi5mcmFtZTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgRnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdCAgICAvLyAgIH1cblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZOlxuXHQgICAgLy8gICBkZXN0cm95KGFjdGlvbi5pZCk7XG5cdCAgICAvLyAgIEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1lfQ09NUExFVEVEOlxuXHQgICAgLy8gICBkZXN0cm95Q29tcGxldGVkKCk7XG5cdCAgICAvLyAgIEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVTdG9yZTsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBBcHAgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvQXBwLmpzJyk7XG5cblJlYWN0LnJlbmRlcihcblx0PEFwcCAvPixcblx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ09wZW5GcmFtZScpXG4pIl19
