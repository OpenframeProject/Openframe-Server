// var Admin = require('./admin.js');
// Admin.init(global.OF_USERNAME);
// 

// var	$ = require('jquery'),
//     _ = require('lodash'),
//     Swiper = require('swiper');

// var _swiper;

// function _setupSwiper() {
// 	console.log('setting it up');
//     _swiper = new Swiper('.swiper-container', {
//         slidesPerView: 1,
//         spaceBetween: 30,
//         loop: true,
//         keyboardControl: true
//     });

//     console.log(_swiper);
// }

// _setupSwiper();

var React = require('react'),
	Nav = require('./components/Nav');

var App = React.createClass({
  render: function(){
    return (
      <Nav />
    )
  }
});

React.render(
  <App />,
  document.getElementById('OpenFrame')
)