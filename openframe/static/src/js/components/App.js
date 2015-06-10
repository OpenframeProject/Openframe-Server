var React = require('react'),
	Nav = require('./Nav.js'),
	FrameContainer = require('./FrameContainer.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js');

var App = React.createClass({
	getInitialState: function() {
		return {
			frames: [],
			selectedFrame: {
				name: ''
			}
		}
	},
	componentDidMount: function() {
		if (!global.OF_USERNAME) return;

		$.getJSON('/frames/user/'+global.OF_USERNAME, (function(frames) {
			console.log('frames be gotten: ', frames);
			if (frames.length) {
				this.setState({
					frames: frames,
					selectedFrame: frames[0]
				});
			}
		}).bind(this));
	},
  	render: function(){
		var frames = ['home', 'studio'];
	    return (
	      <div className='app'>
		      <Nav frames={this.state.frames} />
		      <FrameContainer frame={this.state.selectedFrame} />
		      <TransferButtons />
		      <AddContentForm />
		      <ContentList />
		  </div>
	    )
  	}
});

module.exports = App;