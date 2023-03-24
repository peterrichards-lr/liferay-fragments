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
    if (!entry) {
      console.warn('Unable to find the entry from the event');
    }
    entry.classList.toggle('alert-close');
  };

  const createAccordion = (entry) => {
    const entryTitle = entry.querySelector('.entry-title');
    if (!entryTitle) {
      console.warn("Unable to find the entry's header");
    }
    entryTitle.addEventListener('click', clickHandler);
    if (!configuration.showAlertOpen) {
      entry.classList.add('alert-close');
    }
  };

  const queryInnerTextAll = function (root, selector, regex) {
    if (typeof regex === 'string') {
      regex = new RegExp(regex, 'i');
    }
    const elements = [...root.querySelectorAll(selector)];
    const rtn = elements.filter((element) => {
      return element.innerText.match(regex);
    });
    return rtn.length === 0 ? null : rtn;
  };

  const queryInnerText = function (root, selector, text) {
    try {
      const result = queryInnerTextAll(root, selector, text);
      if (Array.isArray(result)) {
        return result[0];
      } else {
        return result;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const getReadAtDate = () => {
    return new Date().toJSON();
  };

  const getEntryId = (link) => {
    var text;
    if (link.hasAttribute('href')) {
      text = link.getAttribute('href');
    } else if (link.hasAttribute('onclick')) {
      text = link.getAttribute('onclick');
    }
    if (text.startsWith('javascript:')) {
      const markEntryRegEx = /markEntry\(([0-9]+)\)/;
      const match = text.match(markEntryRegEx);
      return match ? match[1] : undefined;
    }
    return undefined;
  };

  const addMarkAsRead = (entry) => {
    const actionText = 'Mark as Read';
    const entryContent = entry.querySelector('.entry-content');
    if (!entryContent) {
      console.error("Unable to find the entry's message body");
      return;
    }
    const entryTitle = entry.querySelector('.entry-title');
    if (!entryTitle) {
      console.error("Unable to find the entry's header");
      return;
    }
    const contextMenu = entry.querySelector(
      '.dropdown-menu.dropdown-menu-right'
    );
    if (!contextMenu) {
      console.error("Unable to find the entry's context menu");
      return;
    }
    const markAsReadMenuItem = queryInnerText(contextMenu, 'span', actionText);
    if (!markAsReadMenuItem) {
      console.error("Unable to find the entry's ' + actionText + ' menu");
      return;
    }
    const markAsReadMenuItemLink = markAsReadMenuItem.parentElement;
    const entryId = getEntryId(markAsReadMenuItemLink);
    const markAsReadButton = document.createElement('a');
    markAsReadButton.innerText = actionText;
    markAsReadButton.classList.add('btn');
    markAsReadButton.classList.add(
      'btn-' + configuration.addMarkAsReadButtonSize
    );
    markAsReadButton.classList.add(
      'btn-' + configuration.addMarkAsReadButtonType
    );
    markAsReadButton.addEventListener('click', (evt) => {
      if (configuration.enableAcCustomEvent) {
        const action = 'Read alert / announcement';
        if (window.Analytics) {
          Analytics.track(action, {
            userId: themeDisplay.getUserId(),
            readAt: getReadAtDate(),
            entryId: entryId ? '' + entryId : 'Unknown',
            entryTitle: entryTitle ? entryTitle : 'Unknown',
          });
        }
      }
      markAsReadMenuItemLink.click();
    });
    entryContent.appendChild(markAsReadButton);
  };

  for (var i = 0; i < entries.length; i++) {
    const entry = entries[i];
    setPriority(entry);
    if (configuration.useAccordion) {
      createAccordion(entry);
    }
    if (configuration.addMarkAsRead && themeDisplay.isSignedIn()) {
      addMarkAsRead(entry);
    }
  }
}
