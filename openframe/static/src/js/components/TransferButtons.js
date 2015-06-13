var React = require('react'),
	FrameActions = require('../actions/FrameActions'),
	ContentStore = require('../stores/ContentStore');

var TransferButtons = React.createClass({

	render: function() {
		return (
			<div className="row visible-xs transfer-buttons">
                <div className="col-xs-12 text-center">
                    <div className="btn-group" role="group" aria-label="...">
                        <button type="button" className="btn btn-xs btn-default btn-send btn-transfer" onClick={this.sendClicked}>
                            <span className="icon icon-send" aria-hidden="true" />
                        </button>
                        {/* <button type="button" class="btn btn-xs btn-default btn-send btn-transfer">
                                                <span class="icon icon-send" aria-hidden="true"></span>
                                        </button> */}
                    </div>
                </div>
            </div>
		);
	},

	sendClicked: function(e) {
		FrameActions.updateContent(ContentStore.getSelectedContent());
	}

});

module.exports = TransferButtons;