var React = require('react');

var FooterNav = React.createClass({

	render: function() {
		return (
			<div className="row of-nav-fixed of-nav-footer">
				<div className="col-xs-4">
					<a className="btn-nav-footer active" href="#"><span className="glyphicon glyphicon-stop" /></a>
				</div>
				<div className="col-xs-4">
					<a className="btn-nav-footer" href="#"><span className="glyphicon glyphicon-stop" /></a>
				</div>
				<div className="col-xs-4">
					<a className="btn-nav-footer" href="#"><span className="glyphicon glyphicon-search" /> <span className="hidden-xs">SEARCH</span></a>
				</div>
			</div>
		);
	}

});

module.exports = FooterNav;