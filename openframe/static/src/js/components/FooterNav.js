var React = require('react'),
	$ = require('jquery');

var FooterNav = React.createClass({
	getInitialState: function() {
		return {
			collection: true
		}
	},

	_handleCollectionClick: function() {

	},

	_handleFramesClick: function() {

	},

	_handleAddClick: function() {
		$('.modal-add-content').modal();
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
		return collection;
	}

});

module.exports = FooterNav;