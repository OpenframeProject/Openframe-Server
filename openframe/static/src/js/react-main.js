var React = require('react'),
    $ = require('jquery'),
    App = require('./components/App.js'),
    browser_state = require('./browser_state_manager'),
    FastClick = require('fastclick');

// init javascript media query-like state detection
browser_state.init();

// Turn on touch events for React.
// React.initializeTouchEvents(true);

// FastClick removes the 300s delay on stupid iOS devices
window.addEventListener('load', function() {
	console.log('attaching FastClick');
	FastClick.attach(document.body);
});

React.render(
	<App />,
	document.getElementById('OpenFrame')
)