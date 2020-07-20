const $ = require('jquery');

global.$ = $;

require('bootstrap');

$(() => {
  $('.menu-button').click(() => {
    if (!$('#menu').is(':checked')) {
      $('.menu-item').addClass('animate__animated animate__fadeInRight animate__fast');
    } else {
      $('.menu-item').removeClass('animate__animated animate__fadeInRight animate__fast');
    }
  });
});
