(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/admin.js":[function(require,module,exports){
(function (global){
var socker = require('./socker.js'),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null);

module.exports = (function() {
    var self = {},
        _username,
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
        
        _username = username;

        _setupUserEventHandling();

        socker.connect("ws://" + _domain + ":8888/admin/ws/" + _username);

        socker.on('frame:connected', _handleFrameConnected);
        socker.on('frame:disconnected', _handleFrameDisonnected);
        socker.on('frame:content_updated', _handleFrameContentUpdated);
        socker.on('frame:setup', _handleFrameSetup);

        _setupSwiper();

        _fetchContent(_username);
    }

    function _setupUserEventHandling() {

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
                users: [_username]
            }),
            dataType: 'json'
        }).done(function(resp) {
            console.log(resp);
            _fetchContent(_username);
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
            _fetchContent(_username);
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

},{"./socker.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/socker.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/socker.js":[function(require,module,exports){

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWRtaW4uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQy9CLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQ3JCLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLFdBQVc7SUFDekIsSUFBSSxJQUFJLEdBQUcsRUFBRTtRQUNULFNBQVM7UUFDVCxlQUFlO1FBQ2YsZUFBZTtRQUNmLEdBQUc7UUFDSCxPQUFPO1FBQ1AsZ0JBQWdCLEdBQUcsRUFBRTtRQUNyQixPQUFPLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDdEMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4RSxRQUFRLFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7O0lBRXhELFNBQVMsS0FB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QUFDLFVBQVUsRUFBRTtZQUNiLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekI7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDbEIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxNQUFNLEVBQUU7WUFDOUQsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsS0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7b0JBQ3JCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzVCO2FBQ0o7U0FDSixDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNuQixLQUFLO0FBQ0w7O0lBRUksS0FBSyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDZixLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztJQUNqQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNuQixLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztJQUN6QixPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDLEdBQUcsQ0FBQzs7QUFFTCxZQUFZO0FBQ1osSUFBSSxPQUFPLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU07Ozs7QUMzSTNFLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHNvY2tlciA9IHJlcXVpcmUoJy4vc29ja2VyLmpzJyksXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgICBTd2lwZXIgPSByZXF1aXJlKCdzd2lwZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB7fSxcbiAgICAgICAgX3VzZXJuYW1lLFxuICAgICAgICBfc2VsZWN0ZWRfZnJhbWUsXG4gICAgICAgIF8kY3VycmVudF9zbGlkZSxcbiAgICAgICAgX3dzLFxuICAgICAgICBfc3dpcGVyLFxuICAgICAgICBfY29ubmVjdGVkRnJhbWVzID0gW10sXG4gICAgICAgIF9kb21haW4gPSBfdXJsX2RvbWFpbih3aW5kb3cubG9jYXRpb24pLFxuICAgICAgICBfY29udGVudF9pdGVtX3RwbCA9IF8udGVtcGxhdGUoJChcIiNDb250ZW50SXRlbVRlbXBsYXRlXCIpLmh0bWwoKSksXG4gICAgICAgIF9mcmFtZV90cGwgPSBfLnRlbXBsYXRlKCQoXCIjRnJhbWVUZW1wbGF0ZVwiKS5odG1sKCkpO1xuXG4gICAgZnVuY3Rpb24gX2luaXQodXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2luaXQnLCB1c2VybmFtZSk7XG4gICAgICAgIFxuICAgICAgICBfdXNlcm5hbWUgPSB1c2VybmFtZTtcblxuICAgICAgICBfc2V0dXBVc2VyRXZlbnRIYW5kbGluZygpO1xuXG4gICAgICAgIHNvY2tlci5jb25uZWN0KFwid3M6Ly9cIiArIF9kb21haW4gKyBcIjo4ODg4L2FkbWluL3dzL1wiICsgX3VzZXJuYW1lKTtcblxuICAgICAgICBzb2NrZXIub24oJ2ZyYW1lOmNvbm5lY3RlZCcsIF9oYW5kbGVGcmFtZUNvbm5lY3RlZCk7XG4gICAgICAgIHNvY2tlci5vbignZnJhbWU6ZGlzY29ubmVjdGVkJywgX2hhbmRsZUZyYW1lRGlzb25uZWN0ZWQpO1xuICAgICAgICBzb2NrZXIub24oJ2ZyYW1lOmNvbnRlbnRfdXBkYXRlZCcsIF9oYW5kbGVGcmFtZUNvbnRlbnRVcGRhdGVkKTtcbiAgICAgICAgc29ja2VyLm9uKCdmcmFtZTpzZXR1cCcsIF9oYW5kbGVGcmFtZVNldHVwKTtcblxuICAgICAgICBfc2V0dXBTd2lwZXIoKTtcblxuICAgICAgICBfZmV0Y2hDb250ZW50KF91c2VybmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3NldHVwVXNlckV2ZW50SGFuZGxpbmcoKSB7XG5cbiAgICAgICAgLy8gQWRkIGNvbnRlbnRcbiAgICAgICAgJChcIiNhZGQtZm9ybVwiKS5vbignc3VibWl0JywgX2FkZENvbnRlbnQpO1xuXG4gICAgICAgIC8vIHNlbmQgdG8gZnJhbWUgaGFuZGxlclxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmJ0bi1zZW5kJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgLy8gZnJhbWVfaWQgPSAkKCcjU2VuZFRvRnJhbWUnKS52YWwoKSxcbiAgICAgICAgICAgICAgICBmcmFtZV9pZCA9IF9zZWxlY3RlZF9mcmFtZSxcbiAgICAgICAgICAgICAgICBjb250ZW50X2lkID0gJGVsLmF0dHIoJ3JlbCcpO1xuICAgICAgICAgICAgX3VwZGF0ZUZyYW1lKGZyYW1lX2lkLCBjb250ZW50X2lkKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGNvbnRlbnQgaGFuZGxlclxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbW92ZS1idXR0b24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50X2lkID0gJGVsLmF0dHIoJ3JlbCcpO1xuICAgICAgICAgICAgX2RlbGV0ZUNvbnRlbnQoY29udGVudF9pZCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZW92ZXInLCAnLmZyYW1lLW91dGVyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdob3ZlciBvdmVyJyk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICAgICAgICAgICRlbC5maW5kKCcuYnRuLXNldHRpbmdzJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlb3V0JywgJy5mcmFtZS1vdXRlci1jb250YWluZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaG92ZXIgb2ZmJyk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICAgICAgICAgICRlbC5maW5kKCcuYnRuLXNldHRpbmdzJykuYWRkQ2xhc3MoJ2hpZGUnKTtcbiAgICAgICAgfSk7XG5cblxuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3NldHVwU3dpcGVyKCkge1xuICAgICAgICBfc3dpcGVyID0gbmV3IFN3aXBlcignLnN3aXBlci1jb250YWluZXInLCB7XG4gICAgICAgICAgICBwYWdpbmF0aW9uOiAnLnN3aXBlci1wYWdpbmF0aW9uJyxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IDEsXG4gICAgICAgICAgICBwYWdpbmF0aW9uQ2xpY2thYmxlOiB0cnVlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiAzMCxcbiAgICAgICAgICAgIG9uSW5pdDogX3NldFNlbGVjdGVkRnJhbWUsXG4gICAgICAgICAgICBrZXlib2FyZENvbnRyb2w6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coX3N3aXBlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3NldFNlbGVjdGVkRnJhbWUoc3dpcGVyKSB7XG4gICAgICAgIC8vIHRoaXMgc2VlbXMgdG8gYmUgYSBoYWNrXG4gICAgICAgIHN3aXBlci5vbignc2xpZGVDaGFuZ2VFbmQnLCBfc2V0U2VsZWN0ZWRGcmFtZSk7XG4gICAgICAgIF8kY3VycmVudFNsaWRlID0gc3dpcGVyLnNsaWRlcy5lcShzd2lwZXIuYWN0aXZlSW5kZXgpO1xuICAgICAgICBfc2VsZWN0ZWRfZnJhbWUgPSBfJGN1cnJlbnRTbGlkZS5kYXRhKCdmcmFtZS1pZCcpO1xuICAgICAgICBjb25zb2xlLmxvZygnX3NldFNlbGVjdGVkRnJhbWU6ICcgKyBfc2VsZWN0ZWRfZnJhbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF91cGRhdGVGcmFtZShmcmFtZV9pZCwgY29udGVudF9pZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnY2xpY2tlZCcsIGZyYW1lX2lkLCBjb250ZW50X2lkKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZV9pZDogZnJhbWVfaWQsXG4gICAgICAgICAgICBjb250ZW50X2lkOiBjb250ZW50X2lkXG4gICAgICAgIH07XG4gICAgICAgIHNvY2tlci5zZW5kKCdmcmFtZTp1cGRhdGVfY29udGVudCcsIGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hZGRDb250ZW50KCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgdXJsOiAkKCcjVVJMJykudmFsKCksXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtfdXNlcm5hbWVdXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgICAgIF9mZXRjaENvbnRlbnQoX3VzZXJuYW1lKTtcbiAgICAgICAgICAgICQoJyNVUkwnKS52YWwoJycpLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2RlbGV0ZUNvbnRlbnQoY29udGVudF9pZCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQvJyArIGNvbnRlbnRfaWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgX2ZldGNoQ29udGVudChfdXNlcm5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mZXRjaENvbnRlbnQodXNlcikge1xuICAgICAgICAkLmdldEpTT04oJy9jb250ZW50L3VzZXIvJyArIHVzZXIpXG4gICAgICAgICAgICAuZG9uZShmdW5jdGlvbihjb250ZW50X2xpc3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjb250ZW50X2xpc3QpO1xuICAgICAgICAgICAgICAgIHZhciAkdWxfYXJ0ID0gJChcIiNBcnRcIik7XG5cbiAgICAgICAgICAgICAgICAkdWxfYXJ0LmVtcHR5KCk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRlbnRfbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50X2l0ZW0gPSBfY29udGVudF9pdGVtX3RwbCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInVybFwiOiBjb250ZW50X2xpc3RbaV0udXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBjb250ZW50X2xpc3RbaV0uX2lkLiRvaWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICR1bF9hcnQuYXBwZW5kKGNvbnRlbnRfaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3VybF9kb21haW4oZGF0YSkge1xuICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgYS5ocmVmID0gZGF0YTtcbiAgICAgICAgcmV0dXJuIGEuaG9zdG5hbWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lQ29ubmVjdGVkKGZyYW1lKSB7XG4gICAgICAgIHZhciBfaWQgPSBmcmFtZS5faWQuJG9pZCB8fCBmcmFtZS5faWQ7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhpcyBmcmFtZSBhbHJlYWR5IGlzIHJlbmRlcmVkLCBpZiBzbyBzbGlkZSB0byBpdFxuICAgICAgICB2YXIgJGZyYW1lID0gJCgnLnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgaWYgKCRmcmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBzbGlkZV9pbmRleCA9ICQoJ2Rpdi5zd2lwZXItc2xpZGUnKS5pbmRleCgkZnJhbWUpO1xuICAgICAgICAgICAgX3N3aXBlci5zbGlkZVRvKHNsaWRlX2luZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZyYW1lLmZyYW1lX2lkID0gX2lkO1xuXG4gICAgICAgIGlmICghZnJhbWUuY3VycmVudF9jb250ZW50KSBmcmFtZS5jdXJyZW50X2NvbnRlbnQgPSBudWxsO1xuXG4gICAgICAgIF9zZWxlY3RlZF9mcmFtZSA9IF9pZDtcblxuICAgICAgICB2YXIgaW5kZXggPSBfY29ubmVjdGVkRnJhbWVzLmluZGV4T2YoX2lkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgX2Nvbm5lY3RlZEZyYW1lcy5wdXNoKF9pZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZnJhbWVfaHRtbCA9IF9mcmFtZV90cGwoZnJhbWUpO1xuXG4gICAgICAgIF9zd2lwZXIuYXBwZW5kU2xpZGUoZnJhbWVfaHRtbCk7XG5cbiAgICAgICAgX3N3aXBlci5zbGlkZVRvKF9zd2lwZXIuc2xpZGVzLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lRGlzb25uZWN0ZWQoZnJhbWUpIHtcbiAgICAgICAgdmFyIF9pZCA9IGZyYW1lLl9pZC4kb2lkIHx8IGZyYW1lLl9pZDtcblxuICAgICAgICB2YXIgaW5kZXggPSBfY29ubmVjdGVkRnJhbWVzLmluZGV4T2YoX2lkKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIF9jb25uZWN0ZWRGcmFtZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgJGZyYW1lID0gJCgnZGl2LnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmluZGV4KCRmcmFtZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzbGlkZV9pbmRleDogJyArIHNsaWRlX2luZGV4KTtcbiAgICAgICAgX3N3aXBlci5yZW1vdmVTbGlkZShzbGlkZV9pbmRleCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lQ29udGVudFVwZGF0ZWQoZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZnJhbWUgY29udGVudCBoYXMgYmVlbiB1cGRhdGVkJywgZGF0YSk7XG4gICAgICAgIHZhciBmcmFtZSA9IGRhdGEuZnJhbWUsXG4gICAgICAgICAgICBjb250ZW50ID0gZGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgX2lkID0gZnJhbWUuX2lkLiRvaWQgfHwgZnJhbWUuX2lkO1xuICAgICAgICB2YXIgJGZyYW1lID0gJCgnLnN3aXBlci1zbGlkZVtkYXRhLWZyYW1lLWlkPVwiJyArIF9pZCArICdcIl0nKTtcbiAgICAgICAgJGZyYW1lLmZpbmQoJ2Rpdi5mcmFtZScpLmNzcyh7XG4gICAgICAgICAgICAnYmFja2dyb3VuZC1pbWFnZSc6ICd1cmwoJytjb250ZW50LnVybCsnKSdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2hhbmRsZUZyYW1lU2V0dXAoZnJhbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2ZyYW1lIHNldHVwJywgZnJhbWUpO1xuICAgIH1cblxuICAgIHNlbGYuaW5pdCA9IF9pbml0O1xuICAgIHJldHVybiBzZWxmO1xuXG59KSgpO1xuIiwiXG5Tb2NrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9zZWxmID0ge30sXG4gICAgICAgIF9ldmVudEhhbmRsZXJzID0ge30sXG4gICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZSxcbiAgICAgICAgX29wdHMgPSB7XG4gICAgICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgICAgICBjaGVja0ludGVydmFsOiAxMDAwMFxuICAgICAgICB9LFxuICAgICAgICBfdXJsLFxuICAgICAgICBfd3MsXG4gICAgICAgIF90aW1lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdlYnNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdXJsICBUaGUgc2VydmVyIFVSTC5cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdHMgT3B0aW9uYWwgc2V0dGluZ3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY29ubmVjdCh1cmwsIG9wdHMpIHtcbiAgICAgICAgX3VybCA9IHVybDtcbiAgICAgICAgaWYgKG9wdHMpIF9leHRlbmQoX29wdHMsIG9wdHMpO1xuICAgICAgICBfd3MgPSBuZXcgV2ViU29ja2V0KHVybCk7XG5cbiAgICAgICAgX3dzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gb3BlbmVkJyk7XG4gICAgICAgICAgICBfY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbk9wZW4pIF9vcHRzLm9uT3BlbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChfb3B0cy5vbkNsb3NlKSBfb3B0cy5vbkNsb3NlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gbWVzc2FnZS5uYW1lLFxuICAgICAgICAgICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBldmVudCBoYW5kbGVyLCBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2V2ZW50SGFuZGxlcnNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV1baV0oZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgXCIgZXZlbnQgbm90IGhhbmRsZWQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChfb3B0cy5rZWVwQWxpdmUpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgICAgIF90aW1lciA9IHNldEludGVydmFsKF9jaGVja0Nvbm5lY3Rpb24sIF9vcHRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF9ldmVudEhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdID0gW2NhbGxiYWNrXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSAgIG5hbWUgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgZnVuY3Rpb24gX29mZihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9ldmVudEhhbmRsZXJzW25hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZGF0YSBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc2VuZChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Muc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIElmIG5vdCwgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hlY2tDb25uZWN0aW9uKCkge1xuICAgICAgICBpZiAoIV9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIF9jb25uZWN0KF91cmwsIF9vcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIGV4dGVuZGluZyBhbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZXh0ZW5kKG9iaikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBfc2VsZi5vbiA9IF9vbjtcbiAgICBfc2VsZi5vZmYgPSBfb2ZmO1xuICAgIF9zZWxmLnNlbmQgPSBfc2VuZDtcbiAgICBfc2VsZi5jb25uZWN0ID0gX2Nvbm5lY3Q7XG4gICAgcmV0dXJuIF9zZWxmO1xufSkoKTtcblxuLy8gQ09NTU9OLkpTXG5pZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBTb2NrZXI7IiwidmFyIEFkbWluID0gcmVxdWlyZSgnLi9hZG1pbi5qcycpO1xuQWRtaW4uaW5pdChnbG9iYWwuT0ZfVVNFUk5BTUUpOyJdfQ==
