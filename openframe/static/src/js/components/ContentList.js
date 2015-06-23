var React = require('react'),
	Swiper = require('swiper'),
    ContentActions = require('../actions/ContentActions'),
	UIActions = require('../actions/UIActions'),
	ContentStore = require('../stores/ContentStore');

var ContentList = React.createClass({
	getInitialState: function() {
		return {
			content: []
		}
	},

	componentDidMount: function() {
		ContentActions.loadContent();
		ContentStore.addChangeListener(this._onChange);
		this._updateContainerDimensions();

        // hack
        $(document).on('click', '.content-slide', this._handleClick);
    },

    componentWillUnmount: function() {
        console.log('componentDidUnmount');
        ContentStore.removeChangeListener(this._onChange);
        $(document).off('click', '.content-slide');
	},

    componentDidUpdate: function() {

    },

    _handleClick: function() {
        // hack -- so we can use the FramePreview
        // component here. Should get refactored to be more generic.
        UIActions.openPreview({
            current_content: ContentStore.getSelectedContent()
        });
    },

  	_onChange: function() {
  		this.setState({
  			content: ContentStore.getContent()
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
	        centeredSlides: true,
	        // freeMode: true,
	        // freeModeMomentum: true,
	        // freeModeMomentumRatio: 0.5,
	        // freeModeSticky:true,
	        // loop: true,
	        // loopedSlides: 5,
	        keyboardControl: true,
	        onSlideChangeEnd: this._slideChangeEnd
	    });
  	},

  	_populateSlider: function() {
  		this.swiper.removeAllSlides();
  		this.state.content.forEach(this._addSlide);
  	},

  	_addSlide: function(contentItem) {
  		var html = '<div class="swiper-slide content-slide" data-contentid="' + contentItem._id + '"><img src=' + contentItem.url + ' /></div>'
		  this.swiper.prependSlide(html);
  	},

  	_slideTo: function(index) {
  		this.swiper.slideTo(index);
  	},

  	_slideChangeEnd: function(slider) {
  		var slide = this.swiper.slides[this.swiper.activeIndex],
  			content_id = slide.dataset.contentid;
  		console.log('_slideChangeEnd', content_id);
  		ContentActions.slideChanged(content_id);
  	},

    _updateContainerDimensions: function() {
    	console.log('_updateContainerDimensions');
        var container = React.findDOMNode(this)
            h = container.offsetHeight,
            padding = 40,
            newH = h - padding;

        container.style.height = newH+'px';
        // container.style.top = '0px';
    },

    render: function() {
        function createContentSlide(contentItem) {
            console.log('creating slide: ', contentItem);
            return (
                <div key={contentItem._id.$oid} className="swiper-slide">
                    <img src={contentItem.url} />
                </div>
            );
        }
        return (
            <div className="swiper-outer-container">
                <div className="swiper-container" ref="Swiper">
                    <div className="swiper-wrapper">

                    </div>
                </div>
            </div>
        );
    }

});

module.exports = ContentList;