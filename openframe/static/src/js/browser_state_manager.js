var ssm = require('ssm')
	conf = require('./config');

function _initBrowserStateManagement() {
	console.log('_initBrowserStateManagement');

	_setupScreenSize();

	ssm.addState({
	    id: 'xs',
	    maxWidth: 767,
	    onEnter: function(){
	        console.log('enter xs');
	        conf.screen_size = 'xs';
	    }
	});

	ssm.addState({
	    id: 'sm',
	    minWidth: 768,
	    onEnter: function(){
	        console.log('enter sm');
	        conf.screen_size = 'sm';
	    }
	});

	ssm.addState({
	    id: 'md',
	    minWidth: 992,
	    onEnter: function(){
	        console.log('enter md');
	        conf.screen_size = 'md';
	    }
	});

	ssm.addState({
	    id: 'lg',
	    minWidth: 1200,
	    onEnter: function(){
	        console.log('enter lg');
	        conf.screen_size = 'lg';
	    }
	});	

	ssm.ready();
}

function _setupScreenSize() {
	conf.wW = window.innerWidth;
	conf.wH = window.innerHeight;
	console.log(conf);
}

module.exports = {
	init: _initBrowserStateManagement
}

