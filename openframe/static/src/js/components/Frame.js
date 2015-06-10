var React = require('react'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore');

var Frame = React.createClass({

	getInitialState: function() {
		return {
			frame: {
				name: '',
				current_content: {
					url: ''
				}
			}
		}
	},

	componentDidMount: function() {
		FrameActions.loadFrames();
		FrameStore.addChangeListener(this._onChange);
	},

	render: function() {
		var divStyle = {
			backgroundImage: 'url(' + this.state.frame.current_content.url + ')',
			backgroundSize: 'contain',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: 'center center'
		};
		return (
			<div className="col-md-12 frame-outer-container">
				<button type="button" className="btn btn-primary btn-xs btn-settings hide" data-toggle="modal" data-target="#myModal">S</button>
	            <div className="frame" style={divStyle} />
	            <div className="frame-name text-center">
	                <h6>{this.state.frame.name}</h6>
	            </div>
	        </div>
		);
	},

  	_onChange: function() {
  		this.setState({
  			frame: FrameStore.getSelectedFrame()
  		});
  	}


});

module.exports = Frame;