(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/admin.js":[function(require,module,exports){
(function (global){
var socker = require('./socker.js'),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYWRtaW4uanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvc29ja2VyLmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQy9CLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQ3JCLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLFNBQVMsUUFBUSxFQUFFO0lBQ2pDLElBQUksSUFBSSxHQUFHLEVBQUU7UUFDVCxlQUFlO1FBQ2YsZUFBZTtRQUNmLEdBQUc7UUFDSCxPQUFPO1FBQ1AsZ0JBQWdCLEdBQUcsRUFBRTtRQUNyQixPQUFPLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDdEMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4RSxRQUFRLFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7O0lBRXhELFNBQVMsS0FBSyxDQUFDLFFBQVEsRUFBRTtBQUM3QixRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDOztBQUV0QyxRQUFRLHVCQUF1QixFQUFFLENBQUM7O0FBRWxDLFFBQVEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxHQUFHLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxDQUFDOztRQUVqRSxNQUFNLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztBQUN2RSxRQUFRLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7O0FBRXBELFFBQVEsWUFBWSxFQUFFLENBQUM7O1FBRWYsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2hDLEtBQUs7O0FBRUwsSUFBSSxTQUFTLHVCQUF1QixHQUFHO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2pEOztBQUVBLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFOztBQUV6RCxZQUFZLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7O2dCQUViLFFBQVEsR0FBRyxlQUFlO2dCQUMxQixVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQyxZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLE9BQU8sS0FBSyxDQUFDO0FBQ3pCLFNBQVMsQ0FBQyxDQUFDO0FBQ1g7O0FBRUEsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsRUFBRTs7WUFFbEQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDYixVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsT0FBTyxLQUFLLENBQUM7QUFDekIsU0FBUyxDQUFDLENBQUM7O1FBRUgsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDMUQsU0FBUyxDQUFDLENBQUM7O1FBRUgsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsd0JBQXdCLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkQsU0FBUyxDQUFDLENBQUM7QUFDWDtBQUNBOztBQUVBLEtBQUs7O0lBRUQsU0FBUyxZQUFZLEdBQUc7UUFDcEIsT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLG1CQUFtQixFQUFFO1lBQ3RDLFVBQVUsRUFBRSxvQkFBb0I7WUFDaEMsYUFBYSxFQUFFLENBQUM7WUFDaEIsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixZQUFZLEVBQUUsRUFBRTtZQUNoQixNQUFNLEVBQUUsaUJBQWlCO1lBQ3pCLGVBQWUsRUFBRSxJQUFJO0FBQ2pDLFNBQVMsQ0FBQyxDQUFDOztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0IsS0FBSzs7QUFFTCxJQUFJLFNBQVMsaUJBQWlCLENBQUMsTUFBTSxFQUFFOztRQUUvQixNQUFNLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDL0MsY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RCxlQUFlLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixHQUFHLGVBQWUsQ0FBQyxDQUFDO0FBQzdELEtBQUs7O0lBRUQsU0FBUyxZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRTtRQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0MsSUFBSSxJQUFJLEdBQUc7WUFDUCxRQUFRLEVBQUUsUUFBUTtZQUNsQixVQUFVLEVBQUUsVUFBVTtTQUN6QixDQUFDO1FBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsRCxLQUFLOztJQUVELFNBQVMsV0FBVyxHQUFHO1FBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDSCxHQUFHLEVBQUUsVUFBVTtZQUNmLE1BQU0sRUFBRSxNQUFNO1lBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ2pCLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFO2dCQUNwQixLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUM7YUFDcEIsQ0FBQztZQUNGLFFBQVEsRUFBRSxNQUFNO1NBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUU7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUM3QixDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQztBQUNyQixLQUFLOztJQUVELFNBQVMsY0FBYyxDQUFDLFVBQVUsRUFBRTtRQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ0gsR0FBRyxFQUFFLFdBQVcsR0FBRyxVQUFVO1lBQzdCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFFBQVEsRUFBRSxNQUFNO1NBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUU7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDM0IsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUM7QUFDckIsS0FBSzs7SUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUU7UUFDekIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7YUFDN0IsSUFBSSxDQUFDLFNBQVMsWUFBWSxFQUFFO2dCQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzFDLGdCQUFnQixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXhDLGdCQUFnQixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7O2dCQUVoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDMUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDO3dCQUM3QixLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7d0JBQzFCLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUk7cUJBQ2pDLENBQUMsQ0FBQztvQkFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUNoQzthQUNKLENBQUMsQ0FBQztBQUNmLEtBQUs7O0lBRUQsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDZCxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDMUIsS0FBSzs7SUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQUssRUFBRTtBQUMxQyxRQUFRLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDOUM7O1FBRVEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLCtCQUErQixHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM3RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QixPQUFPO0FBQ25CLFNBQVM7O0FBRVQsUUFBUSxLQUFLLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQzs7QUFFN0IsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQzs7QUFFakUsUUFBUSxlQUFlLEdBQUcsR0FBRyxDQUFDOztRQUV0QixJQUFJLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDZCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkMsU0FBUzs7QUFFVCxRQUFRLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFM0MsUUFBUSxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztRQUVoQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0MsS0FBSzs7SUFFRCxTQUFTLHVCQUF1QixDQUFDLEtBQUssRUFBRTtBQUM1QyxRQUFRLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUM7O1FBRXRDLElBQUksS0FBSyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNaLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDckM7UUFDRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsa0NBQWtDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ2hFLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsQ0FBQztRQUMzQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3pDLEtBQUs7O0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxJQUFJLEVBQUU7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSztZQUNsQixPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUMzQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3RDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQywrQkFBK0IsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDekIsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRztTQUM3QyxDQUFDLENBQUM7QUFDWCxLQUFLOztJQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBSyxFQUFFO1FBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFDLEtBQUs7O0lBRUQsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDdEIsSUFBSSxPQUFPLElBQUksQ0FBQzs7Q0FFZixHQUFHLENBQUM7Ozs7OztBQzlOTDtBQUNBLE1BQU0sR0FBRyxDQUFDLFdBQVc7SUFDakIsSUFBSSxLQUFLLEdBQUcsRUFBRTtRQUNWLGNBQWMsR0FBRyxFQUFFO1FBQ25CLFVBQVUsR0FBRyxLQUFLO1FBQ2xCLEtBQUssR0FBRztZQUNKLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLEtBQUs7U0FDdkI7UUFDRCxJQUFJO1FBQ0osR0FBRztBQUNYLFFBQVEsTUFBTSxDQUFDO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO1FBQ3pCLElBQUksR0FBRyxHQUFHLENBQUM7UUFDWCxJQUFJLElBQUksRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLFFBQVEsR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztRQUV6QixHQUFHLENBQUMsTUFBTSxHQUFHLFdBQVc7WUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM3QyxTQUFTLENBQUM7O1FBRUYsR0FBRyxDQUFDLE9BQU8sR0FBRyxXQUFXO1lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNqQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDL0MsU0FBUyxDQUFDOztRQUVGLEdBQUcsQ0FBQyxTQUFTLEdBQUcsU0FBUyxHQUFHLEVBQUU7WUFDMUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUM5QixJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUk7QUFDbkMsZ0JBQWdCLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDOztBQUVwQyxZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRWpDLFlBQVksSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7O2dCQUV0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDbEQsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNqQzthQUNKLE1BQU07Z0JBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcscUJBQXFCLENBQUMsQ0FBQzthQUM3QztBQUNiLFNBQVMsQ0FBQzs7UUFFRixJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUU7WUFDakIsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sR0FBRyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQy9EO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3pCLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RCLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkMsTUFBTTtZQUNILGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3JDO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzFCLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RCLElBQUksS0FBSyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1osY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekM7QUFDYixTQUFTLE1BQU07O1NBRU47QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUVJLFNBQVMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDdkIsSUFBSSxPQUFPLEdBQUc7WUFDVixJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxJQUFJO0FBQ3RCLFNBQVMsQ0FBQzs7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMxQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0lBRUksU0FBUyxnQkFBZ0IsR0FBRztRQUN4QixJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2IsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN6QjtBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUVJLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNsQixLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLE1BQU0sRUFBRTtZQUM5RCxJQUFJLE1BQU0sRUFBRTtnQkFDUixLQUFLLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTtvQkFDckIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDNUI7YUFDSjtTQUNKLENBQUMsQ0FBQztRQUNILE9BQU8sR0FBRyxDQUFDO0FBQ25CLEtBQUs7QUFDTDs7SUFFSSxLQUFLLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUNmLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ25CLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMsR0FBRyxDQUFDOztBQUVMLFlBQVk7QUFDWixJQUFJLE9BQU8sTUFBTSxJQUFJLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTTs7OztBQzNJM0UsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgc29ja2VyID0gcmVxdWlyZSgnLi9zb2NrZXIuanMnKSxcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICAgIFN3aXBlciA9IHJlcXVpcmUoJ3N3aXBlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbih1c2VybmFtZSkge1xuICAgIHZhciBzZWxmID0ge30sXG4gICAgICAgIF9zZWxlY3RlZF9mcmFtZSxcbiAgICAgICAgXyRjdXJyZW50X3NsaWRlLFxuICAgICAgICBfd3MsXG4gICAgICAgIF9zd2lwZXIsXG4gICAgICAgIF9jb25uZWN0ZWRGcmFtZXMgPSBbXSxcbiAgICAgICAgX2RvbWFpbiA9IF91cmxfZG9tYWluKHdpbmRvdy5sb2NhdGlvbiksXG4gICAgICAgIF9jb250ZW50X2l0ZW1fdHBsID0gXy50ZW1wbGF0ZSgkKFwiI0NvbnRlbnRJdGVtVGVtcGxhdGVcIikuaHRtbCgpKSxcbiAgICAgICAgX2ZyYW1lX3RwbCA9IF8udGVtcGxhdGUoJChcIiNGcmFtZVRlbXBsYXRlXCIpLmh0bWwoKSk7XG5cbiAgICBmdW5jdGlvbiBfaW5pdCh1c2VybmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnaW5pdCcsIHVzZXJuYW1lKTtcblxuICAgICAgICBfc2V0dXBVc2VyRXZlbnRIYW5kbGluZygpO1xuXG4gICAgICAgIHNvY2tlci5jb25uZWN0KFwid3M6Ly9cIiArIF9kb21haW4gKyBcIjo4ODg4L2FkbWluL3dzL1wiICsgdXNlcm5hbWUpO1xuXG4gICAgICAgIHNvY2tlci5vbignZnJhbWU6Y29ubmVjdGVkJywgX2hhbmRsZUZyYW1lQ29ubmVjdGVkKTtcbiAgICAgICAgc29ja2VyLm9uKCdmcmFtZTpkaXNjb25uZWN0ZWQnLCBfaGFuZGxlRnJhbWVEaXNvbm5lY3RlZCk7XG4gICAgICAgIHNvY2tlci5vbignZnJhbWU6Y29udGVudF91cGRhdGVkJywgX2hhbmRsZUZyYW1lQ29udGVudFVwZGF0ZWQpO1xuICAgICAgICBzb2NrZXIub24oJ2ZyYW1lOnNldHVwJywgX2hhbmRsZUZyYW1lU2V0dXApO1xuXG4gICAgICAgIF9zZXR1cFN3aXBlcigpO1xuXG4gICAgICAgIF9mZXRjaENvbnRlbnQodXNlcm5hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9zZXR1cFVzZXJFdmVudEhhbmRsaW5nKCkge1xuICAgICAgICAvLyBMb2dvdXQgaGFuZGxlclxuICAgICAgICAvLyAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnI0xvZ291dEJ1dHRvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gICAgIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiO1xuICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBBZGQgY29udGVudFxuICAgICAgICAkKFwiI2FkZC1mb3JtXCIpLm9uKCdzdWJtaXQnLCBfYWRkQ29udGVudCk7XG5cbiAgICAgICAgLy8gc2VuZCB0byBmcmFtZSBoYW5kbGVyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuYnRuLXNlbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAvLyBmcmFtZV9pZCA9ICQoJyNTZW5kVG9GcmFtZScpLnZhbCgpLFxuICAgICAgICAgICAgICAgIGZyYW1lX2lkID0gX3NlbGVjdGVkX2ZyYW1lLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRfaWQgPSAkZWwuYXR0cigncmVsJyk7XG4gICAgICAgICAgICBfdXBkYXRlRnJhbWUoZnJhbWVfaWQsIGNvbnRlbnRfaWQpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZW1vdmUgY29udGVudCBoYW5kbGVyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucmVtb3ZlLWJ1dHRvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRfaWQgPSAkZWwuYXR0cigncmVsJyk7XG4gICAgICAgICAgICBfZGVsZXRlQ29udGVudChjb250ZW50X2lkKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlb3ZlcicsICcuZnJhbWUtb3V0ZXItY29udGFpbmVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2hvdmVyIG92ZXInKTtcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKHRoaXMpO1xuICAgICAgICAgICAgJGVsLmZpbmQoJy5idG4tc2V0dGluZ3MnKS5yZW1vdmVDbGFzcygnaGlkZScpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2VvdXQnLCAnLmZyYW1lLW91dGVyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdob3ZlciBvZmYnKTtcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKHRoaXMpO1xuICAgICAgICAgICAgJGVsLmZpbmQoJy5idG4tc2V0dGluZ3MnKS5hZGRDbGFzcygnaGlkZScpO1xuICAgICAgICB9KTtcblxuXG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfc2V0dXBTd2lwZXIoKSB7XG4gICAgICAgIF9zd2lwZXIgPSBuZXcgU3dpcGVyKCcuc3dpcGVyLWNvbnRhaW5lcicsIHtcbiAgICAgICAgICAgIHBhZ2luYXRpb246ICcuc3dpcGVyLXBhZ2luYXRpb24nLFxuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogMSxcbiAgICAgICAgICAgIHBhZ2luYXRpb25DbGlja2FibGU6IHRydWUsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IDMwLFxuICAgICAgICAgICAgb25Jbml0OiBfc2V0U2VsZWN0ZWRGcmFtZSxcbiAgICAgICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhfc3dpcGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfc2V0U2VsZWN0ZWRGcmFtZShzd2lwZXIpIHtcbiAgICAgICAgLy8gdGhpcyBzZWVtcyB0byBiZSBhIGhhY2tcbiAgICAgICAgc3dpcGVyLm9uKCdzbGlkZUNoYW5nZUVuZCcsIF9zZXRTZWxlY3RlZEZyYW1lKTtcbiAgICAgICAgXyRjdXJyZW50U2xpZGUgPSBzd2lwZXIuc2xpZGVzLmVxKHN3aXBlci5hY3RpdmVJbmRleCk7XG4gICAgICAgIF9zZWxlY3RlZF9mcmFtZSA9IF8kY3VycmVudFNsaWRlLmRhdGEoJ2ZyYW1lLWlkJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdfc2V0U2VsZWN0ZWRGcmFtZTogJyArIF9zZWxlY3RlZF9mcmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3VwZGF0ZUZyYW1lKGZyYW1lX2lkLCBjb250ZW50X2lkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZnJhbWVfaWQsIGNvbnRlbnRfaWQpO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGZyYW1lX2lkOiBmcmFtZV9pZCxcbiAgICAgICAgICAgIGNvbnRlbnRfaWQ6IGNvbnRlbnRfaWRcbiAgICAgICAgfTtcbiAgICAgICAgc29ja2VyLnNlbmQoJ2ZyYW1lOnVwZGF0ZV9jb250ZW50JywgZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FkZENvbnRlbnQoKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICcvY29udGVudCcsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICB1cmw6ICQoJyNVUkwnKS52YWwoKSxcbiAgICAgICAgICAgICAgICB1c2VyczogW3VzZXJuYW1lXVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgICAgICBfZmV0Y2hDb250ZW50KHVzZXJuYW1lKTtcbiAgICAgICAgICAgICQoJyNVUkwnKS52YWwoJycpLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2RlbGV0ZUNvbnRlbnQoY29udGVudF9pZCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiAnL2NvbnRlbnQvJyArIGNvbnRlbnRfaWQsXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICAgICAgX2ZldGNoQ29udGVudCh1c2VybmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZldGNoQ29udGVudCh1c2VyKSB7XG4gICAgICAgICQuZ2V0SlNPTignL2NvbnRlbnQvdXNlci8nICsgdXNlcilcbiAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGNvbnRlbnRfbGlzdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbnRlbnRfbGlzdCk7XG4gICAgICAgICAgICAgICAgdmFyICR1bF9hcnQgPSAkKFwiI0FydFwiKTtcblxuICAgICAgICAgICAgICAgICR1bF9hcnQuZW1wdHkoKTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudF9saXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRfaXRlbSA9IF9jb250ZW50X2l0ZW1fdHBsKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXJsXCI6IGNvbnRlbnRfbGlzdFtpXS51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IGNvbnRlbnRfbGlzdFtpXS5faWQuJG9pZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHVsX2FydC5hcHBlbmQoY29udGVudF9pdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfdXJsX2RvbWFpbihkYXRhKSB7XG4gICAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBhLmhyZWYgPSBkYXRhO1xuICAgICAgICByZXR1cm4gYS5ob3N0bmFtZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaGFuZGxlRnJhbWVDb25uZWN0ZWQoZnJhbWUpIHtcbiAgICAgICAgdmFyIF9pZCA9IGZyYW1lLl9pZC4kb2lkIHx8IGZyYW1lLl9pZDtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGlzIGZyYW1lIGFscmVhZHkgaXMgcmVuZGVyZWQsIGlmIHNvIHNsaWRlIHRvIGl0XG4gICAgICAgIHZhciAkZnJhbWUgPSAkKCcuc3dpcGVyLXNsaWRlW2RhdGEtZnJhbWUtaWQ9XCInICsgX2lkICsgJ1wiXScpO1xuICAgICAgICBpZiAoJGZyYW1lLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHNsaWRlX2luZGV4ID0gJCgnZGl2LnN3aXBlci1zbGlkZScpLmluZGV4KCRmcmFtZSk7XG4gICAgICAgICAgICBfc3dpcGVyLnNsaWRlVG8oc2xpZGVfaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnJhbWUuZnJhbWVfaWQgPSBfaWQ7XG5cbiAgICAgICAgaWYgKCFmcmFtZS5jdXJyZW50X2NvbnRlbnQpIGZyYW1lLmN1cnJlbnRfY29udGVudCA9IG51bGw7XG5cbiAgICAgICAgX3NlbGVjdGVkX2ZyYW1lID0gX2lkO1xuXG4gICAgICAgIHZhciBpbmRleCA9IF9jb25uZWN0ZWRGcmFtZXMuaW5kZXhPZihfaWQpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBfY29ubmVjdGVkRnJhbWVzLnB1c2goX2lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmcmFtZV9odG1sID0gX2ZyYW1lX3RwbChmcmFtZSk7XG5cbiAgICAgICAgX3N3aXBlci5hcHBlbmRTbGlkZShmcmFtZV9odG1sKTtcblxuICAgICAgICBfc3dpcGVyLnNsaWRlVG8oX3N3aXBlci5zbGlkZXMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaGFuZGxlRnJhbWVEaXNvbm5lY3RlZChmcmFtZSkge1xuICAgICAgICB2YXIgX2lkID0gZnJhbWUuX2lkLiRvaWQgfHwgZnJhbWUuX2lkO1xuXG4gICAgICAgIHZhciBpbmRleCA9IF9jb25uZWN0ZWRGcmFtZXMuaW5kZXhPZihfaWQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgX2Nvbm5lY3RlZEZyYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHZhciAkZnJhbWUgPSAkKCdkaXYuc3dpcGVyLXNsaWRlW2RhdGEtZnJhbWUtaWQ9XCInICsgX2lkICsgJ1wiXScpO1xuICAgICAgICB2YXIgc2xpZGVfaW5kZXggPSAkKCdkaXYuc3dpcGVyLXNsaWRlJykuaW5kZXgoJGZyYW1lKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3NsaWRlX2luZGV4OiAnICsgc2xpZGVfaW5kZXgpO1xuICAgICAgICBfc3dpcGVyLnJlbW92ZVNsaWRlKHNsaWRlX2luZGV4KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaGFuZGxlRnJhbWVDb250ZW50VXBkYXRlZChkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdmcmFtZSBjb250ZW50IGhhcyBiZWVuIHVwZGF0ZWQnLCBkYXRhKTtcbiAgICAgICAgdmFyIGZyYW1lID0gZGF0YS5mcmFtZSxcbiAgICAgICAgICAgIGNvbnRlbnQgPSBkYXRhLmNvbnRlbnQ7XG4gICAgICAgIHZhciBfaWQgPSBmcmFtZS5faWQuJG9pZCB8fCBmcmFtZS5faWQ7XG4gICAgICAgIHZhciAkZnJhbWUgPSAkKCcuc3dpcGVyLXNsaWRlW2RhdGEtZnJhbWUtaWQ9XCInICsgX2lkICsgJ1wiXScpO1xuICAgICAgICAkZnJhbWUuZmluZCgnZGl2LmZyYW1lJykuY3NzKHtcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWltYWdlJzogJ3VybCgnK2NvbnRlbnQudXJsKycpJ1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaGFuZGxlRnJhbWVTZXR1cChmcmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZnJhbWUgc2V0dXAnLCBmcmFtZSk7XG4gICAgfVxuXG4gICAgc2VsZi5pbml0ID0gX2luaXQ7XG4gICAgcmV0dXJuIHNlbGY7XG5cbn0pKCk7XG4iLCJcblNvY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgX3NlbGYgPSB7fSxcbiAgICAgICAgX2V2ZW50SGFuZGxlcnMgPSB7fSxcbiAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlLFxuICAgICAgICBfb3B0cyA9IHtcbiAgICAgICAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNoZWNrSW50ZXJ2YWw6IDEwMDAwXG4gICAgICAgIH0sXG4gICAgICAgIF91cmwsXG4gICAgICAgIF93cyxcbiAgICAgICAgX3RpbWVyO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB1cmwgIFRoZSBzZXJ2ZXIgVVJMLlxuICAgICAqIEBwYXJhbSAge29iamVjdH0gb3B0cyBPcHRpb25hbCBzZXR0aW5nc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jb25uZWN0KHVybCwgb3B0cykge1xuICAgICAgICBfdXJsID0gdXJsO1xuICAgICAgICBpZiAob3B0cykgX2V4dGVuZChfb3B0cywgb3B0cyk7XG4gICAgICAgIF93cyA9IG5ldyBXZWJTb2NrZXQodXJsKTtcblxuICAgICAgICBfd3Mub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiBvcGVuZWQnKTtcbiAgICAgICAgICAgIF9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uT3BlbikgX29wdHMub25PcGVuKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgX3dzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW9uIGNsb3NlZCcpO1xuICAgICAgICAgICAgX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKF9vcHRzLm9uQ2xvc2UpIF9vcHRzLm9uQ2xvc2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBfd3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBtZXNzYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIGV2ZW50IGhhbmRsZXIsIGNhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfZXZlbnRIYW5kbGVyc1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBfZXZlbnRIYW5kbGVyc1tuYW1lXVtpXShkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyBcIiBldmVudCBub3QgaGFuZGxlZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9vcHRzLmtlZXBBbGl2ZSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChfdGltZXIpO1xuICAgICAgICAgICAgX3RpbWVyID0gc2V0SW50ZXJ2YWwoX2NoZWNrQ29ubmVjdGlvbiwgX29wdHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gICBuYW1lICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9vbihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoX2V2ZW50SGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2V2ZW50SGFuZGxlcnNbbmFtZV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19ICAgbmFtZSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfb2ZmKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChfZXZlbnRIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gX2V2ZW50SGFuZGxlcnNbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIF9ldmVudEhhbmRsZXJzW25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGFuIGV2ZW50LlxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gbmFtZSBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBkYXRhIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9zZW5kKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIF93cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC4gSWYgbm90LCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jaGVja0Nvbm5lY3Rpb24oKSB7XG4gICAgICAgIGlmICghX2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgX2Nvbm5lY3QoX3VybCwgX29wdHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXRpbGl0eSBmdW5jdGlvbiBmb3IgZXh0ZW5kaW5nIGFuIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9leHRlbmQob2JqKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cblxuICAgIF9zZWxmLm9uID0gX29uO1xuICAgIF9zZWxmLm9mZiA9IF9vZmY7XG4gICAgX3NlbGYuc2VuZCA9IF9zZW5kO1xuICAgIF9zZWxmLmNvbm5lY3QgPSBfY29ubmVjdDtcbiAgICByZXR1cm4gX3NlbGY7XG59KSgpO1xuXG4vLyBDT01NT04uSlNcbmlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IFNvY2tlcjsiLCJ2YXIgQWRtaW4gPSByZXF1aXJlKCcuL2FkbWluLmpzJyk7XG5BZG1pbi5pbml0KGdsb2JhbC5PRl9VU0VSTkFNRSk7Il19
