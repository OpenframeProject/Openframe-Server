var React = require('react'),
    Swiper = require('swiper'),
    FrameItem = require('./FrameItem'),
    PublicFrameActions = require('../actions/PublicFrameActions');

var PublicFrameSwiper = React.createClass({
    componentDidMount: function() {
        this._updateContainerDimensions();
    },

    componentDidUpdate: function(prevProps, prevState) {
        if (!this.swiper) {
            this._initSlider();
        }
    },

    _initSlider: function() {
        var el = React.findDOMNode(this.refs.Swiper);
        if (this.swiper) {
            this.swiper.destroy();
        }
        this.swiper = new Swiper(el, {
            slidesPerView: 3,
            spaceBetween: 50,
            centeredSlides: true,
            // preloadImages: true,
            // freeMode: true,
            // freeModeMomentum: true,
            // freeModeMomentumRatio: .25,
            // freeModeSticky:true,
            keyboardControl: true,
            onSlideChangeEnd: this._slideChangeEnd
        });
    },

    _slideTo: function(index) {
        this.swiper.slideTo(index);
    },

    _slideChangeEnd: function(slider) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            frame_id = slide.dataset.frameid;
        PublicFrameActions.slideChanged(frame_id);
    },

    _updateContainerDimensions: function() {
        console.log('_updateContainerDimensions');
        var container = this.refs.container.getDOMNode(),
            h = container.offsetHeight,
            padding = 100,
            newH = h - padding;

        container.style.height = newH+'px';
        // container.style.top = '0px';
    },

    render: function() {
        var frameItems = this.props.frames.map(function (frameItem) {
            return (
                <FrameItem frame={frameItem} key={frameItem._id} />
            );
        });

        return (
            <div className="swiper-outer-container" ref="container">
                <div className="swiper-container" ref="Swiper">
                    <div className="swiper-wrapper">
                        {frameItems}
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = PublicFrameSwiper;
