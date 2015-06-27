var React = require('react'),
	NavFrameLink = require('./NavFrameLink');

var NavFrameList = React.createClass({
	componentDidMount: function() {
        // FrameStore.addChangeListener(this._onChange);
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

    // getInitialState: function() {
    //     return {
    //         frames: []
    //     }
    // },

	render: function() {
		function createFrameLink(frame) {
            console.log('MMMMMM?', frame, this.props.selectedFrame);
            return (
                <NavFrameLink
                    key={frame._id}
                    frame={frame}
                    selected={frame._id === this.props.selectedFrame._id}
                    linkClickHandler={this.props.linkClickHandler}
                />
            );
        }

		var classes = this.props.extraClasses + ' nav-frame-list drawer-content';

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
                {this.props.frames.map(createFrameLink.bind(this))}
                {logout}
            </ul>
		);
	},

	// _onChange: function() {
 //        this.setState({
 //            frames: FrameStore.getAllFrames()
 //        });
 //    }

});

module.exports = NavFrameList;
