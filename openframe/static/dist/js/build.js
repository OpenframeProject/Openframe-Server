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
			React.createElement("div", {className: "container app"}, 
				React.createElement(Nav, null), 
				React.createElement(Frame, null), 
				React.createElement(TransferButtons, null), 
				React.createElement(AddContentForm, null), 
				React.createElement(ContentList, null), 
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9rZXltaXJyb3IvaW5kZXguanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWN0aW9ucy9Db250ZW50QWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hY3Rpb25zL0ZyYW1lQWN0aW9ucy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9hcGkvU29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvQWRkQ29udGVudEZvcm0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BcHAuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9Db250ZW50TGlzdC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0Zvb3Rlck5hdi5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0ZyYW1lLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2LmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvTmF2RnJhbWVMaW5rLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvVHJhbnNmZXJCdXR0b25zLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbmZpZy5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb25zdGFudHMvT0ZDb25zdGFudHMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL3N0b3Jlcy9Db250ZW50U3RvcmUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc3RvcmVzL0ZyYW1lU3RvcmUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvcmVhY3QtbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVTs7Ozs7O0FDdkozQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUV6QyxLQUFLLENBQUMsTUFBTTtDQUNYLG9CQUFDLEdBQUcsRUFBQSxJQUFBLENBQUcsQ0FBQTtDQUNQLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGVudW1lcmF0aW9uIHdpdGgga2V5cyBlcXVhbCB0byB0aGVpciB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgIHZhciBDT0xPUlMgPSBrZXlNaXJyb3Ioe2JsdWU6IG51bGwsIHJlZDogbnVsbH0pO1xuICogICB2YXIgbXlDb2xvciA9IENPTE9SUy5ibHVlO1xuICogICB2YXIgaXNDb2xvclZhbGlkID0gISFDT0xPUlNbbXlDb2xvcl07XG4gKlxuICogVGhlIGxhc3QgbGluZSBjb3VsZCBub3QgYmUgcGVyZm9ybWVkIGlmIHRoZSB2YWx1ZXMgb2YgdGhlIGdlbmVyYXRlZCBlbnVtIHdlcmVcbiAqIG5vdCBlcXVhbCB0byB0aGVpciBrZXlzLlxuICpcbiAqICAgSW5wdXQ6ICB7a2V5MTogdmFsMSwga2V5MjogdmFsMn1cbiAqICAgT3V0cHV0OiB7a2V5MToga2V5MSwga2V5Mjoga2V5Mn1cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbnZhciBrZXlNaXJyb3IgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIHJldCA9IHt9O1xuICB2YXIga2V5O1xuICBpZiAoIShvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2tleU1pcnJvciguLi4pOiBBcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgfVxuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV0W2tleV0gPSBrZXk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5TWlycm9yO1xuIiwidmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKSxcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuXHRTb2NrZXIgPSByZXF1aXJlKCcuLi9hcGkvU29ja2VyJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdGFsbF9jb250ZW50OiAnL2NvbnRlbnQvdXNlci8nICsgT0ZfVVNFUk5BTUVcbn1cblxudmFyIENvbnRlbnRBY3Rpb25zID0ge1xuXG5cdC8qKlxuXHQgKiBGZXRjaCB0aGUgY29udGVudCBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqL1xuXHRsb2FkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ0NvbnRlbnRBY3Rpb25zLmxvYWRDb250ZW50cygpJyk7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBjb250ZW50XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBjb250ZW50XG5cdFx0JC5nZXRKU09OKGVuZHBvaW50cy5hbGxfY29udGVudClcblx0XHRcdC5kb25lKGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfTE9BRF9ET05FLFxuXHRcdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdC8vIGxvYWQgZmFpbHVyZSwgZmlyZSBjb3JyZXNwb25kaW5nIGFjdGlvblxuXHRcdFx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgYSBuZXcgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0FERCxcblx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHR9KTtcblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShjb250ZW50KSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX0FERF9ET05FLFxuXHRcdFx0XHRjb250ZW50OiByZXNwXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfQUREX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGEgY29udGVudCBpdGVtLiBQZXJmb3JtcyBzZXJ2ZXIgcmVxdWVzdC5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBjb250ZW50XG5cdCAqL1xuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX1JFTU9WRSxcblx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHR9KTtcblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQvJyArIGNvbnRlbnQuX2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5DT05URU5UX1JFTU9WRV9ET05FXG5cdFx0XHR9KTtcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfUkVNT1ZFX0ZBSUwsXG5cdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHRcdH0pO1xuICAgICAgICB9KTtcblx0fSxcblxuXHRzbGlkZUNoYW5nZWQ6IGZ1bmN0aW9uKGNvbnRlbnRfaWQpIHtcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkNPTlRFTlRfU0xJREVfQ0hBTkdFRCxcblx0XHRcdGNvbnRlbnRfaWQ6IGNvbnRlbnRfaWRcblx0XHR9KTtcblx0fVxuXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZW50QWN0aW9uczsiLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRPRkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9PRkNvbnN0YW50cycpLFxuXHQkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG5cdFNvY2tlciA9IHJlcXVpcmUoJy4uL2FwaS9Tb2NrZXInKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBlbmRwb2ludHMgPSB7XG5cdGFsbF9mcmFtZXM6ICcvZnJhbWVzL3VzZXIvJyArIE9GX1VTRVJOQU1FXG59XG5cbnZhciBGcmFtZUFjdGlvbnMgPSB7XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSBmcmFtZXMgYXN5bmNocm9ub3VzbHkgZnJvbSB0aGUgc2VydmVyLlxuXHQgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGxvYWRGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpJyk7XG5cdFx0Ly8gZGlzcGF0Y2ggYW4gYWN0aW9uIGluZGljYXRpbmcgdGhhdCB3ZSdyZSBsb2FkaW5nIHRoZSBmcmFtZXNcblx0XHRBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURcblx0XHR9KTtcblxuXHRcdC8vIGZldGNoIHRoZSBmcmFtZXNcblx0XHQkLmdldEpTT04oZW5kcG9pbnRzLmFsbF9mcmFtZXMpXG5cdFx0XHQuZG9uZShmdW5jdGlvbihmcmFtZXMpIHtcblx0XHRcdFx0Ly8gbG9hZCBzdWNjZXNzLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRE9ORSxcblx0XHRcdFx0XHRmcmFtZXM6IGZyYW1lc1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0Ly8gbG9hZCBmYWlsdXJlLCBmaXJlIGNvcnJlc3BvbmRpbmcgYWN0aW9uXG5cdFx0XHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0xPQURfRkFJTCxcblx0XHRcdFx0XHRlcnI6IGVyclxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgYSBmcmFtZS5cblx0ICogQHBhcmFtICB7b2JqZWN0fSBmcmFtZVxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuXHRcdFx0YWN0aW9uVHlwZTogT0ZDb25zdGFudHMuRlJBTUVfU0VMRUNULFxuXHRcdFx0ZnJhbWU6IGZyYW1lXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgY29udGVudCBvbiB0aGUgc2VsZWN0ZWQgZnJhbWUuXG5cdCAqIEBwYXJhbSAge29iamVjdH0gY29udGVudFxuXHQgKi9cblx0dXBkYXRlQ29udGVudDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdHZhciBmcmFtZSA9IEZyYW1lU3RvcmUuZ2V0U2VsZWN0ZWRGcmFtZSgpO1xuXHRcdGNvbnNvbGUubG9nKGZyYW1lLCBjb250ZW50KTtcblx0XHQvLyB2YXIgY29udGVudCA9IENvbnRlbnRTdG9yZS5nZXRTZWxlY3RlZENvbnRlbnQoKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZV9pZDogZnJhbWUuX2lkLFxuICAgICAgICAgICAgY29udGVudF9pZDogY29udGVudC5faWRcbiAgICAgICAgfTtcbiAgICAgICAgU29ja2VyLnNlbmQoJ2ZyYW1lOnVwZGF0ZV9jb250ZW50JywgZGF0YSk7XG5cdFx0XG5cdFx0Ly8gV2ViU29ja2V0IGV2ZW50IGhhbmRsZXIgZm9yIGZyYW1lOmNvbnRlbnRfdXBkYXRlZCB0cmlnZ2VycyB0aGUgZGlzcGF0Y2hcblx0fSxcblxuXHRmcmFtZUNvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgQ29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZURpc2Nvbm5lY3RlZDogZnVuY3Rpb24oZnJhbWUpIHtcblx0XHRjb25zb2xlLmxvZygnRnJhbWUgZGlzY29ubmVjdGVkOiAnLCBmcmFtZSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9ESVNDT05ORUNURUQsXG5cdFx0XHRmcmFtZTogZnJhbWVcblx0XHR9KTtcblx0fSxcblxuXHRmcmFtZUNvbnRlbnRVcGRhdGVkOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0Y29uc29sZS5sb2coJ0ZyYW1lIENvbnRlbnQgdXBkYXRlZDogJywgZGF0YSk7XG5cdFx0QXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG5cdFx0XHRhY3Rpb25UeXBlOiBPRkNvbnN0YW50cy5GUkFNRV9DT05URU5UX1VQREFURUQsXG5cdFx0XHRmcmFtZTogZGF0YVxuXHRcdH0pO1xuXHR9LFxuXG5cdHNldHVwOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGZyYW1lID0gZGF0YS5mcmFtZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZyYW1lIFNldHVwJywgZnJhbWUpO1xuICAgICAgICAvLyB0aGlzIGlzIGEgbGl0dGxlIHdlaXJkIC0tIHdoeSBpc24ndCBzZXR1cCBqdXN0IHBhcnQgb2YgdGhlIGluaXRpYWxcbiAgICAgICAgLy8gY29ubmVjdGVkIGV2ZW50P1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcblx0XHRcdGFjdGlvblR5cGU6IE9GQ29uc3RhbnRzLkZSQU1FX0NPTk5FQ1RFRCxcblx0XHRcdGZyYW1lOiBmcmFtZVxuXHRcdH0pO1xuICAgIH1cblx0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVBY3Rpb25zOyIsIlNvY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgX3NlbGYgPSB7fSxcbiAgICAgICAgX2V2ZW50SGFuZGxlcnMgPSB7fSxcbiAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlLFxuICAgICAgICBfb3B0cyA9IHtcbiAgICAgICAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNoZWNrSW50ZXJ2YWw6IDEwMDAwXG4gICAgICAgIH0sXG4gICAgICAgIF91cmwsXG4gICAgICAgIF93cyxcbiAgICAgICAgX3RpbWVyO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB1cmwgIFRoZSBzZXJ2ZXIgVVJMLlxuICAgICAqIEBwYXJhbSAge29iamVjdH0gb3B0cyBPcHRpb25hbCBzZXR0aW5nc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jb25uZWN0KHVybCwgb3B0cykge1xuICAgICAgICBfdXJsID0gdXJsO1xuICAgICAgICBpZiAob3B0cykgX2V4dGVuZChfb3B0cywgb3B0cyk7XG4gICAgICAgIF93cyA9IG5ldyBXZWJTb2NrZXQodXJsKTtcblxuICAgICAgICBfd3Mub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBvcGVuZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uT3BlbikgX29wdHMub25PcGVuKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIGNsb3NlZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uQ2xvc2UpIF9vcHRzLm9uQ2xvc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBtZXNzYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIGV2ZW50IGhhbmRsZXIsIGNhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfZXZlbnRIYW5kbGVyc1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXVtpXShkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyBcIiBldmVudCBub3QgaGFuZGxlZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9vcHRzLmtlZXBBbGl2ZSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChfdGltZXIpO1xuICAgICAgICAgICAgX3RpbWVyID0gc2V0SW50ZXJ2YWwoX2NoZWNrQ29ubmVjdGlvbiwgX29wdHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vbihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb2ZmKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gX2V2ZW50SGFuZGxlcnNbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGFuIGV2ZW50LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gbmFtZSBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBkYXRhIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9zZW5kKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC4gSWYgbm90LCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jaGVja0Nvbm5lY3Rpb24oKSB7XG4gICAgICAgIGlmICghX2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgX2Nvbm5lY3QoX3VybCwgX29wdHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXRpbGl0eSBmdW5jdGlvbiBmb3IgZXh0ZW5kaW5nIGFuIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9leHRlbmQob2JqKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cblxuICAgIF9zZWxmLm9uID0gX29uO1xuICAgIF9zZWxmLm9mZiA9IF9vZmY7XG4gICAgX3NlbGYuc2VuZCA9IF9zZW5kO1xuICAgIF9zZWxmLmNvbm5lY3QgPSBfY29ubmVjdDtcbiAgICByZXR1cm4gX3NlbGY7XG59KSgpO1xuXG4vLyBDT01NT04uSlNcbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IFNvY2tlcjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIENvbnRlbnRBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9Db250ZW50QWN0aW9ucycpO1xuXG52YXIgQWRkQ29udGVudEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgaGFuZGxlRm9ybVN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciB1cmwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZTtcblxuICAgICAgICBpZiAoIXVybCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICB1c2VyczogW09GX1VTRVJOQU1FXVxuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnc3VibWl0dGluZyBjb250ZW50OiAnLCBjb250ZW50KTtcbiAgICAgICAgQ29udGVudEFjdGlvbnMuYWRkQ29udGVudChjb250ZW50KTtcblxuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS52YWx1ZSA9ICcnO1xuICAgICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuVVJMKS5mb2N1cygpO1xuICAgIH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGhpZGRlbi14c1wiIGlkPVwiYWRkLWNvbnRlbnQtZGl2XCI+XG4gICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1pbmxpbmVcIiBpZD1cImFkZC1mb3JtXCIgb25TdWJtaXQ9e3RoaXMuaGFuZGxlRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxsYWJlbCBmb3I9XCJTZW5kVG9Vc2VyXCI+VVJMPC9sYWJlbD4gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIGlkPVwiVVJMXCIgcGxhY2Vob2xkZXI9XCJlbnRlciBVUkxcIiByZWY9XCJVUkxcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHQgYnRuLWFkZC1jb250ZW50XCIgaHJlZj1cIiNhZGQtY29udGVudFwiIGlkPVwiYWRkLWNvbnRlbnQtYnV0dG9uXCI+QWRkIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkZENvbnRlbnRGb3JtOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdE5hdiA9IHJlcXVpcmUoJy4vTmF2LmpzJyksXG5cdEZyYW1lID0gcmVxdWlyZSgnLi9GcmFtZS5qcycpLFxuXHRUcmFuc2ZlckJ1dHRvbnMgPSByZXF1aXJlKCcuL1RyYW5zZmVyQnV0dG9ucy5qcycpLFxuXHRBZGRDb250ZW50Rm9ybSA9IHJlcXVpcmUoJy4vQWRkQ29udGVudEZvcm0uanMnKSxcblx0Q29udGVudExpc3QgPSByZXF1aXJlKCcuL0NvbnRlbnRMaXN0LmpzJyksXG5cdEZvb3Rlck5hdiA9IHJlcXVpcmUoJy4vRm9vdGVyTmF2LmpzJyksXG5cblx0QXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKSxcblxuXHRTb2NrZXIgPSByZXF1aXJlKCcuLi9hcGkvU29ja2VyJyksXG5cblx0Y29uZiA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG4vKipcbiAqIFRoZSBBcHAgaXMgdGhlIHJvb3QgY29tcG9uZW50IHJlc3BvbnNpYmxlIGZvcjpcbiAqIC0gc2V0dGluZyB1cCBzdHJ1Y3R1cmUgb2YgY2hpbGQgY29tcG9uZW50c1xuICpcbiAqIEluZGl2aWR1YWwgY29tcG9uZW50cyByZWdpc3RlciBmb3IgU3RvcmUgc3RhdGUgY2hhbmdlIGV2ZW50c1xuICovXG52YXIgQXBwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Y29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIWdsb2JhbC5PRl9VU0VSTkFNRSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ09GX1VTRVJOQU1FIG5vdCBkZWZpbmVkLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdFNvY2tlci5jb25uZWN0KFwid3M6Ly9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgXCIvYWRtaW4vd3MvXCIgKyBPRl9VU0VSTkFNRSk7XG5cblx0XHRTb2NrZXIub24oJ2ZyYW1lOmNvbm5lY3RlZCcsIEZyYW1lQWN0aW9ucy5mcmFtZUNvbm5lY3RlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6ZGlzY29ubmVjdGVkJywgRnJhbWVBY3Rpb25zLmZyYW1lRGlzY29ubmVjdGVkKTtcbiAgICAgICAgU29ja2VyLm9uKCdmcmFtZTpjb250ZW50X3VwZGF0ZWQnLCBGcmFtZUFjdGlvbnMuZnJhbWVDb250ZW50VXBkYXRlZCk7XG4gICAgICAgIFNvY2tlci5vbignZnJhbWU6c2V0dXAnLCBGcmFtZUFjdGlvbnMuc2V0dXApO1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRcblx0fSxcblxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0RnJhbWVTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cdH0sXG5cbiAgXHRyZW5kZXI6IGZ1bmN0aW9uKCl7XG5cdCAgICByZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRhaW5lciBhcHAnPlxuXHRcdFx0XHQ8TmF2IC8+XG5cdFx0XHRcdDxGcmFtZSAvPlxuXHRcdFx0XHQ8VHJhbnNmZXJCdXR0b25zIC8+XG5cdFx0XHRcdDxBZGRDb250ZW50Rm9ybSAvPlxuXHRcdFx0XHQ8Q29udGVudExpc3QgLz5cblx0XHRcdFx0PEZvb3Rlck5hdiAvPlxuXHRcdFx0PC9kaXY+XG5cdCAgICApXG4gIFx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG5cdFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpLFxuXHRDb250ZW50QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQ29udGVudEFjdGlvbnMnKSxcblx0Q29udGVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0NvbnRlbnRTdG9yZScpO1xuXG52YXIgQ29udGVudExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRlbnQ6IFtdXG5cdFx0fVxuXHR9LFxuXHRcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRlbnRBY3Rpb25zLmxvYWRDb250ZW50KCk7XG5cdFx0Q29udGVudFN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblx0XHR0aGlzLl9pbml0U2xpZGVyKCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRmdW5jdGlvbiBjcmVhdGVDb250ZW50U2xpZGUoY29udGVudEl0ZW0pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdjcmVhdGluZyBzbGlkZTogJywgY29udGVudEl0ZW0pO1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PGRpdiBrZXk9e2NvbnRlbnRJdGVtLl9pZC4kb2lkfSBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIiBvbkNsaWNrPXtudWxsfT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2NvbnRlbnRJdGVtLnVybH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG5cdFx0fVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci1vdXRlci1jb250YWluZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzd2lwZXItY29udGFpbmVyXCIgcmVmPVwiU3dpcGVyXCI+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXBlci13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgICAgICAgICAgXG5cdCAgICAgICAgICAgICAgICA8L2Rpdj5cblx0ICAgICAgICAgICAgPC9kaXY+XG5cdCAgICAgICAgPC9kaXY+XG5cdFx0KTtcblx0fSxcblxuICBcdF9vbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gIFx0XHR0aGlzLnNldFN0YXRlKHtcbiAgXHRcdFx0Y29udGVudDogQ29udGVudFN0b3JlLmdldENvbnRlbnQoKVxuICBcdFx0fSk7XG4gIFx0XHRcbiAgXHRcdC8vIFRPRE86IGJldHRlciBSZWFjdCBpbnRlZ3JhdGlvbiBmb3IgdGhlIHN3aXBlclxuICBcdFx0XG4gIFx0XHRpZiAoIXRoaXMuc3dpcGVyKSB7XG4gIFx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcbiAgXHRcdH1cblxuICBcdFx0dGhpcy5fcG9wdWxhdGVTbGlkZXIoKVxuICBcdFx0XG5cdFx0dmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmxlbmd0aDtcbiAgICAgICAgdGhpcy5zd2lwZXIuc2xpZGVUbyhzbGlkZV9pbmRleCk7XG4gIFx0fSxcblxuICBcdF9pbml0U2xpZGVyOiBmdW5jdGlvbigpIHtcbiAgXHRcdHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5Td2lwZXIpO1xuXHRcdHRoaXMuc3dpcGVyID0gbmV3IFN3aXBlcihlbCwge1xuXHQgICAgICAgIHNsaWRlc1BlclZpZXc6IDEsXG5cdCAgICAgICAgc3BhY2VCZXR3ZWVuOiAzMCxcblx0ICAgICAgICBsb29wOiB0cnVlLFxuXHQgICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZSxcblx0ICAgICAgICBvblNsaWRlQ2hhbmdlRW5kOiB0aGlzLl9zbGlkZUNoYW5nZUVuZFxuXHQgICAgfSk7XG5cblxuICBcdH0sXG5cbiAgXHRfcG9wdWxhdGVTbGlkZXI6IGZ1bmN0aW9uKCkge1xuICBcdFx0dGhpcy5zd2lwZXIucmVtb3ZlQWxsU2xpZGVzKCk7XG4gIFx0XHR0aGlzLnN0YXRlLmNvbnRlbnQuZm9yRWFjaCh0aGlzLl9hZGRTbGlkZSk7XG4gIFx0fSxcblxuICBcdF9hZGRTbGlkZTogZnVuY3Rpb24oY29udGVudEl0ZW0pIHtcbiAgXHRcdHZhciBodG1sID0gJzxkaXYgY2xhc3M9XCJzd2lwZXItc2xpZGVcIiBkYXRhLWNvbnRlbnRpZD1cIicgKyBjb250ZW50SXRlbS5faWQgKyAnXCI+PGltZyBzcmM9JyArIGNvbnRlbnRJdGVtLnVybCArICcgLz48L2Rpdj4nXG5cdFx0dGhpcy5zd2lwZXIucHJlcGVuZFNsaWRlKGh0bWwpO1xuICBcdH0sXG5cbiAgXHRfc2xpZGVUbzogZnVuY3Rpb24oaW5kZXgpIHtcbiAgXHRcdHRoaXMuc3dpcGVyLnNsaWRlVG8oaW5kZXgpO1xuICBcdH0sXG5cbiAgXHRfc2xpZGVDaGFuZ2VFbmQ6IGZ1bmN0aW9uKHNsaWRlcikge1xuICBcdFx0dmFyIHNsaWRlID0gdGhpcy5zd2lwZXIuc2xpZGVzW3RoaXMuc3dpcGVyLmFjdGl2ZUluZGV4XSxcbiAgXHRcdFx0Y29udGVudF9pZCA9IHNsaWRlLmRhdGFzZXQuY29udGVudGlkO1xuICBcdFx0Y29uc29sZS5sb2coJ19zbGlkZUNoYW5nZUVuZCcsIGNvbnRlbnRfaWQpO1xuICBcdFx0Q29udGVudEFjdGlvbnMuc2xpZGVDaGFuZ2VkKGNvbnRlbnRfaWQpO1xuICBcdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIEZvb3Rlck5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBuYXYtZm9vdGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTRcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlciBhY3RpdmVcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tc3RvcFwiIC8+PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNFwiPlxuXHRcdFx0XHRcdDxhIGNsYXNzTmFtZT1cImJ0bi1uYXYtZm9vdGVyXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXN0b3BcIiAvPjwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTRcIj5cblx0XHRcdFx0XHQ8YSBjbGFzc05hbWU9XCJidG4tbmF2LWZvb3RlclwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1zdG9wXCIgLz48L2E+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXJOYXY7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0RnJhbWVBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9GcmFtZUFjdGlvbnMnKSxcblx0RnJhbWVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9GcmFtZVN0b3JlJyk7XG5cbnZhciBGcmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRGcmFtZUFjdGlvbnMubG9hZEZyYW1lcygpO1xuXHRcdEZyYW1lU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZyYW1lKSB7XG5cdFx0XHRyZXR1cm4gPGRpdj5ObyBmcmFtZXMgYXZhaWxhYmxlLjwvZGl2PlxuXHRcdH1cblx0XHR2YXIgd19oX3JhdGlvID0gdGhpcy5zdGF0ZS5mcmFtZSAmJiB0aGlzLnN0YXRlLmZyYW1lLnNldHRpbmdzID8gdGhpcy5zdGF0ZS5mcmFtZS5zZXR0aW5ncy53X2hfcmF0aW8gOiAxO1xuXG5cdFx0dmFyIHVybCA9IHRoaXMuc3RhdGUuZnJhbWUgJiYgdGhpcy5zdGF0ZS5mcmFtZS5jdXJyZW50X2NvbnRlbnQgPyB0aGlzLnN0YXRlLmZyYW1lLmN1cnJlbnRfY29udGVudC51cmwgOiAnJztcblx0XHR2YXIgZGl2U3R5bGUgPSB7XG5cdFx0XHRiYWNrZ3JvdW5kSW1hZ2U6ICd1cmwoJyArIHVybCArICcpJyxcblx0XHR9O1xuXG5cdFx0Y29uc29sZS5sb2cod19oX3JhdGlvKTtcblxuXHRcdHZhciB3aFN0eWxlID0ge1xuXHRcdFx0cGFkZGluZ0JvdHRvbTogKDEvd19oX3JhdGlvKSAqIDEwMCArICclJ1xuXHRcdH07XG5cblx0XHR2YXIgYWN0aXZlID0gdGhpcy5zdGF0ZS5mcmFtZS5hY3RpdmUgPyAnKicgOiAnJztcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgZnJhbWVzLWxpc3RcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wteGwtMTIgZnJhbWUtb3V0ZXItY29udGFpbmVyXCI+XG5cdFx0XHRcdFx0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi14cyBidG4tc2V0dGluZ3MgaGlkZVwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNteU1vZGFsXCI+UzwvYnV0dG9uPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZnJhbWUtaW5uZXItY29udGFpbmVyXCIgc3R5bGU9e3doU3R5bGV9ID5cblx0XHQgICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwiZnJhbWVcIiBzdHlsZT17ZGl2U3R5bGV9IC8+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG5cdFx0ICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmcmFtZS1uYW1lIHRleHQtY2VudGVyXCI+XG5cdFx0ICAgICAgICAgICAgICAgIDxoNj57dGhpcy5zdGF0ZS5mcmFtZS5uYW1lfSB7YWN0aXZlfTwvaDY+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG5cdFx0ICAgICAgICA8L2Rpdj5cblx0ICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG4gIFx0X29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgXHRcdHZhciBzZWxlY3RlZEZyYW1lID0gRnJhbWVTdG9yZS5nZXRTZWxlY3RlZEZyYW1lKCk7XG4gIFx0XHRjb25zb2xlLmxvZygnc2VsZWN0ZWRGcmFtZTonLCBzZWxlY3RlZEZyYW1lKTtcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe1xuICBcdFx0XHRmcmFtZTogc2VsZWN0ZWRGcmFtZVxuICBcdFx0fSk7XG4gIFx0fVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgTmF2RnJhbWVMaW5rID0gcmVxdWlyZSgnLi9OYXZGcmFtZUxpbmsnKSxcbiAgICBGcmFtZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL0ZyYW1lU3RvcmUnKTtcblxuXG52YXIgTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJhbWVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZXM6IFtdXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZnJhbWU6ICcsIGZyYW1lKTtcbiAgICAgICAgICAgIHJldHVybiA8TmF2RnJhbWVMaW5rIGtleT17ZnJhbWUuX2lkfSBmcmFtZT17ZnJhbWV9IC8+XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPG5hdiBjbGFzc05hbWU9XCJuYXZiYXIgbmF2YmFyLWRlZmF1bHRcIj5cbiAgICAgICAgICAgICAgICB7LyogQnJhbmQgYW5kIHRvZ2dsZSBnZXQgZ3JvdXBlZCBmb3IgYmV0dGVyIG1vYmlsZSBkaXNwbGF5ICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJuYXZiYXItdG9nZ2xlIGNvbGxhcHNlZCBwdWxsLWxlZnRcIiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjYnMtZXhhbXBsZS1uYXZiYXItY29sbGFwc2UtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwic3Itb25seVwiPlRvZ2dsZSBuYXZpZ2F0aW9uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQgaGlkZGVuLXhzXCI+PHNwYW4gY2xhc3NOYW1lPVwib3BlbmZyYW1lXCI+b3BlbmZyYW1lLzwvc3Bhbj48c3BhbiBjbGFzc05hbWU9XCJ1c2VybmFtZVwiPntPRl9VU0VSTkFNRX08L3NwYW4+PC9oMz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7LyogQ29sbGVjdCB0aGUgbmF2IGxpbmtzLCBmb3JtcywgYW5kIG90aGVyIGNvbnRlbnQgZm9yIHRvZ2dsaW5nICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sbGFwc2UgbmF2YmFyLWNvbGxhcHNlXCIgaWQ9XCJicy1leGFtcGxlLW5hdmJhci1jb2xsYXBzZS0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJkcm9wZG93blwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlXCIgZGF0YS10b2dnbGU9XCJkcm9wZG93blwiIHJvbGU9XCJidXR0b25cIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj5GcmFtZXMgPHNwYW4gY2xhc3NOYW1lPVwiY2FyZXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwiZHJvcGRvd24tbWVudVwiIHJvbGU9XCJtZW51XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLmZyYW1lcy5tYXAoY3JlYXRlRnJhbWVMaW5rLmJpbmQodGhpcykpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIvbG9nb3V0XCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1sb2ctb3V0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsvKiAvLm5hdmJhci1jb2xsYXBzZSAqL31cbiAgICAgICAgICAgIDwvbmF2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBfb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZyYW1lczogRnJhbWVTdG9yZS5nZXRBbGxGcmFtZXMoKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIEZyYW1lQWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvRnJhbWVBY3Rpb25zJyk7XG5cbnZhciBOYXZGcmFtZUxpbmsgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGhhbmRsZUZyYW1lU2VsZWN0aW9uOiBmdW5jdGlvbihlKSB7XG5cdFx0RnJhbWVBY3Rpb25zLnNlbGVjdCh0aGlzLnByb3BzLmZyYW1lKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmUgPSB0aGlzLnByb3BzLmZyYW1lLmFjdGl2ZSA/ICcqJyA6ICcnO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8bGkgb25DbGljaz17dGhpcy5oYW5kbGVGcmFtZVNlbGVjdGlvbn0+XG5cdFx0XHRcdDxhIGhyZWY9XCIjXCI+e3RoaXMucHJvcHMuZnJhbWUubmFtZX0ge2FjdGl2ZX08L2E+XG5cdFx0XHQ8L2xpPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkZyYW1lTGluazsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuXHRGcmFtZUFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0ZyYW1lQWN0aW9ucycpLFxuXHRDb250ZW50U3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvQ29udGVudFN0b3JlJyk7XG5cbnZhciBUcmFuc2ZlckJ1dHRvbnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgdmlzaWJsZS14cyB0cmFuc2Zlci1idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIiByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPVwiLi4uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJidG4gYnRuLXhzIGJ0bi1kZWZhdWx0IGJ0bi1zZW5kIGJ0bi10cmFuc2ZlclwiIG9uQ2xpY2s9e3RoaXMuc2VuZENsaWNrZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLXNlbmRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+ICovfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cblx0c2VuZENsaWNrZWQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRGcmFtZUFjdGlvbnMudXBkYXRlQ29udGVudChDb250ZW50U3RvcmUuZ2V0U2VsZWN0ZWRDb250ZW50KCkpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZmVyQnV0dG9uczsiLCJ2YXIgY29uZiA9IHtcblx0ZG9tYWluOiAnbG9jYWxob3N0Jyxcblx0cG9ydDogJzg4ODgnXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZjsiLCJ2YXIga2V5bWlycm9yID0gcmVxdWlyZSgna2V5bWlycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5bWlycm9yKHtcblxuXHQvLyBmcmFtZSBhY3Rpb24gdHlwZXNcblx0RlJBTUVfTE9BRDogbnVsbCxcblx0RlJBTUVfTE9BRF9ET05FOiBudWxsLFxuXHRGUkFNRV9MT0FEX0ZBSUw6IG51bGwsXG5cdEZSQU1FX1NFTEVDVDogbnVsbCxcblx0RlJBTUVfVVBEQVRFX0NPTlRFTlQ6IG51bGwsXG5cdEZSQU1FX0NPTlRFTlRfVVBEQVRFRDogbnVsbCxcblx0RlJBTUVfQ09OTkVDVDogbnVsbCxcblx0RlJBTUVfRElTQ09OTkVDVDogbnVsbCxcblxuXHQvLyBjb250ZW50IGFjdGlvbiB0eXBlc1xuXHRDT05URU5UX0xPQUQ6IG51bGwsXG5cdENPTlRFTlRfTE9BRF9ET05FOiBudWxsLFxuXHRDT05URU5UX0xPQURfRkFJTDogbnVsbCxcblx0Q09OVEVOVF9TRU5EOiBudWxsLFxuXHRDT05URU5UX1NMSURFX0NIQU5HRUQ6IG51bGwsXG5cdENPTlRFTlRfQUREOiBudWxsLFxuXHRDT05URU5UX0FERF9ET05FOiBudWxsLFxuXHRDT05URU5UX0FERF9GQUlMOiBudWxsLFxuXHRDT05URU5UX1JFTU9WRTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRE9ORTogbnVsbCxcblx0Q09OVEVOVF9SRU1PVkVfRkFJTDogbnVsbCxcblxuXG5cdC8vIGVtaXR0ZWQgYnkgc3RvcmVzXG5cdENIQU5HRV9FVkVOVDogbnVsbFxufSk7IiwidmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCdmbHV4JykuRGlzcGF0Y2hlcjtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRGlzcGF0Y2hlcigpOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9jb250ZW50ID0gW10sXG5cdF9zZWxlY3RlZF9jb250ZW50X2lkID0gMDtcblxuXG52YXIgQ29udGVudFN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oY29udGVudCkge1xuXHRcdF9jb250ZW50ID0gY29udGVudDtcblx0XHRfc2VsZWN0ZWRfY29udGVudF9pZCA9IF9jb250ZW50WzBdLl9pZDtcblx0fSxcblxuXHRhZGRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQucHVzaChjb250ZW50KTtcblx0fSxcblxuXHRyZW1vdmVDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0X2NvbnRlbnQgPSBfLnJlbW92ZShfY29udGVudCwge19pZDogY29udGVudC5faWR9KTtcblx0fSxcblxuXHRlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVtaXQoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5UKTtcblx0fSxcblxuXHRnZXRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2NvbnRlbnQ7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyBjb25zb2xlLmxvZygnZ2V0U2VsZWN0ZWRDb250ZW50OicsIF9jb250ZW50LCBfc2VsZWN0ZWRfY29udGVudF9pZCk7XG5cdFx0cmV0dXJuIF8uZmluZChfY29udGVudCwgeydfaWQnOiBfc2VsZWN0ZWRfY29udGVudF9pZH0pO1xuXHR9LFxuXG5cdGFkZENoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYil7XG4gICAgXHR0aGlzLm9uKE9GQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgY2IpO1xuICBcdH0sXG4gIFx0XG4gIFx0cmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMucmVtb3ZlTGlzdGVuZXIoT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG5cdH1cblxufSk7XG5cblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBcdHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEOlxuXHRcdFx0Y29uc29sZS5sb2coJ2xvYWRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9MT0FEX0RPTkU6XG4gICAgXHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGxvYWRlZDogJywgYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmluaXQoYWN0aW9uLmNvbnRlbnQpO1xuXHRcdFx0Q29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0xPQURfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBsb2FkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NMSURFX0NIQU5HRUQ6XG5cdFx0XHRjb25zb2xlLmxvZygnc2xpZGUgY2hhbmdlZC4uLicpO1xuXHRcdFx0X3NlbGVjdGVkX2NvbnRlbnRfaWQgPSBhY3Rpb24uY29udGVudF9pZDtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX0FERDpcblx0XHRcdGNvbnNvbGUubG9nKCdhZGRpbmcgY29udGVudC4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRE9ORTpcbiAgICBcdFx0Y29uc29sZS5sb2coJ2NvbnRlbnQgYWRkZWQ6ICcsIGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5hZGRDb250ZW50KGFjdGlvbi5jb250ZW50KTtcblx0XHRcdENvbnRlbnRTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuQ09OVEVOVF9BRERfRkFJTDpcblx0XHRcdGNvbnNvbGUubG9nKCdjb250ZW50IGZhaWxlZCB0byBiZSBhZGRlZDogJywgYWN0aW9uLmVycik7XG5cdFx0XHRicmVhaztcblxuICAgIFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG4gICAgXHRcdFxuXHRcdFx0Ly8gQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fVVBEQVRFX1RFWFQ6XG5cdCAgICAvLyAgIHRleHQgPSBhY3Rpb24udGV4dC50cmltKCk7XG5cdCAgICAvLyAgIGlmICh0ZXh0ICE9PSAnJykge1xuXHQgICAgLy8gICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG5cdCAgICAvLyAgICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgfVxuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX0RFU1RST1k6XG5cdCAgICAvLyAgIGRlc3Ryb3koYWN0aW9uLmlkKTtcblx0ICAgIC8vICAgQ29udGVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZX0NPTVBMRVRFRDpcblx0ICAgIC8vICAgZGVzdHJveUNvbXBsZXRlZCgpO1xuXHQgICAgLy8gICBDb250ZW50U3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICBicmVhaztcblxuXHQgICAgZGVmYXVsdDpcbiAgICBcdFx0Ly8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudFN0b3JlOyIsInZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyksXG5cdEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcblx0T0ZDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvT0ZDb25zdGFudHMnKSxcblx0YXNzaWduID0gcmVxdWlyZSgnbG9kYXNoJykuYXNzaWduLFxuXHRfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cblxudmFyIF9mcmFtZXMgPSB7fSxcblx0X3NlbGVjdGVkRnJhbWUgPSBudWxsO1xuXG52YXIgYWRkRnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuXHQvLyByZW1vdmVGcmFtZShmcmFtZSk7XG5cdF9mcmFtZXNbZnJhbWUuX2lkXSA9IGZyYW1lO1xufTtcblxudmFyIHJlbW92ZUZyYW1lID0gZnVuY3Rpb24oZnJhbWUpe1xuXHRjb25zb2xlLmxvZygncmVtb3ZlRnJhbWUnLCBmcmFtZSk7XG5cdHZhciBpZCA9IGZyYW1lLl9pZDtcblx0aWYgKGlkIGluIF9mcmFtZXMpIGRlbGV0ZSBfZnJhbWVzW2lkXTtcblx0Y29uc29sZS5sb2coX2ZyYW1lcyk7XG59O1xuXG52YXIgRnJhbWVTdG9yZSA9IGFzc2lnbih7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGZyYW1lcykge1xuXHRcdF8uZWFjaChmcmFtZXMsIGFkZEZyYW1lKTtcblxuXHRcdC8vIHNlZSBpZiBhbnkgYSBmcmFtZSBpcyBtYXJrZWQgYXMgc2VsZWN0ZWQgZnJvbSBkYiwgXG5cdFx0Ly8gb3RoZXJ3aXNlIHNlbGVjdCB0aGUgZmlyc3QgZnJhbWUuXG5cdFx0dmFyIHNlbGVjdGVkID0gXy5maW5kKF9mcmFtZXMsIHtzZWxlY3RlZDogdHJ1ZX0pO1xuXHRcdF9zZWxlY3RlZEZyYW1lID0gc2VsZWN0ZWQgfHwgZnJhbWVzWzBdO1xuXHR9LFxuXG5cdGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZW1pdChPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQpO1xuXHR9LFxuXG5cdGdldEZyYW1lOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiBfZnJhbWVzW2lkXTtcblx0fSxcblxuXHRnZXRBbGxGcmFtZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKCdnZXRBbGxGcmFtZXM6ICcsIF9mcmFtZXMpO1xuXHRcdHJldHVybiBfLm1hcChfZnJhbWVzLCBmdW5jdGlvbihmcmFtZSkge1xuXHRcdFx0cmV0dXJuIGZyYW1lO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkRnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfc2VsZWN0ZWRGcmFtZTtcblx0fSxcblxuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYW1lczogX2ZyYW1lcyxcblx0XHRcdHNlbGVjdGVkRnJhbWU6IF9zZWxlY3RlZEZyYW1lXG5cdFx0fTtcblx0fSxcblxuXHQvKipcblx0ICogQSBmcmFtZSBoYXMgY29ubmVjdGVkLiBTaW1wbHkgdXBkYXRlZCB0aGUgZnJhbWUgb2JqZWN0IGluIG91ciBjb2xsZWN0aW9uLlxuXHQgKi9cblx0Y29ubmVjdEZyYW1lOiBmdW5jdGlvbihmcmFtZSkge1xuXHRcdC8vIGFkZEZyYW1lIHdpbGwgb3ZlcndyaXRlIHByZXZpb3VzIGZyYW1lXG5cdFx0Y29uc29sZS5sb2coJ2Nvbm5lY3RGcmFtZTogJywgZnJhbWUpO1xuXHRcdGFkZEZyYW1lKGZyYW1lKTtcblx0XHRfc2VsZWN0ZWRGcmFtZSA9IGZyYW1lO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBIGZyYW1lIGhhcyBkaXNjb25uZWN0ZWQuIFNpbXBseSB1cGRhdGVkIHRoZSBmcmFtZSBvYmplY3QgaW4gb3VyIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHRkaXNjb25uZWN0RnJhbWU6IGZ1bmN0aW9uKGZyYW1lKSB7XG5cdFx0Ly8gYWRkRnJhbWUgd2lsbCBvdmVyd3JpdGUgcHJldmlvdXMgZnJhbWVcblx0XHRhZGRGcmFtZShmcmFtZSk7XG5cdH0sXG5cblx0YWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNiKXtcbiAgICBcdHRoaXMub24oT0ZDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCBjYik7XG4gIFx0fSxcbiAgXHRcbiAgXHRyZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2Ipe1xuICAgIFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihPRkNvbnN0YW50cy5DSEFOR0VfRVZFTlQsIGNiKTtcblx0fVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBcdHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRDpcblx0XHRcdGNvbnNvbGUubG9nKCdsb2FkaW5nIGZyYW1lcy4uLicpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfTE9BRF9ET05FOlxuICAgIFx0XHRjb25zb2xlLmxvZygnZnJhbWVzIGxvYWRlZDogJywgYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRGcmFtZVN0b3JlLmluaXQoYWN0aW9uLmZyYW1lcyk7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9MT0FEX0ZBSUw6XG5cdFx0XHRjb25zb2xlLmxvZygnZnJhbWVzIGZhaWxlZCB0byBsb2FkOiAnLCBhY3Rpb24uZXJyKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5GUkFNRV9DT05ORUNURUQ6XG5cdFx0XHRGcmFtZVN0b3JlLmNvbm5lY3RGcmFtZShhY3Rpb24uZnJhbWUpO1xuXHRcdFx0RnJhbWVTdG9yZS5lbWl0Q2hhbmdlKCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfRElTQ09OTkVDVEVEOlxuXHRcdFx0RnJhbWVTdG9yZS5kaXNjb25uZWN0RnJhbWUoYWN0aW9uLmZyYW1lKTtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cbiAgICBcdGNhc2UgT0ZDb25zdGFudHMuRlJBTUVfU0VMRUNUOlxuXHRcdFx0X3NlbGVjdGVkRnJhbWUgPSBhY3Rpb24uZnJhbWU7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSBPRkNvbnN0YW50cy5DT05URU5UX1NFTkQ6XG4gICAgXHRcdF9zZWxlY3RlZEZyYW1lLmNvbnRlbnQgPSBhY3Rpb24uY29udGVudDtcblx0XHRcdEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlIE9GQ29uc3RhbnRzLkZSQU1FX0NPTlRFTlRfVVBEQVRFRDpcbiAgICBcdFx0X3NlbGVjdGVkRnJhbWUgPSBhY3Rpb24uZnJhbWU7XG5cdFx0XHRGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0XHRcdGJyZWFrO1xuXHQgICAgLy8gY2FzZSBPRkNvbnN0YW50cy5UT0RPX1VQREFURV9URVhUOlxuXHQgICAgLy8gICB0ZXh0ID0gYWN0aW9uLnRleHQudHJpbSgpO1xuXHQgICAgLy8gICBpZiAodGV4dCAhPT0gJycpIHtcblx0ICAgIC8vICAgICB1cGRhdGUoYWN0aW9uLmlkLCB7dGV4dDogdGV4dH0pO1xuXHQgICAgLy8gICAgIEZyYW1lU3RvcmUuZW1pdENoYW5nZSgpO1xuXHQgICAgLy8gICB9XG5cdCAgICAvLyAgIGJyZWFrO1xuXG5cdCAgICAvLyBjYXNlIE9GQ29uc3RhbnRzLlRPRE9fREVTVFJPWTpcblx0ICAgIC8vICAgZGVzdHJveShhY3Rpb24uaWQpO1xuXHQgICAgLy8gICBGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIC8vIGNhc2UgT0ZDb25zdGFudHMuVE9ET19ERVNUUk9ZX0NPTVBMRVRFRDpcblx0ICAgIC8vICAgZGVzdHJveUNvbXBsZXRlZCgpO1xuXHQgICAgLy8gICBGcmFtZVN0b3JlLmVtaXRDaGFuZ2UoKTtcblx0ICAgIC8vICAgYnJlYWs7XG5cblx0ICAgIGRlZmF1bHQ6XG4gICAgXHRcdC8vIG5vIG9wXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lU3RvcmU7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcC5qcycpO1xuXG5SZWFjdC5yZW5kZXIoXG5cdDxBcHAgLz4sXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdPcGVuRnJhbWUnKVxuKSJdfQ==
