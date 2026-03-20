const initCustomTabs = () => {
  const dropdown = fragmentElement.querySelector('.navbar-collapse');
  const dropdownButton = fragmentElement.querySelector('.navbar-toggler-link');
  const editMode = layoutMode === 'edit';
  const persistedTabKey =
    'tabsFragment_' + fragmentNamespace + '_persistedTabId';

  const tabItems = Array.from(
    fragmentElement.querySelectorAll(
      '[data-fragment-namespace="' + fragmentNamespace + '"].nav-link'
    )
  );

  const tabPanelItems = Array.from(
    fragmentElement.querySelectorAll(
      '[data-fragment-namespace="' + fragmentNamespace + '"].tab-panel-item'
    )
  );

  const persistedTab = (function () {
    if (!configuration.persistSelectedTab) {
      let persistedId;

      return {
        getId() {
          return persistedId;
        },

        setId(nextId) {
          persistedId = nextId;
        },
      };
    }

    return {
      getId() {
        const val = Liferay.Util.SessionStorage.getItem(
          persistedTabKey,
          Liferay.Util.SessionStorage.TYPES.PERSONALIZATION
        );
        return val !== null ? Number(val) : 0;
      },

      setId(id) {
        Liferay.Util.SessionStorage.setItem(
          persistedTabKey,
          id,
          Liferay.Util.SessionStorage.TYPES.PERSONALIZATION
        );
      },
    };
  })();

  function activeTab(item) {
    const getAriaLabel = () => {
      const label = dropdownButton.getAttribute('aria-label') || '';
      const parts = label.split(':');
      const currentSelectionText = parts[0] || 'Selection';

      return `${currentSelectionText}: ${item.textContent.trim()}`;
    };

    tabItems.forEach(function (tabItem) {
      tabItem.setAttribute('aria-selected', false);
      tabItem.setAttribute('tabindex', '-1');
      tabItem.classList.remove('active');
    });

    if (dropdownButton) {
      dropdownButton.setAttribute('aria-label', getAriaLabel());
    }
    item.setAttribute('aria-selected', true);
    item.setAttribute('tabindex', '0');
    item.classList.add('active');
  }

  function activeTabPanel(item) {
    tabPanelItems.forEach(function (tabPanelItem) {
      tabPanelItem.classList.add('hidden');
    });

    if (item) {
      item.classList.remove('hidden');
    }
  }

  function handleDropdown(event, item) {
    if (event) event.preventDefault();
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('show');
    dropdown.classList.toggle('show', !isOpen);

    if (dropdownButton) {
      dropdownButton.setAttribute('aria-expanded', !isOpen);
    }

    if (item) {
      handleDropdownButtonName(item);
    }
  }

  function handleDropdownButtonName(item) {
    if (!dropdownButton) return;
    const tabText =
      item.querySelector('lfr-editable') ||
      item.querySelector('.navbar-text-truncate');

    if (tabText) {
      const target = dropdownButton.querySelector('.navbar-text-truncate');
      if (target) target.textContent = tabText.textContent.trim();
    }
  }

  function openTabPanel(event, i) {
    const currentTarget = event.currentTarget;
    const target = event.target;

    const isEditable =
      target.hasAttribute('data-lfr-editable-id') ||
      target.hasAttribute('contenteditable');

    const dropdownIsOpen =
      dropdownButton && dropdownButton.getAttribute('aria-expanded') === 'true';

    if (!isEditable || !editMode) {
      if (dropdownIsOpen) {
        handleDropdown(event, currentTarget);
      } else {
        handleDropdownButtonName(currentTarget);
      }

      currentTarget.focus();

      activeTab(currentTarget);
      activeTabPanel(tabPanelItems[i]);
      persistedTab.setId(i);

      // Publish via standardized Event Bus
      Liferay.Fragment.Commons.EventBus.publish(
        'tabs:activePanel',
        { panel: tabPanelItems[i] },
        { sticky: true }
      );
    }
  }

  const handleKeydown = (event, index) => {
    let newIndex = -1;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      newIndex = (index + 1) % tabItems.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      newIndex = (index - 1 + tabItems.length) % tabItems.length;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = tabItems.length - 1;
    }

    if (newIndex !== -1) {
      event.preventDefault();
      tabItems[newIndex].click();
      tabItems[newIndex].focus();
    }
  };

  const init = () => {
    const currentTabId = persistedTab.getId();
    const initialIndex = tabItems[currentTabId] ? currentTabId : 0;

    tabItems.forEach(function (item, index) {
      item.addEventListener('click', function (event) {
        openTabPanel(event, index);
      });

      item.addEventListener('keydown', (e) => handleKeydown(e, index));
    });

    if (dropdownButton) {
      dropdownButton.addEventListener('click', function (event) {
        handleDropdown(event);
      });

      dropdownButton.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (dropdown && dropdown.classList.contains('show')) {
            handleDropdown(e);
            dropdownButton.focus();
          }
        }
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (
        dropdown &&
        dropdown.classList.contains('show') &&
        !fragmentElement.contains(e.target)
      ) {
        handleDropdown();
      }
    });

    activeTab(tabItems[initialIndex]);
    activeTabPanel(tabPanelItems[initialIndex]);
    handleDropdownButtonName(tabItems[initialIndex]);
  };

  init();
};

initCustomTabs();
