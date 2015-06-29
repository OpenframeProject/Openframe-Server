var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = require('lodash').assign,
	_ = require('lodash');


var _frames = {},
	_selectedFrameId = null;

var addFrame = function(frame, select) {
	_frames[frame._id] = frame;
	if (select === true) selectFrame(frame);
}

var removeFrame = function(frame){
	console.log('removeFrame', frame);
	var id = frame._id;
	if (id in _frames) delete _frames[id];
	console.log(_frames);
};

var selectFrame = function(frame) {
	console.log('selectFrame: ', frame);
	_selectedFrameId = frame._id;

	// // unselect currently selected
	// var selectedFrame = FrameStore.getSelectedFrame();
	// if (selectedFrame) {
	// 	selectedFrame.selected = false;
	// }

	// // now set the new selected frame
	// var _selectedFrame = _.find(_frames, {_id: frame._id});
	// _selectedFrame.selected = true;
}

var FrameStore = assign({}, EventEmitter.prototype, {

	/**
	 * Set _selectedFrameId and add all of the frames.
	 * @param  {[type]} frames [description]
	 * @return {[type]}        [description]
	 */
	init: function(frames) {
		_selectedFrameId = frames[0]._id;
		_.each(frames, addFrame);
	},

	getAllFrames: function() {
		return _.map(_frames, function(frame) {
			return frame;
		});
	},

	getSelectedFrame: function() {
		return _frames[_selectedFrameId]
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	/**
	 * A frame has connected. Simply update the frame object in our collection.
	 */
	connectFrame: function(frame) {
		// addFrame will replace previous frame
		console.log('connectFrame: ', frame);
		frame.connected = true;
		addFrame(frame);
	},

	/**
	 * A frame has disconnected. Simply updated the frame object in our collection.
	 */
	disconnectFrame: function(frame) {
		// addFrame will replace previous frame
		frame.connected = false;
		addFrame(frame);
	},

	addChangeListener: function(cb){
    	this.on(OFConstants.CHANGE_EVENT, cb);
  	},

  	removeChangeListener: function(cb){
    	this.removeListener(OFConstants.CHANGE_EVENT, cb);
	}

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
	// console.log('ACTION: FrameStore: ', action.actionType);
  	switch(action.actionType) {
		case OFConstants.FRAME_LOAD:
			console.log('loading frames...');
			break;

    	case OFConstants.FRAME_LOAD_DONE:
    		console.log('frames loaded: ', action.frames);
			FrameStore.init(action.frames);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_LOAD_FAIL:
			console.log('frames failed to load: ', action.err);
			break;

		case OFConstants.FRAME_CONNECTED:
			FrameStore.connectFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_DISCONNECTED:
			FrameStore.disconnectFrame(action.frame);
			FrameStore.emitChange();
			break;

    	case OFConstants.FRAME_SELECT:
    		selectFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.CONTENT_SEND:
    		FrameStore.getSelectedFrame().content = action.content;
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_CONTENT_UPDATED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_UPDATED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_MIRRORED:
			// adding the updated frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_SAVE:
			// adding the saved frame since it will replace current instance
			addFrame(action.frame);
			FrameStore.emitChange();
			break;

		case OFConstants.FRAME_SAVE_DONE:
			// adding the frame since it will replace current instance
			// noop (optimistic ui update already happened on FRAME_SAVE)
			break;

		case OFConstants.FRAME_SAVE_FAIL:
			// adding the failed frame since it will replace current instance
			// TODO: handle this by reverting (immutable.js would help)
			console.log('failed to save frame', action.frame);
			break;

	    default:
    		// no op
  }
});

module.exports = FrameStore;
