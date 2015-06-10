var AppDispatcher = require('../dispatcher/AppDispatcher'),
	EventEmitter = require('events').EventEmitter,
	OFConstants = require('../constants/OFConstants'),
	assign = require('lodash').assign,
	_ = require('lodash');


var _frames = [],
	_selectedFrame = null;

var addFrame = function(frame){
	_frames[frame._id] = frame;
};

var removeFrame = function(id){
	if (id in _frames) delete _frames[id];
}

var FrameStore = assign({}, EventEmitter.prototype, {

	init: function(frames) {
		_frames = frames;

		// see if any a frame is marked as selected from db, 
		// otherwise select the first frame.
		var selected = _.find(_frames, {selected: true});
		_selectedFrame = selected || _frames[0];
	},

	emitChange: function() {
		this.emit(OFConstants.CHANGE_EVENT);
	},

	getFrame: function(id) {
		return _.find(_frames, { _id: id });
	},

	getAllFrames: function() {
		return _frames;
	},

	getSelectedFrame: function() {
		return _selectedFrame;
	},

	getState: function() {
		return {
			frames: _frames,
			selectedFrame: _selectedFrame
		};
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

    	case OFConstants.FRAME_SELECT:
			_selectedFrame = action.frame;
			FrameStore.emitChange();
			break;

		case OFConstants.CONTENT_SEND:
    		_selectedFrame.content = action.content;
			FrameStore.emitChange();
			break;
	    // case OFConstants.TODO_UPDATE_TEXT:
	    //   text = action.text.trim();
	    //   if (text !== '') {
	    //     update(action.id, {text: text});
	    //     FrameStore.emitChange();
	    //   }
	    //   break;

	    // case OFConstants.TODO_DESTROY:
	    //   destroy(action.id);
	    //   FrameStore.emitChange();
	    //   break;

	    // case OFConstants.TODO_DESTROY_COMPLETED:
	    //   destroyCompleted();
	    //   FrameStore.emitChange();
	    //   break;

	    default:
    		// no op
  }
});

module.exports = FrameStore;