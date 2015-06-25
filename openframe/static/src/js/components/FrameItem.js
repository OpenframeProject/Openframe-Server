var React = require('react'),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var FrameItem = React.createClass({
	_handleSlideClick: function(e) {
		console.log('slide click');
		UIActions.openPreview(this.props.frame);
	},
	render: function() {
		var frame = this.props.frame;
		return (
			<div className="swiper-slide frame-slide" data-frameid={frame._id} onClick={this._handleSlideClick}>
				<img src={frame.current_content.url} />
			</div>
		);
	}
});

module.exports = FrameItem;
