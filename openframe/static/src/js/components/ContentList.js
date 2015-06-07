var React = require('react'),
	Swiper = require('swiper');

var ContentList = React.createClass({
	componentDidMount: function() {
		var el = React.findDOMNode(this);
		this.swiper = new Swiper(el, {
	        slidesPerView: 1,
	        spaceBetween: 30,
	        loop: true,
	        keyboardControl: true
	    });
	},
	render: function() {
		return (
			<div className="swiper-container">
                <div className="swiper-wrapper">
                    <div className="swiper-slide">
                        <img src="/static/dist/img/placeholder.jpg" />
                    </div>
                    <div className="swiper-slide">
                        <img src="/static/dist/img/placeholder.jpg" />
                    </div>
                    <div className="swiper-slide">
                        <img src="/static/dist/img/placeholder.jpg" />
                    </div>
                </div>
            </div>
		);
	}

});

module.exports = ContentList;