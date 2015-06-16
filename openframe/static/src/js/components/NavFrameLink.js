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

		function isSelected(selected) {
            return selected ? 'icon-check' : 'space';
        }

		var classes = 'pull-right status ' + activeClass;
		return (
			<li onClick={this.handleFrameSelection}>
				<a href="#">
					<span className={isSelected(this.props.frame.selected)} /> {this.props.frame.name}
					<span className={classes}>{activeText}</span>
				</a>
			</li>
		);
	}
});

module.exports = NavFrameLink;