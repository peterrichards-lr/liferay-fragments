setTimeout(() => {
  const fontSizePixels = parseFloat(
    getComputedStyle(document.documentElement).fontSize || '16'
  );
  const parseBreakpoint = (value, fallback = 0) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    return String(value).includes('rem') ? num * fontSizePixels : num;
  };

  const {
    enableDebug: debugEnabled,
    desktopBreakpoint: desktopBP,
    enableTabletBreakpoint,
    tabletBreakpoint: tabletBP,
    enableLandscapePhoneBreakpoint,
    landscapePhoneBreakpoint: landscapePhoneBP,
    enablePortraitPhoneBreakpoint,
    portraitPhoneBreakpoint: portraitPhoneBP,
    menuStyle,
    debounceDelay = 0,
    limitMenuWidth = false,
    menuWidth = '5rem',
    enableScrollLock = false,
    enableCloseOnInternalNav = true,
  } = configuration;

  const productMenuWidth = 320;
  const root = fragmentElement.querySelector('.fragment-root');
  const debug = (label, ...args) => {
    if (debugEnabled) console.debug('[Menu]', label + ':', ...args);
  };

  const desktopBreakpoint = parseBreakpoint(desktopBP);
  const tabletBreakpoint = enableTabletBreakpoint
    ? parseBreakpoint(tabletBP, desktopBreakpoint)
    : desktopBreakpoint;
  const landscapePhoneBreakpoint = enableLandscapePhoneBreakpoint
    ? parseBreakpoint(landscapePhoneBP, tabletBreakpoint)
    : tabletBreakpoint;
  const portraitPhoneBreakpoint = enablePortraitPhoneBreakpoint
    ? parseBreakpoint(portraitPhoneBP, landscapePhoneBreakpoint)
    : landscapePhoneBreakpoint;

  debug('fontSizePixels', fontSizePixels);
  debug('desktopBreakpoint', desktopBreakpoint);
  debug('tabletBreakpoint', tabletBreakpoint);
  debug('landscapePhoneBreakpoint', landscapePhoneBreakpoint);
  debug('portraitPhoneBreakpoint', portraitPhoneBreakpoint);

  if (!root || layoutMode === 'preview') {
    debug('init', 'No root element or in preview mode – exiting.');
    return;
  }

  const qs = (sel, scope = root) => scope.querySelector(sel);
  const qsa = (sel, scope = root) => Array.from(scope.querySelectorAll(sel));

  const holder = fragmentElement.parentElement;

  const zoneWrapper = qs('.hamburger-zone-wrapper');
  const hamburger = qs('.hamburger');
  const logoZone = zoneWrapper
    ? zoneWrapper.querySelector('.logo-zone')
    : null;
  const toggleButton = qs('.fragment-menu-icon');
  const fragmentMenu = qs('#fragmentSideMenuList-' + fragmentEntryLinkNamespace);
  const mainContent = document.getElementById('main-content');
  const isLeft = menuStyle.includes('menu-left');

  const setAriaWiring = () => {
    if (!toggleButton) return;
    if (fragmentMenu && !toggleButton.hasAttribute('aria-controls')) {
      toggleButton.setAttribute(
        'aria-controls',
        'fragmentSideMenuList-' + fragmentEntryLinkNamespace
      );
    }
    if (!toggleButton.hasAttribute('aria-expanded')) {
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  };

  if (logoZone && hamburger) {
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');
    debug('logoZone state', { afterLP, always, enlarged });
    if (enlarged) {
      hamburger.classList.add('increase');
      if (mainContent) mainContent.classList.add('increase-hamburger');
    }
    if (always) hamburger.classList.add('logo-always');
  }

  if (layoutMode === 'view') {
    if (holder) holder.classList.add('fragment-menu-holder');
    setAriaWiring();

    const debounce = (fn, delay) => {
      let id;
      return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), delay);
      };
    };

    const setFixedWidthForDesktopLike = () => {
      if (!zoneWrapper || !mainContent) return;

      const w = window.innerWidth;

      if (w < tabletBreakpoint) {
        zoneWrapper.style.removeProperty('width');
        if (isLeft) mainContent.style.removeProperty('margin-left');
        else mainContent.style.removeProperty('margin-right');
        return;
      }

      let targetWidth;
      if (limitMenuWidth) {
        targetWidth = menuWidth;
      } else {
        targetWidth = zoneWrapper.offsetWidth + 'px';
      }
      zoneWrapper.style.width = targetWidth;

      if (layoutMode !== 'edit') {
        if (isLeft) mainContent.style.marginLeft = targetWidth;
        else mainContent.style.marginRight = targetWidth;
      }
    };

    const updateSizes = () => {
      setFixedWidthForDesktopLike();
    };

    updateSizes();
    window.addEventListener('resize', debounce(updateSizes, debounceDelay));

    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        if (!zoneWrapper || !hamburger) return;
        const parent = hamburger.parentElement;
        if (parent) parent.classList.toggle('open');
        zoneWrapper.classList.toggle('open');
        if (logoZone) logoZone.classList.toggle('open');
      });
    }

    if (isLeft) {
      const sideMenu = document.body.querySelector(
        'nav.lfr-product-menu-panel'
      );
      if (sideMenu && holder) {
        const onProductToggle = () => {
          const width = sideMenu.clientWidth;
          const isOpen = sideMenu.classList.contains('open');
          const offsetLeft = window.innerWidth <= productMenuWidth ? 0 : width;
          holder.style.left = isOpen ? offsetLeft + 'px' : '0';
        };
        onProductToggle();
        new MutationObserver(onProductToggle).observe(sideMenu, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        });
      }
    }

    const onScroll = () => {
      if (!holder) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      holder.classList.toggle('top', y > 28);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const closeIfWiderThanPhones = () => {
      if (!zoneWrapper || !hamburger) return;
      if (window.innerWidth >= landscapePhoneBreakpoint) {
        zoneWrapper.classList.remove('open');
        const parent = hamburger.parentElement;
        if (parent) parent.classList.remove('open');
        if (logoZone) logoZone.classList.remove('open');
      }
    };
    window
      .matchMedia(`(min-width:${landscapePhoneBreakpoint}px)`)
      .addEventListener('change', closeIfWiderThanPhones);

    if (enableCloseOnInternalNav) {
      const wireCloseOnInternalNav = ({
        root,
        menuContainer,
        transitionTarget,
        isMenuOpen,
        closeMenu,
        enabled = true,
        transitionTimeout = 300,
      }) => {
        if (!enabled || !menuContainer) return;

        const isModifier = (e) =>
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
        const isInternal = (a) => {
          try {
            const u = new URL(a.href, location.href);
            return u.origin === location.origin;
          } catch {
            return false;
          }
        };
        const getClosestLink = (el) => el.closest('a[href]');

        menuContainer.addEventListener('click', (e) => {
          const a = getClosestLink(e.target);
          if (!a) return;
          if (
            a.target === '_blank' ||
            a.hasAttribute('download') ||
            isModifier(e)
          )
            return;
          if (!isInternal(a)) return;
          if (!isMenuOpen()) return;

          e.preventDefault();
          const href = a.href;
          let navigated = false;
          const go = () => {
            if (!navigated) {
              navigated = true;
              window.location.assign(href);
            }
          };

          const onDone = () => {
            (transitionTarget || menuContainer).removeEventListener(
              'transitionend',
              onDone,
              true
            );
            root.removeAttribute('data-closing');
            go();
          };

          root.setAttribute('data-closing', 'true');
          closeMenu();

          (transitionTarget || menuContainer).addEventListener(
            'transitionend',
            onDone,
            true
          );
          setTimeout(onDone, transitionTimeout);
        });
      };

      wireCloseOnInternalNav({
        root,
        menuContainer: fragmentMenu,
        transitionTarget:
          zoneWrapper?.querySelector('.fragment-menu') || fragmentMenu,
        isMenuOpen: () =>
          root.classList.contains('is-menu-view') ||
          zoneWrapper?.classList.contains('open'),
        closeMenu: () => {
          zoneWrapper?.classList.remove('open');
          root.classList.remove('is-menu-view');
        },
        enabled: configuration.enableCloseOnInternalNav === true,
        transitionTimeout: 300,
      });
    }
  }
}, configuration.initializeDelay);
