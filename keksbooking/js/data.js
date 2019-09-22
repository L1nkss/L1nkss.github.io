'use strict';

(function (utilities, filter, map) {
  // константы
  var HouseTypes = {
    BUNGALO: 'Бунгало',
    FLAT: 'Квартира',
    HOUSE: 'Дом',
    PALACE: 'Дворец'
  };

  var PIN_WIDTH = 50; // ширина пина
  var PIN_HEIGHT = 70; // высота пина
  var PIN_COUNT = 5; // количество пинов на карте.

  // DOM элементы
  var pinList = document.querySelector('.map__pins');
  var pinTemplate = document.querySelector('#pin').content.querySelector('.map__pin');
  var cardTemplate = document.querySelector('#card').content.querySelector('.popup');
  var formFilter = document.querySelector('.map__filters');

  // переменные
  var debouncePins;
  // объект для хранения активного пина на странице(хранится DOM Элемент пина и карточки)
  var activeCard = {
    information: null,
    domElement: null
  };
  var pins = [];
  // отфильтрованные пины.
  var filteredPins = [];

  // объект в котором хранятся все активные пины на карте(которые отображаются для пользователя)
  var activePins = {
    pins: null,

    get: function () {
      return this.pins;
    },

    // получить все пины на карте(DOM элементы)
    define: function () {
      this.pins = Array.prototype.slice.call(document.querySelectorAll('.pin'));
    },

    deleteAll: function () {
      this.pins.forEach(function (pin) {
        pin.remove();
      });
    },

    delete: function (id) {
      this.pins[id].remove();
    }
  };

  // очищает переменную с активной картой. Убирает класс map__pin--active и закрывает карточку с информацией
  var clearActiveCard = function () {
    // Если на странице открыта карточка, удаляем её со страницы.
    if (activeCard.domElement) {
      activeCard.domElement.classList.remove('map__pin--active');
      activeCard.domElement = null;
      activeCard.information.remove();
      activeCard.information = null;
    }
  };

  //  Функция конструктор для создания карточки с подробной информацией.
  var PinCard = function (ad) {
    this.element = cardTemplate.cloneNode(true);
    this.ad = ad;
    this.imageGallery = this.element.querySelector('.popup__photos');
    this.features = this.element.querySelector('.popup__features');
    this.element.querySelector('.popup__avatar').src = this.ad.author.avatar;
    this.time = 'Заезд после ' + this.ad.offer.checkin + ', выезд до ' + this.ad.offer.checkout;
    this.priceText = this.ad.offer.price + ' ₽/ночь';
    this.guestsRooms = this.ad.offer.rooms + ' комнаты для ' + this.ad.offer.guests + ' гостей';
    // массив из объектов, где query - класс информации в который необходимо добавить значение
    // value - значение
    this.textsContent = [
      {query: '.popup__avatar', value: this.ad.author.avatar},
      {query: '.popup__title', value: this.ad.offer.title},
      {query: '.popup__text--address', value: this.ad.offer.address},
      {query: '.popup__type', value: HouseTypes[this.ad.offer.type.toUpperCase()]},
      {query: '.popup__text--time', value: this.time},
      {query: '.popup__text--capacity', value: this.guestsRooms},
      {query: '.popup__description', value: this.ad.offer.description},
      {query: '.popup__text--price', value: this.priceText}
    ];
  };

  // заполнить карточку информацией
  PinCard.prototype.fillTextsContent = function () {
    this.textsContent.forEach(function (content) {
      this.element.querySelector(content.query).textContent = content.value;
    }, this);
  };

  PinCard.prototype.onClick = function () {
    clearActiveCard();
  };

  PinCard.prototype.onKeyDown = function (evt) {
    if (utilities.isEscPress(evt.keyCode)) {
      clearActiveCard();
      document.removeEventListener('keydown', this.onKeyDown);
    }
  };

  PinCard.prototype.renderGallery = function () {
    var imageGallery = this.element.querySelector('.popup__photos');
    // Если у объявления нет фотографий, то удаляем этот блок с карточки
    if (this.ad.offer.photos.length === 0) {
      imageGallery.remove();
      return;
    }

    // генерим блок с фотографиями
    this.ad.offer.photos.forEach(function (image) {
      imageGallery.appendChild(this.renderImage(image));
    }, this);
  };

  PinCard.prototype.renderImage = function (image) {
    var img = document.createElement('img');
    img.src = image;
    img.width = 45;
    img.height = 40;
    img.alt = 'Фотография жилья';
    img.classList = 'popup__photo';
    return img;
  };

  PinCard.prototype.renderFeatures = function () {
    var features = this.element.querySelector('.popup__features');

    // Если у объявления нет доп. функций, то удаляем этот блок с карточки
    if (this.ad.offer.features.length === 0) {
      features.remove();
      return;
    }

    // генерим блок с доп. функциями
    this.ad.offer.features.forEach(function (feature) {
      features.appendChild(this.renderFeature(feature));
    }, this);
  };

  PinCard.prototype.renderFeature = function (feature) {
    var li = document.createElement('li');
    li.classList = 'popup__feature popup__feature--' + feature;

    return li;
  };

  PinCard.prototype.render = function () {
    // заполняем текстовые значение в элементе
    this.fillTextsContent();
    // создаём галлерею изображений, если есть фотографии
    this.renderGallery();
    // создаём список доп. функций, если они есть
    this.renderFeatures();
    // вешаем обработчики закрытия элемента
    this.element.querySelector('.popup__close').addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeyDown);

    return this.element;
  };

  // констуктор пина, который добавляем на карту.
  var Pin = function (ad) {
    this.ad = ad;
    this.width = PIN_WIDTH;
    this.height = PIN_HEIGHT;
    this.element = null;
    this.position = {
      left: this.ad.location.x,
      top: this.ad.location.y
    };
    this.cardInformation = null;

    this.onClick = this.onClick.bind(this);
  };

  /**
   * Проверяем позиции пина на карте. Если пин выходит за границы, то отрисовываем его на границы у которой он выходит
   */
  Pin.prototype.checkCoords = function () {
    // получаем границы карты
    var mapLimits = map.getMapLimitCoords();

    if (this.position.left + this.width > mapLimits.RIGHT) {
      this.position.left = mapLimits.RIGHT - PIN_WIDTH / 2;
    } else if (this.position.left < mapLimits.LEFT) {
      this.position.left = mapLimits.LEFT;
    }

    if (this.position.top + this.height > mapLimits.BOTTOM) {
      this.position.top = mapLimits.BOTTOM - this.height;
    } else if (this.position.top < mapLimits.TOP) {
      this.position.top = mapLimits.TOP;
    }
    this.element.style = 'left: ' + this.position.left + 'px; top: ' + this.position.top + 'px;';
  };

  Pin.prototype.onClick = function () {
    var pinInformationCard = new PinCard(this.ad).render();

    // проверка активной карточки на карте.
    var flagCard = checkActiveCard(this.element, pinInformationCard);
    if (flagCard) {
      pinList.appendChild(pinInformationCard);
    }
  };

  Pin.prototype.delete = function () {
    this.element.remove();
  };

  // создание первоночального пина в объекте PIN(как пин будет выглядить на карте)
  Pin.prototype.render = function () {
    // Если у пина нет ключа offer, отрисовывать не будем.
    if (!this.ad.offer) {
      return null;
    }

    this.element = pinTemplate.cloneNode(true);
    this.element.style = 'left: ' + this.position.left + 'px; top: ' + this.position.top + 'px;';
    this.element.querySelector('img').src = this.ad.author.avatar;
    this.element.querySelector('img').alt = this.ad.offer.type;
    this.element.classList.add('pin');
    this.checkCoords();

    return true;
  };

  /**
   * Функция checkActiveCard проверяет какой пин сейчас активен и добавляет класс map__pin--active
   * У другого пина убирает этот класс.
   * Если мы кликнули на тот же самый элемент, то не перересовываем карточку.
   * @param {DOM} clickedCard функция принимает DOM элемент pin
   * @param {DOM} informationCard карточка с подробной информацие
   * @return {boolean} возвращает true - если необходимо перерисовывать карточку и false - если нет
   */
  var checkActiveCard = function (clickedCard, informationCard) {
    // устанавливаем новую активную карточку на карте
    var setNewActiveCard = function () {
      activeCard.domElement = clickedCard;
      activeCard.information = informationCard;
      activeCard.domElement.classList.add('map__pin--active');
    };

    if (!activeCard.domElement) {
      setNewActiveCard();
      return true;
    }

    // если карточка пина, по которому мы кликнули не равна активной карточке на страницу
    // устанавливаем новую активную карточку
    if (clickedCard !== activeCard.domElement) {
      activeCard.domElement.classList.remove('map__pin--active');
      activeCard.information.remove();
      setNewActiveCard();
      return true;
    }

    // Если активная карта пуста и активная карта не равна, той которую мы кликнули, возвращаем false
    return false;
  };

  // добавить пины на карту
  var addPinsOnMap = function () {
    var fragment = document.createDocumentFragment();

    filteredPins.forEach(function (pin) {
      pin.element.addEventListener('click', pin.onClick);
      fragment.appendChild(pin.element);
    });

    pinList.appendChild(fragment);
  };

  /**
   * Если длина массива pins = 0, создаём новые пины(первое получение данных с сервера).
   * Если массив уже заполнен, просто добавляем пины на карту.
   * @param {array} ads массив данных, полученных с сервера
   */
  var renderPins = function (ads) {

    if (pins.length === 0) {
      ads.forEach(function (ad) {
        var pin = new Pin(ad);
        pin.render();
        pins.push(pin);
      });
    }

    // получаем первые 5 значений пинов по фильтрам.
    filteredPins = pins.filter(filter.values).slice(0, PIN_COUNT);
    addPinsOnMap();
    // получить все пины, которые находятся на карте.
    activePins.define();
  };

  // Получить массив отфильтрованных элементов(fragment'ов)
  var getArrayOfElements = function () {
    return filteredPins.map(function (pin) {
      return pin.element;
    });
  };

  // перерисовка объявлений на карте.
  var redrawPins = function () {
    // получаем список отфильтрованных пинов в виде массива их элементов(фрагментов)
    var filteredPinList = getArrayOfElements();

    // если элемент из активных пинов не содержится в отфильтрованном массиве, удаляем его с карты
    activePins.pins.forEach(function (pin, index) {
      var pinID = filteredPinList.indexOf(pin);
      if (pinID === -1) {
        activePins.delete(index);
      }
    });

    // формируем новый отфильтрованный массив без элементов, которые уже на карте(исключаем лишнюю перерисовку)
    filteredPins = filteredPins.filter(function (pin) {
      var pinID = activePins.pins.indexOf(pin.element);

      return pinID === -1 ? true : false;
    });

    // Отрисовать все пины
    addPinsOnMap();

    // убираем открытую карточку
    clearActiveCard();

    // заполняем массив с активными карточками
    activePins.define();
  };

  debouncePins = utilities.debounce(redrawPins, 1500);

  var onFilterChange = function () {
    filteredPins = pins.filter(filter.values).slice(0, PIN_COUNT);
    debouncePins();
  };

  formFilter.addEventListener('change', onFilterChange);

  window.data = {
    renderPins: renderPins,
    clearActiveCard: clearActiveCard,
    activePins: activePins
  };
})(window.utilities, window.filter, window.map);
