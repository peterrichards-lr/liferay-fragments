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
    enableScrollLock = false,
    enableCloseOnInternalNav = true,
  } = configuration;

  const isSticky = menuStyle.includes('sticky');
  const noMenuItemOverflow = menuItemOverflow === 'none';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const wireFocusTrap = ({ container, initialFocus, onDeactivate }) => {
    let active = false;
    const getFocusables = () => {
      if (!container) return [];
      const nodes = container.querySelectorAll(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),select,textarea,input'
      );
      return Array.from(nodes).filter((el) => el.offsetParent !== null);
    };
    const keydown = (e) => {
      if (!active) return;
      if (e.key !== 'Tab') return;
      const els = getFocusables();
      if (!els.length) {
        e.preventDefault();
        const t = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
        t?.focus?.();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    const activate = () => {
      if (active) return;
      active = true;
      document.addEventListener('keydown', keydown, true);
      const t = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
      t?.focus?.();
    };
    const deactivate = () => {
      if (!active) return;
      active = false;
      document.removeEventListener('keydown', keydown, true);
      onDeactivate?.();
    };
    return { activate, deactivate };
  };

  const focusTrap = wireFocusTrap({
    container: zoneWrapper,
    initialFocus: () => getFocusableMenuItems()[0] || toggleButton,
    onDeactivate: () => toggleButton?.focus()
  });

  const setOpen = (open) => {
    const isOverlay = window.innerWidth < landscapePhoneBreakpoint;
    [hamburger, zoneWrapper, logoZone].forEach(
      (el) => el && el.classList.toggle('open', open)
    );
    if (toggleButton)
      toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('is-menu-view', open);
    root.classList.toggle('is-open', open);
    if (isOverlay) {
      if (open) focusTrap.activate();
      else focusTrap.deactivate();
    } else {
      focusTrap.deactivate();
    }
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
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
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

    if (enableCloseOnInternalNav) {
      const wireCloseOnInternalNav = ({
        root,
        menuContainer,
        transitionTarget,
        isMenuOpen,
        closeMenu,
        enabled = true,
        transitionTimeout = 300
      }) => {
        if (!enabled || !menuContainer) return;

        const isModifier = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
        const isInternal = (a) => {
          try { const u = new URL(a.href, location.href); return u.origin === location.origin; }
          catch { return false; }
        };
        const getClosestLink = (el) => el.closest('a[href]');

        menuContainer.addEventListener('click', (e) => {
          const a = getClosestLink(e.target);
          if (!a) return;
          if (a.target === '_blank' || a.hasAttribute('download') || isModifier(e)) return;
          if (!isInternal(a)) return;
          if (!isMenuOpen()) return;

          e.preventDefault();
          const href = a.href;
          let navigated = false;
          const go = () => { if (!navigated) { navigated = true; window.location.assign(href); } };

          const onDone = () => {
            (transitionTarget || menuContainer).removeEventListener('transitionend', onDone, true);
            root.removeAttribute('data-closing');
            go();
          };

          root.setAttribute('data-closing', 'true');
          closeMenu();

          (transitionTarget || menuContainer).addEventListener('transitionend', onDone, true);
          setTimeout(onDone, transitionTimeout);
        });
      };

      wireCloseOnInternalNav({
        root,
        menuContainer: fragmentMenu,
        transitionTarget: zoneWrapper?.querySelector('.fragment-menu') || fragmentMenu,
        isMenuOpen: () => root.classList.contains('is-menu-view') || zoneWrapper?.classList.contains('open'),
        closeMenu: () => {
          zoneWrapper?.classList.remove('open');
          root.classList.remove('is-menu-view');
          focusTrap.deactivate();
        },
        enabled: configuration.enableCloseOnInternalNav === true,
        transitionTimeout: prefersReduced ? 0 : 300
      });
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