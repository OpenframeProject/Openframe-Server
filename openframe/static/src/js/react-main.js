var React = require('react'),
    $ = require('jquery'),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager');


browser_state.init();

React.initializeTouchEvents(true);

React.render(
	<App />,
	document.getElementById('OpenFrame')
)