var React = require('react'),
    NavFrameList = require('./NavFrameList'),
    UIActions = require('../actions/UIActions'),
    FrameStore = require('../stores/FrameStore');


var SimpleNav = React.createClass({
    componentDidMount: function() {
        // FrameStore.addChangeListener(this._onChange);
    },

    getDefualtProps: function() {
        return {
            frames: [],
            selectedFrame: {
                name: '',
                mirroring: null,
                mirroring_count: null,
                mirror_meta: {
                    name: '',
                    owner: ''
                }
            }
        }
    },

    _handleOpenMenuClick: function(e) {
        console.log('_handleOpenMenuClick');
        UIActions.toggleMenu(true);
    },

    _handleOpenSettings: function(e) {
        console.log('_handleOpenSettings');
        UIActions.openSettingsModal();
    },

    // _onChange: function() {
    //     console.log('++++++ get selected frame', FrameStore.getSelectedFrame());
    //     this.setState({
    //         frames: FrameStore.getAllFrames(),
    //         selectedFrame: FrameStore.getSelectedFrame()
    //     });
    // },

    render: function() {
        var frameName = this.props.selectedFrame.name,
            mirroring = this.props.selectedFrame.mirroring,
            mirror_meta = this.props.selectedFrame.mirror_meta,
            mirroring_icon = '',
            mirroring_content = '',
            mirroring_count = this.props.selectedFrame.mirroring_count;

        function connected(connected) {
            var connected_content = '';
            if (connected) {
                connected_content = '&bull; ';
            }
            return {__html: connected_content};
        }

        if (mirroring_count) {
            mirroring_icon = (
                <span className="of-icon-mirror"></span>
            );
            mirroring_content = (
                <span className="mirroring-meta">{mirroring_count}</span>
            );
        }

        if (mirroring) {
            mirroring_icon = (
                <span className="of-icon-mirror"></span>
            );
            mirroring_content = (
                <span className="mirroring-meta">@{mirror_meta.owner} : {mirror_meta.name}</span>
            );
        }

        return (
            <div className="of-nav-fixed of-nav-top">
                <h6 className="frame-name text-center">
                    <span className="connected" dangerouslySetInnerHTML={connected(this.props.selectedFrame.connected)} />
                    {frameName}
                    <span className="mirroring-content">
                        {mirroring_icon}
                        {mirroring_content}
                    </span>
                </h6>

                <button type="button" className="btn-simple-nav btn-menu visible-xs pull-left" onClick={this._handleOpenMenuClick}>
                    <span className="icon-hamburger" />
                </button>
                <button type="button" className="btn-simple-nav btn-setting visible-xs pull-right" onClick={this._handleOpenSettings}>
                    <span className="icon-cog" />
                </button>
                <h3 className="text-muted hidden-xs pull-left"><span className="openframe">openframe/</span><span className="username">{OF_USERNAME}</span></h3>


                <ul className="nav navbar-nav navbar-right hidden-xs">
                    <li className="dropdown">
                        <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Frames <span className="caret" /></a>
                        <NavFrameList
                            frames={this.props.frames}
                            selectedFrame={this.props.selectedFrame}
                            extraClasses="dropdown-menu"
                            includeLogout={false} />
                    </li>
                    <li>
                        <a href="#settings" onClick={this._handleOpenSettings}>Settings</a>
                    </li>
                    <li>
                        <a href="/logout">Log Out</a>
                    </li>
                </ul>
            </div>
        );
    }

});

module.exports = SimpleNav;
