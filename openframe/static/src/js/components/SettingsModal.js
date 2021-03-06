var React = require('react'),
	UIActions = require('../actions/UIActions'),
	UIStore = require('../stores/UIStore'),
	_ = require('lodash');

var SettingsModal = React.createClass({
	getInitialState: function() {
		return {
			settingsOpen: false
		}
	},

	componentDidMount: function() {
		// this.setState(this.props);
        UIStore.addChangeListener(this._onUIChange);

        // set modal event handler
        $(this.refs.modal.getDOMNode()).on('hidden.bs.modal', function() {
        	console.log('hidden.bs.modal');
        	UIActions.settingsModalClosed();
        });

        // Vertically center modals
		/* center modal */
		function centerModals(){
		    $('.modal').each(function(i){
		        var $clone = $(this).clone().css('display', 'block').appendTo('body');
		        var top = Math.round(($clone.height() - $clone.find('.modal-content').height()) / 2);
		        top = top > 0 ? top : 0;
		        $clone.remove();
		        $(this).find('.modal-content').css("margin-top", top);
		    });
		}
		$(this.refs.modal.getDOMNode()).on('show.bs.modal', centerModals);
    },

    componentWillUnount: function() {
        UIStore.removeChangeListener(this._onUIChange);
        $(this.refs.modal.getDOMNode()).off('hidden.bs.modal');
    },

	_handleNameChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.name = val;
		this.props.onSettingsChange(frame);
	},

	_handleDescriptionChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.description = val;
		this.props.onSettingsChange(frame);
	},

	_handleVisibilityChange: function(e) {
		var val = event.target.checked;
		frame = this.props.frame;
		frame.settings.visible = val;
		this.props.onSettingsChange(frame);
	},

	_handleRotationChange: function(e) {
		var val = event.target.value;
		frame = this.props.frame;
		frame.settings.rotation = val;
		this.props.onSettingsChange(frame);
	},

	/**
	 * Pass along event to App, where the save Action is triggered.
	 * @param  {[type]} e [description]
	 */
	_handleSave: function(e) {
		this.props.onSaveSettings()
	},

	_onUIChange: function() {
        this.setState(UIStore.getSettingsModalState(), function() {
	        if (this.state.settingsOpen) {
	        	$(this.refs.modal.getDOMNode()).modal();
	        } else {
	        	$(this.refs.modal.getDOMNode()).modal('hide');
	        }
        });
    },

	render: function() {
		console.log('++++++++ ', this.props.frame);

		return (
			<div className="modal fade modal-settings" ref="modal">
				<div className="modal-dialog">
					<div className="modal-content">
				  		<div className="modal-header">
				    		<button type="button" className="close" data-dismiss="modal" aria-label="Close">
				    			<span className="icon-close" aria-hidden="true"></span>
			    			</button>
					    	<h4 className="modal-title">Settings</h4>
					  	</div>
						<div className="modal-body">
							<div className="row row-form-field">
								<div className="col-xs-12">
						    		<div className="form-label">Name</div>
						    		<div className="form-input">
						    			<input
						    				ref="name"
						    				type="text"
						    				value={this.props.frame.name}
						    				onChange={this._handleNameChange}
					    				/>
						    		</div>
						    	</div>
					    	</div>

				    		<div className="row row-form-field">
				    			<div className="col-xs-12">
						    		<div className="form-label">Description (optional)</div>
						    		<div className="form-label-subtext">Useful if your frame follows a theme</div>
						    		<div className="form-input">
						    			<input
						    				ref="description"
					    					type="text"
					    					value={this.props.frame.description}
					    					onChange={this._handleDescriptionChange}
					    					placeholder="e.g. japanese art, 90s posters" />
						    		</div>
						    	</div>
					    	</div>

				    		<div className="row row-form-field">
				    			<div className="col-xs-9">
						    		<div className="form-label">Visible to other people</div>
						    		<div className="form-label-subtext">Your frame will appear on Frames and others can mirror it</div>
						    	</div>
						    	<div className="col-xs-3">
						    		<div className="form-input-checkbox">
						    			<input className="pull-right" ref="visibility" type="checkbox"
						    				checked={this.props.frame.settings.visible}
						    				onChange={this._handleVisibilityChange}
					    				/>
						    		</div>
						    	</div>
					    	</div>

				    		<div className="row row-form-field row-form-field-rotation">
				    			<div className="col-xs-6 form-label">Rotation</div>
					    		<div className="col-xs-6 form-input-select">
					    			<select className="pull-right" ref="rotation"
					    				value={this.props.frame.settings.rotation}
					    				onChange={this._handleRotationChange}
				    				>
										<option value="0">0&deg;</option>
										<option value="90">90&deg;</option>
										<option value="-90">-90&deg;</option>
										<option value="180">180&deg;</option>
									</select>
					    		</div>
					    	</div>
				  		</div>
				  		<div className="modal-footer">
				    		<button onClick={this._handleSave} type="button" className="btn btn-primary btn-add-content">
				    			Save
				    		</button>
				  		</div>
					</div>
				</div>
			</div>
		);
	}

});

module.exports = SettingsModal;
