(function() {
    const toggleMenuButton = document.querySelector('.burger');
    const menu = document.querySelector('.navigation');
    const burgerToggle = document.querySelector('.burger__toggle');

    toggleMenuButton.addEventListener('click', () => {
        menu.classList.toggle('navigation--toggle');
        burgerToggle.classList.toggle('burger__toggle--hide')
    });
})();