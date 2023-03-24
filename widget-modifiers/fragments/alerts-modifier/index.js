if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

const entries = fragmentElement.querySelectorAll('div.entries > div');
if (entries) {
  const setPriority = (entry) => {
    const badge = entry.querySelector('.badge');
    const important = badge !== null;
    if (important) {
      entry.classList.add('important');
    } else {
      entry.classList.add('normal');
    }
  };

  const getAncestor = (el, gen) => {
    var parent = el.parentElement;
    var i = 0;
    while (i < gen - 1) {
      parent = parent.parentElement;
      i++;
    }
    return parent;
  };

  const clickHandler = (evt) => {
    const entryTitle = evt.target;
    const entry = getAncestor(entryTitle, 7);
    entry.classList.toggle('alert-close');
  };

  const createAccordion = (entry) => {
    const entryTitle = entry.querySelector('.entry-title');
    entryTitle.addEventListener('click', clickHandler);

    if (!configuration.showAlertOpen) {
      entry.classList.add('alert-close');
    }
  };

  for (var i = 0; i < entries.length; i++) {
    const entry = entries[i];
    setPriority(entry);
    if (configuration.useAccordion) {
      createAccordion(entry);
    }
  }
}
