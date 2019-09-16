'use strict';

(function () {
  var ESC_CODE = 27;
  var ENTER_CODE = 13;

  var isEscPress = function (key) {
    return key === ESC_CODE;
  };

  var isEnterPress = function (key) {
    return key === ENTER_CODE;
  };

  // функция для отображения пинов через 1с(по умолчанию)
  var debounce = function (callback, time) {
    var lastTimeout = null;
    time = time || time === 0 ? time : 1000;

    return function () {
      if (lastTimeout) {
        window.clearTimeout(lastTimeout);
      }

      lastTimeout = window.setTimeout(callback, time);
    };
  };

  window.utilities = {
    isEscPress: isEscPress,
    isEnterPress: isEnterPress,
    debounce: debounce
  };
})();
