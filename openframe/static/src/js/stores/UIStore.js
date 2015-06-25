var AppDispatcher = require('../dispatcher/AppDispatcher'),
    EventEmitter = require('events').EventEmitter,
    OFConstants = require('../constants/OFConstants'),
    assign = require('lodash').assign,
    _ = require('lodash');


var _menuOpen = false,
    _settingsOpen = false,
    _addOpen = false,
    _settingsOpen = false,
    _previewOpen = false,
    _previewFrame = null,
    _selectionPanel = "collection";

var _toggleMenu = function(open) {
    _menuOpen = !!open;
}


var UIStore = assign({}, EventEmitter.prototype, {

    getMenuState: function() {
        return {
            open: _menuOpen
        };
    },

    getSettingsState: function() {
        return {
            open: _settingsOpen
        };
    },

    getSelectionPanelState: function() {
        return {
            selectionPanel: _selectionPanel
        };
    },

    getAddModalState: function() {
        return {
            addOpen: _addOpen
        };
    },

    getSettingsModalState: function() {
        console.log('========', _settingsOpen);
        return {
            settingsOpen: _settingsOpen
        };
    },

    getPreviewState: function() {
        return {
            previewOpen: _previewOpen,
            frame: _previewFrame
        }
    },

    emitChange: function() {
        this.emit(OFConstants.CHANGE_EVENT);
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

        case OFConstants.UI_MENU_TOGGLE:
            _toggleMenu(action.open);
            UIStore.emitChange();
            break;

        case OFConstants.UI_MENU_TOGGLE:
            _toggleSettings();
            UIStore.emitChange();
            break;

        case OFConstants.UI_SET_SELECTION_PANEL:
            _selectionPanel = action.panel;
            UIStore.emitChange();
            break;

        case OFConstants.UI_OPEN_ADD_CONTENT:
            _addOpen = true;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_ADD_CONTENT:
            // modal already closing, no change emmission needed
            _addOpen = false;
            break;

        case OFConstants.UI_OPEN_SETTINGS:
            _settingsOpen = true;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_SETTINGS:
            // modal already closing, no change emmission needed
            _settingsOpen = false;
            break;

        case OFConstants.UI_OPEN_PREVIEW:
            _previewOpen = true;
            _previewFrame = action.frame;
            UIStore.emitChange();
            break;

        case OFConstants.UI_CLOSE_PREVIEW:
            _previewOpen = false;
            UIStore.emitChange();
            break;

        case OFConstants.CONTENT_ADD_DONE:
            _addOpen = false;
            UIStore.emitChange();
            break;

        // case OFConstants.FRAME_SLIDE_CHANGED:
        //     _selected_visible_frame_id = action.frame_id;
        //     break;

        case OFConstants.FRAME_SAVE:
            _settingsOpen = false;
            UIStore.emitChange();
            break;

        default:
            // no op
  }
});

module.exports = UIStore;
