(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/ContentItem.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({displayName: "exports",
	render: function() {
		return (
			React.createElement("li", null, 
				React.createElement("div", {className: "row content-item"}, 
					React.createElement("div", {className: "col-md-3"}, 
						React.createElement("div", {className: "img-container", style: {backgroundImage: 'url("{this.props.url}")'}})
					), 
					React.createElement("div", {className: "col-md-6 col-send"}, 
						React.createElement("button", {onClick: this.props.onSendClick, className: "btn btn-default btn-xs btn-send center-block no-border", href: "#send", rel: "{this.props.id}"}, React.createElement("span", {className: "icon icon-send", "aria-hidden": "true"}), React.createElement("br", null), "Send to Frame")
					), 
					React.createElement("div", {className: "col-md-1"}), 
					React.createElement("div", {className: "col-md-2 col-delete"}, 
						React.createElement("button", {onClick: this.props.onDeleteClick, className: "btn btn-default btn-xs remove-button center-block no-border", href: "#delete", rel: "{this.props.id}"}, React.createElement("span", {className: "icon icon-delete", "aria-hidden": "true"}))
					)
				)
			)
		);
	}
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/admin.js":[function(require,module,exports){
(function (global){
var socker = require('./socker.js'),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null),
    ContentItem = require('./ContentItem.js');

module.exports = (function(username) {
    var self = {},
        _selected_frame,
        _$current_slide,
        _ws,
        _swiper,
        _connectedFrames = [],
        _domain = _url_domain(window.location),
        _content_item_tpl = _.template($("#ContentItemTemplate").html()),
        _frame_tpl = _.template($("#FrameTemplate").html());

    function _init(username) {
        console.log('init', username);

        _setupUserEventHandling();

        socker.connect("ws://" + _domain + ":8888/admin/ws/" + username);

        socker.on('frame:connected', _handleFrameConnected);
        socker.on('frame:disconnected', _handleFrameDisonnected);
        socker.on('frame:content_updated', _handleFrameContentUpdated);
        socker.on('frame:setup', _handleFrameSetup);

        _setupSwiper();

        _fetchContent(username);
    }

    function _setupUserEventHandling() {
        // Logout handler
        // $(document).on('click', '#LogoutButton', function(e) {
        //     window.location = "/";
        //     return false;
        // });

        // Add content
        $("#add-form").on('submit', _addContent);

        // send to frame handler
        $(document).on('click', '.btn-send', function(e) {
            // e.preventDefault();
            var $el = $(this),
                // frame_id = $('#SendToFrame').val(),
                frame_id = _selected_frame,
                content_id = $el.attr('rel');
            _updateFrame(frame_id, content_id);
            return false;
        });

        // remove content handler
        $(document).on('click', '.remove-button', function(e) {
            // e.preventDefault();
            var $el = $(this),
                content_id = $el.attr('rel');
            _deleteContent(content_id);
            return false;
        });

        $(document).on('mouseover', '.frame-outer-container', function(e) {
            console.log('hover over');
            var $el = $(this);
            $el.find('.btn-settings').removeClass('hide');
        });

        $(document).on('mouseout', '.frame-outer-container', function(e) {
            console.log('hover off');
            var $el = $(this);
            $el.find('.btn-settings').addClass('hide');
        });



    }

    function _setupSwiper() {
        _swiper = new Swiper('.swiper-container', {
            pagination: '.swiper-pagination',
            slidesPerView: 1,
            paginationClickable: true,
            spaceBetween: 30,
            onInit: _setSelectedFrame,
            keyboardControl: true
        });

        console.log(_swiper);
    }

    function _setSelectedFrame(swiper) {
        // this seems to be a hack
        swiper.on('slideChangeEnd', _setSelectedFrame);
        _$currentSlide = swiper.slides.eq(swiper.activeIndex);
        _selected_frame = _$currentSlide.data('frame-id');
        console.log('_setSelectedFrame: ' + _selected_frame);
    }

    function _updateFrame(frame_id, content_id) {
        console.log('clicked', frame_id, content_id);
        var data = {
            frame_id: frame_id,
            content_id: content_id
        };
        socker.send('frame:update_content', data);
    }

    function _addContent() {
        $.ajax({
            url: '/content',
            method: 'POST',
            data: JSON.stringify({
                url: $('#URL').val(),
                users: [username]
            }),
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            _fetchContent(username);
            $('#URL').val('').focus();
        });
        return false;
    }

    function _deleteContent(content_id) {
        $.ajax({
            url: '/content/' + content_id,
            method: 'DELETE',
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            _fetchContent(username);
        });
        return false;
    }

    function _fetchContent(user) {
        $.getJSON('/content/user/' + user)
            .done(function(content_list) {
                console.log(content_list);
                var $ul_art = $("#Art");

                $ul_art.empty();

                for (var i = 0; i < content_list.length; i++) {
                    content_item = _content_item_tpl({
                        "url": content_list[i].url,
                        "id": content_list[i]._id.$oid
                    });
                    $ul_art.append(content_item);
                }
            });
    }

    function _url_domain(data) {
        var a = document.createElement('a');
        a.href = data;
        return a.hostname;
    }

    function _handleFrameConnected(frame) {
        var _id = frame._id.$oid || frame._id;

        // check if this frame already is rendered, if so slide to it
        var $frame = $('.swiper-slide[data-frame-id="' + _id + '"]');
        if ($frame.length) {
            var slide_index = $('div.swiper-slide').index($frame);
            _swiper.slideTo(slide_index);
            return;
        }

        frame.frame_id = _id;

        if (!frame.current_content) frame.current_content = null;

        _selected_frame = _id;

        var index = _connectedFrames.indexOf(_id);
        if (index === -1) {
            _connectedFrames.push(_id);
        }

        var frame_html = _frame_tpl(frame);

        _swiper.appendSlide(frame_html);

        _swiper.slideTo(_swiper.slides.length);
    }

    function _handleFrameDisonnected(frame) {
        var _id = frame._id.$oid || frame._id;

        var index = _connectedFrames.indexOf(_id);
        if (index > -1) {
            _connectedFrames.splice(index, 1);
        }
        var $frame = $('div.swiper-slide[data-frame-id="' + _id + '"]');
        var slide_index = $('div.swiper-slide').index($frame);
        console.log('slide_index: ' + slide_index);
        _swiper.removeSlide(slide_index);
    }

    function _handleFrameContentUpdated(data) {
        console.log('frame content has been updated', data);
        var frame = data.frame,
            content = data.content;
        var _id = frame._id.$oid || frame._id;
        var $frame = $('.swiper-slide[data-frame-id="' + _id + '"]');
        $frame.find('div.frame').css({
            'background-image': 'url('+content.url+')'
        });
    }

    function _handleFrameSetup(frame) {
        console.log('frame setup', frame);
    }

    self.init = _init;
    return self;

})();


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./ContentItem.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/ContentItem.js","./socker.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/socker.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/socker.js":[function(require,module,exports){

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

},{}],"openframe/static/src/js/app.js":[function(require,module,exports){
(function (global){
var Admin = require('./admin.js');
Admin.init(global.OF_USERNAME);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./admin.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/admin.js"}]},{},["openframe/static/src/js/app.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvQ29udGVudEl0ZW0uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWRtaW4uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTdCLG9DQUFvQyx1QkFBQTtDQUNuQyxNQUFNLEVBQUUsV0FBVztFQUNsQjtHQUNDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7SUFDSCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFBLEVBQUE7S0FDakMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtNQUN6QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGVBQUEsRUFBZSxDQUFDLEtBQUEsRUFBSyxDQUFFLENBQUMsZUFBZSxFQUFFLHlCQUF5QixDQUFFLENBQUEsQ0FBRyxDQUFBO0tBQ2pGLENBQUEsRUFBQTtLQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMs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QUcsQ0FBQztJQUNmLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ25CLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMsR0FBRyxDQUFDOztBQUVMLFlBQVk7QUFDWixJQUFJLE9BQU8sTUFBTSxJQUFJLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTTs7OztBQzNJM0UsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGxpPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBjb250ZW50LWl0ZW1cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0zXCI+XG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImltZy1jb250YWluZXJcIiBzdHlsZT17e2JhY2tncm91bmRJbWFnZTogJ3VybChcInt0aGlzLnByb3BzLnVybH1cIiknfX0gLz5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC02IGNvbC1zZW5kXCI+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25TZW5kQ2xpY2t9IGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdCBidG4teHMgYnRuLXNlbmQgY2VudGVyLWJsb2NrIG5vLWJvcmRlclwiIGhyZWY9XCIjc2VuZFwiIHJlbD1cInt0aGlzLnByb3BzLmlkfVwiPjxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz48YnIgLz5TZW5kIHRvIEZyYW1lPC9idXR0b24+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMVwiIC8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMiBjb2wtZGVsZXRlXCI+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25EZWxldGVDbGlja30gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14cyByZW1vdmUtYnV0dG9uIGNlbnRlci1ibG9jayBuby1ib3JkZXJcIiBocmVmPVwiI2RlbGV0ZVwiIHJlbD1cInt0aGlzLnByb3BzLmlkfVwiPjxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1kZWxldGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIiAvPjwvYnV0dG9uPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxufSk7IiwidmFyIHNvY2tlciA9IHJlcXVpcmUoJy4vc29ja2VyLmpzJyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgICBTd2lwZXIgPSByZXF1aXJlKCdzd2lwZXInKSxcbiAgICBDb250ZW50SXRlbSA9IHJlcXVpcmUoJy4vQ29udGVudEl0ZW0uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICB2YXIgc2VsZiA9IHt9LFxuICAgICAgICBfc2VsZWN0ZWRfZnJhbWUsXG4gICAgICAgIF8kY3VycmVudF9zbGlkZSxcbiAgICAgICAgX3dzLFxuICAgICAgICBfc3dpcGVyLFxuICAgICAgICBfY29ubmVjdGVkRnJhbWVzID0gW10sXG4gICAgICAgIF9kb21haW4gPSBfdXJsX2RvbWFpbih3aW5kb3cubG9jYXRpb24pLFxuICAgICAgICBfY29udGVudF9pdGVtX3RwbCA9IF8udGVtcGxhdGUoJChcIiNDb250ZW50SXRlbVRlbXBsYXRlXCIpLmh0bWwoKSksXG4gICAgICAgIF9mcmFtZV90cGwgPSBfLnRlbXBsYXRlKCQoXCIjRnJhbWVUZW1wbGF0ZVwiKS5odG1sKCkpO1xuXG4gICAgZnVuY3Rpb24gX2luaXQodXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2luaXQnLCB1c2VybmFtZSk7XG5cbiAgICAgICAgX3NldHVwVXNlckV2ZW50SGFuZGxpbmcoKTtcblxuICAgICAgICBzb2NrZXIuY29ubmVjdChcIndzOi8vXCIgKyBfZG9tYWluICsgXCI6ODg4OC9hZG1pbi93cy9cIiArIHVzZXJuYW1lKTtcblxuICAgICAgICBzb2NrZXIub24oJ2ZyYW1lOmNvbm5lY3RlZCcsIF9oYW5kbGVGcmFtZUNvbm5lY3RlZCk7XG4gICAgICAgIHNvY2tlci5vbignZnJhbWU6ZGlzY29ubmVjdGVkJywgX2hhbmRsZUZyYW1lRGlzb25uZWN0ZWQpO1xuICAgICAgICBzb2NrZXIub24oJ2ZyYW1lOmNvbnRlbnRfdXBkYXRlZCcsIF9oYW5kbGVGcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgc29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIF9oYW5kbGVGcmFtZVNldHVwKTtcblxuICAgICAgICBfc2V0dXBTd2lwZXIoKTtcblxuICAgICAgICBfZmV0Y2hDb250ZW50KHVzZXJuYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfc2V0dXBVc2VyRXZlbnRIYW5kbGluZygpIHtcbiAgICAgICAgLy8gTG9nb3V0IGhhbmRsZXJcbiAgICAgICAgLy8gJChkb2N1bWVudCkub24oJ2NsaWNrJywgJyNMb2dvdXRCdXR0b24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcbiAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gQWRkIGNvbnRlbnRcbiAgICAgICAgJChcIiNhZGQtZm9ybVwiKS5vbignc3VibWl0JywgX2FkZENvbnRlbnQpO1xuXG4gICAgICAgIC8vIHNlbmQgdG8gZnJhbWUgaGFuZGxlclxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmJ0bi1zZW5kJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgLy8gZnJhbWVfaWQgPSAkKCcjU2VuZFRvRnJhbWUnKS52YWwoKSxcbiAgICAgICAgICAgICAgICBmcmFtZV9pZCA9IF9zZWxlY3RlZF9mcmFtZSxcbiAgICAgICAgICAgICAgICBjb250ZW50X2lkID0gJGVsLmF0dHIoJ3JlbCcpO1xuICAgICAgICAgICAgX3VwZGF0ZUZyYW1lKGZyYW1lX2lkLCBjb250ZW50X2lkKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGNvbnRlbnQgaGFuZGxlclxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbW92ZS1idXR0b24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50X2lkID0gJGVsLmF0dHIoJ3JlbCcpO1xuICAgICAgICAgICAgX2RlbGV0ZUNvbnRlbnQoY29udGVudF9pZCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZW92ZXInLCAnLmZyYW1lLW91dGVyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdob3ZlciBvdmVyJyk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICAgICAgICAgICRlbC5maW5kKCcuYnRuLXNldHRpbmdzJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlb3V0JywgJy5mcmFtZS1vdXRlci1jb250YWluZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaG92ZXIgb2ZmJyk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICAgICAgICAgICRlbC5maW5kKCcuYnRuLXNldHRpbmdzJykuYWRkQ2xhc3MoJ2hpZGUnKTtcbiAgICAgICAgfSk7XG5cblxuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3NldHVwU3dpcGVyKCkge1xuICAgICAgICBfc3dpcGVyID0gbmV3IFN3aXBlcignLnN3aXBlci1jb250YWluZXInLCB7XG4gICAgICAgICAgICBwYWdpbmF0aW9uOiAnLnN3aXBlci1wYWdpbmF0aW9uJyxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IDEsXG4gICAgICAgICAgICBwYWdpbmF0aW9uQ2xpY2thYmxlOiB0cnVlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiAzMCxcbiAgICAgICAgICAgIG9uSW5pdDogX3NldFNlbGVjdGVkRnJhbWUsXG4gICAgICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coX3N3aXBlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3NldFNlbGVjdGVkRnJhbWUoc3dpcGVyKSB7XG4gICAgICAgIC8vIHRoaXMgc2VlbXMgdG8gYmUgYSBoYWNrXG4gICAgICAgIHN3aXBlci5vbignc2xpZGVDaGFuZ2VFbmQnLCBfc2V0U2VsZWN0ZWRGcmFtZSk7XG4gICAgICAgIF8kY3VycmVudFNsaWRlID0gc3dpcGVyLnNsaWRlcy5lcShzd2lwZXIuYWN0aXZlSW5kZXgpO1xuICAgICAgICBfc2VsZWN0ZWRfZnJhbWUgPSBfJGN1cnJlbnRTbGlkZS5kYXRhKCdmcmFtZS1pZCcpO1xuICAgICAgICBjb25zb2xlLmxvZygnX3NldFNlbGVjdGVkRnJhbWU6ICcgKyBfc2VsZWN0ZWRfZnJhbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF91cGRhdGVGcmFtZShmcmFtZV9pZCwgY29udGVudF9pZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnY2xpY2tlZCcsIGZyYW1lX2lkLCBjb250ZW50X2lkKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZV9pZDogZnJhbWVfaWQsXG4gICAgICAgICAgICBjb250ZW50X2lkOiBjb250ZW50X2lkXG4gICAgICAgIH07XG4gICAgICAgIHNvY2tlci5zZW5kKCdmcmFtZTp1cGRhdGVfY29udGVudCcsIGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hZGRDb250ZW50KCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgdXJsOiAkKCcjVVJMJykudmFsKCksXG4gICAgICAgICAgICAgICAgdXNlcnM6IFt1c2VybmFtZV1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgX2ZldGNoQ29udGVudCh1c2VybmFtZSk7XG4gICAgICAgICAgICAkKCcjVVJMJykudmFsKCcnKS5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9kZWxldGVDb250ZW50KGNvbnRlbnRfaWQpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJy9jb250ZW50LycgKyBjb250ZW50X2lkLFxuICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIF9mZXRjaENvbnRlbnQodXNlcm5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mZXRjaENvbnRlbnQodXNlcikge1xuICAgICAgICAkLmdldEpTT04oJy9jb250ZW50L3VzZXIvJyArIHVzZXIpXG4gICAgICAgICAgICAuZG9uZShmdW5jdGlvbihjb250ZW50X2xpc3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjb250ZW50X2xpc3QpO1xuICAgICAgICAgICAgICAgIHZhciAkdWxfYXJ0ID0gJChcIiNBcnRcIik7XG5cbiAgICAgICAgICAgICAgICAkdWxfYXJ0LmVtcHR5KCk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRlbnRfbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50X2l0ZW0gPSBfY29udGVudF9pdGVtX3RwbCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInVybFwiOiBjb250ZW50X2xpc3RbaV0udXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBjb250ZW50X2xpc3RbaV0uX2lkLiRvaWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICR1bF9hcnQuYXBwZW5kKGNvbnRlbnRfaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3VybF9kb21haW4oZGF0YSkge1xuICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgYS5ocmVmID0gZGF0YTtcbiAgICAgICAgcmV0dXJuIGEuaG9zdG5hbWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lQ29ubmVjdGVkKGZyYW1lKSB7XG4gICAgICAgIHZhciBfaWQgPSBmcmFtZS5faWQuJG9pZCB8fCBmcmFtZS5faWQ7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhpcyBmcmFtZSBhbHJlYWR5IGlzIHJlbmRlcmVkLCBpZiBzbyBzbGlkZSB0byBpdFxuICAgICAgICB2YXIgJGZyYW1lID0gJCgnLnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgaWYgKCRmcmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBzbGlkZV9pbmRleCA9ICQoJ2Rpdi5zd2lwZXItc2xpZGUnKS5pbmRleCgkZnJhbWUpO1xuICAgICAgICAgICAgX3N3aXBlci5zbGlkZVRvKHNsaWRlX2luZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZyYW1lLmZyYW1lX2lkID0gX2lkO1xuXG4gICAgICAgIGlmICghZnJhbWUuY3VycmVudF9jb250ZW50KSBmcmFtZS5jdXJyZW50X2NvbnRlbnQgPSBudWxsO1xuXG4gICAgICAgIF9zZWxlY3RlZF9mcmFtZSA9IF9pZDtcblxuICAgICAgICB2YXIgaW5kZXggPSBfY29ubmVjdGVkRnJhbWVzLmluZGV4T2YoX2lkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgX2Nvbm5lY3RlZEZyYW1lcy5wdXNoKF9pZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZnJhbWVfaHRtbCA9IF9mcmFtZV90cGwoZnJhbWUpO1xuXG4gICAgICAgIF9zd2lwZXIuYXBwZW5kU2xpZGUoZnJhbWVfaHRtbCk7XG5cbiAgICAgICAgX3N3aXBlci5zbGlkZVRvKF9zd2lwZXIuc2xpZGVzLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lRGlzb25uZWN0ZWQoZnJhbWUpIHtcbiAgICAgICAgdmFyIF9pZCA9IGZyYW1lLl9pZC4kb2lkIHx8IGZyYW1lLl9pZDtcblxuICAgICAgICB2YXIgaW5kZXggPSBfY29ubmVjdGVkRnJhbWVzLmluZGV4T2YoX2lkKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIF9jb25uZWN0ZWRGcmFtZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgJGZyYW1lID0gJCgnZGl2LnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmluZGV4KCRmcmFtZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzbGlkZV9pbmRleDogJyArIHNsaWRlX2luZGV4KTtcbiAgICAgICAgX3N3aXBlci5yZW1vdmVTbGlkZShzbGlkZV9pbmRleCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lQ29udGVudFVwZGF0ZWQoZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZnJhbWUgY29udGVudCBoYXMgYmVlbiB1cGRhdGVkJywgZGF0YSk7XG4gICAgICAgIHZhciBmcmFtZSA9IGRhdGEuZnJhbWUsXG4gICAgICAgICAgICBjb250ZW50ID0gZGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgX2lkID0gZnJhbWUuX2lkLiRvaWQgfHwgZnJhbWUuX2lkO1xuICAgICAgICB2YXIgJGZyYW1lID0gJCgnLnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgJGZyYW1lLmZpbmQoJ2Rpdi5mcmFtZScpLmNzcyh7XG4gICAgICAgICAgICAnYmFja2dyb3VuZC1pbWFnZSc6ICd1cmwoJytjb250ZW50LnVybCsnKSdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lU2V0dXAoZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lIHNldHVwJywgZnJhbWUpO1xuICAgIH1cblxuICAgIHNlbGYuaW5pdCA9IF9pbml0O1xuICAgIHJldHVybiBzZWxmO1xuXG59KSgpO1xuIiwiXG5Tb2NrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9zZWxmID0ge30sXG4gICAgICAgIF9ldmVudEhhbmRsZXJzID0ge30sXG4gICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZSxcbiAgICAgICAgX29wdHMgPSB7XG4gICAgICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBjaGVja0ludGVydmFsOiAxMDAwMFxuICAgICAgICB9LFxuICAgICAgICBfdXJsLFxuICAgICAgICBfd3MsXG4gICAgICAgIF90aW1lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdlYnNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdXJsICBUaGUgc2VydmVyIFVSTC5cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdHMgT3B0aW9uYWwgc2V0dGluZ3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY29ubmVjdCh1cmwsIG9wdHMpIHtcbiAgICAgICAgX3VybCA9IHVybDtcbiAgICAgICAgaWYgKG9wdHMpIF9leHRlbmQoX29wdHMsIG9wdHMpO1xuICAgICAgICBfd3MgPSBuZXcgV2ViU29ja2V0KHVybCk7XG5cbiAgICAgICAgX3dzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gb3BlbmVkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbk9wZW4pIF9vcHRzLm9uT3BlbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbkNsb3NlKSBfb3B0cy5vbkNsb3NlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gbWVzc2FnZS5uYW1lLFxuICAgICAgICAgICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBldmVudCBoYW5kbGVyLCBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2V2ZW50SGFuZGxlcnNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV1baV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgXCIgZXZlbnQgbm90IGhhbmRsZWQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfb3B0cy5rZWVwQWxpdmUpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgICAgIF90aW1lciA9IHNldEludGVydmFsKF9jaGVja0Nvbm5lY3Rpb24sIF9vcHRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdID0gW2NhbGxiYWNrXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29mZihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9ldmVudEhhbmRsZXJzW25hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZGF0YSBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc2VuZChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Muc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIElmIG5vdCwgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hlY2tDb25uZWN0aW9uKCkge1xuICAgICAgICBpZiAoIV9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIF9jb25uZWN0KF91cmwsIF9vcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIGV4dGVuZGluZyBhbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZXh0ZW5kKG9iaikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBfc2VsZi5vbiA9IF9vbjtcbiAgICBfc2VsZi5vZmYgPSBfb2ZmO1xuICAgIF9zZWxmLnNlbmQgPSBfc2VuZDtcbiAgICBfc2VsZi5jb25uZWN0ID0gX2Nvbm5lY3Q7XG4gICAgcmV0dXJuIF9zZWxmO1xufSkoKTtcblxuLy8gQ09NTU9OLkpTXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBTb2NrZXI7IiwidmFyIEFkbWluID0gcmVxdWlyZSgnLi9hZG1pbi5qcycpO1xuQWRtaW4uaW5pdChnbG9iYWwuT0ZfVVNFUk5BTUUpOyJdfQ==
