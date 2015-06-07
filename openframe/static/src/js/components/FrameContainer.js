var React = require('react');

var FrameContainer = React.createClass({

	render: function() {
		return (
			<div className="row frames-list">
                <div className="col-md-12 frame-outer-container">
                    <button type="button" className="btn btn-primary btn-xs btn-settings hide" data-toggle="modal" data-target="#myModal">S</button>
                    <div className="frame" />
                    <div className="frame-name text-center">
                        <h6>Home</h6>
                    </div>
                </div>
            </div>
        );
	}

});

module.exports = FrameContainer;