var React = require('react'),
	NavFrameLink = require('./NavFrameLink'),
	FrameStore = require('../stores/FrameStore');

var NavFrameList = React.createClass({
	componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getDefaultProps: function() {
    	return {
    		extraClasses: '',
    		includeLogout: true,
    		linkClickHandler: function() {
    			console.log('link clicked');
    		}
    	};
    },

    getInitialState: function() {
        return {
            frames: []
        }
    },

	render: function() {
		function createFrameLink(frame) {
            console.log('frame: ', frame);
            return <NavFrameLink key={frame._id} frame={frame} linkClickHandler={this.props.linkClickHandler} />
        }

		var classes = this.props.extraClasses + ' nav-frame-list';

		var logout = '';
		if (this.props.includeLogout) {
			console.log('includeLogout');
			logout = (
				<li>
					<a onClick={this.props.linkClickHandler} className="btn-logout" href="/logout">log out</a>
				</li>
			);	
		}

		return (
			<ul className={classes} role="menu">
                {this.state.frames.map(createFrameLink.bind(this))}
                {logout}
            </ul>
		);
	},

	_onChange: function() {
        this.setState({
            frames: FrameStore.getAllFrames()
        });
    }

});

module.exports = NavFrameList;