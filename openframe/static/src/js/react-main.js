var React = require('react'),
    $ = require('jquery'),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager'),
    FastClick = require('fastclick');


browser_state.init();

React.initializeTouchEvents(true);

window.addEventListener('load', function() {
	console.log('attaching FastClick');
	FastClick.attach(document.body);
});

React.render(
	<App />,
	document.getElementById('OpenFrame')
)