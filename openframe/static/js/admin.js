OF_Admin = (function(username, socker) {
    var self = {},
        _selectedFrame,
        _connectedFrames = [],
        _ws,
        _domain = _url_domain(window.location),
        _content_item_tpl = _.template($("#ContentItemTemplate").html()),
        _frame_tpl = _.template($("#FrameTemplate").html());

    function _init() {
        _setupUserEventHandling();

        socker.connect("ws://" + _domain + ":8888/admin/ws/" + username);

        socker.on('frame:connected', _handleFrameConnected);
        socker.on('frame:disconnected', _handleFrameDisonnected);
        socker.on('frame:updated_content', _handleFrameContentUpdated);

        _fetchContent(username);
    }

    function _setupUserEventHandling() {
        // Logout handler
        $(document).on('click', '#LogoutButton', function(e) {
            window.location = "/";
            return false;
        });

        // Add content
        $("#AddForm").on('submit', _addContent);

        // send to frame handler
        $(document).on('click', '.btn-send', function(e) {
            // e.preventDefault();
            var $el = $(e.target),
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

        // TEMP
        _selected_frame = _id;

        var index = _connectedFrames.indexOf(_id);
        if (index === -1) {
            _connectedFrames.push(_id);
        }

        var frame_html = _frame_tpl(frame);

        $('ul.frames-list').append(frame_html);
    }

    function _handleFrameDisonnected(frame) {
        var _id = frame._id.$oid || frame._id;

        var index = _connectedFrames.indexOf(_id);
        if (index > -1) {
            _connectedFrames.splice(index, 1);
        }

        $('li[data-frame-id="' + _id + '"]').remove();
    }

    function _handleFrameContentUpdated(data) {
        console.log('frame content has been updated');
    }

    self.init = _init;
    return self;

})(OF_USERNAME, Socker);
