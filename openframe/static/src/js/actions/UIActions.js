var AppDispatcher = require('../dispatcher/AppDispatcher'),
    OFConstants = require('../constants/OFConstants'),
    $ = require('jquery')

var UIActions = {

    toggleMenu: function(open) {
        // if open true, open. if false, close.
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_MENU_TOGGLE,
            open: open
        });
    },

    toggleSettings: function(open) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_SETTINGS_TOGGLE,
            open: open
        });
    },

    setSelectionPanel: function(panel) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_SET_SELECTION_PANEL,
            panel: panel
        });
    },

    openAddContentModal: function() {
        console.log('openAddContentModal');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_ADD_CONTENT
        });
    },

    addContentModalClosed: function() {
        console.log('addContentModalClosed');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_ADD_CONTENT
        });
    },

    openSettingsModal: function() {
        console.log('openSettingsModal');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_SETTINGS
        });
    },

    settingsModalClosed: function() {
        console.log('settingsModalClosed');
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_SETTINGS
        });
    },

    openPreview: function(frame) {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_OPEN_PREVIEW,
            frame: frame
        })
    },

    closePreview: function() {
        AppDispatcher.handleViewAction({
            actionType: OFConstants.UI_CLOSE_PREVIEW
        })
    }

}

module.exports = UIActions;