(function advancedSearchLabels() {
  function fill(template, group, term) {
    return (template || '').replace('%%group%%', group).replace('%%term%%', term);
  }

  function setLabel(element, text) {
    if (element && element.getAttribute('aria-label') !== text) {
      element.setAttribute('aria-label', text);
    }
  }

  function relabel(form) {
    const labels = form.dataset;
    form.querySelectorAll('.adv-group').forEach((groupElement, groupIndex) => {
      const group = groupIndex + 1;
      const legend = groupElement.querySelector(':scope > legend');
      const legendText = fill(labels.labelGroup, group, '');
      if (legend && legend.textContent !== legendText) {
        legend.textContent = legendText;
      }
      setLabel(groupElement.querySelector('.add_search_link'), fill(labels.labelAdd, group, ''));
      groupElement.querySelectorAll('.adv-search').forEach((searchElement, searchIndex) => {
        const term = searchIndex + 1;
        setLabel(searchElement.querySelector('input.form-control'), fill(labels.labelLookfor, group, term));
        setLabel(searchElement.querySelector('select.adv-term-type'), fill(labels.labelType, group, term));
        setLabel(searchElement.querySelector('.adv-term-remove'), fill(labels.labelRemove, group, term));
      });
    });
  }

  function init() {
    const form = document.getElementById('advSearchForm');
    if (!form) {
      return;
    }
    new MutationObserver(() => relabel(form)).observe(form, { childList: true, subtree: true });
    relabel(form);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
