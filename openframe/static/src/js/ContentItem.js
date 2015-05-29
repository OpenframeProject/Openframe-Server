var React = require('react');

module.exports = React.createClass({
	render: function() {
		return (
			<li>
				<div className="row content-item">
					<div className="col-md-3">
						<div className="img-container" style={{backgroundImage: 'url("{this.props.url}")'}} />
					</div>
					<div className="col-md-6 col-send">
						<button onClick={this.props.onSendClick} className="btn btn-default btn-xs btn-send center-block no-border" href="#send" rel="{this.props.id}"><span className="icon icon-send" aria-hidden="true" /><br />Send to Frame</button>
					</div>
					<div className="col-md-1" />
					<div className="col-md-2 col-delete">
						<button onClick={this.props.onDeleteClick} className="btn btn-default btn-xs remove-button center-block no-border" href="#delete" rel="{this.props.id}"><span className="icon icon-delete" aria-hidden="true" /></button>
					</div>
				</div>
			</li>
		);
	}
});