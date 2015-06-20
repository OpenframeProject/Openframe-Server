var React = require('react'),
	FrameActions = require('../actions/FrameActions'),
    ContentStore = require('../stores/ContentStore'),
	UIStore = require('../stores/UIStore');

var TransferButtons = React.createClass({
    getInitialState: function() {
        return {
            selectionPanel: "collection"
        };
    },

    componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
    },

    _onChange: function() {
        this.setState(UIStore.getSelectionPanelState());
    },

    _handleSendClicked: function(e) {
        console.log('_handleSendClicked');
        FrameActions.updateContent(ContentStore.getSelectedContent());
    },

	_handleMirrorClicked: function(e) {
        console.log('_handleMirrorClicked');
		FrameActions.mirrorFrame(FrameStore.getSelectedVisibleFrame());
	},

    render: function() {
        var icon, handler;
        if (this.state.selectionPanel === 'collection') {
            icon = 'icon-up';
            handler = this._handleSendClicked;
        } else {
            icon = 'of-icon-mirror';
            handler = this._handleMirrorClicked;
        }
        return (
            <div className="row transfer-buttons">
                <div className="col-xs-12 text-center">
                    <div className="btn-group" role="group" aria-label="...">
                        <button type="button" className="btn btn-xs btn-default btn-send btn-transfer" onClick={handler}>
                            <span className={icon} aria-hidden="true" />
                        </button>
                        {/* <button type="button" class="btn btn-xs btn-default btn-send btn-transfer">
                                                <span class="icon icon-send" aria-hidden="true"></span>
                                        </button> */}
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = TransferButtons;
