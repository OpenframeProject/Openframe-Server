var React = require('react'),
	NavFrameList = require('./NavFrameList'),
	MenuActions = require('../actions/MenuActions'),
	MenuStore = require('../stores/MenuStore');

var Drawer = React.createClass({
	getInitialState: function() {
		return {
			open: false
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-left'
		}
	},
	
	componentDidMount: function() {
        MenuStore.addChangeListener(this._onChange);
    },

	render: function() {
		var baseClass = 'visible-xs menu-drawer';
		var openClass = this.state.open ? 'menu-drawer-open' : 'menu-drawer-closed';
		var sideClass = this.props.sideClass;
		var fullClass = [baseClass, openClass, sideClass].join(' ');


		return (
			<div className={fullClass}>
				<div className="of-nav-fixed of-nav-drawer">
					<div className="username text-center">{OF_USERNAME}</div>
					<button type="button" className="btn-simple-nav visible-xs pull-left" onClick={this._handleCloseMenuClick} >
	                    <span className="glyphicon glyphicon-menu-left" />
	                </button>
				</div>
				<NavFrameList linkClickHandler={this._handleCloseMenuClick} />
			</div>
		);
	},

	_handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		MenuActions.toggleMenu();
	},

	_onChange: function() {
        this.setState(MenuStore.getMenuState());
    }

});

module.exports = Drawer;