'use strict';

(function () {
  // константы
  var MapLimit = {
    TOP: 130,
    RIGHT: 1200,
    BOTTOM: 630,
    LEFT: 0
  };

  // переменные
  var map;
  var mapPins;
  var border;

  // координаты пина, которые мы возвращаем
  var coords = {
    posX: null,
    posY: null
  };

  // функция констуктор для границ карты
  var Limit = function () {
    // ограничение по границам с учётом ширины пина
    this.limits = {
      top: null,
      right: null,
      bottom: null,
      left: null
    };
    // вышел ли пин за карту по осям
    this.isOut = {
      x: false,
      y: false
    };

    this.setAxes = this.setAxes.bind(this);
  };

  // проверяем что хотя бы по одней из осей мы вышли за границу
  Limit.prototype.isLeaves = function () {
    return this.isOut.x || this.isOut.y;
  };

  // установить границы по оси X с учётом ширины главного пина
  Limit.prototype.setX = function (width) {
    this.limits.right = MapLimit.RIGHT - width;
    this.limits.left = MapLimit.LEFT - width;
  };

  // установить границы по оси Y с учётом высоты главного пина
  Limit.prototype.setY = function (height) {
    this.limits.top = MapLimit.TOP - height;
    this.limits.bottom = MapLimit.BOTTOM - height;
  };

  Limit.prototype.getX = function (position) {
    return position > this.limits.right ? this.limits.right : this.limits.left;
  };

  Limit.prototype.getY = function (position) {
    return position > this.limits.bottom ? this.limits.bottom : this.limits.top;
  };

  // устанавливаем границы по X и Y с учётом размера пина
  Limit.prototype.setAxes = function (width, height) {
    this.setX(width);
    this.setY(height);
  };

  /**
   * Метод getCoord рассчитывает положение пина на карте.
   * У метода 4 возможных состояния
   * 1) находимся внутри карты по оси Axe , но уже вышли за границу по другой оси. Возвращаем prevPosition
   * 2) находимся внутри карты по оси Axe и другая ось тоже внутри карты. Возвращаем Position
   * 3) находимся за границой карты по оси Axe , но по другой оси ещё не выходили за границы. Возвращаем границы оси
   * 4) В последнем случае просто возвращаем пред. значение
   * @param {string} axe Ось, у которой будем возвращать значение
   * @param {number} position положение мыши по оси Y
   * @param {number} prevPosition положение мыши по оси X(текущее значение)
   * @param {boolean} validAxe внутри карты мы или нет
   * @return {Number} Возвращаем координаты оси
   */
  Limit.prototype.getCoord = function (axe, position, prevPosition, validAxe) {
    if (validAxe && this.isLeaves()) {
      this.isOut[axe] = false;
      return prevPosition;
    }

    if (validAxe && !this.isLeaves()) {
      this.isOut[axe] = false;
      return position;
    }

    if (!validAxe && !this.isLeaves()) {
      this.isOut[axe] = true;
      return axe === 'x' ? this.getX(position) : this.getY(position);
    }

    this.isOut[axe] = true;
    return prevPosition;
  };

  var getMapLimitCoords = function () {
    return MapLimit;
  };

  var getX = function (x, prevX) {
    var isValidX = x >= border.limits.left && x < border.limits.right;

    return border.getCoord('x', x, prevX, isValidX);
  };

  var getY = function (y, prevY) {
    var isValidY = y >= border.limits.top && y <= border.limits.bottom;

    return border.getCoord('y', y, prevY, isValidY);
  };

  /**
   * Функция calculateCoords рассчитывает положение пина на карте
   * posX и posY - координаты пина внутри карты.
   * функции getX и getY задают координаты пина по осям
   * @param {number} mouseX положение мыши по оси X
   * @param {number} mouseY положение мыши по оси Y
   * @return {object} Возвращаем объект координат.
   */
  var calculateCoords = function (mouseX, mouseY) {
    // позиция мыши на экране
    var posX = mouseX - mapPins.offset.x;
    var posY = mouseY - mapPins.offset.y;

    // получить координаты пина на карте по X и Y
    coords.posX = getX(posX, coords.posX);
    coords.posY = getY(posY, coords.posY);

    return coords;
  };

  // констуктора главный карты на странице
  var Map = function (query) {
    this.map = document.querySelector(query);
  };

  // констуктор карты пинов на странице
  var MapPins = function (query) {
    Map.call(this, query);
    this.offset = {
      x: 0,
      y: 0
    };
  };

  Map.prototype.changeStatus = function () {
    this.map.classList.toggle('map--faded');
  };

  // наследуем MapPins от Map
  MapPins.prototype = Object.create(Map.prototype);
  MapPins.prototype.constructor = MapPins;

  MapPins.prototype.initOffsetCoords = function (x, y) {
    this.offset.x = x || 0;
    this.offset.y = y || 0;
  };

  map = new Map('.map');
  mapPins = new MapPins('.map__pins');
  border = new Limit();

  window.map = {
    main: map,
    pins: mapPins,
    calculateCoords: calculateCoords,
    getMapLimitCoords: getMapLimitCoords,
    setLimits: border.setAxes
  };
})();
