var React = require('react'),
    FrameStore = require('../stores/FrameStore');

var FrameItemDetails = React.createClass({
    getInitialState: function() {
        return {
            frame: {
                name: '',
                owner: ''
            }
        }
    },

    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        FrameStore.removeChangeListener(this._onChange);
    },

    _onChange: function() {
        this.setState({
            // currentFrame: FrameStore.getSelectedVisibleFrame()
        });
    },

    render: function() {

        var mirroring_count = '';

        if (this.state.frame && this.state.frame.mirroring_count) {
            mirroring_count = (
                <div className="visible-frame-stats">
                    <span className="of-icon-mirror"></span> {this.state.frame.mirroring_count}
                </div>
            )
        }

        var owner = '';
        if (this.state.frame.owner) {
            owner += '@' + this.state.frame.owner;
        }

        return (
            <div className="frame-slide-content">
                <div className="visible-frame-details">
                    <div>
                        <span className="visible-frame-name">{this.state.frame.name}</span>
                        <span className="visible-frame-user">{owner}</span>
                    </div>
                    {mirroring_count}
                </div>
            </div>
        );
    }

});

module.exports = FrameItemDetails;
