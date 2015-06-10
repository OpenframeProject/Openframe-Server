var React = require('react');

var Nav = React.createClass({
    
    handleFrameSelection: function(e) {
        console.log(e.currentTarget);
    },

    render: function() {
        function createFrameLink(frame) {
            return <li key={frame._id} onClick={this.handleFrameSelection}><a href="#">{frame.name}</a></li>
        }

        return <nav className="navbar navbar-default">
            {/* Brand and toggle get grouped for better mobile display */}
            <div className="navbar-header">
                <button type="button" className="navbar-toggle collapsed pull-left" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                </button>
                <h3 className="text-muted hidden-xs"><span className="openframe">openframe/</span><span className="username">jonwohl</span></h3>
            </div>
            {/* Collect the nav links, forms, and other content for toggling */}
            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul className="nav navbar-nav navbar-right">
                    <li className="dropdown">
                        <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Frames <span className="caret" /></a>
                        <ul className="dropdown-menu" role="menu">
                            {this.props.frames.map(createFrameLink.bind(this))}
                        </ul>
                    </li>
                    <li>
                        <a href="#"><span className="glyphicon glyphicon-log-out" /></a>
                    </li>
                </ul>
            </div>
            {/* /.navbar-collapse */}
        </nav>
    }
});

module.exports = Nav;