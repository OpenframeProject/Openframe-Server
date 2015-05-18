OF_Admin = (function(username, socker) {
    var self = {},
        _selected_frame,
        _$current_slide,
        _ws,
        _swiper,
        _connectedFrames = [],
        _domain = _url_domain(window.location),
        _content_item_tpl = _.template($("#ContentItemTemplate").html()),
        _frame_tpl = _.template($("#FrameTemplate").html());

    function _init() {
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
        $(document).on('click', '#LogoutButton', function(e) {
            window.location = "/";
            return false;
        });

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

        _swiper.on('slideChangeEnd', _setSelectedFrame);
    }

    function _setSelectedFrame(swiper) {
        // this seems to be a hack
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

        frame.frame_id = _id;

        if (!frame.current_content) frame.current_content = null;

        // TEMP
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

})(OF_USERNAME, Socker);
