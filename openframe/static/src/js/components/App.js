var React = require('react'),
	Nav = require('./Nav.js'),
	FrameContainer = require('./FrameContainer.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js')

	;

var App = React.createClass({
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