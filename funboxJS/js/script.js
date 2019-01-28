const APP =  (function() {

    function init() {
        // Переменные
        let itemArray,
            oldIndex,
            newIndex,
            dragElement;
        const listMarkers = document.querySelector(".points-list");

        // Создание карты
        let map = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 7,
            controls: ["zoomControl"],
            behaviors: ["drag"]
        });

        // Создам коллекцию геообъектов
        let points = new ymaps.GeoObjectCollection({}, {
            draggable: true 
        });

        // Создаём Polylina для точек
        let polyline = new ymaps.Polyline([]);








        // Функции

        // Добавить новый маркер
        function addNewPoints(e) {
            let inputValue = document.querySelector(".points-input").value;

            if (e.keyCode === 13 && inputValue !== "") {
                // Добавить новый маркер в коллекцию
                const id = addPointToCollection(map.getCenter(), inputValue)
            

                // Соединяем маркера, если их больше чем 1
                if(points.getLength() > 1) {
                    drawLines();
                }

                // Добавить маркер в DOM
                addMarkerToDOM(id, inputValue);

                 // Убираем значение с input'а
                document.querySelector(".points-input").value = "";
            }
        };

        // Добавить маркер в коллекцию объектов
        function addPointToCollection(coords, name) {
            let id;

            // Присваиваем ID маркеру
            points.getLength() !== 0 ? id = points.getLength() + 1 : id = 1;

            // Добавляем информацию (балун, подсказка, ID)
            let newElement = new ymaps.Placemark(coords, {
                balloonContentHeader: name,
                hintContent: name,
                id: id
            });

            points.add(newElement);
            map.geoObjects.add(points);
            return id;
        }

        // Отрисовка линий между маркерами
        function drawLines() {
            polyline.geometry.setCoordinates(getAllCoord());
            map.geoObjects.add(polyline);
        }

        // Получить все координаты точек
        function getAllCoord() {
            let coords = [];
            points.each(item => {
                coords.push(item.geometry.getCoordinates());
            });
            return coords;
        }

        // Добавить маркер в DOM
        function addMarkerToDOM(id, name) {
            let html = `
                <li id=marker-${id} class="points__item"" draggable="true">
                    <a href="#" class="points__item-name">${name}</a>
                    <button class="points__item-delete">Удалить</button>
                </li> 
            `;
            document.querySelector(".points-list").insertAdjacentHTML("beforeend", html);
        }

        // Удалить маркер
        function deleteItem(marker) {
            let elementID = marker.id.split("-");
            let deleteID
            let li = marker;

            points.each(item => {
                // получаем ID маркера
                let currentID = item.properties.get("id");

                // Удаляем маркер из коллекции, если ID совпадают
                if (currentID == Number(elementID[1])) {
                    deleteID = currentID;
                    // Удаляем из коллекции геообъектов
                    points.remove(item);
                }
            })


            // Меняем индексы всех оставшихся элементов
            changeIndexs(deleteID);
            // Отрисовываем маркеры
            drawLines();
            // Удаляем элемент из DOM'а
            li.remove();
        }

        // Изменить индекс элементов, после удаления
        function changeIndexs(id) {
            points.each( item => {
                let curID = item.properties.get("id");

                if (curID > id) {
                    let li = document.getElementById(`marker-${curID}`);
                    newID = li.id.split("-");
                    newID[1] = curID - 1;
                    newID = newID.join("-");
                    li.id = newID;
                    item.properties.set("id", curID - 1);
                }
            })
        }

        // Показать Балун на карте, при клике
        function showMarker(marker) {
            let elementID;

            // Находим в DOM'е ID 
            elementID = marker.id.split("-");

            points.each(item => {
                let currentID = item.properties.get("id");

                // Находим элемент по ID и открываем балуун
                if (currentID === Number(elementID[1])) {
                    item.balloon.open();
                }
            })
        };

        // Начало переноса (drag and drop)
        function dragStart(e) {
            // Получаем все элементы внутри ul
            itemArray = Array.from(listMarkers.children);

            // Получаем значение target'a и присваиваем в переносимый элемент
            if (e.target.className === "points__item") {
                dragElement = e.target;
            } else {
                dragElement = e.target.parentNode; 
            }

            // Получаем индекс элемента, который будет перенесен
            oldIndex = itemArray.indexOf(dragElement);
        };

        function dragEnter(e) {
            if (e.target.classList.contains("points__item")) {
                e.target.classList.add("dragPoint");
                e.preventDefault()
            }
        }

        function dragLeave(e) {
            e.preventDefault();
            if (e.target.classList.contains("points__item")) {
                e.target.classList.remove("dragPoint");
            }
        }

        function dragDrop(e) {
            e.preventDefault();

            // Получаем размер item'а
            let rect = e.target.getBoundingClientRect();
            // Получаем положение мыши внутри item'a 
            let mousePos = e.clientY - rect.top;
            // Высота item'а
            let elementHeight = rect.height;
            // Убираем класс dragPoint
            e.target.classList.remove("dragPoint");

            // Если текущий элемент не равен переносимому
            if (e.target !== dragElement && e.target !== listMarkers) {
                // Смотрим на положении мыши и вставляем элемент до или после
                if (mousePos > elementHeight / 2) {
                    listMarkers.insertBefore(dragElement,e.target.nextSibling);
                } else {
                    listMarkers.insertBefore(dragElement,e.target);
                }
            }

            // Получаем все элементы внутри ul
            itemArray = Array.from(listMarkers.children);
            // Получаем новый индекс элемента
            newIndex = itemArray.indexOf(dragElement)

            // меняем элемент со старого индекса на новый
            let tmp = points.get(oldIndex);
            points.splice(oldIndex, 1);
            points.add(tmp, [newIndex]);
            drawLines();
        }


        // Event Listener'ы
        document.querySelector(".points-input").addEventListener("keypress", addNewPoints);

        // Получить координаты после пересона точки
        points.events.add("dragend", (e) => {
            drawLines();
        });

        // Удаление маркера и отображение маркера на карте при клике в списке
        document.querySelector(".points-list").addEventListener("click", (e) => {
            // Если кликнули на кнопку "удалить"
            if (e.target.className === "points__item-delete") {
                deleteItem(e.target.parentNode);
            }

            // Если кликнули на название маркера
            if (e.target.className === "points__item-name") {
                showMarker(e.target.parentNode);
            }
        });

        // Drag and drop listeners

        // начало переноса
        listMarkers.addEventListener("dragstart", dragStart);

        listMarkers.addEventListener("dragenter", dragEnter);

        listMarkers.addEventListener("dragover", e => {
            e.preventDefault();
        })

        parent.addEventListener("dragleave", dragLeave);

        parent.addEventListener("drop", dragDrop);


    }

    return {
        init
    }
})();

ymaps.ready(APP.init);

