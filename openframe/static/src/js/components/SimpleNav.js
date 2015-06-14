var React = require('react'),
    NavFrameList = require('./NavFrameList'),
    MenuActions = require('../actions/MenuActions'),
    FrameStore = require('../stores/FrameStore');


var SimpleNav = React.createClass({
    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getInitialState: function() {
        return {
            frames: [],
            selectedFrame: {
                name: 'HOME'
            } 
        }
    },

    render: function() {
        var frameName = this.state.selectedFrame.name;
        frameName = this.state.selectedFrame.active ? frameName + " *" : frameName; 

        return (
            <div className="of-nav-fixed of-nav-top">
                <button type="button" className="btn-simple-nav btn-menu visible-xs pull-left" onClick={this._handleOpenMenuClick}>
                    <span className="glyphicon glyphicon-menu-hamburger" />
                </button>
                <button type="button" className="btn-simple-nav btn-setting visible-xs pull-right" onClick={this._handleOpenSettings}>
                    <span className="glyphicon glyphicon-cog" />
                </button>
                <h3 className="text-muted hidden-xs pull-left"><span className="openframe">openframe/</span><span className="username">{OF_USERNAME}</span></h3>

                <div className="frame-name visible-xs text-center">{frameName}</div>

                <ul className="nav navbar-nav navbar-right hidden-xs">
                    <li className="dropdown">
                        <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Frames <span className="caret" /></a>
                        <NavFrameList extraClasses="dropdown-menu" includeLogout={false}/>
                    </li>
                    <li>
                        <a href="/logout">Log Out</a>
                    </li>
                </ul>
            </div>
        );
    },

    _handleOpenMenuClick: function(e) {
        console.log('_handleOpenMenuClick');
        MenuActions.toggleMenu();
    },

    _handleOpenSettings: function(e) {
        console.log('_handleOpenSettings');
        MenuActions.toggleSettings();
    },

    _onChange: function() {
        this.setState({
            frames: FrameStore.getAllFrames(),
            selectedFrame: FrameStore.getSelectedFrame()
        });
    }

});

module.exports = SimpleNav;