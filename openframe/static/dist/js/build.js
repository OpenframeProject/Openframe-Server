(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var AddContentForm = React.createClass({displayName: "AddContentForm",

	render: function() {
		return (
			React.createElement("div", {className: "row hidden-xs", id: "add-content-div"}, 
                React.createElement("form", {className: "form-inline", id: "add-form"}, 
                    React.createElement("div", {className: "form-group"}, 
                        /* <label for="SendToUser">URL</label> */
                        React.createElement("div", {className: "col-md-10"}, 
                            React.createElement("input", {type: "text", className: "form-control", id: "URL", placeholder: "enter URL"})
                        ), 
                        React.createElement("div", {className: "col-md-2"}, 
                            React.createElement("button", {className: "btn btn-default btn-add-content", href: "#add-content", id: "add-content-button"}, "Add Content")
                        )
                    )
                )
            )
		);
	}

});

module.exports = AddContentForm;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	Nav = require('./Nav.js'),
	FrameContainer = require('./FrameContainer.js'),
	TransferButtons = require('./TransferButtons.js'),
	AddContentForm = require('./AddContentForm.js'),
	ContentList = require('./ContentList.js')

	;

var App = React.createClass({displayName: "App",
  render: function(){
    return (
      React.createElement("div", {className: "app"}, 
	      React.createElement(Nav, null), 
	      React.createElement(FrameContainer, null), 
	      React.createElement(TransferButtons, null), 
	      React.createElement(AddContentForm, null), 
	      React.createElement(ContentList, null)
	  )
    )
  }
});

module.exports = App;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./AddContentForm.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/AddContentForm.js","./ContentList.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js","./FrameContainer.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameContainer.js","./Nav.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js","./TransferButtons.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js"}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/ContentList.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
	Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null);

var ContentList = React.createClass({displayName: "ContentList",
	componentDidMount: function() {
		var el = React.findDOMNode(this);
		this.swiper = new Swiper(el, {
	        slidesPerView: 1,
	        spaceBetween: 30,
	        loop: true,
	        keyboardControl: true
	    });
	},
	render: function() {
		return (
			React.createElement("div", {className: "swiper-container"}, 
                React.createElement("div", {className: "swiper-wrapper"}, 
                    React.createElement("div", {className: "swiper-slide"}, 
                        React.createElement("img", {src: "/static/dist/img/placeholder.jpg"})
                    ), 
                    React.createElement("div", {className: "swiper-slide"}, 
                        React.createElement("img", {src: "/static/dist/img/placeholder.jpg"})
                    ), 
                    React.createElement("div", {className: "swiper-slide"}, 
                        React.createElement("img", {src: "/static/dist/img/placeholder.jpg"})
                    )
                )
            )
		);
	}

});

module.exports = ContentList;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/FrameContainer.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var FrameContainer = React.createClass({displayName: "FrameContainer",

	render: function() {
		return (
			React.createElement("div", {className: "row frames-list"}, 
                React.createElement("div", {className: "col-md-12 frame-outer-container"}, 
                    React.createElement("button", {type: "button", className: "btn btn-primary btn-xs btn-settings hide", "data-toggle": "modal", "data-target": "#myModal"}, "S"), 
                    React.createElement("div", {className: "frame"}), 
                    React.createElement("div", {className: "frame-name text-center"}, 
                        React.createElement("h6", null, "Home")
                    )
                )
            )
        );
	}

});

module.exports = FrameContainer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/Nav.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var Nav = React.createClass({displayName: "Nav",
    render: function() {
        function createFrameLink(frame) {
            return React.createElement("li", null, React.createElement("a", {href: "#"}, frame))
        }

        return React.createElement("nav", {className: "navbar navbar-default"}, 
            /* Brand and toggle get grouped for better mobile display */
            React.createElement("div", {className: "navbar-header"}, 
                React.createElement("button", {type: "button", className: "navbar-toggle collapsed pull-left", "data-toggle": "collapse", "data-target": "#bs-example-navbar-collapse-1"}, 
                    React.createElement("span", {className: "sr-only"}, "Toggle navigation"), 
                    React.createElement("span", {className: "icon-bar"}), 
                    React.createElement("span", {className: "icon-bar"}), 
                    React.createElement("span", {className: "icon-bar"})
                ), 
                React.createElement("h3", {className: "text-muted hidden-xs"}, React.createElement("span", {className: "openframe"}, "openframe/"), React.createElement("span", {className: "username"}, "jonwohl"))
            ), 
            /* Collect the nav links, forms, and other content for toggling */
            React.createElement("div", {className: "collapse navbar-collapse", id: "bs-example-navbar-collapse-1"}, 
                React.createElement("ul", {className: "nav navbar-nav navbar-right"}, 
                    React.createElement("li", {className: "dropdown"}, 
                        React.createElement("a", {href: "#", className: "dropdown-toggle", "data-toggle": "dropdown", role: "button", "aria-expanded": "false"}, "Frames ", React.createElement("span", {className: "caret"})), 
                        React.createElement("ul", {className: "dropdown-menu", role: "menu"}, 
                            React.createElement("li", null, React.createElement("a", {href: "#"}, "Home")), 
                            React.createElement("li", null, React.createElement("a", {href: "#"}, "Studio"))
                        )
                    ), 
                    React.createElement("li", null, 
                        React.createElement("a", {href: "#"}, React.createElement("span", {className: "glyphicon glyphicon-log-out"}))
                    )
                )
            )
            /* /.navbar-collapse */
        )
    }
});

module.exports = Nav;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/TransferButtons.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var TransferButtons = React.createClass({displayName: "TransferButtons",

	render: function() {
		return (
			React.createElement("div", {className: "row visible-xs transfer-buttons"}, 
                React.createElement("div", {className: "col-xs-12 text-center"}, 
                    React.createElement("div", {className: "btn-group", role: "group", "aria-label": "..."}, 
                        React.createElement("button", {type: "button", className: "btn btn-xs btn-default btn-send btn-transfer"}, 
                            React.createElement("span", {className: "icon icon-send", "aria-hidden": "true"})
                        )
                        /* <button type="button" class="btn btn-xs btn-default btn-send btn-transfer">
                                                <span class="icon icon-send" aria-hidden="true"></span>
                                        </button> */
                    )
                )
            )
		);
	}

});

module.exports = TransferButtons;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"openframe/static/src/js/react-app.js":[function(require,module,exports){
(function (global){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    App = require('./components/App.js');

React.render(
  React.createElement(App, null),
  document.getElementById('OpenFrame')
)

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./components/App.js":"/Volumes/BigBro/jmw/Projects/OpenFrame/OpenFrame-Py/openframe/static/src/js/components/App.js"}]},{},["openframe/static/src/js/react-app.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9BZGRDb250ZW50Rm9ybS5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0FwcC5qcyIsIi9Wb2x1bWVzL0JpZ0Jyby9qbXcvUHJvamVjdHMvT3BlbkZyYW1lL09wZW5GcmFtZS1QeS9vcGVuZnJhbWUvc3RhdGljL3NyYy9qcy9jb21wb25lbnRzL0NvbnRlbnRMaXN0LmpzIiwiL1ZvbHVtZXMvQmlnQnJvL2ptdy9Qcm9qZWN0cy9PcGVuRnJhbWUvT3BlbkZyYW1lLVB5L29wZW5mcmFtZS9zdGF0aWMvc3JjL2pzL2NvbXBvbmVudHMvRnJhbWVDb250YWluZXIuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9OYXYuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvY29tcG9uZW50cy9UcmFuc2ZlckJ1dHRvbnMuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvcmVhY3QtYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFN0IsSUFBSSxvQ0FBb0MsOEJBQUE7O0NB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QyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgQWRkQ29udGVudEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3cgaGlkZGVuLXhzXCIgaWQ9XCJhZGQtY29udGVudC1kaXZcIj5cbiAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZVwiIGlkPVwiYWRkLWZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogPGxhYmVsIGZvcj1cIlNlbmRUb1VzZXJcIj5VUkw8L2xhYmVsPiAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJVUkxcIiBwbGFjZWhvbGRlcj1cImVudGVyIFVSTFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdCBidG4tYWRkLWNvbnRlbnRcIiBocmVmPVwiI2FkZC1jb250ZW50XCIgaWQ9XCJhZGQtY29udGVudC1idXR0b25cIj5BZGQgQ29udGVudDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRkQ29udGVudEZvcm07IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0TmF2ID0gcmVxdWlyZSgnLi9OYXYuanMnKSxcblx0RnJhbWVDb250YWluZXIgPSByZXF1aXJlKCcuL0ZyYW1lQ29udGFpbmVyLmpzJyksXG5cdFRyYW5zZmVyQnV0dG9ucyA9IHJlcXVpcmUoJy4vVHJhbnNmZXJCdXR0b25zLmpzJyksXG5cdEFkZENvbnRlbnRGb3JtID0gcmVxdWlyZSgnLi9BZGRDb250ZW50Rm9ybS5qcycpLFxuXHRDb250ZW50TGlzdCA9IHJlcXVpcmUoJy4vQ29udGVudExpc3QuanMnKVxuXG5cdDtcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYXBwJz5cblx0ICAgICAgPE5hdiAvPlxuXHQgICAgICA8RnJhbWVDb250YWluZXIgLz5cblx0ICAgICAgPFRyYW5zZmVyQnV0dG9ucyAvPlxuXHQgICAgICA8QWRkQ29udGVudEZvcm0gLz5cblx0ICAgICAgPENvbnRlbnRMaXN0IC8+XG5cdCAgPC9kaXY+XG4gICAgKVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0U3dpcGVyID0gcmVxdWlyZSgnc3dpcGVyJyk7XG5cbnZhciBDb250ZW50TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpO1xuXHRcdHRoaXMuc3dpcGVyID0gbmV3IFN3aXBlcihlbCwge1xuXHQgICAgICAgIHNsaWRlc1BlclZpZXc6IDEsXG5cdCAgICAgICAgc3BhY2VCZXR3ZWVuOiAzMCxcblx0ICAgICAgICBsb29wOiB0cnVlLFxuXHQgICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZVxuXHQgICAgfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpcGVyLXdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiL3N0YXRpYy9kaXN0L2ltZy9wbGFjZWhvbGRlci5qcGdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiL3N0YXRpYy9kaXN0L2ltZy9wbGFjZWhvbGRlci5qcGdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2lwZXItc2xpZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiL3N0YXRpYy9kaXN0L2ltZy9wbGFjZWhvbGRlci5qcGdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGVudExpc3Q7IiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIEZyYW1lQ29udGFpbmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IGZyYW1lcy1saXN0XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMTIgZnJhbWUtb3V0ZXItY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSBidG4teHMgYnRuLXNldHRpbmdzIGhpZGVcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjbXlNb2RhbFwiPlM8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmcmFtZVwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZnJhbWUtbmFtZSB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg2PkhvbWU8L2g2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lQ29udGFpbmVyOyIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRnJhbWVMaW5rKGZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gPGxpPjxhIGhyZWY9XCIjXCI+e2ZyYW1lfTwvYT48L2xpPlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxuYXYgY2xhc3NOYW1lPVwibmF2YmFyIG5hdmJhci1kZWZhdWx0XCI+XG4gICAgICAgICAgICB7LyogQnJhbmQgYW5kIHRvZ2dsZSBnZXQgZ3JvdXBlZCBmb3IgYmV0dGVyIG1vYmlsZSBkaXNwbGF5ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwibmF2YmFyLXRvZ2dsZSBjb2xsYXBzZWQgcHVsbC1sZWZ0XCIgZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI2JzLWV4YW1wbGUtbmF2YmFyLWNvbGxhcHNlLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwic3Itb25seVwiPlRvZ2dsZSBuYXZpZ2F0aW9uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uLWJhclwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24tYmFyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbi1iYXJcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkIGhpZGRlbi14c1wiPjxzcGFuIGNsYXNzTmFtZT1cIm9wZW5mcmFtZVwiPm9wZW5mcmFtZS88L3NwYW4+PHNwYW4gY2xhc3NOYW1lPVwidXNlcm5hbWVcIj5qb253b2hsPC9zcGFuPjwvaDM+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHsvKiBDb2xsZWN0IHRoZSBuYXYgbGlua3MsIGZvcm1zLCBhbmQgb3RoZXIgY29udGVudCBmb3IgdG9nZ2xpbmcgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbGxhcHNlIG5hdmJhci1jb2xsYXBzZVwiIGlkPVwiYnMtZXhhbXBsZS1uYXZiYXItY29sbGFwc2UtMVwiPlxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdiBuYXZiYXItcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cImRyb3Bkb3duXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImRyb3Bkb3duLXRvZ2dsZVwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiByb2xlPVwiYnV0dG9uXCIgYXJpYS1leHBhbmRlZD1cImZhbHNlXCI+RnJhbWVzIDxzcGFuIGNsYXNzTmFtZT1cImNhcmV0XCIgLz48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwiZHJvcGRvd24tbWVudVwiIHJvbGU9XCJtZW51XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+SG9tZTwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlN0dWRpbzwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1vdXRcIiAvPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7LyogLy5uYXZiYXItY29sbGFwc2UgKi99XG4gICAgICAgIDwvbmF2PlxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdjsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgVHJhbnNmZXJCdXR0b25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93IHZpc2libGUteHMgdHJhbnNmZXItYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTEyIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnRuLWdyb3VwXCIgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIi4uLlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tZGVmYXVsdCBidG4tc2VuZCBidG4tdHJhbnNmZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGljb24tc2VuZFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4teHMgYnRuLWRlZmF1bHQgYnRuLXNlbmQgYnRuLXRyYW5zZmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi1zZW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPiAqL31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZmVyQnV0dG9uczsiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBBcHAgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvQXBwLmpzJyk7XG5cblJlYWN0LnJlbmRlcihcbiAgPEFwcCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ09wZW5GcmFtZScpXG4pIl19
