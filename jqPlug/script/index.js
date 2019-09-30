(function($) {
  $.fn.toggleStatus = function() {
    // классы для каждого из состояний
    const classes = {
      'Активна': 'content__toggle--on',
      'Неактивна': 'content__toggle--off',
      'Промежуточный': 'content__toggle--intermediate'
    }
    // статусы
    const statuses = {
      '1': 'Активна',
      '0': 'Неактивна',
      '2': 'Промежуточный'
    };
    // счётчик кликов
    let count = 0;

    // получить класс в зависимости от количества кликов
    function getClass(count) {
      const status = statuses[count];
      return classes[status];
    }

    function changeStatusField(count) {
      const status = statuses[count];
      $(".content__current-status").text(status);
    }

    function setClass(className) {
      $(this).attr('class', `content__toggle ${className}`);
    }

    function onChange() {
      // увеличиваем счёткик клика
      count++;
      // получаем класс
      const statusClass = getClass(count);

      // устанавливаем новый статус
      setClass.call(this,statusClass);

      // изменяем текстовое описания поля
      changeStatusField(count)

      if (count === 2) {
        count = -1;
      }
    }
    function main(e) {
      $(e).click(onChange);
    }

    this.each(function() { main($(this)); });
    return this;
  };
})(jQuery);

$(".content__toggle").toggleStatus();