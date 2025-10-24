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
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const root = fragmentElement.querySelector('.fragment-root');
  if (!root || layoutMode === 'preview') return;

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

  const qs = (sel, scope = root) => scope.querySelector(sel);
  const holder = fragmentElement.parentElement;
  const zoneWrapper = qs('.hamburger-zone-wrapper');
  const hamburger = qs('.hamburger');
  const toggleButton = qs('.fragment-menu-icon');
  const fragmentMenu = qs(
    '#fragmentSideMenuList-' + fragmentEntryLinkNamespace
  );
  const mainContent =
    document.getElementById('main-content') ||
    document.querySelector('.main-content');
  const logoZone = zoneWrapper ? zoneWrapper.querySelector('.logo-zone') : null;
  const isLeft = menuStyle.includes('menu-left');
  const bodyEl = document.body;

  let __lockY = 0;

  const applyScrollLock = (on) => {
    if (!enableScrollLock) return;
    if (document.body.classList.contains('has-edit-mode-menu')) return;
    if (window.innerWidth >= landscapePhoneBreakpoint) on = false;

    if (on) {
      __lockY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add('menu-scroll-locked');
      document.body.classList.add('menu-scroll-locked');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${__lockY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      document.documentElement.classList.remove('menu-scroll-locked');
      document.body.classList.remove('menu-scroll-locked');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      if (__lockY) window.scrollTo(0, __lockY);
    }
  };

  const ensureStyleOnce = (() => {
    let done = false;
    return () => {
      if (done) return;
      const style = document.createElement('style');
      style.textContent =
        '.logo-zone-collapse > *{display:none !important} .floating-logo{will-change:opacity}';
      document.head.appendChild(style);
      done = true;
    };
  })();

  const stripIds = (el) => {
    if (!el) return;
    if (el.id) el.removeAttribute('id');
    el.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  };

  const getLogoAnchor = (el) => {
    if (!el) return null;
    return el.tagName === 'A' ? el : el.querySelector('a[href]') || null;
  };

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

  const getFocusableMenuItems = () => {
    if (!fragmentMenu) return [];
    const nodes = fragmentMenu.querySelectorAll(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),select,textarea,input'
    );
    return Array.from(nodes).filter((el) => el.offsetParent !== null);
  };

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
      if (!active || e.key !== 'Tab') return;
      const els = getFocusables();
      if (!els.length) {
        e.preventDefault();
        const t =
          typeof initialFocus === 'function' ? initialFocus() : initialFocus;
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
      const t =
        typeof initialFocus === 'function' ? initialFocus() : initialFocus;
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
    onDeactivate: () => toggleButton?.focus(),
  });

  let floatingLogo = null;

  const ensureFloatingLogo = () => {
    if (floatingLogo || !logoZone) return;
    ensureStyleOnce();
    floatingLogo = logoZone.cloneNode(true);
    stripIds(floatingLogo);
    floatingLogo.classList.add('floating-logo');
    floatingLogo.removeAttribute('aria-hidden');

    const origA = getLogoAnchor(logoZone);
    const cloneA = getLogoAnchor(floatingLogo);

    if (origA) {
      const href = origA.getAttribute('href');
      const target = origA.getAttribute('target');
      if (cloneA) {
        cloneA.setAttribute('href', href || '#');
        if (target) cloneA.setAttribute('target', target);
        cloneA.setAttribute('tabindex', '0');
        cloneA.addEventListener('click', (e) => {
          if (!href || href === '#') return;
          if (target === '_blank') return;
          e.preventDefault();
          window.location.assign(href);
        });
        cloneA.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cloneA.click();
          }
        });
      } else {
        floatingLogo.setAttribute('tabindex', '0');
        floatingLogo.setAttribute('role', 'link');
        floatingLogo.addEventListener('click', () => {
          if (!href || href === '#') return;
          if (target === '_blank') window.open(href, '_blank');
          else window.location.assign(href);
        });
        floatingLogo.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            floatingLogo.click();
          }
        });
      }
    }

    floatingLogo.style.position = 'fixed';
    floatingLogo.style.top = 'var(--control-menu-container-height, 0)';
    if (isLeft) {
      floatingLogo.style.right = '8px';
      floatingLogo.style.left = 'auto';
    } else {
      floatingLogo.style.left = '8px';
      floatingLogo.style.right = 'auto';
    }
    floatingLogo.style.zIndex = '1004';
    floatingLogo.style.pointerEvents = 'auto';
    floatingLogo.style.userSelect = 'none';
    floatingLogo.style.webkitUserDrag = 'none';
    floatingLogo.style.opacity = '0';
    floatingLogo.style.visibility = 'hidden';
    floatingLogo.style.display = 'block';
    floatingLogo.style.transition = prefersReduced
      ? 'none'
      : 'opacity .2s ease';

    document.body.appendChild(floatingLogo);
  };

  const menuHasImages = () =>
    !!fragmentMenu?.querySelector('.text-truncate img');
  const isMobileLike = () => window.innerWidth < landscapePhoneBreakpoint;
  const isLogoAlways = () => !!logoZone?.classList.contains('logo-always');

  const collapseOriginal = (on) => {
    if (!logoZone) return;
    if (on) {
      logoZone.classList.add('logo-zone-collapse');
      logoZone.setAttribute('aria-hidden', 'true');
    } else {
      logoZone.classList.remove('logo-zone-collapse');
      logoZone.removeAttribute('aria-hidden');
    }
  };

  const placeFloatingLogo = () => {
    if (!floatingLogo) return;
    floatingLogo.style.top = 'var(--control-menu-container-height, 0)';
    if (isLeft) {
      floatingLogo.style.right = '8px';
      floatingLogo.style.left = 'auto';
    } else {
      floatingLogo.style.left = '8px';
      floatingLogo.style.right = 'auto';
    }
  };

  const showFloating = (show) => {
    if (!floatingLogo) return;
    if (show) {
      floatingLogo.style.visibility = 'visible';
      floatingLogo.style.opacity = '1';
    } else {
      floatingLogo.style.opacity = '0';
      if (prefersReduced) floatingLogo.style.visibility = 'hidden';
      else
        setTimeout(() => {
          floatingLogo.style.visibility = 'hidden';
        }, 200);
    }
  };

  const isMenuOpen = () =>
    !!(
      zoneWrapper?.classList.contains('open') ||
      hamburger?.parentElement?.classList.contains('open')
    );

  const syncLogoMode = () => {
    if (!logoZone) return;
    ensureFloatingLogo();

    const desktopOrWider = !isMobileLike();
    const mobileWithImages = isMobileLike() && menuHasImages();
    const mobileAlways = isMobileLike() && isLogoAlways() && !menuHasImages();
    const mobileToggle = isMobileLike() && !isLogoAlways() && !menuHasImages();

    if (desktopOrWider || mobileWithImages) {
      collapseOriginal(false);
      showFloating(false);
    } else if (mobileAlways) {
      placeFloatingLogo();
      collapseOriginal(true);
      showFloating(true);
    } else if (mobileToggle) {
      placeFloatingLogo();
      const open = isMenuOpen();
      collapseOriginal(open);
      showFloating(open);
    }

    debug('logo sync', {
      width: window.innerWidth,
      mobile: isMobileLike(),
      hasImages: menuHasImages(),
      logoAlways: isLogoAlways(),
      open: isMenuOpen(),
    });
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

  const setOpen = (open) => {
    debug({
      enableScrollLock: configuration.enableScrollLock,
      bodyHasEditModeMenu:
        document.body.classList.contains('has-edit-mode-menu'),
      windowUnnerWidth: window.innerWidth,
      mobileBreakpoint:
        window.innerWidth <
        (typeof landscapePhoneBreakpoint !== 'undefined'
          ? landscapePhoneBreakpoint
          : 999999),
    });

    const isOverlay = window.innerWidth < landscapePhoneBreakpoint;
    const parent = hamburger?.parentElement || null;
    if (parent) parent.classList.toggle('open', open);
    zoneWrapper?.classList.toggle('open', open);
    logoZone?.classList.toggle('open', open);
    if (toggleButton)
      toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('is-menu-view', open && isOverlay);

    if (isOverlay) {
      if (open) {
        applyScrollLock(true);
        focusTrap.activate();
      } else {
        applyScrollLock(false);
        focusTrap.deactivate();
      }
    } else {
      applyScrollLock(false);
      focusTrap.deactivate();
    }

    syncLogoMode();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reduce-motion');
  }

  if (layoutMode === 'view') {
    holder?.classList.add('fragment-menu-holder');
    setAriaWiring();

    const debounce = (fn, delay) => {
      let id;
      return (...a) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...a), delay);
      };
    };

    const setFixedWidthForDesktopLike = () => {
      if (!zoneWrapper || !mainContent) return;

      const w = window.innerWidth;

      if (w < tabletBreakpoint) {
        zoneWrapper.style.removeProperty('width');
        mainContent.style.removeProperty('margin-left');
        mainContent.style.removeProperty('margin-right');
        return;
      }

      const targetWidth = limitMenuWidth ? menuWidth : zoneWrapper.offsetWidth + 'px';
      zoneWrapper.style.width = targetWidth;

      if (layoutMode !== 'edit') {
        if (isLeft) {
          mainContent.style.removeProperty('margin-left');
          mainContent.style.removeProperty('margin-right');
        } else {
          mainContent.style.marginRight = targetWidth;
          mainContent.style.removeProperty('margin-left');
        }
      }
    };

    const updateSizes = () => {
      setFixedWidthForDesktopLike();
      placeFloatingLogo();
      syncLogoMode();
    };

    updateSizes();
    window.addEventListener('resize', debounce(updateSizes, debounceDelay));
    window.addEventListener('scroll', debounce(placeFloatingLogo, 50));

    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        setOpen(!isMenuOpen());
        if (root.hasAttribute('data-closing'))
          root.removeAttribute('data-closing');
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
      if (window.innerWidth >= landscapePhoneBreakpoint) setOpen(false);
      syncLogoMode();
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
        closeMenu: () => setOpen(false),
        enabled: configuration.enableCloseOnInternalNav === true,
        transitionTimeout: prefersReduced ? 0 : 300,
      });
    }
  }
}, configuration.initializeDelay);
