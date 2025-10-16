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
    menuItemOverflow,
    desktopBreakpoint: desktopBP,
    enableTabletBreakpoint,
    tabletBreakpoint: tabletBP,
    enableLandscapePhoneBreakpoint,
    landscapePhoneBreakpoint: landscapePhoneBP,
    enablePortraitPhoneBreakpoint,
    portraitPhoneBreakpoint: portraitPhoneBP,
    menuStyle,
    debounceDelay = 0,
    scrollBackToTop = false,
  } = configuration;

  const noMenuItemOverflow = menuItemOverflow === 'none';
  const isSticky = menuStyle.includes('sticky');
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
  const parentDiv = fragmentElement.parentElement;
  const toggleButton = root.querySelector('.fragment-menu-icon');
  const fragmentMenu = root.querySelector(
    '#fragmentMenuList-' + fragmentEntryLinkNamespace
  );

  const setAriaWiring = () => {
    if (!toggleButton) return;
    if (fragmentMenu && !toggleButton.hasAttribute('aria-controls')) {
      toggleButton.setAttribute(
        'aria-controls',
        'fragmentMenuList-' + fragmentEntryLinkNamespace
      );
    }
    if (!toggleButton.hasAttribute('aria-expanded')) {
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  };

  const getFocusableMenuItems = () => {
    if (!fragmentMenu) return [];
    const candidates = fragmentMenu.querySelectorAll(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
    return Array.from(candidates).filter((el) => el.offsetParent !== null);
  };

  const isMenuOpen = () =>
    !!(
      hamburger?.classList.contains('open') ||
      hamburgerZoneWrapper?.classList.contains('open') ||
      logoZone?.classList.contains('open')
    );

  const openMenu = () => {
    [hamburger, hamburgerZoneWrapper, logoZone].forEach((el) =>
      el?.classList.add('open')
    );
    if (toggleButton) toggleButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu-view');
    const focusables = getFocusableMenuItems();
    if (focusables.length) focusables[0].focus();
  };

  const closeMenu = () => {
    [hamburger, hamburgerZoneWrapper, logoZone].forEach((el) =>
      el?.classList.remove('open')
    );
    if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-view');
  };

  const markCurrentPageLink = () => {
    const here = window.location.href.replace(/#$/, '');
    root.querySelectorAll('.fragment-menu a[href]').forEach((a) => {
      const target = a.href && a.href.replace(/#$/, '');
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  };

  const logoSetup = () => {
    if (!logoZone) return;
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');
    debug('logoZone state', { afterLP, always, enlarged });
    if (enlarged) hamburger?.classList.add('increase');
    if (always) hamburger?.classList.add('logo-always');
  };

  if (layoutMode === 'view') {
    parentDiv.classList.add('fragment-menu-holder');
    setAriaWiring();
    logoSetup();
    markCurrentPageLink();

    const updateSizes = () => {
      root.style.height = '';
      root.style.width = '';
      root.style.minWidth = '';

      const heightPx = `${root.clientHeight}px`;
      debug('rootHeight', heightPx);
      root.style.height = heightPx;
      root.dataset.height = heightPx;

      if (window.innerWidth >= landscapePhoneBreakpoint) {
        closeMenu();
      } else if (noMenuItemOverflow) {
        const innerMenu = hamburgerZoneWrapper.querySelector('.fragment-menu');
        const minWidth = `${innerMenu.offsetWidth}px`;
        debug('rootMinWidth', minWidth);
        root.dataset.minWidth = minWidth;
      }
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

    const onToggleClick = () => {
      if (isMenuOpen()) {
        closeMenu();
        toggleButton?.focus();
      } else {
        openMenu();
      }
    };

    toggleButton?.addEventListener('click', onToggleClick);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!isMenuOpen()) return;
      event.preventDefault();
      closeMenu();
      toggleButton?.focus();
    });

    document.addEventListener('click', (event) => {
      if (root.contains(event.target)) return;
      if (!isMenuOpen()) return;
      closeMenu();
    });

    if (scrollBackToTop && !isSticky) {
      const scrollToTopBtn = root.querySelector('.fragment-scroll-to-top');
      scrollToTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      const onScroll = () => {
        const visible = window.scrollY > 20;
        if (scrollToTopBtn)
          scrollToTopBtn.style.display = visible ? 'block' : 'none';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else if (isSticky) {
      window.addEventListener(
        'scroll',
        () => {
          const scrolled = window.scrollY > 28;
          parentDiv.classList.toggle('top', scrolled);
        },
        { passive: true }
      );
    }
  }
}, configuration.initializeDelay);
