var React = require('react'),
	Swiper = require('swiper');

var ContentList = React.createClass({
	getInitialState: function() {
		return {
			content: []
		}
	},
	componentDidMount: function() {
		$.getJSON('/content/user/'+global.OF_USERNAME, (function(content) {
			console.log('content be gotten: ', content);
			if (content.length) {
				this.setState({
					content: content
				});
				var el = React.findDOMNode(this);
				this.swiper = new Swiper(el, {
			        slidesPerView: 1,
			        spaceBetween: 30,
			        loop: true,
			        keyboardControl: true
			    });
			}
		}).bind(this));

		
	},
	render: function() {
		function createContentSlide(contentItem) {
			console.log('creating slide: ', contentItem);
			var divStyle = {
			  backgroundImage: 'url(' + contentItem.url + ')',
			  backgroundSize: 'contain',
			  backgroundRepeat: 'no-repeat',
			  backgroundPosition: 'center center',
			  minHeight: '200px',
			  minWidth: '300px'
			};
			return (
				<div key={contentItem._id.$oid} className="swiper-slide" onClick={null}>
                    <div style={ divStyle } />
                </div>
            );
		}
		return (
			<div className="swiper-container">
                <div className="swiper-wrapper">
                    {this.state.content.map(createContentSlide.bind(this))}
                </div>
            </div>
		);
	}

});

module.exports = ContentList;