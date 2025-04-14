const debugEnabled = configuration.enableDebug;
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

const debug = (...params) => {
  if (debugEnabled) {
    console.debug(params);
  }
}

if (debugEnabled) {
  debug('fontSizePixels', fontSizePixels);
  debug('desktopBreakpoint', desktopBreakpoint);
  debug('tabletBreakpoint', tabletBreakpoint);
  debug('landscapePhoneBreakpoint', landscapePhoneBreakpoint);
  debug('portraitPhoneBreakpoint', portraitPhoneBreakpoint);
}

if (root) {
  if (layoutMode !== 'preview') {
    const isSticky = configuration.menuStyle.indexOf('sticky') > -1;
    const hamburgerZoneWrapper = fragmentElement.querySelector(`div.hamburger-zone-wrapper`);
    const logoZone = hamburgerZoneWrapper.querySelector('.logo-zone');

    if (layoutMode === "view") {
      const parentDiv = fragmentElement.parentElement;
      parentDiv.classList.add('fragment-menu-holder');

      const updateSizes = () => {
        root.style.height = '';
        const rootHeight = `${root.clientHeight}px`;
        debug('rootHeight', rootHeight);
        root.style.height = rootHeight;
        root.setAttribute('data-height', rootHeight);
      };

      const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(() => {
            callback(...args);
          }, wait);
        };
      }

      updateSizes();
      window.addEventListener('resize', debounce(updateSizes, configuration.debounceDelay));

      debug('logoZone', logoZone);

      if (logoZone) {
        const hamburger = fragmentElement.querySelector('.hamburger');
        const isAfterLandscapePhoneBreakpoint = window.innerWidth >= landscapePhoneBreakpoint;
        const isLogoAlwaysDisplayed = logoZone.classList.contains('logo-always');
        const isIncreaseHamburger = logoZone.classList.contains('increase-hamburger');

        debug('isAfterLandscapePhoneBreakpoint', isAfterLandscapePhoneBreakpoint);
        debug('isLogoAlwaysDisplayed', isLogoAlwaysDisplayed);
        debug('isIncreaseHamburger', isIncreaseHamburger);

        if (isIncreaseHamburger) {
          if (isAfterLandscapePhoneBreakpoint) {
            hamburger.style.height = '';
          } else {
            hamburger.style.height = "var(--responsive-menu-logo-max-height, 35px)";
          }
        }
        if (isLogoAlwaysDisplayed) {
          if (isAfterLandscapePhoneBreakpoint) {
            hamburger.classList.remove('logo-always');
          } else {
            hamburger.classList.add('logo-always');
          }
        }
        updateSizes();
      }

      const hamburgerIcon = root.querySelector('.fragment-menu-icon');
      const menu = root.querySelector('.hamburger-zone-wrapper');
      hamburgerIcon.addEventListener('click', () => {
        hamburgerIcon.parentElement.classList.toggle('open');
        menu.classList.toggle('open');
        if (logoZone) {
          logoZone.classList.toggle('open');
        }
      });

      if (configuration.scrollBackToTop && !isSticky) {
        const scrollToTop = root.querySelector('.fragment-scroll-to-top');
        scrollToTop.addEventListener('click', () => {
          document.body.scrollTop = 0; // For Safari
          document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        });

        window.addEventListener('scroll', () => {
          if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTop.style.display = "block";
          } else {
            scrollToTop.style.display = "none";
          }
        });
      } else if (isSticky) {
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
}