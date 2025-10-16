setTimeout(() => {
  const fontSizePixels = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const parseBreakpoint = (value, fallback = 0) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    return value.includes('rem') ? num * fontSizePixels : num;
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
  } = configuration;

  const productMenuWidth = 320;
  const root = fragmentElement.querySelector('.fragment-root');

  const debug = (label, ...args) => {
    if (debugEnabled) console.debug(`[Menu] ${label}:`, ...args);
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

  const hamburgerZoneWrapper = root.querySelector('.hamburger-zone-wrapper');
  const hamburger = root.querySelector('.hamburger');
  const logoZone = hamburgerZoneWrapper?.querySelector('.logo-zone');
  const mainContent = document.getElementById('main-content');
  const isLeft = menuStyle.includes('menu-left');
  const holder = fragmentElement.parentElement;
  const toggleButton = root.querySelector('.fragment-menu-icon');
  const menuList = root.querySelector(
    '#fragmentMenuList-' + fragmentEntryLinkNamespace
  );

  const setAria = () => {
    if (!toggleButton) return;
    if (menuList && !toggleButton.hasAttribute('aria-controls')) {
      toggleButton.setAttribute(
        'aria-controls',
        'fragmentMenuList-' + fragmentEntryLinkNamespace
      );
    }
    if (!toggleButton.hasAttribute('aria-expanded')) {
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  };

  const getFocusableInMenu = () => {
    if (!menuList) return [];
    const nodes = menuList.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter((el) => el.offsetParent !== null);
  };

  const targets = [
    hamburger ? hamburger.parentElement : null,
    hamburgerZoneWrapper,
    logoZone,
  ].filter(Boolean);

  const isOpen = () => targets.some((el) => el.classList.contains('open'));

  const openMenu = () => {
    targets.forEach((el) => el.classList.add('open'));
    toggleButton?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu-view');
    if (menuList) {
      menuList.focus();
      const focusables = getFocusableInMenu();
      if (focusables.length) focusables[0].focus();
    }
  };

  const closeMenu = () => {
    targets.forEach((el) => el.classList.remove('open'));
    toggleButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-view');
  };

  const markCurrentPageLink = () => {
    const here = window.location.href.replace(/#$/, '');
    root.querySelectorAll('.fragment-menu a[href]').forEach((a) => {
      const target = a.href && a.href.replace(/#$/, '');
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  };

  if (logoZone) {
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');
    debug('logoZone state', { afterLP, always, enlarged });
    if (enlarged) {
      hamburger.classList.add('increase');
      mainContent?.classList.add('increase-hamburger');
    }
    if (always) hamburger.classList.add('logo-always');
  }

  if (layoutMode === 'view') {
    holder.classList.add('fragment-menu-holder');
    setAria();
    markCurrentPageLink();

    const updateSizes = () => {
      if (limitMenuWidth) {
        hamburgerZoneWrapper.style.width = menuWidth;
        if (mainContent) mainContent.style.marginRight = menuWidth;
      } else {
        const w = window.innerWidth;
        if (w >= tabletBreakpoint) {
          const wPx = `${hamburgerZoneWrapper.offsetWidth}px`;
          hamburgerZoneWrapper.style.width = wPx;
          if (layoutMode !== 'edit' && mainContent)
            mainContent.style.marginRight = wPx;
        } else {
          hamburgerZoneWrapper.style.width = '';
          if (mainContent) mainContent.style.marginRight = '';
        }
      }
      if (window.innerWidth >= landscapePhoneBreakpoint) closeMenu();
    };

    const debounce = (fn, delay) => {
      let id;
      return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), delay);
      };
    };

    updateSizes();
    window.addEventListener('resize', debounce(updateSizes, debounceDelay));

    toggleButton?.addEventListener('click', () => {
      if (isOpen()) {
        closeMenu();
        toggleButton.focus();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        closeMenu();
        toggleButton?.focus();
      }
      if (e.key !== 'Tab' || !isOpen()) return;
      const focusables = getFocusableInMenu();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target) && isOpen()) closeMenu();
    });

    if (isLeft) {
      const sideMenu = document.body.querySelector(
        'nav.lfr-product-menu-panel'
      );
      if (sideMenu) {
        const onProductToggle = () => {
          const width = sideMenu.clientWidth;
          const open = sideMenu.classList.contains('open');
          const offsetLeft = window.innerWidth <= productMenuWidth ? 0 : width;
          holder.style.left = open ? `${offsetLeft}px` : '0';
        };
        onProductToggle();
        new MutationObserver(onProductToggle).observe(sideMenu, {
          attributes: true,
        });
      }
    }

    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      holder.classList.toggle('top', scrollY > 28);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}, configuration.initializeDelay);
