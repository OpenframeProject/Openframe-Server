var React = require('react'),
	FrameActions = require('../actions/FrameActions'),
	UIActions = require('../actions/UIActions'),
	FrameStore = require('../stores/FrameStore');

var Frame = React.createClass({

	// getInitialState: function() {
	// 	return {}
	// },

	componentDidMount: function() {
		// FrameActions.loadFrames();
		// FrameStore.addChangeListener(this._onChange);
	},

	componentDidUpdate: function() {
		this._updateContainerDimensions();
	},

	_handleClick: function(e) {
		if (this.props.frame.current_content) {
			UIActions.openPreview(this.props.frame);
		}
	},

  	// _onChange: function() {
  	// 	var selectedFrame = FrameStore.getSelectedFrame();
  	// 	console.log('selectedFrame:', selectedFrame);
  	// 	this.setState({
  	// 		frame: selectedFrame
  	// 	});
  	// },

  	_updateContainerDimensions: function() {
  		var container = React.findDOMNode(this),
  			frameOuterContainer = React.findDOMNode(this.refs.frameOuterContainer),
  			frameInnerContainer = React.findDOMNode(this.refs.frameInnerContainer),
  			frame = React.findDOMNode(this.refs.frame),
			w = container.offsetWidth,
			h = container.offsetHeight,
			padding = 50,
			maxW = w - 2*padding,
			maxH = h - 2*padding,
			frameW, frameH;

		if ((this.w_h_ratio > 1 || maxH * this.w_h_ratio > maxW) && maxW / this.w_h_ratio < maxH) {
			// width > height or using full height would extend beyond maxW
			frameW = maxW;
			frameH = (maxW / this.w_h_ratio);
		} else {
			// width < height
			frameH = maxH;
			frameW = (maxH * this.w_h_ratio);
		}

		frame.style.width = frameW + 'px';
		frame.style.height = frameH + 'px';

		frameOuterContainer.style.width = maxW+'px';
		frameInnerContainer.style.top = ((h - frameH) / 2) + 'px';
		// frameInnerContainer.style.height = frame.style.height;



		console.log('frameOuterContainer:', frameOuterContainer);
		console.log('container:', w, h, maxW, maxH);
  	},

	render: function() {
		if (!this.props.frame) {
			return <div className="row frames-list"></div>
		}
		this.w_h_ratio = this.props.frame && this.props.frame.settings ? this.props.frame.settings.w_h_ratio : 1;

		var url = this.props.frame && this.props.frame.current_content ? this.props.frame.current_content.url : '';
		var divStyle = {
			backgroundImage: 'url(' + url + ')',
		};

		console.log(this.w_h_ratio);

		var whStyle = {
			paddingBottom: (1/this.w_h_ratio) * 100 + '%'
		};

		return (
			<div className="row frames-list" ref="frameContainer">
				<div className="col-xl-12 frame-outer-container" ref="frameOuterContainer">
					<div className="frame-inner-container" ref="frameInnerContainer" onClick={this._handleClick}>
		            	<div className="frame" style={divStyle} ref="frame"/>
		            </div>
		        </div>
	        </div>
		);
	}
});

module.exports = Frame;
