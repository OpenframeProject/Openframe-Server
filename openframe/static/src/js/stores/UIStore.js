var AppDispatcher = require('../dispatcher/AppDispatcher'),
    EventEmitter = require('events').EventEmitter,
    OFConstants = require('../constants/OFConstants'),
    assign = require('lodash').assign,
    _ = require('lodash');


var _menuOpen = false,
    _settingsOpen = false,
    _addOpen = false,
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
        console.log('sending _selectionPanel', _selectionPanel);
        return {
            selectionPanel: _selectionPanel
        };
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
            console.log(_selectionPanel);
            UIStore.emitChange();
            break;

        case OFConstants.UI_SET_SELECTION_PANEL:
            _selectionPanel = action.panel;
            console.log(_selectionPanel);
            UIStore.emitChange();
            break;

        default:
            // no op
  }
});

module.exports = UIStore;