'use strict';

(function (utilities) {
  var errorTemplate = document.querySelector('#error').content.querySelector('.error');
  var successTemplate = document.querySelector('#success').content.querySelector('.success');
  var errorDataTemplate = document.querySelector('#data-error').content.querySelector('.message-block');

  /**
   * В функции closePopup мы создаём обработчики событий, которые могут возникнуть у шаблонов
   * В каждом обработчике мы удаляем обработчик у document
   * Если у шаблона есть button, то мы добавляем и ему обработчик, в противном случае пропускаем   создание.
   * @param {DOM element} element шаблон ошибки или успеха
   */

  var closePopup = function (element) {
    var button = element.querySelector('button');
    var removeElement = function () {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onEscPress);
      element.remove();
    };

    var onDocumentClick = function () {
      removeElement();
    };

    var onEscPress = function (evt) {
      if (utilities.isEscPress(evt.keyCode)) {
        removeElement();
      }
    };

    if (button) {
      var onButtonClick = function (evt) {
        evt.stopPropagation();
        removeElement();
      };

      button.addEventListener('click', onButtonClick);
    }
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onEscPress);
  };

  /**
   * Функция renderErrorData выводит кастомное сообщение об ошибки при проблемах с запросом на сервер.
   * @param {string} code Код ошибки, который возник при запросе
   * @param {string} errorText Сообщение, которое будет написано
  */

  var renderErrorData = function (code, errorText) {
    var element = errorDataTemplate.cloneNode(true);
    element.textContent += code + '. ' + errorText;

    return element;
  };

  // карточка ошибки
  var renderErrorMessage = function () {
    var element = errorTemplate.cloneNode(true);
    closePopup(element);

    return element;
  };

  // карточка успешной отправки
  var renderSuccessMessage = function () {
    var element = successTemplate.cloneNode(true);
    closePopup(element);

    return element;
  };

  window.notify = {
    renderErrorData: renderErrorData,
    renderErrorMessage: renderErrorMessage,
    renderSuccessMessage: renderSuccessMessage
  };
})(window.utilities);
