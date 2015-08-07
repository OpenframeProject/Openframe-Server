var React = require('react'),
    Swiper = require('swiper'),
    ContentItem = require('./ContentItem'),
    ContentActions = require('../actions/ContentActions'),
    UIActions = require('../actions/UIActions'),
    ContentStore = require('../stores/ContentStore'),
    _ = require('lodash');

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
    },

    componentWillUnmount: function() {
        console.log('componentDidUnmount');
        ContentStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {
    },

    _onChange: function() {
        this.setState({
            content: ContentStore.getContent()
        });

        // TODO: better React integration for the swiper

        this._initSlider();
        // if (this.state.content.length) {
        //     var content_id = this.state.content[0]._id;
        // }
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
            // freeMode: true,
            // freeModeMomentum: true,
            // freeModeMomentumRatio: 0.5,
            // freeModeSticky:true,
            // loop: true,
            // loopedSlides: 5,
            initialSlide: 0,
            keyboardControl: true,
            onSlideChangeEnd: this._slideChangeEnd
        });
    },

    /**
     * When we change slides, update the selected content
     * in the ContentStore
     * @param  {Swiper} swiper
     */
    _slideChangeEnd: function(swiper) {
        var slide = this.swiper.slides[this.swiper.activeIndex],
            content_id = slide.dataset.contentid;
        console.log('_slideChangeEnd', content_id);
        ContentActions.slideChanged(content_id);
    },

    /**
     * Once the component has loaded we can appropriately
     * adjust the size of the slider container.
     */
    _updateContainerDimensions: function() {
        console.log('_updateContainerDimensions');
        var container = this.refs.Swiper.getDOMNode(),
            h = container.offsetHeight,
            // current top of the frames swiper container (i.e. screen midpoint)
            top = container.offsetTop,
            //  height of the footer nav (40) + frame detail text (52)
            footerH = 50,
            //  additional padding
            padding = 40,
            totalPad = footerH + padding,
            newH = h - totalPad;

        container.style.height = newH+'px';
        container.style.top = (top + padding/2) + 'px';
    },

    render: function() {

        var contentItems = this.state.content.map(function (contentItem) {
            return (
                <ContentItem content={contentItem} key={contentItem._id} />
            );
        });

        contentItems.reverse();

        return (
            <div className="swiper-outer-container">
                <div className="swiper-container" ref="Swiper">
                    <div className="swiper-wrapper">
                        {contentItems}
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = ContentList;
