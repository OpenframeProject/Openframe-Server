var React = require('react');

var AddContentModal = React.createClass({

	_handleAddContent: function() {

	},

	render: function() {
		return (
			<div className="modal fade modal-add-content">
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
				    			<input ref="tags" type="text" placeholder="#photo #Rodchenko #1941" />
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