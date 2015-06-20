var React = require('react'),
	$ = require('jquery'),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore');

var FooterNav = React.createClass({
	getInitialState: function() {
		return {
			selectionPanel: "collection"
		};
	},

	getDefaultProps: function() {
		return {}
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
    },

    _handleCloseMenuClick: function() {
		UIActions.toggleMenu(false);
	},

	_handleCollectionClick: function() {
		UIActions.setSelectionPanel("collection");
	},

	_handleFramesClick: function() {
		UIActions.setSelectionPanel("frames");
	},

	_handleAddClick: function(e) {
		e.stopPropagation();
		UIActions.openAddContentModal();
	},

	_onChange: function() {
        this.setState(UIStore.getSelectionPanelState());
    },

	/**
	 * TODO: figure out state management. Store?
	 * @return {[type]} [description]
	 */
	render: function() {
		var collection = (
			<div className="row of-nav-fixed of-nav-footer">
				<div className="col-xs-6">
					<a className="btn-nav-footer btn-nav-footer-collection active" href="#" onClick={this._handleCollectionClick}>
						<span className="collection">collection</span>
					</a>
				</div>
				<div className="col-xs-6">
					<a className="btn-nav-footer btn-nav-footer-frames" href="#" onClick={this._handleFramesClick}>
						<span className="frames">frames</span>
					</a>
				</div>
				<a className="btn-nav-footer-add active" href="#" onClick={this._handleAddClick}>+</a>
			</div>
		);

		var frames = (
			<div className="row of-nav-fixed of-nav-footer">
				<div className="col-xs-6">
					<a className="btn-nav-footer btn-nav-footer-collection" href="#" onClick={this._handleCollectionClick}>
						<span className="collection">collection</span>
					</a>
				</div>
				<div className="col-xs-6">
					<a className="btn-nav-footer btn-nav-footer-frames active" href="#" onClick={this._handleFramesClick}>
						<span className="frames">frames</span>
					</a>
				</div>
			</div>
		);
		var panel = this.state.selectionPanel;
		console.log('PANEL: ', this.state, panel);
		return panel === 'collection' ? collection : frames;
	}

});

module.exports = FooterNav;
