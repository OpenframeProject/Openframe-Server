(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"openframe/static/src/js/app.js":[function(require,module,exports){
(function (global){
// var Admin = require('./admin.js');
// Admin.init(global.OF_USERNAME);
// 

var	$ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null),
    Swiper = (typeof window !== "undefined" ? window.Swiper : typeof global !== "undefined" ? global.Swiper : null);

var _swiper;

function _setupSwiper() {
	console.log('setting it up');
    _swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        keyboardControl: true
    });

    console.log(_swiper);
}

_setupSwiper();

// var React = require('react'),
// 	ListContainer = require('./components/ListContainer');

// var App = React.createClass({
//   render: function(){
//     return (
//       <div className="container">
//         <div className="row">
//           <ListContainer />
//         </div>
//       </div>
//     )
//   }
// });

// React.render(
//   <App />,
//   document.getElementById('OpenFrame')
// )

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},["openframe/static/src/js/app.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVm9sdW1lcy9CaWdCcm8vam13L1Byb2plY3RzL09wZW5GcmFtZS9PcGVuRnJhbWUtUHkvb3BlbmZyYW1lL3N0YXRpYy9zcmMvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBLHFDQUFxQztBQUNyQyxrQ0FBa0M7QUFDbEMsR0FBRzs7QUFFSCxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQ3JCLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsSUFBSSxPQUFPLENBQUM7O0FBRVosU0FBUyxZQUFZLEdBQUc7Q0FDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMxQixPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLEVBQUU7UUFDdEMsYUFBYSxFQUFFLENBQUM7UUFDaEIsWUFBWSxFQUFFLEVBQUU7UUFDaEIsSUFBSSxFQUFFLElBQUk7UUFDVixlQUFlLEVBQUUsSUFBSTtBQUM3QixLQUFLLENBQUMsQ0FBQzs7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pCLENBQUM7O0FBRUQsWUFBWSxFQUFFLENBQUM7O0FBRWYsZ0NBQWdDO0FBQ2hDLDBEQUEwRDs7QUFFMUQsZ0NBQWdDO0FBQ2hDLHdCQUF3QjtBQUN4QixlQUFlO0FBQ2Ysb0NBQW9DO0FBQ3BDLGdDQUFnQztBQUNoQyw4QkFBOEI7QUFDOUIsaUJBQWlCO0FBQ2pCLGVBQWU7QUFDZixRQUFRO0FBQ1IsTUFBTTtBQUNOLE1BQU07O0FBRU4sZ0JBQWdCO0FBQ2hCLGFBQWE7QUFDYix5Q0FBeUM7QUFDekMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gdmFyIEFkbWluID0gcmVxdWlyZSgnLi9hZG1pbi5qcycpO1xuLy8gQWRtaW4uaW5pdChnbG9iYWwuT0ZfVVNFUk5BTUUpO1xuLy8gXG5cbnZhclx0JCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgICBTd2lwZXIgPSByZXF1aXJlKCdzd2lwZXInKTtcblxudmFyIF9zd2lwZXI7XG5cbmZ1bmN0aW9uIF9zZXR1cFN3aXBlcigpIHtcblx0Y29uc29sZS5sb2coJ3NldHRpbmcgaXQgdXAnKTtcbiAgICBfc3dpcGVyID0gbmV3IFN3aXBlcignLnN3aXBlci1jb250YWluZXInLCB7XG4gICAgICAgIHNsaWRlc1BlclZpZXc6IDEsXG4gICAgICAgIHNwYWNlQmV0d2VlbjogMzAsXG4gICAgICAgIGxvb3A6IHRydWUsXG4gICAgICAgIGtleWJvYXJkQ29udHJvbDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coX3N3aXBlcik7XG59XG5cbl9zZXR1cFN3aXBlcigpO1xuXG4vLyB2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuLy8gXHRMaXN0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0xpc3RDb250YWluZXInKTtcblxuLy8gdmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbi8vICAgcmVuZGVyOiBmdW5jdGlvbigpe1xuLy8gICAgIHJldHVybiAoXG4vLyAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuLy8gICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxuLy8gICAgICAgICAgIDxMaXN0Q29udGFpbmVyIC8+XG4vLyAgICAgICAgIDwvZGl2PlxuLy8gICAgICAgPC9kaXY+XG4vLyAgICAgKVxuLy8gICB9XG4vLyB9KTtcblxuLy8gUmVhY3QucmVuZGVyKFxuLy8gICA8QXBwIC8+LFxuLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnT3BlbkZyYW1lJylcbi8vICkiXX0=
