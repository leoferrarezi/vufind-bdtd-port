(function jumpMenuKeyboard() {
  const selectionKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];

  function jumpMenuFrom(event) {
    const select = event.target;
    return select instanceof HTMLSelectElement && select.classList.contains('jumpMenu') ? select : null;
  }

  document.addEventListener('focusin', (event) => {
    const select = jumpMenuFrom(event);
    if (select && select.dataset.pendingChange !== '1') {
      select.dataset.appliedValue = select.value;
    }
  });

  document.addEventListener('pointerdown', (event) => {
    const select = jumpMenuFrom(event);
    if (select) {
      delete select.dataset.keyboardChange;
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    const select = jumpMenuFrom(event);
    if (!select) {
      return;
    }
    if (event.key === 'Enter') {
      if (select.dataset.pendingChange === '1') {
        event.preventDefault();
        delete select.dataset.pendingChange;
        select.form.submit();
      }
      return;
    }
    if (selectionKeys.includes(event.key) || event.key.length === 1) {
      select.dataset.keyboardChange = '1';
    }
  }, true);

  document.addEventListener('change', (event) => {
    const select = jumpMenuFrom(event);
    if (select && select.dataset.keyboardChange === '1') {
      event.stopImmediatePropagation();
      delete select.dataset.keyboardChange;
      select.dataset.pendingChange = select.value === select.dataset.appliedValue ? '' : '1';
    }
  }, true);

  document.addEventListener('focusout', (event) => {
    const select = jumpMenuFrom(event);
    if (select && select.dataset.pendingChange === '1') {
      select.value = select.dataset.appliedValue;
      delete select.dataset.pendingChange;
    }
  });
}());
