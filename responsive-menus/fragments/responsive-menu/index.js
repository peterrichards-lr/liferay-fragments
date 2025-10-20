setTimeout(() => {
  const fontSizePixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const parseBreakpoint = (value, fallback = 0) => {
    if (!value) return fallback;
    const n = parseFloat(value);
    return value.includes('rem') ? n * fontSizePixels : n;
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

  const isSticky = menuStyle.includes('sticky');
  const noMenuItemOverflow = menuItemOverflow === 'none';

  const root = fragmentElement.querySelector('.fragment-root');
  if (!root || layoutMode === 'preview') return;

  const debug = (...a) => { if (debugEnabled) console.debug('[Menu]', ...a); };

  const desktopBreakpoint = parseBreakpoint(desktopBP);
  const tabletBreakpoint = enableTabletBreakpoint ? parseBreakpoint(tabletBP, desktopBreakpoint) : desktopBreakpoint;
  const landscapePhoneBreakpoint = enableLandscapePhoneBreakpoint ? parseBreakpoint(landscapePhoneBP, tabletBreakpoint) : tabletBreakpoint;
  const portraitPhoneBreakpoint = enablePortraitPhoneBreakpoint ? parseBreakpoint(portraitPhoneBP, landscapePhoneBreakpoint) : landscapePhoneBreakpoint;

  const qs = (sel, scope = root) => scope.querySelector(sel);
  const qsa = (sel, scope = root) => Array.from(scope.querySelectorAll(sel));

  const holder = fragmentElement.parentElement;
  const zoneWrapper = qs('.hamburger-zone-wrapper');
  const hamburger = qs('.hamburger');
  const toggleButton = qs('.fragment-menu-icon');
  const fragmentMenu = qs('#fragmentMenuList-' + fragmentEntryLinkNamespace);
  const logoZone = zoneWrapper ? zoneWrapper.querySelector('.logo-zone') : null;

  const setAriaWiring = () => {
    if (!toggleButton) return;
    if (fragmentMenu && !toggleButton.hasAttribute('aria-controls')) {
      toggleButton.setAttribute('aria-controls', 'fragmentMenuList-' + fragmentEntryLinkNamespace);
    }
    if (!toggleButton.hasAttribute('aria-expanded')) {
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  };

  const getFocusableMenuItems = () => {
    if (!fragmentMenu) return [];
    const candidates = fragmentMenu.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
    return Array.from(candidates).filter((el) => el.offsetParent !== null);
  };

  const isMenuOpen = () =>
    !!(
      hamburger?.classList.contains('open') ||
      zoneWrapper?.classList.contains('open') ||
      logoZone?.classList.contains('open')
    );

  const setOpen = (open) => {
    [hamburger, zoneWrapper, logoZone].forEach((el) => el && el.classList.toggle('open', open));
    if (toggleButton) toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('is-menu-view', open);
  };

  const openMenu = () => {
    setOpen(true);
    const items = getFocusableMenuItems();
    if (items.length) items[0].focus();
  };

  const closeMenu = () => setOpen(false);

  const markCurrentPageLink = () => {
    const here = window.location.href.replace(/#$/, '');
    qsa('.fragment-menu a[href]').forEach((a) => {
      const t = a.href && a.href.replace(/#$/, '');
      if (t === here) a.setAttribute('aria-current', 'page');
    });
  };

  const logoSetup = () => {
    if (!logoZone) return;
    const width = window.innerWidth;
    const afterLP = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');
    debug('logo', { afterLP, always, enlarged });
    if (enlarged) hamburger?.classList.add('increase');
    if (always) hamburger?.classList.add('logo-always');
  };

  const updateSizes = () => {
    root.style.height = '';
    root.style.width = '';
    root.style.minWidth = '';
    const h = `${root.clientHeight}px`;
    root.style.height = h;
    root.dataset.height = h;
    if (window.innerWidth >= landscapePhoneBreakpoint) {
      closeMenu();
    } else if (noMenuItemOverflow) {
      const innerMenu = zoneWrapper?.querySelector('.fragment-menu');
      if (innerMenu) {
        const mw = `${innerMenu.offsetWidth}px`;
        root.dataset.minWidth = mw;
      }
    }
  };

  const debounce = (fn, delay) => {
    if (!delay) return fn;
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), delay);
    };
  };

  if (layoutMode === 'view') {
    holder.classList.add('fragment-menu-holder');
    setAriaWiring();
    logoSetup();
    markCurrentPageLink();

    const onResize = debounce(updateSizes, debounceDelay);
    updateSizes();
    window.addEventListener('resize', onResize, { passive: true });

    const onToggle = () => (isMenuOpen() ? closeMenu() : openMenu());
    toggleButton?.addEventListener('click', onToggle);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!isMenuOpen()) return;
      e.preventDefault();
      closeMenu();
      toggleButton?.focus();
    });

    document.addEventListener('click', (e) => {
      if (root.contains(e.target)) return;
      if (!isMenuOpen()) return;
      closeMenu();
    });

    if (scrollBackToTop && !isSticky) {
      const btn = qs('.fragment-scroll-to-top');
      const onScroll = () => {
        const v = window.scrollY > 20;
        if (btn) btn.style.display = v ? 'block' : 'none';
      };
      btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else if (isSticky) {
      window.addEventListener(
        'scroll',
        () => {
          const scrolled = window.scrollY > 28;
          holder.classList.toggle('top', scrolled);
        },
        { passive: true }
      );
    }
  }
}, configuration.initializeDelay);