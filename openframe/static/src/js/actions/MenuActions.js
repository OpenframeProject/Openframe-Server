var AppDispatcher = require('../dispatcher/AppDispatcher'),
	OFConstants = require('../constants/OFConstants'),
	$ = require('jquery')

var MenuActions = {

	toggleMenu: function() {
		AppDispatcher.dispatch({
			actionType: OFConstants.MENU_TOGGLE
		});
	},

	toggleSettings: function() {
		AppDispatcher.dispatch({
			actionType: OFConstants.SETTINGS_TOGGLE
		});
	}
	
}

module.exports = MenuActions;