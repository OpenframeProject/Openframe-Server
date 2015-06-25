var React = require('react'),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var ContentItem = React.createClass({
	_handleSlideClick: function(e) {
		console.log('slide click');
		// bit of a hack -- so we can use the FramePreview
        // component here. Preview should get refactored to be more generic.
		UIActions.openPreview({
            current_content: this.props.content
        });
	},
	render: function() {
		var content = this.props.content;
		return (
			<div className="swiper-slide content-slide" data-contentid={content._id} onClick={this._handleSlideClick}>
				<img src={content.url} />
			</div>
		);
	}
});

module.exports = ContentItem;
