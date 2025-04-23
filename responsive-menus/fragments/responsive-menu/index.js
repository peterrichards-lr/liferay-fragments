setTimeout(() => {
  const fontSizePixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const parseBreakpoint = (value, fallback = 0) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    return value.includes('rem') ? num * fontSizePixels : num;
  };

  // Configuration & constants
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

  // Debug logger with context
  const debug = (label, ...args) => {
    if (debugEnabled) console.debug(`[Menu] ${label}:`, ...args);
  };

  // Compute breakpoints
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

  // Early exit if there's no root or we're in preview mode
  if (!root || layoutMode === 'preview') {
    debug('init', 'No root element or in preview mode – exiting.');
    return;
  }

  // Common elements
  const hamburgerZoneWrapper = root.querySelector('.hamburger-zone-wrapper');
  const hamburger = root.querySelector('.hamburger');
  const logoZone = hamburgerZoneWrapper?.querySelector('.logo-zone');
  const parentDiv = fragmentElement.parentElement;

  // Logo modifiers
  if (logoZone) {
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');

    debug('logoZone state', { afterLP, always, enlarged });

    if (enlarged) hamburger.classList.add('increase');
    if (always) hamburger.classList.add('logo-always');
  }

  // Only in "view" mode do we wire up menu behaviours
  if (layoutMode === 'view') {
    parentDiv.classList.add('fragment-menu-holder');

    // Resize handler
    const updateSizes = () => {
      // Reset styles
      root.style.height = '';
      root.style.width = '';
      root.style.minWidth = '';

      // Set height
      const heightPx = `${root.clientHeight}px`;
      debug('rootHeight', heightPx);
      root.style.height = heightPx;
      root.dataset.height = heightPx;

      if (window.innerWidth >= landscapePhoneBreakpoint) {
        [hamburger, hamburgerZoneWrapper, logoZone].forEach(el => el?.classList.remove('open'));
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

    // Initialize
    updateSizes();
    window.addEventListener('resize', debounce(updateSizes, debounceDelay));

    // Hamburger toggle
    root.querySelector('.fragment-menu-icon')
      .addEventListener('click', () => {
        [hamburger, hamburgerZoneWrapper, logoZone].forEach(el => el?.classList.toggle('open'));
      });

    // Scroll-to-top or sticky behavior
    if (scrollBackToTop && !isSticky) {
      const scrollToTopBtn = root.querySelector('.fragment-scroll-to-top');

      scrollToTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      window.addEventListener('scroll', () => {
        const visible = window.scrollY > 20;
        if (scrollToTopBtn) scrollToTopBtn.style.display = visible ? 'block' : 'none';
      }, { passive: true });

    } else if (isSticky) {
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 28;
        parentDiv.classList.toggle('top', scrolled);
      }, { passive: true });
    }
  }
}, configuration.initializeDelay);