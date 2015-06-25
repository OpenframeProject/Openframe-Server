var React = require('react'),
    Swiper = require('swiper'),
    FrameItem = require('./FrameItem'),
	FrameItemDetails = require('./FrameItemDetails'),
    FrameActions = require('../actions/FrameActions'),
	UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore'),
    _ = require('lodash'),
    $ = require('jquery');

var FramesList = React.createClass({
	getInitialState: function() {
        return {
			frames: [],
            currentFrame: {
                name: '',
                owner: ''
            }
		}
	},

	componentDidMount: function() {
		FrameActions.loadVisibleFrames();
		FrameStore.addChangeListener(this._onChange);
        this._updateContainerDimensions();
    },

    componentWillUnmount: function() {
        FrameStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {
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

    // _populateSlider: function() {
    //     this.swiper.removeAllSlides();
    //     this.state.frames.forEach(this._addSlide);
    // },

    // _addSlide: function(frame) {
    //     // If there is current content set on the frame.
    //     if (frame.current_content && frame.current_content.url) {
    //         var html = '' +
    //             '<div class="swiper-slide frame-slide" data-frameid="' + frame._id + '">' +
    //                 '<img src=' + frame.current_content.url + ' />' +
    //             '</div>';

    //         this.swiper.appendSlide(html);
    //     }
    // },

    _slideTo: function(index) {
        this.swiper.slideTo(index);
    },

    _slideChangeEnd: function(slider) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            frame_id = slide.dataset.frameid;
        console.log(frame_id);
        FrameActions.slideChanged(frame_id);
    },

    _updateContainerDimensions: function() {
        var container = this.refs.container.getDOMNode(),
            h = container.offsetHeight,
            padding = 100,
            newH = h - padding;

        container.style.height = newH+'px';
        // container.style.top = '0px';
    },

  	_onChange: function() {
  		this.setState({
  			frames: FrameStore.getVisibleFrames()
  		}, function() {
            if (!this.swiper) {
                this._initSlider();
            }
        });

        // TODO: better React integration for the swiper
        // Maybe a slide component?

  	},

    render: function() {
        var mirroring_count = '';

        if (this.state.currentFrame && this.state.currentFrame.mirroring_count) {
            mirroring_count = (
                <div className="visible-frame-stats">
                    <span className="of-icon-mirror"></span> {this.state.currentFrame.mirroring_count}
                </div>
            )
        }

        var frameItems = this.state.frames.map(function (frameItem) {
            return (
                <FrameItem frame={frameItem} key={frameItem._id} />
            );
        });
        return (
            <div>
                <div className="swiper-outer-container" ref="container">
                    <div className="swiper-container" ref="Swiper">
                        <div className="swiper-wrapper">
                            {frameItems}
                        </div>
                    </div>
                </div>
                <FrameItemDetails />
            </div>
        );
    }

});

module.exports = FramesList;
