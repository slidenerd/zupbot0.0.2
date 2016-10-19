
var $messages = $('.messages-content'),
    d, h, m,
    i = 0;
var zupBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpEMEJDMzcxODg5M0YxMUU2QTM3NDlDQjU4MjcxM0I1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpEMEJDMzcxOTg5M0YxMUU2QTM3NDlDQjU4MjcxM0I1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQwQkMzNzE2ODkzRjExRTZBMzc0OUNCNTgyNzEzQjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQwQkMzNzE3ODkzRjExRTZBMzc0OUNCNTgyNzEzQjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+LIrr2AAABOtJREFUeNrsmWtsFFUUx89MZ1+0W7utu4uibUkLDVVIfEYNYgDRiEYUkBQLRg0vNSVg4iPig+g3Er80aRUwRhIwSoymvqNWE/WDYtRoaExEErI8VGikbN3S3e3M9X+6Z3Ey3G26mBob5yS/7M6dOzP3f++555zZNZRSNJnNpEluvgBfgC/AF+AL8AX4AnwB/2cBVnPj9Cp8bgFXgp/BM0OO0z+/Okp7mprIcRxCvdqO9g1gBIqfyyn16ZIDv1Df8HAiZBgb0d4I3gWvlXhOA3hSPnuzSnVeEg6f7pnRTEHDaHCItqL9QvAZ2A5mg2vBxYDL5RT4Cnwpx38LAM+CzXJ8I4ijx0qLDFvaloDdrmtY6BUi9gWwVNpZJMZCez2DD8j1c+V4EagDj4IQ2AVukHM3gQdAfYmJYIFPiJgzLrTa02mZo6j+6spK/t4MMS96zleJUL52gefcXZqH8mCu8bQtlM8W1+Dd/UvZfBFxj1vA7+4eeaVOJgPW4PLaGBZL8eCnajbOCXxUeJdTVtRrYWB42oqrGz0Ht+f7vQIWFwU8DbJUGI0aVmrL+kS8PxkMPmwrtdB7tWEYHx7L53uO5POVlmF4Behe75SmXY3R321DYEDTzhOyE8R4xt5kn8adWk/Z9qEHE/FvHkom52LzbtNc2E+muaY3PZg7kc9XRSsqJiq49IPHwPdgluyj52XvFI03/UprBO/EoC+nqK+ttpaemjYtCtfpVgUX8crejHNHewfTVGEYEzX4IQkMX4BKiX6/gRXgfdn4RbvdjFkWzYpEqKuxnjob6llqF1xntubG203T3L0/M0Rf/5mhsDlhKeQlGTxbBqyX2b5AQqzbWqxPWmZSFIMJwh2U4yy3z45KbPvB4/zl7YEBSts2VY/ffZwyBezTtD0CtolLua3arMMKBOAOtuPMxJO6NRcPg1VwmAEH7rYvkxntX8Zgg2VmfFvTxhu5FyS9fU24Cz/VlKQU93TIg03gBw4XcCG6PlpFucJvSbrooguLa8oUUGp2Xpck6LbjxRtv1SQlkhzhiB/Og4vR/fE4tUbChHKAN9tJT//LxF+Lxtm2o0wXUiVqNo5C13ndjcPoPKmFdHYR2HHGP5R6KxYI3NuRSKY7Uqks6iDeG82u/ryCH8hyt4KbSxWRYySAU6ANrAUfyeAXu0oRt+0p1kLjXeI7lW2nbq05b1P38TAdyGb3QsQdnj5zhLGmOIMkSKZx1mZiXXdL/RUt4RVFe48nigceK2d94U/rIpbVuDGZ4PzxhsTmsgzXfTw1GKCAaXpTOQtaNY4S4ydwX9G3dpT5/AhWYc4tNTV0+ZQpeZQeq8VlSlnKc8wxvntBNMp1CZ3DT8t8/W1UqMdGiy8OnTmp8ELjqE8MrEI2hDzQXldL3x0+8gcGskhu2i7uw/c9LJHtIOiRB76Kzd/dineBpbEY5x3d/Y+CX8GlUrixnQZ9oEtK8xF39aikMNpZXqxQ1BQKF0tShbV/hwoEZGWzrt48mPRoUsGg2yAcbki2rQv59C3vNTAdJFzR8JAuz1j/JOeP6P9byGvaRgfP+WNGOETLSs8+2+cy0IPCf+edmGd/7flxqgsGOSTrktaP4OWy3on/rcHD9+kqvOWtgPu4Zp/33jGpNjnmd2qS49gb0v+LyRfgC/AF+AJ8Ab4AX4AvYPLaXwIMAEtpgaduUkn/AAAAAElFTkSuQmCC';

$(window).load(function() {
  $messages.mCustomScrollbar();
  setTimeout(function() {
    fakeMessage();
  }, 100);
});

(function () {
    $(document).ready(function () {
        return $('#header-handle').click(function () {
            return $('header').toggleClass('expanded');
        });
    });
}.call(this));

function updateScrollbar() {
  $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
    scrollInertia: 10,
    timeout: 0
  });
}

function setDate(){
  d = new Date()
  if (m != d.getMinutes()) {
    m = d.getMinutes();
    $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
  }
}

function insertMessage() {
  var emails = '', text = '';
  msg = $('.message-input').val();
  if ($.trim(msg) == '') {
    return false;
  }

  text = msg;
  if (text != null && text != '') {
      emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z._-]+)/gi);
      $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
      setDate();
      $('.message-input').val(null);
      updateScrollbar();
      if (emails != null && emails != '') {
          console.log(emails);
          subscribeEmail(emails[0]);
      } else {
          fakeMessage();
          return;
      }
  }
}

$('.message-submit').click(function() {
  insertMessage();
});

$(window).on('keydown', function(e) {
  if (e.which == 13) {
    insertMessage();
    return false;
  }
})

var Fake = [
  'Hi there, I am Zup, and you?',
  'Nice to meet you. How are you?',
  'Awesome! I can get you an Uber cab or find Flipkart deals for you. Let me know your email if you wish to be notified when I become alive. I wont spam you',  
  'Thank you, Cya around :)'
]

function fakeMessage(responseMsg) {
  var statusMsg = '';
  if ($('.message-input').val() != '') {
    return false;
  }

  $('<div class="message loading new"><figure class="avatar"><img src="'+zupBase64+'" /></figure><span></span></div>').appendTo($('.mCSB_container'));
  updateScrollbar();

  setTimeout(function() {
    $('.message.loading').remove();
    statusMsg = responseMsg != undefined ? responseMsg : (Fake[i] == undefined ? ': (' : Fake[i]);
    $('<div class="message new"><figure class="avatar"><img src="'+zupBase64+'" /></figure>' + statusMsg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setDate();
    updateScrollbar();
    if(responseMsg == undefined)
        i++;
  }, 1000 + (Math.random() * 20) * 100);
}