'use strict';

(function (map, form, createRequest, notify, userData, utilities, filter) {
  // острый конец пина
  var PIN_TIP = 22;

  var mainPin;

  var spinner = document.querySelector('.loader');
  var pinMap = document.querySelector('.map');
  var adFormStatus = document.querySelector('.ad-form');

  // констуктор главного пина
  var Pin = function (query) {
    this.pin = document.querySelector(query);
    this.isActive = false;
    // получаем высоту изображения
    this.height = this.pin.querySelector('img').offsetHeight;
    // получаем ширину изображения
    this.width = this.pin.offsetWidth;
    this.halfWidth = this.width / 2;
    // текущее положение пина на карте
    this.position = {
      x: null,
      y: null
    };
    // стартовые координаты
    this.StartPosition = {
      x: null,
      y: null
    };
    this.changeStatus = this.changeStatus.bind(this);
    this.restoreDefaultPosition = this.restoreDefaultPosition.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onEnterPress = this.onEnterPress.bind(this);

    this.pin.addEventListener('mousedown', this.onMouseDown);
    this.pin.addEventListener('keydown', this.onEnterPress);

    this.calculatePotision();
    this.calculateStartPotision();
    this.fillFormAddress();
  };

  /*                    Прототипы класса Pin                               */
  /* --------------------------------------------------------------------- */
  /**
   * Устанавливаем позицию пина на карте
   */
  Pin.prototype.calculatePotision = function () {
    var width = (this.pin.offsetLeft + this.halfWidth);
    this.position.x = Math.floor(width);
    this.position.y = Math.floor(this.pin.offsetTop + this.height);

  };

  Pin.prototype.calculateStartPotision = function () {
    this.StartPosition.x = Math.floor(this.pin.offsetLeft);
    this.StartPosition.y = Math.floor(this.pin.offsetTop);
  };

  // вернуть пин на начальную позицию
  Pin.prototype.restoreDefaultPosition = function () {
    this.position.x = this.StartPosition.x;
    this.position.y = this.StartPosition.y;
    this.onMouseMove(this.position.x, this.position.y);
  };

  Pin.prototype.getPosition = function () {
    return {
      x: this.position.x,
      y: this.position.y
    };
  };

  Pin.prototype.onMouseDown = function (evt) {
    // активируем страницу при первом зажатии главного пина
    activatePage();
    // меняет адрес, так как меняется размер пина
    this.fillFormAddress();

    document.addEventListener('mousemove', checkCoords);

    var x = evt.clientX - parseInt(evt.currentTarget.style.left, 10);
    var y = evt.clientY - parseInt(evt.currentTarget.style.top, 10);
    map.pins.initOffsetCoords(x, y);

    document.addEventListener('mouseup', onMouseUp);
  };

  Pin.prototype.fillFormAddress = function () {
    form.fillAddress(this.getPosition());
  };

  Pin.prototype.onEnterPress = function (evt) {
    if (utilities.isEnterPress(evt.keyCode)) {
      // активируем страницу при первом зажатии главного пина
      activatePage();
      // меняет адрес, так как меняется размер пина
      this.fillFormAddress();
    }
  };

  // метод движения пина. Получаем координаты мыши.
  Pin.prototype.onMouseMove = function (newPositionX, newPositionY) {
    this.pin.style.left = newPositionX + 'px';
    this.pin.style.top = newPositionY + 'px';
    this.calculatePotision();
    this.fillFormAddress();
  };


  /**
   * Меням статус пина на активный и рассчитываем новое положение
   * Если пин активирован, добавляем высоте 22px(так как рассчёт коордит идёт от острого конца пина), если нет берём центр пина.
   */
  Pin.prototype.changeStatus = function () {
    this.isActive = !this.isActive;
    this.height = this.isActive ? this.height + PIN_TIP : this.height / 2;
    this.calculatePotision();
  };

  /* --------------------------------------------------------------------- */
  mainPin = new Pin('.map__pin--main');

  /**
   * Функция checkCoords проверяет расположение пина на карте(не выходит ли за границы). И вызывает * функцию fillAddress для заполнения в форме поля Адрес
   */

  var checkCoords = function (evt) {
    var coords = map.calculateCoords(evt.clientX, evt.clientY, mainPin.halfWidth, mainPin.height);

    mainPin.onMouseMove(coords.posX, coords.posY);
  };

  /**
   *  onSuccess и onError - callback функции при запросе на сервер
   * @param {array} data массив с загруженными данными
   */
  var onSuccess = function (data) {
    // убираем spinner
    spinner.classList.toggle('loader--show');
    // меняет состояние карты
    map.main.changeStatus();
    // меняем состояние форм
    form.changeFormStatus();
    // рендерим объявления
    userData.renderPins(data);
  };

  var onError = function (code, status) {
    pinMap.appendChild(notify.renderErrorData(code, status));
  };

  /**
   * Функция активации страницы
   * Если страница не активна. Делаем запрос на сервер и меняет статус pin'a
   */
  var activatePage = function () {
    if (!mainPin.isActive) {
      createRequest('https://js.dump.academy/keksobooking/data', 'GET', onSuccess, onError);
      spinner.classList.toggle('loader--show');
      mainPin.changeStatus();
      // устанавливаем координаты с учётом размера пина
      map.setLimits(mainPin.halfWidth, mainPin.height);
      return;
    }
  };

  /**
   * Функция деактивации страницы
   * Меняет все поля на начальные и блокирует страницу
   */
  var disactivatePage = function () {
    // возвращает пин в начальную точку
    mainPin.restoreDefaultPosition();
    // меняет статус Pin'a
    mainPin.changeStatus();
    // меняем статус карты
    map.main.changeStatus();
    // возвращаем стандартные настройки для фильтров
    filter.restoreDefaultSetting();
    // удаляем карточки
    userData.activePins.deleteAll();
    // если есть открытые карточки, закрываем её
    userData.clearActiveCard();
    // меняем статус pina
    mainPin.changeStatus();
  };

  var onMouseUp = function (evt) {
    evt.preventDefault();
    document.removeEventListener('mousemove', checkCoords);
    map.pins.initOffsetCoords();
  };

  // callback функции для обработчика формы
  var setDefaultPageStatus = function () {
    mainPin.changeStatus();
    disactivatePage();
  };
  var onFormReset = form.getOnFormReset(setDefaultPageStatus);
  var onFormSubmit = form.getOnFormSubmit(setDefaultPageStatus);

  adFormStatus.addEventListener('reset', onFormReset);
  adFormStatus.addEventListener('submit', onFormSubmit);

})(window.map, window.form, window.request, window.notify, window.data, window.utilities, window.filter);
