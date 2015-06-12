var React = require('react'),
    FrameActions = require('../actions/FrameActions');

var NavFrameLink = React.createClass({
	handleFrameSelection: function(e) {
		FrameActions.select(this.props.frame);
	},

	render: function() {
		var active = this.props.frame.active ? '*' : '';
		return (
			<li onClick={this.handleFrameSelection}>
				<a href="#">{this.props.frame.name} {active}</a>
			</li>
		);
	}
});

module.exports = NavFrameLink;