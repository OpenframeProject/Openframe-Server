var React = require('react'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore');

var Frame = React.createClass({

	getInitialState: function() {
		return {}
	},

	componentDidMount: function() {
		FrameActions.loadFrames();
		FrameStore.addChangeListener(this._onChange);
	},

	render: function() {
		if (!this.state.frame) {
			return <div>No frames available.</div>
		}
		var w_h_ratio = this.state.frame && this.state.frame.settings ? this.state.frame.settings.w_h_ratio : 1;

		var url = this.state.frame && this.state.frame.current_content ? this.state.frame.current_content.url : '';
		var divStyle = {
			backgroundImage: 'url(' + url + ')',
		};

		console.log(w_h_ratio);

		var whStyle = {
			paddingBottom: (1/w_h_ratio) * 100 + '%'
		};

		var active = this.state.frame.active ? '*' : '';
		return (
			<div className="row frames-list">
				<div className="col-xl-12 frame-outer-container">
					<button type="button" className="btn btn-primary btn-xs btn-settings hide" data-toggle="modal" data-target="#myModal">S</button>
					<div className="frame-inner-container" style={whStyle} >
		            	<div className="frame" style={divStyle} />
		            </div>
		            <div className="hidden-xs frame-name text-center">
		                <h6>{this.state.frame.name} {active}</h6>
		            </div>
		        </div>
	        </div>
		);
	},

  	_onChange: function() {
  		var selectedFrame = FrameStore.getSelectedFrame();
  		console.log('selectedFrame:', selectedFrame);
  		this.setState({
  			frame: selectedFrame
  		});
  	}


});

module.exports = Frame;