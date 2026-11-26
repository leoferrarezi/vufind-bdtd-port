/* Aba de metadados do registro: começa fechada e funciona como botão de mostrar/esconder (Enter e Espaço).
   O record.js do VuFind abre a aba também no foco, por isso o foco e o clique não chegam a ele; o clique
   que ele mesmo dispara ao aplicar o #hash da URL só abre. */
(function openCloseTab() {
  const selector = '.record-tabs .nav-tabs a';

  function tabFrom(event) {
    return event.target instanceof Element ? event.target.closest(selector) : null;
  }

  function setOpen(tab, open) {
    const li = tab.parentNode;
    const top = tab.closest('.record-tabs');
    const pane = top ? top.querySelector('.tab-pane.' + li.dataset.tab + '-tab') : null;
    if (!pane) {
      return;
    }
    pane.classList.toggle('active', open);
    tab.classList.toggle('active', open);
    tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    const url = window.location.pathname + window.location.search + (open ? '#' + li.dataset.tab : '');
    window.history.replaceState({}, '', url);
  }

  function toggle(tab) {
    setOpen(tab, !tab.classList.contains('active'));
  }

  document.addEventListener('focus', (event) => {
    if (tabFrom(event)) {
      event.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('click', (event) => {
    const tab = tabFrom(event);
    if (!tab) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.isTrusted) {
      toggle(tab);
    } else {
      setOpen(tab, true);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    const tab = event.key === ' ' ? tabFrom(event) : null;
    if (tab) {
      event.preventDefault();
      toggle(tab);
    }
  }, true);
})();
