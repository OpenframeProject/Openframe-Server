var React = require('react'),
	FrameItemDetails = require('./FrameItemDetails'),
    PublicFrameSwiper = require('./PublicFrameSwiper'),
    PublicFrameActions = require('../actions/PublicFrameActions'),
    PublicFrameStore = require('../stores/PublicFrameStore');


/**
 * This component manages state for the list of public frames
 */
var PublicFramesList = React.createClass({
	getInitialState: function() {
        return {
			frames: [],
            selectedFrame: {
                name: '',
                owner: ''
            }
		}
	},

	componentDidMount: function() {
        console.log('PublicFramesList: component did mount');
		PublicFrameStore.addChangeListener(this._onChange);
        PublicFrameActions.loadPublicFrames();
    },

    componentWillUnmount: function() {
        PublicFrameStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function() {},

  	_onChange: function() {
  		this.setState({
  			frames: PublicFrameStore.getPublicFrames(),
            selectedFrame: PublicFrameStore.getSelectedPublicFrame()
  		});
  	},

    render: function() {
        return (
            <div>
                <PublicFrameSwiper frames={this.state.frames} />
                <FrameItemDetails frame={this.state.selectedFrame}/>
            </div>
        );
    }

});

module.exports = PublicFramesList;
