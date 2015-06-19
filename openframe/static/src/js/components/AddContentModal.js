var React = require('react'),
	UIActions = require('../actions/UIActions'),
	ContentActions = require('../actions/ContentActions'),
	UIStore = require('../stores/UIStore'),
	_ = require('lodash');

var AddContentModal = React.createClass({
	getInitialState: function() {
		return {
			selectionPanel: "collection"
		};
	},

	getDefaultProps: function() {
		return {}
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
        var that = this;
        $(this.refs.modal.getDOMNode()).on('hidden.bs.modal', function() {
        	console.log('hidden.bs.modal');
        	that._resetForm();
        	UIActions.addContentModalClosed();
        });
    },

	_handleAddContent: function() {
		var url = this.refs.url.getDOMNode().value,
			tags = this.refs.tags.getDOMNode().value;

		if (!url.trim()) {
			return;
		}

		tags = tags.trim().split('#');

		_.remove(tags, function(tag) {
			return tag.trim() == '';
		});

		_.each(tags, function(tag, i) {
			tags[i] = tag.trim();
		});

		console.log(tags);

		var content = {
            url: url,
            users: [OF_USERNAME],
            tags: tags
        };
		ContentActions.addContent(content);

	},

	_handleOnFocus: function(e) {
		var el = e.currentTarget;
		if (el.value.trim() == '') {
			el.value = '#';
		}
	},

	_handleTagsChange: function(e) {
		var el = e.currentTarget,
			val = el.value;

		if (el.value == '') {
			el.value = '#';
		}

		if (val[val.length-1] === ' ') {
			el.value += '#'
		}
	},

	_handleKeyDown: function(e) {
		var val = e.currentTarget.value;
		if (e.key === 'Backspace' && val !== '#') {
			if (val[val.length - 1] === '#') {
				e.currentTarget.value = val.substring(0, val.length - 1);
			}
		}
	},

	_resetForm: function() {
		this.refs.url.getDOMNode().value = '';
		this.refs.tags.getDOMNode().value = '';
	},

	_onChange: function() {
        this.setState(UIStore.getAddModalState(), function() {
	        if (this.state.addOpen) {
	        	$(this.refs.modal.getDOMNode()).modal();
	        } else {
	        	$(this.refs.modal.getDOMNode()).modal('hide');
	        }
        });
    },

	render: function() {
		return (
			<div className="modal fade modal-add-content" ref="modal">
				<div className="modal-dialog">
					<div className="modal-content">
				  		<div className="modal-header">
				    		<button type="button" className="close" data-dismiss="modal" aria-label="Close">
				    			<span className="icon-close" aria-hidden="true"></span>
			    			</button>
					    	<h4 className="modal-title">Add Content</h4>
					  	</div>
						<div className="modal-body">
				    		<div className="form-label">Enter URL</div>
				    		<div className="form-input">
				    			<input ref="url" type="text" placeholder="http://..." />
				    		</div>

				    		<div className="form-label">Enter description with tags</div>
				    		<div className="form-input">
				    			<input ref="tags" type="text" 
				    					placeholder="#photo #Rodchenko #1941" 
				    					onFocus={this._handleOnFocus}
				    					onChange={this._handleTagsChange}
				    					onKeyDown={this._handleKeyDown}/>
				    		</div>
				  		</div>
				  		<div className="modal-footer">
				    		<button onClick={this._handleAddContent} type="button" className="btn btn-primary btn-add-content">
				    			Add To Collection
				    		</button>
				  		</div>
					</div>
				</div>
			</div>
		);
	}

});

module.exports = AddContentModal;