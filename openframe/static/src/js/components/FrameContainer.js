var React = require('react'),
	$ = require('jquery'),
	Frame = require('./Frame.js');

var FrameContainer = React.createClass({
	getDefaultProps: function() {
		return {
			frame: {
				name: ''
			}
		};
	},
	render: function() {
		return (
			<div className="row frames-list">
                <Frame frame={this.props.frame} />
            </div>
        );
	}

});

module.exports = FrameContainer;