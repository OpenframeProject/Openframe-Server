var React = require('react'),
	MenuActions = require('../actions/MenuActions'),
	MenuStore = require('../stores/MenuStore'),
	SettingsForm = require('./SettingsForm');

var SettingsDrawer = React.createClass({
	getInitialState: function() {
		return {
			open: false
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-right'
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
				<div className="menu-drawer-inner">
					<div className="of-nav-fixed of-nav-drawer">
						<div className="username text-center">{OF_USERNAME}</div>
						<button type="button" className="btn-simple-nav visible-xs pull-right" onClick={this._handleCloseMenuClick} >
		                    <span className="glyphicon glyphicon-menu-right" />
		                </button>
					</div>
					<div className="drawer-content">
						<SettingsForm />
					</div>
				</div>
			</div>
		);
	},

	_handleCloseMenuClick: function() {
		console.log('_handleCloseMenuClick');
		MenuActions.toggleSettings();
	},

	_onChange: function() {
        this.setState(MenuStore.getSettingsState());
    }

});

module.exports = SettingsDrawer;