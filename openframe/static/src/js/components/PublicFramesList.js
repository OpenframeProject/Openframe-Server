var React = require('react'),
	FrameItemDetails = require('./FrameItemDetails'),
    PublicFrameSwiper = require('./PublicFrameSwiper'),
    PublicFrameActions = require('../actions/PublicFrameActions'),
    PublicFrameStore = require('../stores/PublicFrameStore'),
    FrameStore = require('../stores/FrameStore');


/**
 * This component manages state for the list of public frames
 */
var PublicFramesList = React.createClass({
	getInitialState: function() {
        return {
			publicFrames: [],
            currentSlideFrame: {
                name: '',
                owner: ''
            },
            selectedFrame: {}
		}
	},

	componentDidMount: function() {
        console.log('PublicFramesList: component did mount');
        PublicFrameStore.addChangeListener(this._onChange);
		FrameStore.addChangeListener(this._onChange);
        PublicFrameActions.loadPublicFrames();
    },

    componentWillUnmount: function() {
        PublicFrameStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {},

  	_onChange: function() {
  		this.setState({
  			publicFrames: PublicFrameStore.getPublicFrames(),
            currentSlideFrame: PublicFrameStore.getSelectedPublicFrame(),
            selectedFrame: FrameStore.getSelectedFrame()
  		});
  	},

    render: function() {
        return (
            <div>
                <PublicFrameSwiper frames={this.state.publicFrames} />
                <FrameItemDetails frame={this.state.currentSlideFrame} selectedFrame={this.state.selectedFrame} />
            </div>
        );
    }

});

module.exports = PublicFramesList;
