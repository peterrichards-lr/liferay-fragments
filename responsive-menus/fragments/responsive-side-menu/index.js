setTimeout(() => {
  const fontSizePixels = parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
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
    menuWidth = '5rem'
  } = configuration;

  const productMenuWidth = 320;
  const root = fragmentElement.querySelector('.fragment-root');
  const debug = (label, ...args) => { if (debugEnabled) console.debug('[Menu]', label + ':', ...args); };

  const desktopBreakpoint = parseBreakpoint(desktopBP);
  const tabletBreakpoint = enableTabletBreakpoint ? parseBreakpoint(tabletBP, desktopBreakpoint) : desktopBreakpoint;
  const landscapePhoneBreakpoint = enableLandscapePhoneBreakpoint ? parseBreakpoint(landscapePhoneBP, tabletBreakpoint) : tabletBreakpoint;
  const portraitPhoneBreakpoint = enablePortraitPhoneBreakpoint ? parseBreakpoint(portraitPhoneBP, landscapePhoneBreakpoint) : landscapePhoneBreakpoint;

  debug('fontSizePixels', fontSizePixels);
  debug('desktopBreakpoint', desktopBreakpoint);
  debug('tabletBreakpoint', tabletBreakpoint);
  debug('landscapePhoneBreakpoint', landscapePhoneBreakpoint);
  debug('portraitPhoneBreakpoint', portraitPhoneBreakpoint);

  if (!root || layoutMode === 'preview') {
    debug('init', 'No root element or in preview mode – exiting.');
    return;
  }

  const holder = fragmentElement.parentElement;
  const hamburgerZoneWrapper = root.querySelector('.hamburger-zone-wrapper');
  const hamburger = root.querySelector('.hamburger');
  const logoZone = hamburgerZoneWrapper ? hamburgerZoneWrapper.querySelector('.logo-zone') : null;
  const toggleBtn = root.querySelector('.fragment-menu-icon');
  const mainContent = document.getElementById('main-content');
  const isLeft = menuStyle.includes('menu-left');

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

    const debounce = (fn, delay) => {
      let id;
      return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), delay); };
    };

    const setFixedWidthForDesktopLike = () => {
      if (!hamburgerZoneWrapper || !mainContent) return;
      if (limitMenuWidth) {
        hamburgerZoneWrapper.style.width = menuWidth;
        if (isLeft) mainContent.style.marginLeft = menuWidth;
        else mainContent.style.marginRight = menuWidth;
        return;
      }
      const w = window.innerWidth;
      if (w >= tabletBreakpoint) {
        const wPx = hamburgerZoneWrapper.offsetWidth + 'px';
        hamburgerZoneWrapper.style.width = wPx;
        if (layoutMode !== 'edit') {
          if (isLeft) mainContent.style.marginLeft = wPx;
          else mainContent.style.marginRight = wPx;
        }
      } else {
        hamburgerZoneWrapper.style.width = '';
        if (isLeft) mainContent.style.marginLeft = '';
        else mainContent.style.marginRight = '';
      }
    };

    const updateSizes = () => {
      setFixedWidthForDesktopLike();
    };

    updateSizes();
    window.addEventListener('resize', debounce(updateSizes, debounceDelay));

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (!hamburgerZoneWrapper || !hamburger) return;
        const parent = hamburger.parentElement;
        if (parent) parent.classList.toggle('open');
        hamburgerZoneWrapper.classList.toggle('open');
        if (logoZone) logoZone.classList.toggle('open');
      });
    }

    if (isLeft) {
      const sideMenu = document.body.querySelector('nav.lfr-product-menu-panel');
      if (sideMenu && holder) {
        const onProductToggle = () => {
          const width = sideMenu.clientWidth;
          const isOpen = sideMenu.classList.contains('open');
          const offsetLeft = window.innerWidth <= productMenuWidth ? 0 : width;
          holder.style.left = isOpen ? offsetLeft + 'px' : '0';
        };
        onProductToggle();
        new MutationObserver(onProductToggle).observe(sideMenu, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    }

    const onScroll = () => {
      if (!holder) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      holder.classList.toggle('top', y > 28);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const closeIfWiderThanPhones = () => {
      if (!hamburgerZoneWrapper || !hamburger) return;
      if (window.innerWidth >= landscapePhoneBreakpoint) {
        hamburgerZoneWrapper.classList.remove('open');
        const parent = hamburger.parentElement;
        if (parent) parent.classList.remove('open');
        if (logoZone) logoZone.classList.remove('open');
      }
    };
    window.matchMedia(`(min-width:${landscapePhoneBreakpoint}px)`).addEventListener('change', closeIfWiderThanPhones);
  }
}, configuration.initializeDelay);