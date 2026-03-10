const initResponsiveMenu = () => {
  const {
    menuStyle,
    debounceDelay: configDebounceDelay = 0,
    scrollBackToTop = false,
    initializeDelay = 0,
  } = configuration;

  const isSticky = menuStyle.includes("sticky");
  const root = fragmentElement.querySelector(".fragment-root");

  if (!root || layoutMode === "preview") {
    return;
  }

  const hamburgerZoneWrapper = root.querySelector(".hamburger-zone-wrapper");
  const hamburger = root.querySelector(".hamburger");
  const toggleButton = root.querySelector(".fragment-menu-icon");
  const fragmentMenu = root.querySelector(
    "#fragmentMenuList-" + fragmentEntryLinkNamespace,
  );

  const setAriaWiring = () => {
    if (!toggleButton) return;
    if (fragmentMenu && !toggleButton.hasAttribute("aria-controls")) {
      toggleButton.setAttribute(
        "aria-controls",
        "fragmentMenuList-" + fragmentEntryLinkNamespace,
      );
    }
    if (!toggleButton.hasAttribute("aria-expanded")) {
      toggleButton.setAttribute("aria-expanded", "false");
    }
  };

  const getFocusableMenuItems = () => {
    if (!fragmentMenu) return [];
    const candidates = fragmentMenu.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(candidates).filter((el) => el.offsetParent !== null);
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
    if (toggleButton) toggleButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-menu-view", "menu-scroll-locked");
    const focusables = getFocusableMenuItems();
    if (focusables.length) focusables[0].focus();
  };

  const closeMenu = () => {
    // Add a closing state to trigger FTL/CSS transitions if defined
    root.setAttribute("data-closing", "true");

    setTimeout(() => {
      [hamburger, hamburgerZoneWrapper].forEach((el) =>
        el?.classList.remove("open"),
      );
      if (toggleButton) toggleButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-menu-view", "menu-scroll-locked");
      root.removeAttribute("data-closing");
    }, 250); // Matches --menu-fade-duration
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
    setAriaWiring();
    markCurrentPageLink();

    const onToggleClick = () => {
      if (isMenuOpen()) {
        closeMenu();
        toggleButton?.focus();
      } else {
        openMenu();
      }
    };

    toggleButton?.addEventListener("click", onToggleClick);

    // Keyboard Trap and Escape Handling
    document.addEventListener("keydown", (event) => {
      if (!isMenuOpen()) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        toggleButton?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusables = getFocusableMenuItems();
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // Close on outside click
    document.addEventListener("click", (event) => {
      if (root.contains(event.target)) return;
      if (!isMenuOpen()) return;
      closeMenu();
    });

    if (scrollBackToTop && !isSticky) {
      const scrollToTopBtn = root.querySelector(".fragment-scroll-to-top");
      scrollToTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      const onScroll = () => {
        const visible = window.scrollY > 100;
        if (scrollToTopBtn)
          scrollToTopBtn.style.display = visible ? "block" : "none";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    const onResize = Liferay.Fragment.Commons.debounce(() => {
      if (window.innerWidth >= 992 && isMenuOpen()) {
        closeMenu();
      }
    }, configDebounceDelay);

    window.addEventListener("resize", onResize);
  }
};

initResponsiveMenu();
