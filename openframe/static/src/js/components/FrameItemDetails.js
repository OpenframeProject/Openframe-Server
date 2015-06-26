var React = require('react'),
    PublicFrameStore = require('../stores/PublicFrameStore');

var FrameItemDetails = React.createClass({
    // getInitialState: function() {
    //     return {
    //         frame: {
    //             name: '',
    //             owner: ''
    //         }
    //     }
    // },

    getDefaultProps: function() {
        return {
            frame: {
                name: '',
                owner: ''
            }
        }
    },

    // componentDidMount: function() {
    //     PublicFrameStore.addChangeListener(this._onChange);
    // },

    // componentWillUnmount: function() {
    //     PublicFrameStore.removeChangeListener(this._onChange);
    // },

    // _onChange: function() {

    // },

    render: function() {

        var mirroring_count = '';

        if (this.props.frame && this.props.frame.mirroring_count) {
            mirroring_count = (
                <div className="visible-frame-stats">
                    <span className="of-icon-mirror"></span> {this.props.frame.mirroring_count}
                </div>
            )
        }

        var owner = '';
        if (this.props.frame.owner) {
            owner += '@' + this.props.frame.owner;
        }

        return (
            <div className="frame-slide-content">
                <div className="visible-frame-details">
                    <div>
                        <span className="visible-frame-name">{this.props.frame.name}</span>
                        <span className="visible-frame-user">{owner}</span>
                    </div>
                    {mirroring_count}
                </div>
            </div>
        );
    }

});

module.exports = FrameItemDetails;
