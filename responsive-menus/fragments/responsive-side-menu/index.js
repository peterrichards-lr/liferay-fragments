// noinspection JSUnresolvedReference

const debug = configuration.enableDebug;
const productMenuWidth = 320;
const root = fragmentElement.querySelector(`div.fragment-root`);

const fontSizePixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
const convertRemToPixels = (rem) => rem * fontSizePixels;
const desktopBreakpoint = (() => {
  if (configuration.desktopBreakpoint.indexOf('rem') > -1) {
    const rem = parseFloat(configuration.desktopBreakpoint.replace('rem', ''));
    return convertRemToPixels(rem);
  } else if (configuration.desktopBreakpoint.indexOf('px') > -1) {
    return parseFloat(configuration.desktopBreakpoint.replace('px', ''));
  }
})();
const tabletBreakpoint = (() => {
  if (configuration.enableTabletBreakpoint) {
    if (configuration.tabletBreakpoint.indexOf('rem') > -1) {
      const rem = parseFloat(configuration.tabletBreakpoint.replace('rem', ''));
      return convertRemToPixels(rem);
    } else if (configuration.tabletBreakpoint.indexOf('px') > -1) {
      return parseFloat(configuration.tabletBreakpoint.replace('px', ''));
    }
  }
  return desktopBreakpoint;
})();
const landscapePhoneBreakpoint = (() => {
  if (configuration.enableLandscapePhoneBreakpoint) {
    if (configuration.landscapePhoneBreakpoint.indexOf('rem') > -1) {
      const rem = parseFloat(configuration.landscapePhoneBreakpoint.replace('rem', ''));
      return convertRemToPixels(rem);
    } else if (configuration.landscapePhoneBreakpoint.indexOf('px') > -1) {
      return parseFloat(configuration.landscapePhoneBreakpoint.replace('px', ''));
    }
  }
  return tabletBreakpoint;
})();
const portraitPhoneBreakpoint = (() => {
  if (configuration.enablePortraitPhoneBreakpoint) {
    if (configuration.portraitPhoneBreakpoint.indexOf('rem') > -1) {
      const rem = parseFloat(configuration.portraitPhoneBreakpoint.replace('rem', ''));
      return convertRemToPixels(rem);
    } else if (configuration.portraitPhoneBreakpoint.indexOf('px') > -1) {
      return parseFloat(configuration.portraitPhoneBreakpoint.replace('px', ''));
    }
  }
  return landscapePhoneBreakpoint;
})();

if (debug) {
  console.debug('fontSizePixels', fontSizePixels);
  console.debug('desktopBreakpoint', desktopBreakpoint);
  console.debug('tabletBreakpoint', tabletBreakpoint);
  console.debug('landscapePhoneBreakpoint', landscapePhoneBreakpoint);
  console.debug('portraitPhoneBreakpoint', portraitPhoneBreakpoint);
}

if (root) {
  if (layoutMode !== 'preview') {
    const isLeft = configuration.menuStyle.indexOf('menu-left') > -1;
    const hamburgerZoneWrapper = fragmentElement.querySelector(`div.hamburger-zone-wrapper`);
    const mainContent = document.getElementById('main-content');
    const logoZone = hamburgerZoneWrapper.querySelector('.logo-zone');

    if (logoZone) {
      const hamburger = fragmentElement.querySelector('.hamburger');
      if (logoZone.classList.contains('increase-hamburger')) {
        hamburger.style.height = "var(--responsive-menu-logo-max-height, 35px)";
      }
      if (logoZone.classList.contains('logo-always')) {
        hamburger.classList.add('logo-always');
      }
    }

    if (layoutMode === "view") {
      const updateSizes = () => {
        const isAfterTabletBreakpoint = window.innerWidth >= tabletBreakpoint;

        if (isAfterTabletBreakpoint) {
          const hzwWidth = `${hamburgerZoneWrapper.offsetWidth}px`;
          hamburgerZoneWrapper.setAttribute('data-width', hzwWidth);
          hamburgerZoneWrapper.style.width = hzwWidth;
          if (layoutMode !== 'edit') {
            mainContent.style.marginRight = hzwWidth;
          }
        } else {
          hamburgerZoneWrapper.style.width = '';
          mainContent.style.marginRight = '';
        }
      };

      const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(() => {
            callback(...args);
          }, wait);
        };
      };

      updateSizes();

      window.addEventListener('resize', debounce(updateSizes, configuration.debounceDelay));

      const parentDiv = fragmentElement.parentElement;
      parentDiv.classList.add('fragment-menu-holder');

      const hamburger = root.querySelector('.fragment-menu-icon');
      const menu = root.querySelector('.hamburger-zone-wrapper');
      const logoZone = root.querySelector('.logo-zone');
      hamburger.addEventListener('click', () => {
        hamburger.parentElement.classList.toggle('open');
        menu.classList.toggle('open');
        if (logoZone) {
          logoZone.classList.toggle('open');
        }
      });

      if (isLeft) {
        const sideMenu = document.body.querySelector('nav.lfr-product-menu-panel');

        if (sideMenu) {
          const productMenuVisibilityHandler = () => {
            const sideMenuWidth = sideMenu.clientWidth;
            const isProductMenuOpen = sideMenu.classList.contains('open');
            const left = window.innerWidth <= productMenuWidth ? 0 : sideMenuWidth;
            parentDiv.style.left = isProductMenuOpen ? `${left}px` : '0';
          };
          productMenuVisibilityHandler();
          const observer = new MutationObserver(productMenuVisibilityHandler);
          observer.observe(sideMenu, {attributes: true});
        }
      }

      window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 28 || document.documentElement.scrollTop > 28) {
          if (!parentDiv.classList.contains('top'))
            parentDiv.classList.add('top');
        } else {
          parentDiv.classList.remove('top');
        }
      });
    }
  }
}