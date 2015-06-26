var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = require('lodash').assign,
	_ = require('lodash');


var _publicFrames = [],
	_selected_public_frame_id = null;

var addFrame = function(frame, select) {
	_publicFrames.push(frame)
	if (select !== false) selectFrame(frame);
}

var removeFrame = function(frame){
	_.remove(_publicFrames, {_id: frame._id});
};

var PublicFrameStore = assign({}, EventEmitter.prototype, {

	init: function(frames) {
		_publicFrames = frames;
	},

	/**
	 * Get the list of public frames.
	 * @return {object} Array
	 */
	getPublicFrames: function() {
		return _publicFrames;
	},

	/**
	 * Get the public frame that is currently selected.
	 * @return {object} frame
	 */
	getSelectedPublicFrame: function() {
		return _.find(_publicFrames, {'_id': _selected_public_frame_id});
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
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
  	switch(action.actionType) {
		case OFConstants.PUBLIC_FRAMES_LOAD:
			console.log('loading visible frames...');
			break;

    	case OFConstants.PUBLIC_FRAMES_LOAD_DONE:
    		console.log('visible frames loaded: ', action.frames);
			_publicFrames = action.frames;
			_selected_public_frame_id = _publicFrames[0]._id;
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_LOAD_FAIL:
			console.log('visible frames failed to load: ', action.err);
			break;

		case OFConstants.PUBLIC_FRAMES_ADD:
			addFrame(action.frame);
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_REMOVE:
			removeFrame(action.frame);
			PublicFrameStore.emitChange();
			break;

		case OFConstants.PUBLIC_FRAMES_SLIDE_CHANGED:
			console.log('slide changed...', action);
			_selected_public_frame_id = action.frame_id;
			PublicFrameStore.emitChange();
			break;

	    default:
    		// no op
  }
});

module.exports = PublicFrameStore;
