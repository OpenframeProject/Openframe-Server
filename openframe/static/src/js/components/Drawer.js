var React = require('react'),
	NavFrameList = require('./NavFrameList'),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore');

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
        UIStore.addChangeListener(this._onChange);
    },

    _handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		UIActions.toggleMenu(false);
	},

	_onChange: function() {
        this.setState(UIStore.getMenuState());
    },

	render: function() {
		var baseClass = 'visible-xs menu-drawer';
		var openClass = this.state.open ? 'menu-drawer-open' : 'menu-drawer-closed';
		var sideClass = this.props.sideClass;
		var fullClass = [baseClass, openClass, sideClass].join(' ');


		return (
			<div className={fullClass}>
				<div className="menu-drawer-inner">
					<div className="of-nav-fixed of-nav-drawer">
						<div className="username text-center">{OF_USERNAME}</div>
						<button type="button" className="btn-simple-nav visible-xs pull-right" onClick={this._handleCloseMenuClick} >
		                    <span className="icon-close" />
		                </button>
					</div>
					<NavFrameList linkClickHandler={this._handleCloseMenuClick} />
				</div>
			</div>
		);
	}

});

module.exports = Drawer;