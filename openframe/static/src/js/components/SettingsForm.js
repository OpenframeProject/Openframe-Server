var React = require('react')
	MenuActions = require('../actions/MenuActions'),
	FrameStore = require('../stores/FrameStore');

var SettingsDrawer = React.createClass({
	getInitialState: function() {
		return {
			frame: {
				settings: {
					on_time: '06:00:00',
					off_time: '12:00:00',
					rotation: 180,
					visibility: 'public'
				},
				user: [
					'jonwohl',
					'ishback',
					'andy'
				]
			}
		};
	},

	getDefaultProps: function() {
		return {
			sideClass: 'menu-drawer-right'
		}
	},
	
	componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

	render: function() {
		return (
			<div className="settings-fields">
				<div className="row row-settings">
					<div className="col-xs-2">Users</div>
					<div className="col-xs-8">
						<input className="users-input" type="text" ref="newUser" />
					</div>
					<div className="col-xs-2">
						<button className="btn btn-xs btn-default pull-right">Add</button>
					</div>
					<div className="col-xs-12">
						{this.state.frame.users}
					</div>
				</div>
				<div className="row row-settings">
					<div className="col-xs-2">Turn on</div>
					<div className="col-xs-10">
						<select className="pull-right" ref="turnOn" value={this.state.frame.settings.on_time}>
							<option value="05:00:00">5am</option>
							<option value="06:00:00">6am</option>
							<option value="07:00:00">7am</option>
							<option value="08:00:00">8am</option>
							<option value="09:00:00">9am</option>
							<option value="10:00:00">10am</option>
							<option value="11:00:00">11am</option>
							<option value="12:00:00">12pm</option>
						</select>
					</div>
				</div>
				<div className="row row-settings">
					<div className="col-xs-2">Turn on</div>
					<div className="col-xs-10">
						<select className="pull-right" ref="turnOff" value={this.state.frame.settings.off_time}>
							<option value="05:00:00">5pm</option>
							<option value="06:00:00">6pm</option>
							<option value="07:00:00">7pm</option>
							<option value="08:00:00">8pm</option>
							<option value="09:00:00">9pm</option>
							<option value="10:00:00">10pm</option>
							<option value="11:00:00">11pm</option>
							<option value="12:00:00">12pm</option>
						</select>
					</div>
				</div>
				<div className="row row-settings">
					<div className="col-xs-2">Rotate</div>
					<div className="col-xs-10">
						<select className="pull-right" ref="rotate" value={this.state.frame.settings.rotation}>
							<option value="0">none</option>
							<option value="90">90&deg;</option>
							<option value="-90">-90&deg;</option>
							<option value="180">180&deg;</option>
						</select>
					</div>
				</div>
				<div className="row row-settings">
					<div className="col-xs-2">Visibility</div>
					<div className="col-xs-10">
						<select className="pull-right" ref="turnOff" value={this.state.frame.settings.visibility}>
							<option value="public">public</option>
							<option value="private">private</option>
						</select>
					</div>
				</div>
			</div>
		);
	},

	_onChange: function() {

    }

});

module.exports = SettingsDrawer;