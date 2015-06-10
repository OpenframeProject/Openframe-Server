var React = require('react'),
	Nav = require('./Nav.js'),
	FrameContainer = require('./FrameContainer.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),

	AppDispatcher = require('../dispatcher/AppDispatcher'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore');

/**
 * The App is the root component responsible for:
 * - setting up structure of child components
 * - kickoff server communication (fetching frames and content)
 *
 * Individual components register for Store state change events
 */
var App = React.createClass({
	
	componentDidMount: function() {
		if (!global.OF_USERNAME) {
			console.log('OF_USERNAME not defined.');
			return;
		}
	},

	componentWillUnmount: function() {
		FrameStore.removeChangeListener(this._onChange);
	},

  	render: function(){
	    return (
	      <div className='app'>
		      <Nav />
		      <FrameContainer />
		      <TransferButtons />
		      <AddContentForm />
		      <ContentList />
		  </div>
	    )
  	}
});

module.exports = App;