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

if (root) {
  if (layoutMode !== 'preview') {
    const isTop = configuration.menuStyle.indexOf('menu-top') > -1;
    const isInline = configuration.menuStyle.indexOf('menu-inline') > -1;
    const isSticky = configuration.menuStyle.indexOf('sticky') > -1;

    const updateSizes = () => {
      const rootHeight = `${root.clientHeight}px`;
      root.style.height = rootHeight;
      root.setAttribute('data-height', rootHeight);
    };

    if (layoutMode === "view") {
      updateSizes();

      const parentDiv = fragmentElement.parentElement;
      parentDiv.classList.add('fragment-menu-holder');

      const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(() => {
            callback(...args);
          }, wait);
        };
      }

      window.addEventListener('resize', debounce(updateSizes, configuration.debounceDelay));

      const hamburger = root.querySelector('.fragment-menu-icon');
      const menu = root.querySelector('.hamburger-zone-wrapper');
      hamburger.addEventListener('click', () => {
        hamburger.parentElement.classList.toggle('open');
        menu.classList.toggle('open');
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