var React = require('react'),
	$ = require('jquery'),

	Nav = require('./Nav.js'),
	SimpleNav = require('./SimpleNav.js'),
	Frame = require('./Frame.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js'),
	PublicFramesList = require('./PublicFramesList.js'),
	FooterNav = require('./FooterNav.js'),
	Drawer = require('./Drawer.js'),
	AddContentModal = require('./AddContentModal.js'),
	SettingsModal = require('./SettingsModal.js'),
	FramePreview = require('./FramePreview.js'),

	AppDispatcher = require('../dispatcher/AppDispatcher'),
	FrameActions = require('../actions/FrameActions'),
	FrameStore = require('../stores/FrameStore'),
	UIStore = require('../stores/UIStore'),

	Socker = require('../api/Socker'),

	conf = require('../config');

/**
 * The App is the root component responsible for:
 * - setting up structure of child components
 *
 * Individual components register for Store state change events
 */
var App = React.createClass({
	getInitialState: function() {
		return {
			selectionPanel: "collection",
			frames: [],
            selectedFrame: {
                name: '',
				description: '',
				settings: {
					visible: true,
					rotation: 0
				},
                mirroring: null,
                mirroring_count: null,
                mirror_meta: {
                    name: '',
                    owner: ''
                }
            }
		};
	},

	componentWillMount: function() {
		if (!global.OF_USERNAME) {
			console.log('OF_USERNAME not defined.');
			return;
		}

		Socker.connect("ws://" + window.location.host + "/admin/ws/" + OF_USERNAME);

		// TODO: these should move to the corresponding Actions creator (e.g. FrameActions)
		Socker.on('frame:connected', FrameActions.frameConnected);
        Socker.on('frame:disconnected', FrameActions.frameDisconnected);
        Socker.on('frame:frame_updated', FrameActions.frameContentUpdated);
        Socker.on('frame:setup', FrameActions.setup);
	},

	componentDidMount: function() {
		UIStore.addChangeListener(this._onChange);
		FrameStore.addChangeListener(this._onChange);
		// kick off frame loading
		FrameActions.loadFrames();
	},

	componentWillUnmount: function() {
		UIStore.removeChangeListener(this._onChange);
		FrameStore.removeChangeListener(this._onChange);
	},

	/**
	 * Triggered from within settings modal
	 * @param  {[type]} settings [description]
	 */
	_saveFrame: function(settings) {
		FrameActions.saveFrame(this.state.selectedFrame);
	},

	/**
	 * Triggered by changes within settings modal.
	 * @param  {[type]} frame [description]
	 */
	_onSettingsChange: function(frame) {
		this.setState({
			selectedFrame: frame
		});
	},

	_onChange: function() {
		console.log('SELECTED FRAME: ', FrameStore.getSelectedFrame());
		this.setState({
			selectionPanel: UIStore.getSelectionPanelState(),
            frames: FrameStore.getAllFrames(),
            selectedFrame: FrameStore.getSelectedFrame()
        });
	},

  	render: function(){
  		// The ContentLlist and PublicFramesList maintain their own state
  		var contentList = <ContentList />,
  			frameList = <PublicFramesList />;

  		var selectionPanel = this.state.selectionPanel === 'collection' ? contentList : frameList;
	    return (
			<div className='container app'>
				<SimpleNav frames={this.state.frames} selectedFrame={this.state.selectedFrame}/>
				<Frame frame={this.state.selectedFrame} />
				<TransferButtons panelState={this.state.selectionPanel} />
				<div>{selectionPanel}</div>
				<FooterNav ref="navFooter"/>
				<Drawer
					frames={this.state.frames}
					selectedFrame={this.state.selectedFrame} />
				<SettingsModal
					frame={this.state.selectedFrame}
					onSaveSettings={this._saveFrame}
					onSettingsChange={this._onSettingsChange}
				/>
				<AddContentModal />
				<FramePreview />
			</div>
	    )
  	}
});

module.exports = App;
