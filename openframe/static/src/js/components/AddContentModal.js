var React = require('react'),
	UIActions = require('../actions/UIActions'),
	ContentActions = require('../actions/ContentActions'),
	UIStore = require('../stores/UIStore'),
	_ = require('lodash');

var AddContentModal = React.createClass({
	getInitialState: function() {
		return {
			addOpen: false
		}
	},

	getDefaultProps: function() {
	},

	componentDidMount: function() {
        UIStore.addChangeListener(this._onChange);
        var that = this;
        $(this.refs.modal.getDOMNode()).on('hidden.bs.modal', function() {
        	console.log('hidden.bs.modal');
        	that._resetForm();
        	UIActions.addContentModalClosed();
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
		// $(window).on('resize', centerModals);
    },

    componentWillUnount: function() {
        UIStore.removeChangeListener(this._onChange);
        $(this.refs.modal.getDOMNode()).off('hidden.bs.modal');
    },

	_testImage: function(url, callback, timeout) {
	    timeout = timeout || 5000;
	    var timedOut = false,
	        timer;
	    var img = new Image();
	    img.onerror = img.onabort = function() {
	        if (!timedOut) {
	            clearTimeout(timer);
	            callback(url, "error");
	        }
	    };
	    img.onload = function() {
	        if (!timedOut) {
	            clearTimeout(timer);
	            callback(url, "success");
	        }
	    };
	    img.src = url;
	    timer = setTimeout(function() {
	        timedOut = true;
	        callback(url, "timeout");
	    }, timeout);
	},

	_handleAddContent: function() {
		var url = this.refs.url.getDOMNode().value,
			tags = this.refs.tags.getDOMNode().value;

		if (!url.trim()) {
			return;
		}

        function performAdd(url, success) {
        	if (success !== 'success') {
        		console.log('bad url');
        		return;
        	}

        	tags = tags.trim().split('#');

			_.remove(tags, function(tag) {
				return tag.trim() == '';
			});

			_.each(tags, function(tag, i) {
				tags[i] = tag.trim();
			});

			var content = {
	            url: url,
	            users: [OF_USERNAME],
	            tags: tags
	        };
			ContentActions.addContent(content);
        }

        this._testImage(url, performAdd);

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
		if (val[0] != '#') {
			e.currentTarget.value = val = '#' + val;

		}
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
							<div className="row row-form-field">
				    			<div className="col-xs-12">
						    		<div className="form-label">Enter URL</div>
						    		<div className="form-input">
						    			<input ref="url" type="url" autoCapitalize="off" placeholder="http://..." />
						    		</div>
						    	</div>
					    	</div>

					    	<div className="row row-form-field">
				    			<div className="col-xs-12">
						    		<div className="form-label">Enter description with tags</div>
						    		<div className="form-input">
						    			<input ref="tags" type="text"
						    					autoCapitalize="off"
						    					placeholder="#photo #Rodchenko #1941"
						    					onFocus={this._handleOnFocus}
						    					onChange={this._handleTagsChange}
						    					onKeyDown={this._handleKeyDown} />
				    				</div>
				    			</div>
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
