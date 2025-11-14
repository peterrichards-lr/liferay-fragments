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
    floatingLogoVerticalAlignment = 'middle',
  } = configuration;

  const isSticky = menuStyle.includes('sticky');
  const noMenuItemOverflow = menuItemOverflow === 'none';
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

  const qs = (selector, scope = root) => scope.querySelector(selector);
  const qsa = (selector, scope = root) =>
    Array.from(scope.querySelectorAll(selector));

  const holder = fragmentElement.parentElement;
  const dropzoneWrapper = qs('.dropzone-wrapper');
  const zoneWrapper = qs('.hamburger-zone-wrapper');
  const hamburger = qs('.hamburger');
  const toggleButton = qs('.fragment-menu-icon');
  const fragmentMenu = qs('#fragmentMenuList-' + fragmentEntryLinkNamespace);
  const logoZone = zoneWrapper ? zoneWrapper.querySelector('.logo-zone') : null;
  const bodyEl = document.body;
  const mainContent =
    document.getElementById('main-content') ||
    document.querySelector('.main-content');
  const menuImageSelector = '.dropzone-menu.fragment-menu .text-truncate img';
  const isRtl = getComputedStyle(document.documentElement).direction === 'rtl';

  function setHasMenuImages() {
    const images = root.querySelectorAll(menuImageSelector);
    const has =
      images.length > 0 &&
      Array.from(images).some((image) =>
        image.complete ? image.naturalWidth > 0 : true
      );
    root.classList.toggle('has-menu-images', has);
  }

  function watchMenuImages() {
    const menu = root.querySelector('.dropzone-menu.fragment-menu') || root;

    const onLoadOnce = (image) => {
      image.addEventListener('load', setHasMenuImages, { once: true });
      image.addEventListener('error', setHasMenuImages, { once: true });
    };

    root.querySelectorAll(menuImageSelector).forEach(onLoadOnce);

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        let touched = false;
        for (const mutation of mutations) {
          if (
            mutation.type === 'childList' ||
            (mutation.type === 'attributes' && mutation.attributeName === 'src')
          ) {
            touched = true;
            if (mutation.addedNodes) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  node
                    .querySelectorAll?.(menuImageSelector)
                    .forEach(onLoadOnce);
                }
              });
            }
          }
        }
        if (touched) setHasMenuImages();
      });

      observer.observe(menu, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
      });
    } else {
      const intervalId = setInterval(setHasMenuImages, 1000);
      root.addEventListener('DOMNodeRemoved', () => clearInterval(intervalId), {
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
    return Array.from(candidates).filter(
      (element) => element.offsetParent !== null
    );
  };

  const isMenuOpen = () =>
    !!(
      hamburger?.classList.contains('open') ||
      zoneWrapper?.classList.contains('open') ||
      logoZone?.classList.contains('open')
    );

  const deriveSiteName = () => {
    const og = document
      .querySelector('meta[property="og:site_name"]')
      ?.content?.trim();
    if (og) return og;
    const app = document
      .querySelector('meta[name="application-name"]')
      ?.content?.trim();
    if (app) return app;
    const doc = (document.title || '').trim();
    if (doc) return doc;
    const host = (location.hostname || '').replace(/^www\./, '').trim();
    if (host) return host;
    return 'Home';
  };

  const getAccessibleName = (link) => {
    if (
      link.hasAttribute('aria-label') &&
      link.getAttribute('aria-label').trim()
    )
      return null;
    if (
      link.hasAttribute('aria-labelledby') &&
      link.getAttribute('aria-labelledby').trim()
    )
      return null;

    if (link.textContent && link.textContent.trim().length) return null;

    const imageAlt = link
      .querySelector('img[alt]')
      ?.getAttribute('alt')
      ?.trim();
    if (imageAlt) return imageAlt;

    return deriveSiteName();
  };

  const ensureLogoLinkA11y = (rootElement) => {
    const link =
      rootElement?.querySelector?.(
        'a.logo-link, .logo-zone a[href], .floating-logo a[href]'
      ) || null;
    if (!link) return;

    const name =
      getAccessibleName(link) ||
      link.getAttribute('aria-label') ||
      link.getAttribute('title') ||
      deriveSiteName();

    if (
      name &&
      !(
        link.hasAttribute('aria-label') &&
        link.getAttribute('aria-label').trim()
      )
    ) {
      link.setAttribute('aria-label', name);
    }

    if (!link.hasAttribute('title') || !link.getAttribute('title').trim()) {
      link.setAttribute('title', name);
    }
  };

  let floatingLogo = null;

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

  const stripIds = (element) => {
    if (!element) return;
    if (element.id) element.removeAttribute('id');
    element
      .querySelectorAll('[id]')
      .forEach((node) => node.removeAttribute('id'));
  };

  const getLogoAnchor = (element) => {
    if (!element) return null;
    return element.tagName === 'A'
      ? element
      : element.querySelector('a[href]') || null;
  };

  const ensureFloatingLogo = () => {
    if (floatingLogo || !logoZone) return;

    ensureStyleOnce();

    floatingLogo = logoZone.cloneNode(true);
    stripIds(floatingLogo);

    floatingLogo.classList.add('floating-logo');
    floatingLogo.classList.add('logo-proxy');
    floatingLogo.removeAttribute('aria-hidden');

    const originalAnchor = getLogoAnchor(logoZone);
    const cloneAnchor = getLogoAnchor(floatingLogo);

    if (originalAnchor) {
      const href = originalAnchor.getAttribute('href');
      const target = originalAnchor.getAttribute('target');

      if (cloneAnchor) {
        cloneAnchor.setAttribute('href', href || '#');
        if (target) cloneAnchor.setAttribute('target', target);
        cloneAnchor.setAttribute('tabindex', '0');

        cloneAnchor.addEventListener('click', (event) => {
          if (!href || href === '#') return;
          if (target === '_blank') return;
          event.preventDefault();
          window.location.assign(href);
        });

        cloneAnchor.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            cloneAnchor.click();
          }
        });
      } else {
        floatingLogo.setAttribute('tabindex', '0');
        floatingLogo.setAttribute('role', 'link');

        floatingLogo.addEventListener('click', () => {
          if (!href || href === '#') return;
          if (target === '_blank') {
            window.open(href, '_blank');
          } else {
            window.location.assign(href);
          }
        });

        floatingLogo.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            floatingLogo.click();
          }
        });
      }
    }

    floatingLogo.style.position = 'fixed';
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

    root.appendChild(floatingLogo);
  };

  const menuHasImages = () => !!fragmentMenu?.querySelector(menuImageSelector);

  const isOverlayMode = () => window.innerWidth <= landscapePhoneBreakpoint;

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
    if (!floatingLogo || !hamburger) return;

    const hamburgerRect = hamburger.getBoundingClientRect();
    const logoRect = floatingLogo.getBoundingClientRect();
    const logoHeight = logoRect.height || hamburgerRect.height;

    let top;

    switch (floatingLogoVerticalAlignment) {
      case 'top':
        top = hamburgerRect.top;
        break;

      case 'bottom':
        top = hamburgerRect.bottom - logoHeight;
        break;

      case 'middle':
      default:
        top = hamburgerRect.top + (hamburgerRect.height - logoHeight) / 2;
        break;
    }

    floatingLogo.style.top = `${Math.round(top)}px`;

    if (isRtl) {
      floatingLogo.style.left = '8px';
      floatingLogo.style.right = 'auto';
    } else {
      floatingLogo.style.left = 'auto';
      floatingLogo.style.right = '8px';
    }
  };

  const showFloating = (show) => {
    if (!floatingLogo) return;
    if (show) {
      floatingLogo.style.visibility = 'visible';
      floatingLogo.style.opacity = '1';
    } else {
      floatingLogo.style.opacity = '0';
      if (prefersReduced) {
        floatingLogo.style.visibility = 'hidden';
      } else {
        setTimeout(() => {
          floatingLogo.style.visibility = 'hidden';
        }, 200);
      }
    }
  };

  const syncLogoMode = (options = {}) => {
    const { immediate = false, forcedOpen = null } = options;

    if (!logoZone || !hamburger) return;

    ensureFloatingLogo();

    const overlay = isOverlayMode();
    const open = typeof forcedOpen === 'boolean' ? forcedOpen : isMenuOpen();
    const always = isLogoAlways();
    const hasImages = menuHasImages();

    const applyLogoState = () => {
      if (!overlay || hasImages) {
        collapseOriginal(false);
        showFloating(false);

        debug('logo sync', {
          width: window.innerWidth,
          overlay,
          open,
          always,
          hasImages,
        });

        return;
      }

      placeFloatingLogo();

      if (always) {
        collapseOriginal(true);
        showFloating(true);
      } else {
        collapseOriginal(open);
        showFloating(open);
      }

      debug('logo sync', {
        width: window.innerWidth,
        overlay,
        open,
        always,
        hasImages,
      });
    };

    if (immediate) {
      applyLogoState();
    } else {
      requestAnimationFrame(applyLogoState);
    }
  };

  let lockScrollPositionY = 0;

  const shouldScrollLock = () =>
    enableScrollLock &&
    !bodyEl.classList.contains('has-edit-mode-menu') &&
    window.innerWidth <= landscapePhoneBreakpoint;

  const lockScroll = () => {
    if (!shouldScrollLock()) return;
    lockScrollPositionY =
      window.scrollY || document.documentElement.scrollTop || 0;

    document.documentElement.classList.add('menu-scroll-locked');
    bodyEl.classList.add('menu-scroll-locked');

    bodyEl.style.position = 'fixed';
    bodyEl.style.top = `-${lockScrollPositionY}px`;
    bodyEl.style.left = '0';
    bodyEl.style.right = '0';
    bodyEl.style.width = '100%';
  };

  const unlockScroll = () => {
    document.documentElement.classList.remove('menu-scroll-locked');
    bodyEl.classList.remove('menu-scroll-locked');

    bodyEl.style.position = '';
    bodyEl.style.top = '';
    bodyEl.style.left = '';
    bodyEl.style.right = '';
    bodyEl.style.width = '';

    if (lockScrollPositionY) window.scrollTo(0, lockScrollPositionY);
  };

  const wireFocusTrap = ({ container, initialFocus, onDeactivate }) => {
    let active = false;
    const getFocusables = () => {
      if (!container) return [];
      const nodes = container.querySelectorAll(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),select,textarea,input'
      );
      return Array.from(nodes).filter(
        (element) => element.offsetParent !== null
      );
    };
    const keydown = (event) => {
      if (!active) return;
      if (event.key !== 'Tab') return;
      const elements = getFocusables();
      if (!elements.length) {
        event.preventDefault();
        const target =
          typeof initialFocus === 'function' ? initialFocus() : initialFocus;
        target?.focus?.();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };
    const activate = () => {
      if (active) return;
      active = true;
      document.addEventListener('keydown', keydown, true);
      const target =
        typeof initialFocus === 'function' ? initialFocus() : initialFocus;
      target?.focus?.();
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

  const setOpen = (open, options = {}) => {
    const { skipLogoSync = false, logoSyncImmediate = false } = options;

    debug('setOpen', {
      open,
      enableScrollLock,
      hasEditModeMenu: bodyEl.classList.contains('has-edit-mode-menu'),
      windowWidth: window.innerWidth,
      mobileBreakpoint: landscapePhoneBreakpoint,
    });

    const isOverlay = window.innerWidth <= landscapePhoneBreakpoint;

    [hamburger, zoneWrapper, logoZone].forEach(
      (element) => element && element.classList.toggle('open', open)
    );

    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    root.classList.toggle('is-menu-view', open && isOverlay);
    root.classList.toggle('is-open', open);

    if (isOverlay) {
      if (open) {
        focusTrap.activate();
        lockScroll();
      } else {
        if (root.hasAttribute('data-closing')) {
          focusTrap.deactivate();
        } else {
          focusTrap.deactivate();
          unlockScroll();
        }
      }
    } else {
      focusTrap.deactivate();
      unlockScroll();
    }

    if (!skipLogoSync) {
      syncLogoMode({ immediate: logoSyncImmediate });
    }
  };

  const openMenu = () => {
    if (isMenuOpen()) return;

    syncLogoMode({ immediate: true, forcedOpen: true });

    setOpen(true, { skipLogoSync: true });

    const items = getFocusableMenuItems();
    if (items.length) {
      requestAnimationFrame(() => items[0].focus());
    }
  };

  const closeMenu = (withTransition = true) => {
    if (!isMenuOpen()) return;

    const transitionTarget =
      zoneWrapper?.querySelector('.fragment-menu') || zoneWrapper || null;

    if (
      withTransition &&
      transitionTarget &&
      !root.hasAttribute('data-closing')
    ) {
      root.setAttribute('data-closing', 'true');

      // Close first (without logo sync), then sync after transition ends
      setOpen(false, { skipLogoSync: true });

      const onDone = () => {
        transitionTarget.removeEventListener('transitionend', onDone, true);
        unlockScroll();
        root.removeAttribute('data-closing');
        syncLogoMode();
      };

      transitionTarget.addEventListener('transitionend', onDone, true);
      setTimeout(onDone, prefersReduced ? 0 : 300);
    } else {
      setOpen(false);
    }

    setTimeout(() => toggleButton?.focus(), 150);
  };

  const markCurrentPageLink = () => {
    const here = window.location.href.replace(/#$/, '');
    qsa('.fragment-menu a[href]').forEach((anchor) => {
      const target = anchor.href && anchor.href.replace(/#$/, '');
      if (target === here) anchor.setAttribute('aria-current', 'page');
    });
  };

  const logoSetup = () => {
    if (!logoZone || !hamburger || !dropzoneWrapper) return;
    const width = window.innerWidth;
    const afterLandscapePhone = width >= landscapePhoneBreakpoint;
    const always = logoZone.classList.contains('logo-always');
    const enlarged = logoZone.classList.contains('increase-hamburger');

    debug('logoSetup', { afterLandscapePhone, always, enlarged });

    if (enlarged) {
      dropzoneWrapper.classList.add('increase');
      if (mainContent) mainContent.classList.add('increase-hamburger');
    }

    if (always) {
      hamburger.classList.add('logo-always');
    }
  };

  if (prefersReduced) {
    root.classList.add('reduce-motion');
  }

  if (layoutMode === 'view') {
    holder.classList.add('fragment-menu-holder');
    setAriaWiring();
    logoSetup();
    ensureLogoLinkA11y(logoZone || root);
    markCurrentPageLink();
    watchMenuImages();

    syncLogoMode();

    const debounce = (fn, delay) => {
      if (!delay) return fn;
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    const onResize = debounce(() => {
      syncLogoMode();
    }, debounceDelay);

    window.addEventListener('resize', onResize);

    window.addEventListener('scroll', () => {
      placeFloatingLogo();
    });

    const onToggle = () => (isMenuOpen() ? closeMenu(true) : openMenu());
    toggleButton?.addEventListener('click', onToggle);

    if (toggleButton && toggleButton.tagName !== 'BUTTON') {
      toggleButton.setAttribute('role', 'button');
      toggleButton.setAttribute('tabindex', '0');
    }

    toggleButton?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!isMenuOpen()) return;
      event.preventDefault();
      closeMenu(true);
      toggleButton?.focus();
    });

    document.addEventListener('click', (event) => {
      if (root.contains(event.target)) return;
      if (!isMenuOpen()) return;
      closeMenu(true);
    });

    if (scrollBackToTop && !isSticky) {
      const scrollButton = qs('.fragment-scroll-to-top');
      const onScroll = () => {
        const visible = window.scrollY > 20;
        if (scrollButton)
          scrollButton.style.display = visible ? 'block' : 'none';
      };
      scrollButton?.addEventListener('click', () =>
        window.scrollTo({
          top: 0,
          behavior: prefersReduced ? 'auto' : 'smooth',
        })
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
        transitionTimeout = 300,
      }) => {
        if (!enabled || !menuContainer) return;

        const isModifier = (event) =>
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button === 1;

        const isInternal = (anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return url.origin === location.origin;
          } catch {
            return false;
          }
        };

        const getClosestLink = (element) => element.closest('a[href]');

        menuContainer.addEventListener('click', (event) => {
          const anchor = getClosestLink(event.target);
          if (!anchor) return;
          if (
            anchor.target === '_blank' ||
            anchor.hasAttribute('download') ||
            isModifier(event)
          )
            return;
          if (!isInternal(anchor)) return;
          if (!isMenuOpen()) return;

          event.preventDefault();
          const href = anchor.href;
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
        isMenuOpen,
        closeMenu: () => closeMenu(false),
        enabled: configuration.enableCloseOnInternalNav === true,
        transitionTimeout: prefersReduced ? 0 : 300,
      });
    }
  }

  const closeIfWiderThanPhones = () => {
    if (window.innerWidth > landscapePhoneBreakpoint) {
      setOpen(false);
    }
  };

  window
    .matchMedia(`(min-width:${landscapePhoneBreakpoint}px)`)
    .addEventListener('change', closeIfWiderThanPhones);
}, configuration.initializeDelay);