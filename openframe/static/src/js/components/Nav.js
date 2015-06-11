var React = require('react'),
    NavFrameLink = require('./NavFrameLink'),
    FrameStore = require('../stores/FrameStore');


var Nav = React.createClass({
    componentDidMount: function() {
        FrameStore.addChangeListener(this._onChange);
    },

    getInitialState: function() {
        return {
            frames: []
        }
    },

    render: function() {
        function createFrameLink(frame) {
            console.log('frame: ', frame);
            return <NavFrameLink key={frame._id} frame={frame} />
        }

        return (
            <nav className="navbar navbar-default">
                {/* Brand and toggle get grouped for better mobile display */}
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed pull-left" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar" />
                        <span className="icon-bar" />
                        <span className="icon-bar" />
                    </button>
                    <h3 className="text-muted hidden-xs"><span className="openframe">openframe/</span><span className="username">{OF_USERNAME}</span></h3>
                </div>
                {/* Collect the nav links, forms, and other content for toggling */}
                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul className="nav navbar-nav navbar-right">
                        <li className="dropdown">
                            <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Frames <span className="caret" /></a>
                            <ul className="dropdown-menu" role="menu">
                                {this.state.frames.map(createFrameLink.bind(this))}
                            </ul>
                        </li>
                        <li>
                            <a href="/logout"><span className="glyphicon glyphicon-log-out" /></a>
                        </li>
                    </ul>
                </div>
                {/* /.navbar-collapse */}
            </nav>
        );
    },

    _onChange: function() {
        this.setState({
            frames: FrameStore.getAllFrames()
        });
    }

});

module.exports = Nav;