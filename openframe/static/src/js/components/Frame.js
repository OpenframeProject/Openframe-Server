var React = require('react');

var Frame = React.createClass({
	getDefaultProps: function() {
		return {
			frame: {
				name: ''
			}
		};
	},
	render: function() {
		return (
			<div className="col-md-12 frame-outer-container">
				<button type="button" className="btn btn-primary btn-xs btn-settings hide" data-toggle="modal" data-target="#myModal">S</button>
	            <div className="frame" />
	            <div className="frame-name text-center">
	                <h6>{this.props.frame.name}</h6>
	            </div>
	        </div>
		);
	}

});

module.exports = Frame;