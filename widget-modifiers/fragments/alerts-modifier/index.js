if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

const entries = fragmentElement.querySelectorAll('div.entries > div');
if (entries) {
  const actionText = 'Mark as Read';
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

  const getJsonDate = () => {
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
      return match
        ? isNaN(match[1]) == false
          ? parseInt(match[1])
          : match[1]
        : undefined;
    }
    return undefined;
  };

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

  const getMarkAsReadMenuItem = (entry) => {
    const contextMenu = entry.querySelector(
      '.dropdown-menu.dropdown-menu-right'
    );
    if (!contextMenu) {
      console.error("Unable to find the entry's context menu");
      return;
    }
    const markAsReadMenuItem = queryInnerText(contextMenu, 'span', actionText);
    if (markAsReadMenuItem) return markAsReadMenuItem;
    return null;
  };

  const buildAnalyticsEventData = (entryId, entry, entryTitle) => {
    const userIdStr = themeDisplay.getUserId();
    const userId = isNaN(userIdStr) ? userIdStr : parseInt(userIdStr);
    return {
      userId: userId,
      actionAt: getJsonDate(),
      entryId: entryId,
      entryTitle: entryTitle ? entryTitle.innerText : 'Unknown',
      entryPrioirty: entry.classList.contains('important')
        ? 'Important'
        : 'Normal',
    };
  };

  const clickHandler = (evt) => {
    const entryTitle = evt.target;
    const entry = getAncestor(entryTitle, 7);
    if (!entry) {
      console.warn('Unable to find the entry from the event');
      return;
    }
    if (configuration.enableAcCustomEvent && window.Analytics) {
      if (entry.classList.contains('alert-close')) {
        const action = 'Viewed alert / announcement';
        const markAsReadMenuItem = getMarkAsReadMenuItem(entry);
        if (!markAsReadMenuItem) {
          console.error("Unable to find the entry's ' + actionText + ' menu");
          return;
        }
        const markAsReadMenuItemLink = markAsReadMenuItem.parentElement;
        const entryId = getEntryId(markAsReadMenuItemLink);
        const eventData = buildAnalyticsEventData(entryId, entry, entryTitle);
        Analytics.track(action, eventData);
      }
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

  const addMarkAsRead = (entry) => {
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
    const markAsReadMenuItem = getMarkAsReadMenuItem(entry);
    if (!markAsReadMenuItem) {
      console.error("Unable to find the entry's ' + actionText + ' menu");
      return;
    }
    const markAsReadMenuItemLink = markAsReadMenuItem.parentElement;
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
      if (configuration.enableAcCustomEvent && window.Analytics) {
        const action = 'Read alert / announcement';
        const entryId = getEntryId(markAsReadMenuItemLink);
        const eventData = buildAnalyticsEventData(entryId, entry, entryTitle);
        Analytics.track(action, eventData);
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
