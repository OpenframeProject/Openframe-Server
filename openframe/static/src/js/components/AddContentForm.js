var React = require('react');

var AddContentForm = React.createClass({

	render: function() {
		return (
			<div className="row hidden-xs" id="add-content-div">
                <form className="form-inline" id="add-form">
                    <div className="form-group">
                        {/* <label for="SendToUser">URL</label> */}
                        <div className="col-md-10">
                            <input type="text" className="form-control" id="URL" placeholder="enter URL" />
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-default btn-add-content" href="#add-content" id="add-content-button">Add Content</button>
                        </div>
                    </div>
                </form>
            </div>
		);
	}

});

module.exports = AddContentForm;