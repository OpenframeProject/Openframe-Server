var React = require('react'),
    FrameActions = require('../actions/FrameActions');

var NavFrameLink = React.createClass({
	handleFrameSelection: function(e) {
		FrameActions.select(this.props.frame);
		if (this.props.linkClickHandler) {
			this.props.linkClickHandler();
		}
	},

	render: function() {
		var activeClass = 'not-connected',
			activeText = 'not connected';
		if (this.props.frame.active) {
			activeClass = activeText = 'connected';
		}

		var classes = 'pull-right status ' + activeClass;
		return (
			<li onClick={this.handleFrameSelection}>
				<a href="#">
					<div>
						<span className="pull-left">{this.props.frame.name}</span> 
						<span className={classes}>{activeText}</span>
					</div>
				</a>
			</li>
		);
	}
});

module.exports = NavFrameLink;