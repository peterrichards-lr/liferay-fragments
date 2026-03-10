const initResponsiveSideMenu = () => {
  const {
    menuStyle,
    debounceDelay: configDebounceDelay = 0,
    menuWidth = "300px",
    limitMenuWidth = false,
  } = configuration;

  const isLeft = menuStyle.includes("menu-left");
  const root = fragmentElement.querySelector(".fragment-root");

  if (!root || layoutMode === "preview") {
    return;
  }

  const hamburgerZoneWrapper = root.querySelector(".hamburger-zone-wrapper");
  const hamburger = root.querySelector(".hamburger");
  const toggleButton = root.querySelector(".fragment-menu-icon");
  const menuList = root.querySelector(
    "#fragmentMenuList-" + fragmentEntryLinkNamespace,
  );
  const mainContent = document.getElementById("main-content");
  const holder = fragmentElement.parentElement;

  const setAria = () => {
    if (!toggleButton) return;
    if (menuList && !toggleButton.hasAttribute("aria-controls")) {
      toggleButton.setAttribute(
        "aria-controls",
        "fragmentMenuList-" + fragmentEntryLinkNamespace,
      );
    }
    if (!toggleButton.hasAttribute("aria-expanded")) {
      toggleButton.setAttribute("aria-expanded", "false");
    }
  };

  const getFocusableInMenu = () => {
    if (!menuList) return [];
    const nodes = menuList.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(nodes).filter((el) => el.offsetParent !== null);
  };

  const isMenuOpen = () =>
    !!(
      hamburger?.classList.contains("open") ||
      hamburgerZoneWrapper?.classList.contains("open")
    );

  const openMenu = () => {
    [hamburger, hamburgerZoneWrapper].forEach((el) =>
      el?.classList.add("open"),
    );
    toggleButton?.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-menu-view", "menu-scroll-locked");
    if (menuList) {
      const focusables = getFocusableInMenu();
      if (focusables.length) focusables[0].focus();
    }
  };

  const closeMenu = () => {
    root.setAttribute("data-closing", "true");

    setTimeout(() => {
      [hamburger, hamburgerZoneWrapper].forEach((el) =>
        el?.classList.remove("open"),
      );
      toggleButton?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-menu-view", "menu-scroll-locked");
      root.removeAttribute("data-closing");
    }, 250);
  };

  const markCurrentPageLink = () => {
    const here = window.location.pathname;
    root.querySelectorAll(".fragment-menu a[href]").forEach((a) => {
      const target = a.getAttribute("href");
      if (target === here) {
        a.setAttribute("aria-current", "page");
        a.closest(".nav-item")?.classList.add("active");
      }
    });
  };

  if (layoutMode === "view") {
    holder.classList.add("fragment-menu-holder");
    setAria();
    markCurrentPageLink();

    const updateSizes = () => {
      if (limitMenuWidth && window.innerWidth >= 992) {
        if (hamburgerZoneWrapper) hamburgerZoneWrapper.style.width = menuWidth;
        if (mainContent) {
          if (isLeft) mainContent.style.marginLeft = menuWidth;
          else mainContent.style.marginRight = menuWidth;
        }
      } else {
        if (hamburgerZoneWrapper) hamburgerZoneWrapper.style.width = "";
        if (mainContent) {
          mainContent.style.marginLeft = "";
          mainContent.style.marginRight = "";
        }
      }
      if (window.innerWidth >= 992 && isMenuOpen()) closeMenu();
    };

    updateSizes();
    window.addEventListener(
      "resize",
      Liferay.Fragment.Commons.debounce(updateSizes, configDebounceDelay),
    );

    toggleButton?.addEventListener("click", () => {
      if (isMenuOpen()) {
        closeMenu();
        toggleButton.focus();
      } else {
        openMenu();
      }
    });

    // Keyboard Trap and Escape Handling
    document.addEventListener("keydown", (e) => {
      if (!isMenuOpen()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        toggleButton?.focus();
        return;
      }

      if (e.key === "Tab") {
        const focusables = getFocusableInMenu();
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target) && isMenuOpen()) closeMenu();
    });

    // Scroll listener for sticky behaviors
    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      holder.classList.toggle("top", scrollY > 28);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }
};

initResponsiveSideMenu();
