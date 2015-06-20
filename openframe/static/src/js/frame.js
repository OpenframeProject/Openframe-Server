OF_Frame = (function(frame_id, socker) {
    var self = {},
        _connected = false,
        _domain = _url_domain(window.location),
        _$body = $('body'),
        _width = window.innerWidth,
        _height = window.innerHeight;


    function _init() {
        console.log('_init');

        socker.connect("ws://" + _domain + ":8888/ws/" + frame_id, {
            onOpen: function() {
                socker.send('frame:setup', {width: _width, height: _height});
            }
        });

        socker.on('frame:update_content', _handleUpdateContent);
    }

    function _handleUpdateContent(content) {
        _id = content._id.$oid || content._id;

        _$body.animate({
                'opacity': 0
            }, 1000, function() {
                _$body.css({
                    'background-image': 'url("' + content.url + '")'
                });
                _$body.animate({
                    'opacity': 1
                }, 1000);
            });

        var data = {
            frame_id: frame_id,
            content_id: _id
        };

        Socker.send('frame:content_updated', data);
    }

    function _url_domain(data) {
        var a = document.createElement('a');
        a.href = data;
        return a.hostname;
    }

    self.init = _init;
    return self;

})(OF_FRAME_ID, Socker);
