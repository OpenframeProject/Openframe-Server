var React = require('react'),
    UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore'),
    UIStore = require('../stores/UIStore'),
    _ = require('lodash');

var FramePreview = React.createClass({

    getInitialState: function() {
        return {
            frame: null,
            previewOpen: false
        };
    },

    componentDidMount: function() {
        UIStore.addChangeListener(this._onUIChange);
    },

    _handleCloseClick: function() {
        UIActions.closePreview();
    },

    _onUIChange: function() {
        this.setState(UIStore.getPreviewState());
    },

    render: function() {
        if (!this.state.frame) {
            return false;
        }

        var content = this.state.frame.current_content,
            tags = content.tags,
            frameDetails = null,
            mirroring_icon = '',
            mirroring_content = '',
            mirroring_count = this.state.frame.mirroring_count;

        tags_content = '';
        if (tags) {
            _.each(tags, function(tag) {
                tags_content += '#' + tag + ' ';
            });
        }

        var previewClass = this.state.previewOpen ? 'preview-open' : 'preview-closed';

        var fullClass = 'preview-container ' + previewClass;

        var divStyle = {
            backgroundImage: 'url(' + content.url + ')'
        };

        if (mirroring_count) {
            mirroring_icon = (
                <span className="of-icon-mirror"></span>
            );
            mirroring_content = (
                <span className="mirroring-meta">{mirroring_count}</span>
            );
        }

        if (this.state.frame.name) {
            frameDetails = (
                <div className="row preview-frame-details">
                    <div className="col-xs-6">
                        <span className="frame-name">{this.state.frame.name}</span>
                        <span className="mirroring-content">
                            {mirroring_icon}
                            {mirroring_content}
                        </span>
                    </div>
                    <div className="col-xs-6">
                        <span className="owner pull-right">@{this.state.frame.owner}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={fullClass} style={divStyle} >
                <div className="preview-footer-wrap">
                    <div className="preview-footer">
                        <div className="row preview-tags">
                            <div className="col-xs-11">
                                <div className="preview-tags">
                                    {tags_content}
                                </div>
                            </div>
                            <div className="col-xs-1">
                                <button type="button" className="btn-simple-nav pull-right" onClick={this._handleCloseClick} >
                                    <span className="icon-close" />
                                </button>
                            </div>
                        </div>
                        <div className="row preview-dimensions">
                            <div className="col-xs-12">

                            </div>
                        </div>
                        <div className="row preview-url">
                            <div className="col-xs-12">
                                {content.url}
                            </div>
                        </div>
                    </div>
                    {frameDetails}
                </div>
            </div>
        );
    }

});

module.exports = FramePreview;