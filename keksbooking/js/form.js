'use strict';

(function (createRequest, notify) {
  // Константы
  // название жилья и его цена
  var TypeOfHousePrice = {
    BUNGALO: 0,
    FLAT: 1000,
    HOUSE: 5000,
    PALACE: 10000
  };

  // количество комнат и гостей.
  var RoomCounts = {
    1: [1],
    2: [1, 2],
    3: [1, 2, 3],
    100: [0],
    DEFAULT: [3, 2, 1, 0]
  };

  // текстовое описание количества гостей
  var GuestCounts = {
    3: 'для 3 гостей',
    2: 'для 2 гостей',
    1: 'для 1 гостя',
    0: 'не для гостей'
  };

  var FILE_TYPES = ['gif', 'jpg', 'jpeg', 'png'];
  var DRAG_EVENTS = ['drop', 'dragenter', 'dragleave', 'dragover'];

  // переменные
  var prevSelectedOption = null;
  var formStatus = false;
  var headerInput;
  var pricePerNightInput;
  var formFields;
  var pageForm;
  var userGallery;
  var userAvatar;

  // DOM Элементы
  var addressInput = document.querySelector('#address');

  // окно где мы выводим сообщение об успехе/ошибки
  var main = document.querySelector('main');


  // функция для проверки на соответсвиме формата изображения
  var checkFileFormat = function (fileName) {
    return FILE_TYPES.some(function (format) {
      return fileName.endsWith(format);
    });
  };

  // Конструктор для загрузки изображений Жилища
  var ImageGallery = function (query) {
    this.element = document.querySelector(query);
    this.input = this.element.querySelector('input[type="file"]');
    this.dropZone = this.element.querySelector('label');

    this.onImageChanges = this.onImageChanges.bind(this);
    this.addImage = this.addImage.bind(this);
    this.onImageDrop = this.onImageDrop.bind(this);

    this.input.addEventListener('change', this.onImageChanges);
    this.dropZone.addEventListener('dragenter', this.onToggleDropZone);
    this.dropZone.addEventListener('dragleave', this.onToggleDropZone);
    this.dropZone.addEventListener('drop', this.onImageDrop);
  };

  // загрузка изображения
  // если условие (что формат файла картинка) checkFileFormat выполняется, то добавляем изображения на страницу
  ImageGallery.prototype.loadImage = function (file) {
    var fileName = file.name.toLowerCase();

    if (checkFileFormat(fileName)) {
      this.addImage(file);
    }
  };

  ImageGallery.prototype.deletePhotoGallery = function () {
    var images = this.element.querySelectorAll('.ad-form__photo');

    images.forEach(function (image) {
      image.remove();
    });
  };

  ImageGallery.prototype.onToggleDropZone = function (evt) {
    evt.target.classList.toggle('dragenter');
  };

  ImageGallery.prototype.onReaderLoaded = function (result) {
    this.createPhotoGallery(result);
  };

  // добавление изображения на страницу
  ImageGallery.prototype.addImage = function (file) {
    var self = this;
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      self.onReaderLoaded(reader.result);
    });

    reader.readAsDataURL(file);
  };

  ImageGallery.prototype.loadMultiplyFiles = function (files) {
    for (var i = 0; i < files.length; i++) {
      this.loadImage(files[i]);
    }
  };

  ImageGallery.prototype.onImageDrop = function (evt) {
    var files = evt.dataTransfer.files;

    this.loadMultiplyFiles(files);
  };

  ImageGallery.prototype.createPhotoGallery = function (file) {
    var div = document.createElement('div');
    var image = createImg(file);
    div.className = 'ad-form__photo';

    div.appendChild(image);
    this.element.insertAdjacentElement('beforeend', div);
  };

  ImageGallery.prototype.onImageChanges = function (evt) {
    var files = evt.target.files;

    this.loadMultiplyFiles(files);
  };

  // констуктор аватарки пользователя (наследуется от ImageGallery)
  var AvatarImage = function (query) {
    ImageGallery.call(this, query);
    this.avatar = this.element.querySelector('img');
    this.defaultAvatar = this.avatar.getAttribute('src');
  };

  // наследуем AvatarImage от ImageGallery
  AvatarImage.prototype = Object.create(ImageGallery.prototype);
  AvatarImage.prototype.constructor = AvatarImage;

  // переопределяем родительские методы(ImageGallery)
  AvatarImage.prototype.onImageChanges = function (evt) {
    var file = evt.target.files[0];
    this.loadImage(file);
  };

  AvatarImage.prototype.onReaderLoaded = function (result) {
    this.avatar.src = result;
  };

  AvatarImage.prototype.onImageDrop = function (evt) {
    var file = evt.dataTransfer.files[0];
    this.loadImage(file);
  };

  AvatarImage.prototype.restoreDefaultAvatar = function () {
    this.avatar.src = this.defaultAvatar;
  };

  userGallery = new ImageGallery('.ad-form__photo-container');
  userAvatar = new AvatarImage('.ad-form-header__upload');

  // функция констуктор для полей формы.
  var Fieldsets = function () {
    this.houseType = document.querySelector('#type');
    this.description = document.querySelector('#description');
    this.timeIn = document.querySelector('#timein');
    this.timeOut = document.querySelector('#timeout');
    this.rooms = document.querySelector('#room_number');
    this.capacity = document.querySelector('#capacity');
    this.features = document.querySelector('.features');
    // значения по умолчанию
    this.defaultValues = {
      houseType: this.houseType.value,
      description: this.description.value,
      timeIn: this.timeIn.value,
      timeOut: this.timeOut.value,
    };
    this.defaultRooms = {
      roomCount: this.rooms.value,
      selectedRoom: this.getSelectedGuestsValue()
    };

    this.onTimeInChanges = this.onTimeInChanges.bind(this);
    this.onTimeOutChanges = this.onTimeOutChanges.bind(this);
    this.onRoomNumberChanges = this.onRoomNumberChanges.bind(this);

    this.timeIn.addEventListener('change', this.onTimeInChanges);
    this.timeOut.addEventListener('change', this.onTimeOutChanges);
    this.rooms.addEventListener('change', this.onRoomNumberChanges);
  };

  // получаем выбранное значение из поля "Количество мест"
  Fieldsets.prototype.getSelectedGuestsValue = function () {
    return parseInt(this.capacity.options[this.capacity.selectedIndex].value, 10);
  };

  // Вернуть значение доп. функций по умолчанию
  Fieldsets.prototype.restoreDefaultFeatures = function () {
    var featuresChecked = this.features.querySelectorAll('input:checked');

    featuresChecked.forEach(function (feature) {
      feature.checked = false;
    });
  };

  // возвращаем комнатам начальное состояние
  Fieldsets.prototype.restoreDefaultRooms = function () {
    this.rooms.value = this.defaultRooms.roomCount;
    prevSelectedOption = this.defaultRooms.selected;
    this.changeGuestCapacity(RoomCounts['DEFAULT']);
  };

  // возвращаем стандартное значение всем полям
  Fieldsets.prototype.restoreDefaultValues = function () {
    // получаем ключи из объекта defaultValue и перебираем их в цикле
    Object.keys(this.defaultValues).forEach(function (key) {
      // у соответсвующего элемента фильтрации устанавливаем значение по умолчанию.
      this[key].value = this.defaultValues[key];
    }, this);
  };

  // возвращаем все стандартные значения
  Fieldsets.prototype.restoreDefaultSetting = function () {
    this.restoreDefaultValues();

    this.restoreDefaultFeatures();

    this.restoreDefaultRooms();
  };

  Fieldsets.prototype.syncTimes = function (firstElement, secondElement) {
    if (firstElement.value !== secondElement.value) {
      secondElement.value = firstElement.value;
    }
  };

  Fieldsets.prototype.onTimeInChanges = function (evt) {
    this.syncTimes(evt.target, this.timeOut);
  };

  Fieldsets.prototype.onTimeOutChanges = function (evt) {
    this.syncTimes(evt.target, this.timeIn);
  };

  Fieldsets.prototype.changeGuestCapacity = function (rooms) {
    this.capacity.length = 0;

    rooms.forEach(function (room) {
      this.capacity.add(createOption(room));
    }, this);
  };

  // Передаём в переменную prevSelectedOption предыдущее выбранное значение и изменяем количество гостей
  Fieldsets.prototype.onRoomNumberChanges = function (evt) {
    prevSelectedOption = this.getSelectedGuestsValue();
    this.changeGuestCapacity(RoomCounts[evt.target.value]);
  };

  // констуктор поля Обязательное текстовое поле(Заголовок объявления)
  var ReqNameInput = function (queryInput, queryText) {
    this.input = document.querySelector(queryInput);
    this.isValid = false;
    this.label = document.querySelector(queryText);
    this.labelText = this.label.textContent;
  };

  // констуктор поля Обязательное поле цены(Цена за ночь)
  var ReqNumberInput = function (queryInput, queryText) {
    ReqNameInput.call(this, queryInput, queryText);
  };

  // наследуем ReqNumberInput от ReqNameInput
  ReqNumberInput.prototype = Object.create(ReqNameInput.prototype);
  ReqNumberInput.prototype.constructor = ReqNumberInput;

  // Цепочка прототипов
  ReqNameInput.prototype.checkInputValid = function (count) {
    if (this.input.checkValidity()) {
      this.isValid = true;
      this.setDefault();
      return;
    }

    this.isValid = false;
    this.label.textContent = this.showErrorMessage(count);
    this.input.classList.add('invalid-value');


  };
  ReqNameInput.prototype.setDefault = function () {
    this.input.classList.remove('invalid-value');
    this.label.textContent = this.labelText;
  };

  ReqNameInput.prototype.restoreDefault = function () {
    this.input.classList.remove('invalid-value');
    this.label.textContent = this.labelText;
    this.input.value = '';
  };

  ReqNameInput.prototype.showErrorMessage = function (valueCount) {
    var minValue = 30;
    var left = minValue - valueCount;
    return 'Минимальное количество символов ' + minValue + ' Осталось ' + left;
  };

  ReqNumberInput.prototype.setMinValue = function (value) {
    this.input.min = value;
    this.input.placeholder = value;
  };

  ReqNumberInput.prototype.showErrorMessage = function () {
    var minError = 'Минимальная цена за ночь: ' + this.input.min;
    var maxError = 'Максим. цена за ночь: ' + this.input.max;
    if (parseInt(this.input.value, 10) < this.input.min) {
      return minError;
    }

    if (parseInt(this.input.value, 10) > this.input.max) {
      return maxError;
    }

    return this.labelText;
  };

  // констуктор для Формы
  var Form = function () {
    this.form = document.querySelector('.ad-form');
    this.mapFilters = document.querySelectorAll('.map__filter');
    this.formFieldsets = this.form.querySelectorAll('fieldset');
    this.mapFeatures = document.querySelector('.map__features');
    this.gallery = this.form.querySelector('.ad-form__photo-container');
  };

  // изменить состояние формы в зависимости от статуса
  Form.prototype.changeForm = function () {
    this.form.classList.toggle('ad-form--disabled');
    this.form.classList.toggle('disabled-events');

    // меняем состояние селекторов у фильтров
    this.mapFilters.forEach(function (el) {
      el.disabled = !el.disabled;
    });

    // меняем состояние fieldset'ов у основной формы.
    this.formFieldsets.forEach(function (fieldset) {
      fieldset.disabled = !fieldset.disabled;
    });

    // меняем состояние у доп. функций в фильтре
    this.mapFeatures.disabled = !this.mapFeatures.disabled;
  };

  headerInput = new ReqNameInput('#title', '.title-label');
  pricePerNightInput = new ReqNumberInput('#price', '.price-label');
  formFields = new Fieldsets();
  pageForm = new Form();

  var fillAddress = function (pinPosition) {
    addressInput.value = pinPosition.x + ', ' + pinPosition.y;
  };

  // изменить статус формы
  // Если formStatus = true. Меняем форму на disabled, восстанавливаем значения по умолчанию и меняем статус формы
  // если formStatus = false. Меняем форму на disabled=false, делаем проверку у количество комнат и меняем статус формы
  var changeFormStatus = function () {

    if (formStatus) {
      pageForm.changeForm();
      restoreDefaultForm();
      formStatus = false;
      return;
    }

    formFields.changeGuestCapacity(RoomCounts[formFields.rooms.value]);
    pageForm.changeForm();
    formStatus = true;

  };

  var changeHouseType = function (value, element) {
    element.setMinValue(TypeOfHousePrice[value.toUpperCase()]);
    element.checkInputValid();
  };

  /*                    Функции для создания дополнительных DOM элементов(к примеру img,options и т.д)              */
  var createOption = function (index) {
    var option = document.createElement('option');
    option.text = GuestCounts[index];
    option.value = index;

    // если предыдущее выбранное значение = index, то делаем option выбранным.
    if (prevSelectedOption === index) {
      option.selected = true;
    }

    return option;
  };

  var createImg = function (img) {
    var image = document.createElement('img');
    image.src = img;
    image.alt = 'Изображение жилища';
    image.width = '40';
    image.height = '44';

    return image;
  };

  /* -------------------------------------------------------------------------------------- */

  /**
   * Возвращает значения по умолчанию для полей формы.
   */
  var restoreDefaultForm = function () {
    // возвращаем значение по умолчанию у 'Заголовок объявления'
    headerInput.restoreDefault();

    // возвращаем значение по умолчанию у 'Цена за ночь'
    pricePerNightInput.restoreDefault();

    // возвращаем у всех fieldset'ов значение по умолчанию
    formFields.restoreDefaultSetting();

    // удаляем изображения
    userGallery.deletePhotoGallery();

    // возвращаем начальный аватар
    userAvatar.restoreDefaultAvatar();
  };

  /* ---------------------------------------------------------------------------------    */

  // для всех событий drag & drop убираем стандартное действие браузера и прекращаем поднятие.
  // делаем это на элемента DropZone аватарки и изображений.

  var preventDefaultEvents = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  };

  DRAG_EVENTS.forEach(function (el) {
    userAvatar.dropZone.addEventListener(el, preventDefaultEvents);
  });

  DRAG_EVENTS.forEach(function (el) {
    userGallery.dropZone.addEventListener(el, preventDefaultEvents);
  });

  // Callback функции для обработчиков
  /* ------------------------------------------------------------ */

  var onHeaderInput = function (evt) {
    headerInput.checkInputValid(evt.target.value.length);
  };

  var onPricePerNightInput = function () {
    pricePerNightInput.checkInputValid();
  };

  var onHouseTypeChange = function (evt) {
    changeHouseType(evt.target.value, pricePerNightInput);
  };

  /*                      Функции FormReset и FormSumbit                   */
  // onError - вспомогательная функция для функций formReset и FormSumbit
  var onError = function () {
    main.appendChild(notify.renderErrorMessage());
  };

  var getOnFormReset = function (callback) {

    return function (evt) {
      evt.preventDefault();
      changeFormStatus();
      callback();
    };
  };

  var getOnFormSubmit = function (callback) {
    var onSuccess = function () {
      main.appendChild(notify.renderSuccessMessage());
      changeFormStatus();
      callback();
    };

    return function (evt) {
      evt.preventDefault();
      var data = new FormData(evt.target);
      createRequest(evt.target.action, 'POST', onSuccess, onError, data);
    };
  };

  /*                                        Обработчики                                         */
  headerInput.input.addEventListener('input', onHeaderInput);

  pricePerNightInput.input.addEventListener('input', onPricePerNightInput);

  formFields.houseType.addEventListener('change', onHouseTypeChange);

  /* -------------------------------------------------------------------------------------------*/

  window.form = {
    fillAddress: fillAddress,
    changeFormStatus: changeFormStatus,
    headerInput: headerInput,
    pricePerNightInput: pricePerNightInput,
    getOnFormReset: getOnFormReset,
    getOnFormSubmit: getOnFormSubmit
  };
})(window.request, window.notify);

