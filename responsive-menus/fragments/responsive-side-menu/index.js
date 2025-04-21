(function () {
  const fontSizePixels = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const parseBreakpoint = (value, fallback = 0) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    return value.includes('rem') ? num * fontSizePixels : num;
  };

  // Configuration & constants
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
  } = configuration;

  const productMenuWidth = 320;
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
  const hamburgerZoneWrapper = root.querySelector(
    '.hamburger-zone-wrapper'
  );
  const hamburger = root.querySelector('.hamburger');
  const logoZone = hamburgerZoneWrapper?.querySelector('.logo-zone');
  const mainContent = document.getElementById('main-content');
  const isLeft = menuStyle.includes('menu-left');

  // Logo / hamburger modifiers
  if (logoZone) {
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');

    debug('logoZone state', { afterLP, always, enlarged });

    if (enlarged) {
      hamburger.classList.add('increase');
      mainContent.classList.add('increase-hamburger');
    }
    if (always) hamburger.classList.add('logo-always');
  }

  // Only in "view" mode do we wire up menu behaviours
  if (layoutMode === 'view') {
    const holder = fragmentElement.parentElement;
    holder.classList.add('fragment-menu-holder');

    // Resize handler
    const updateSizes = () => {
      const w = window.innerWidth;
      if (w >= tabletBreakpoint) {
        const wPx = `${hamburgerZoneWrapper.offsetWidth}px`;
        hamburgerZoneWrapper.dataset.width = wPx;
        hamburgerZoneWrapper.style.width = wPx;
        if (layoutMode !== 'edit') {
          mainContent.style.marginRight = wPx;
        }
      } else {
        hamburgerZoneWrapper.style.width = '';
        mainContent.style.marginRight = '';
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
    window.addEventListener(
      'resize',
      debounce(updateSizes, debounceDelay)
    );

    // Hamburger toggle
    root
      .querySelector('.fragment-menu-icon')
      .addEventListener('click', () => {
        [hamburger.parentElement, hamburgerZoneWrapper, logoZone].forEach(
          el => el?.classList.toggle('open')
        );
      });

    // Side (product) menu offset
    if (isLeft) {
      const sideMenu = document.body.querySelector(
        'nav.lfr-product-menu-panel'
      );
      if (sideMenu) {
        const onProductToggle = () => {
          const width = sideMenu.clientWidth;
          const isOpen = sideMenu.classList.contains('open');
          const offsetLeft =
            window.innerWidth <= productMenuWidth ? 0 : width;
          holder.style.left = isOpen ? `${offsetLeft}px` : '0';
        };

        onProductToggle();
        new MutationObserver(onProductToggle).observe(sideMenu, {
          attributes: true,
        });
      }
    }

    // Scroll handler: add .top once scrolled past 28px
    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      holder.classList.toggle('top', scrollY > 28);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
