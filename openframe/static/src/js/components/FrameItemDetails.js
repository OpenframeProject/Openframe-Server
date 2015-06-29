var React = require('react'),
    PublicFrameStore = require('../stores/PublicFrameStore');

var FrameItemDetails = React.createClass({

    getDefaultProps: function() {
        return {
            frame: {
                name: '',
                owner: '',
                _id: null
            }
        }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        // if (this.props.frame._id !== nextProps.frame._id) {
        //     console.log('should update...', this.props.frame, nextProps.frame);
        //     return true;
        // } else {
        //     console.log('should NOT update...');
        //     return false;
        // }
        return this.props.frame._id !== nextProps.frame._id;
    },

    componentWillReceiveProps: function(nextProps) {

    },

    render: function() {
        console.log('rendering...');
        var frame = this.props.frame;

        // If this current slide frame is the same as the selectedFrame's mirroring id
        // if (this.props.frame._id === this.props.selectedFrame.mirroring) {
        //     frame.mirroring_count += 1;
        // }


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
