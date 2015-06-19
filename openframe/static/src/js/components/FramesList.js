var React = require('react'),
	Swiper = require('swiper'),
	FrameActions = require('../actions/FrameActions'),
    FrameStore = require('../stores/FrameStore'),
	UIStore = require('../stores/UIStore');

var FramesList = React.createClass({
	getInitialState: function() {
		return {
			frames: [],
            currentFrame: {
                name: 'test',
                owner: 'jonwohl',
                mirrored_by: [1,2,3,4,5]
            }
		}
	},

	componentDidMount: function() {
		FrameActions.loadVisibleFrames();
		FrameStore.addChangeListener(this._onChange);
	},

	componentWillUnmount: function() {
		FrameStore.removeChangeListener(this._onChange);
	},

    componentDidUpdate: function() {
        this._updateContainerDimensions();
    },

  	_onChange: function() {
  		this.setState({
  			frames: FrameStore.getVisibleFrames()
  		});

  		// TODO: better React integration for the swiper

  		if (!this.swiper) {
  			this._initSlider();
  		}

  		this._populateSlider()

		// var slide_index = $('div.swiper-slide').length;
        this.swiper.slideTo(0);
  	},

  	_initSlider: function() {
  		var el = React.findDOMNode(this.refs.Swiper);
		this.swiper = new Swiper(el, {
	        slidesPerView: 3,
	        spaceBetween: 50,
            preloadImages: true,
	        centeredSlides: true,
	        freeMode: true,
	        freeModeMomentum: true,
	        freeModeMomentumRatio: .25,
	        freeModeSticky:true,
	        keyboardControl: true,
	        onSlideChangeEnd: this._slideChangeEnd
	    });


  	},

  	_populateSlider: function() {
  		this.swiper.removeAllSlides();
  		this.state.frames.forEach(this._addSlide);
  	},

  	_addSlide: function(frame) {
        var html = '' +
            '<div class="swiper-slide frame-slide" data-contentid="' + frame._id + '">' +
                '<img src=' + frame.current_content.url + ' />' +
            '</div>';

		this.swiper.prependSlide(html);
  	},

  	_slideTo: function(index) {
  		this.swiper.slideTo(index);
  	},

  	_slideChangeEnd: function(slider) {
  		var slide = this.swiper.slides[this.swiper.activeIndex],
  			frame_id = slide.dataset.frameid;
  		console.log('_slideChangeEnd', frame_id);
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

    render: function() {
        return (
            <div>
                <div className="swiper-outer-container" ref="container">
                    <div className="swiper-container" ref="Swiper">
                        <div className="swiper-wrapper">

                        </div>
                    </div>
                </div>
                <div className="frame-slide-content">
                    <div className="visible-frame-details">
                        <div>
                            <span className="visible-frame-name">{this.state.currentFrame.name}</span>
                            <span className="visible-frame-user">@ {this.state.currentFrame.owner}</span>
                        </div>
                        <div className="visible-frame-stats">
                            <span className="of-icon-mirror"></span> {this.state.currentFrame.mirrored_by.length}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = FramesList;