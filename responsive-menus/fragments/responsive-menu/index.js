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

  const debug = (...a) => {
    if (debugEnabled) console.debug('[Menu]', ...a);
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

  const qs = (sel, scope = root) => scope.querySelector(sel);
  const qsa = (sel, scope = root) => Array.from(scope.querySelectorAll(sel));

  const holder = fragmentElement.parentElement;
  const zoneWrapper = qs('.hamburger-zone-wrapper');
  const hamburger = qs('.hamburger');
  const toggleButton = qs('.fragment-menu-icon');
  const fragmentMenu = qs('#fragmentMenuList-' + fragmentEntryLinkNamespace);
  const logoZone = zoneWrapper ? zoneWrapper.querySelector('.logo-zone') : null;

  const menuImageSelector = '.dropzone-menu.fragment-menu .text-truncate img';

  function setHasMenuImages() {
    const imgs = root.querySelectorAll(menuImageSelector);
    const has =
      imgs.length > 0 &&
      Array.from(imgs).some((img) =>
        img.complete ? img.naturalWidth > 0 : true
      );
    root.classList.toggle('has-menu-images', has);
  }

  function watchMenuImages() {
    const menu = root.querySelector('.dropzone-menu.fragment-menu') || root;

    const onLoadOnce = (img) => {
      img.addEventListener('load', setHasMenuImages, { once: true });
      img.addEventListener('error', setHasMenuImages, { once: true });
    };

    root.querySelectorAll(menuImageSelector).forEach(onLoadOnce);

    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver((muts) => {
        let touched = false;
        for (const m of muts) {
          if (
            m.type === 'childList' ||
            (m.type === 'attributes' && m.attributeName === 'src')
          ) {
            touched = true;
            if (m.addedNodes) {
              m.addedNodes.forEach((n) => {
                if (n.nodeType === 1) {
                  n.querySelectorAll?.(menuImageSelector).forEach(onLoadOnce);
                }
              });
            }
          }
        }
        if (touched) setHasMenuImages();
      });

      mo.observe(menu, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
      });
    } else {
      const id = setInterval(setHasMenuImages, 1000);
      root.addEventListener('DOMNodeRemoved', () => clearInterval(id), {
        once: true,
      });
    }

    setHasMenuImages();
  }

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
      zoneWrapper?.classList.contains('open') ||
      logoZone?.classList.contains('open')
    );

  const setOpen = (open) => {
    [hamburger, zoneWrapper, logoZone].forEach(
      (el) => el && el.classList.toggle('open', open)
    );
    if (toggleButton)
      toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('is-menu-view', open);
    root.classList.toggle('is-open', open);
  };

  const openMenu = () => {
    setOpen(true);
    const items = getFocusableMenuItems();
    if (items.length) {
      requestAnimationFrame(() => items[0].focus());
    }
  };

  const closeMenu = () => {
    setOpen(false);
    setTimeout(() => toggleButton?.focus(), 150);
  };

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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reduce-motion');
  }

  if (layoutMode === 'view') {
    holder.classList.add('fragment-menu-holder');
    setAriaWiring();
    logoSetup();
    markCurrentPageLink();
    watchMenuImages();

    const onToggle = () => (isMenuOpen() ? closeMenu() : openMenu());
    toggleButton?.addEventListener('click', onToggle);

    if (toggleButton && toggleButton.tagName !== 'BUTTON') {
      toggleButton.setAttribute('role', 'button');
      toggleButton.setAttribute('tabindex', '0');
    }

    toggleButton?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    });

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
      btn?.addEventListener('click', () =>
        window.scrollTo({ top: 0, behavior: 'smooth' })
      );
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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reduce-motion');
  }

  const closeIfWiderThanPhones = () => {
    if (window.innerWidth >= landscapePhoneBreakpoint) {
      setOpen(false);
    }
  };
  window
    .matchMedia(`(min-width:${landscapePhoneBreakpoint}px)`)
    .addEventListener('change', closeIfWiderThanPhones);
}, configuration.initializeDelay);