var React = require('react'),
    Swiper = require('swiper'),
    FrameItem = require('./FrameItem'),
    PublicFrameActions = require('../actions/PublicFrameActions');

var PublicFrameSwiper = React.createClass({
    componentDidMount: function() {
        this._updateContainerDimensions();
    },

    componentDidUpdate: function(prevProps, prevState) {
        // on first render, init swiper
        if (!this.swiper) {
            this._initSlider();
        }
    },

    /**
     * Invoked when the props are changing.
     * Not on first render.
     * @param  {[type]} nextProps [description]
     * @return {[type]}           [description]
     */
    componentWillReceiveProps: function(nextProps) {
        // if (this.swiper) {
        //     this.swiper.detachEvents();
        //     this.swiper.destroy();
        // }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        console.log("()()()()()()()(()");
        console.log(this.props, nextProps);

        if (this.props.frames.length && this.props.frames.length === nextProps.frames.length) {
            console.log('should NOT update');
            return false;
        }
        console.log('should update');
        return true;
    },

    _initSlider: function() {
        var el = React.findDOMNode(this.refs.Swiper);
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
            // current top of the frames swiper container (i.e. screen midpoint)
            top = container.offsetTop,
            //  height of the footer nav (40) + frame detail text (52)
            footerH = 92,
            //  additional padding
            padding = 40,
            totalPad = footerH + padding,
            newH = h - totalPad;

        container.style.height = newH+'px';
        container.style.top = (top + padding/2) + 'px';
    },

    render: function() {
        var frameItems = this.props.frames.map(function (frameItem) {
            // if (!frameItem.current_content) return;
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
