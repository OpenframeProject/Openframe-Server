var React = require('react'),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var FrameItem = React.createClass({
	propTypes: {
		frame: React.PropTypes.object.isRequired
	},
	_handleSlideClick: function(e) {
		console.log('slide click');
		if (this.props.frame && this.props.frame.current_content) {
			UIActions.openPreview(this.props.frame);
		}
	},
	render: function() {
		var frame = this.props.frame;

		function frameContent() {
			if (frame.current_content) {
				return <img src={frame.current_content.url} />
			}
			return <div className="no-content">Frame is currently empty!</div>
		}
		return (
			<div className="swiper-slide frame-slide" data-frameid={frame._id} onClick={this._handleSlideClick}>
				{frameContent()}
			</div>
		);
	}
});

module.exports = FrameItem;
