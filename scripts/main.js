const button = document.querySelector('.close');

button.addEventListener('click', () => {
  Array
    .from(document.querySelectorAll('.visible'))
    .forEach((el) => {
      el.classList.remove('visible')
      el.classList.add('hidden')
    });
})