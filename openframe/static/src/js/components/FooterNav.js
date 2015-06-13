var React = require('react');

var FooterNav = React.createClass({

	render: function() {
		return (
			<div className="row nav-footer">
				<div className="col-xs-4">
					<a className="btn-nav-footer active" href="#"><span className="glyphicon glyphicon-stop" /></a>
				</div>
				<div className="col-xs-4">
					<a className="btn-nav-footer" href="#"><span className="glyphicon glyphicon-stop" /></a>
				</div>
				<div className="col-xs-4">
					<a className="btn-nav-footer" href="#"><span className="glyphicon glyphicon-stop" /></a>
				</div>
			</div>
		);
	}

});

module.exports = FooterNav;