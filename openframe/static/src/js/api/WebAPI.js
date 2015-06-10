var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = require('jquery'),
	Socker = require('Socker'),
	conf = require('../config');

WebAPI = {
	init: function() {
		
		Socker.connect("ws://" + conf.domain + ":8888/admin/ws/" + OF_USERNAME);

        Socker.on('frame:connected', _handleFrameConnected);
        Socker.on('frame:disconnected', _handleFrameDisonnected);
        Socker.on('frame:content_updated', _handleFrameContentUpdated);
        Socker.on('frame:setup', _handleFrameSetup);

	}
};

module.exports = WebAPI;

