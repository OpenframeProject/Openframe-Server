var React = require('react'),
    ContentActions = require('../actions/ContentActions');

var AddContentForm = React.createClass({
    handleFormSubmit: function(e) {
        e.preventDefault();
        var url = React.findDOMNode(this.refs.URL).value;

        if (!url) return;

        var content = {
            url: url,
            users: [OF_USERNAME]
        };
        console.log('submitting content: ', content);
        ContentActions.addContent(content);

        React.findDOMNode(this.refs.URL).value = '';
        React.findDOMNode(this.refs.URL).focus();
    },
	render: function() {
		return (
			<div className="row hidden-xs" id="add-content-div">
                <form className="form-inline" id="add-form" onSubmit={this.handleFormSubmit}>
                    <div className="form-group">
                        {/* <label for="SendToUser">URL</label> */}
                        <div className="col-md-10">
                            <input type="text" className="form-control" id="URL" placeholder="enter URL" ref="URL" />
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