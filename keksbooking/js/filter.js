'use strict';

(function (utilities) {
  // диапазон цен стоимости жилья.
  var RangeOfPrices = {
    ANY: {min: 0, max: Infinity},
    MIDDLE: {min: 10000, max: 50000},
    LOW: {min: 0, max: 10000},
    HIGH: {min: 50000, max: Infinity}
  };

  var filters;

  // констуктор для полей фильтрации
  var Filters = function () {
    this.type = document.querySelector('#housing-type');
    this.price = document.querySelector('#housing-price');
    this.rooms = document.querySelector('#housing-rooms');
    this.guests = document.querySelector('#housing-guests');
    this.features = document.querySelector('#housing-features');
    this.defaultValues = {
      type: this.type.value,
      price: this.price.value,
      rooms: this.rooms.value,
      guests: this.guests.value
    };

    this.restoreDefaultSettings = this.restoreDefaultSettings.bind(this);
    this.features.addEventListener('keydown', this.onFeatureEnterClick);
  };

  // Восстановить значение по умолчанию у полей фильтрации
  Filters.prototype.restoreDefaultSettings = function () {
    // восстанавливаем поля по умолчанию
    this.restoreDefaultValues();

    // восстанавливаем значение по умолчаю для доп. функций.
    this.restoreFeatures();
  };

  Filters.prototype.restoreDefaultValues = function () {
    // получаем ключи из объекта defaultValue и перебираем их в цикле
    Object.keys(this.defaultValues).forEach(function (key) {
      // у соответсвующего элемента фильтрации устанавливаем значение по умолчанию.
      this[key].value = this.defaultValues[key];
    }, this);
  };

  Filters.prototype.restoreFeatures = function () {
    var checkedFeatures = this.getAllCheckedFeatures();

    checkedFeatures.forEach(function (feature) {
      feature.checked = false;
    });
  };

  Filters.prototype.onFeatureEnterClick = function (evt) {
    if (utilities.isEnterPress(evt.keyCode)) {
      evt.target.checked = !evt.target.checked;
    }
  };

  Filters.prototype.getAllCheckedFeatures = function () {
    return Array.prototype.slice.call(this.features.querySelectorAll('input:checked'));
  };

  Filters.prototype.getValue = function (key) {
    return this[key].value;
  };

  // методы фильтрации пинов
  Filters.prototype.checkPrice = function (element) {
    var elementPrice = element.ad.offer.price;
    var range = RangeOfPrices[this.getValue('price').toUpperCase()];

    return elementPrice >= range.min && elementPrice < range.max;
  };

  Filters.prototype.checkType = function (element) {
    var type = this.getValue('type');
    var elementType = element.ad.offer.type;

    return type === 'any' ? element : elementType === type;
  };

  Filters.prototype.checkRooms = function (element) {
    var rooms = this.getValue('rooms');
    var elementRooms = element.ad.offer.rooms;

    return rooms === 'any' ? element : elementRooms.toString() === rooms;
  };

  Filters.prototype.checkGuests = function (element) {
    var guests = this.getValue('guests');
    var elementGuests = element.ad.offer.guests;

    return guests === 'any' ? element : elementGuests.toString() === guests;
  };

  Filters.prototype.checkFeatures = function (element) {
    var featuresChecked = this.getAllCheckedFeatures();
    var elementFeatures = element.ad.offer.features;
    var result = false;
    var features = featuresChecked.map(function (feature) {
      return feature.value;
    });
    // callback функция для функции получения всех features в фильтрации
    var getFeatures = function (feature) {
      return elementFeatures.indexOf(feature) !== -1;
    };

    if (features.length === 0) {
      result = true;
    }

    // если у всех выбранных функций есть каждый элемент у элемента, возвращаем true;
    if (features.every(getFeatures)) {
      result = true;
    }

    return result;
  };

  filters = new Filters();

  var filter = function (element) {
    return filters.checkType(element) && filters.checkPrice(element) && filters.checkRooms(element) && filters.checkGuests(element) && filters.checkFeatures(element);
  };

  window.filter = {
    values: filter,
    restoreDefaultSetting: filters.restoreDefaultSettings
  };
})(window.utilities);
