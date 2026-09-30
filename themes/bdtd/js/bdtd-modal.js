/*
 * BDTD: janela (lightbox) centrada como no Bootstrap 3 do legado. O Bootstrap 3 reservava à
 * direita da janela a largura da barra de rolagem da página; o 5 esconde a barra antes de
 * medir e centra a janela na tela inteira (meia barra à direita do legado).
 */
document.addEventListener('show.bs.modal', (event) => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  event.target.style.paddingRight = scrollbarWidth > 0 ? scrollbarWidth + 'px' : '';
});
