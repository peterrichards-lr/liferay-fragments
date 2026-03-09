const initResponsiveMenu = () => {
  if (layoutMode === "view") {
    const defaultDebounceDelay = 0;

    const { debounceDelay: configDebounceDelay } = configuration;

    const debounceDelay =
      configDebounceDelay !== undefined
        ? configDebounceDelay
        : defaultDebounceDelay;

    const navItems = fragmentElement.querySelectorAll(".nav-item");

    if (navItems) {
      navItems.forEach((navItem) => {
        const navLink = navItem.querySelector(".nav-link");

        if (navLink) {
          const href = navLink.getAttribute("href");

          if (href === window.location.pathname) {
            navItem.classList.add("active");
          }
        }
      });
    }

    const onResize = Liferay.Fragment.Commons.debounce(() => {
      const navbarCollapse = fragmentElement.querySelector(".navbar-collapse");

      if (navbarCollapse) {
        navbarCollapse.classList.remove("show");
      }
    }, debounceDelay);

    window.addEventListener("resize", onResize);
  }
};

initResponsiveMenu();
