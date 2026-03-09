const initResponsiveSideMenu = () => {
  if (layoutMode === "view") {
    const mainContainer = fragmentElement.querySelector(
      ".responsive-side-menu",
    );
    const logoContainer = fragmentElement.querySelector(".logo-container");
    const sidebar = fragmentElement.querySelector(".sidebar");
    const topBar = fragmentElement.querySelector(".top-bar");

    const defaultDebounceDelay = 0;
    const { debounceDelay: configDebounceDelay } = configuration;
    const debounceDelay =
      configDebounceDelay !== undefined
        ? configDebounceDelay
        : defaultDebounceDelay;

    const updateSizes = () => {
      const topBarHeight = topBar ? topBar.offsetHeight : 0;
      if (sidebar) {
        sidebar.style.top = `${topBarHeight}px`;
        sidebar.style.height = `calc(100vh - ${topBarHeight}px)`;
      }
      if (mainContainer) {
        mainContainer.style.marginTop = `${topBarHeight}px`;
      }
    };

    const placeFloatingLogo = () => {
      if (logoContainer) {
        const topBarHeight = topBar ? topBar.offsetHeight : 0;
        if (window.scrollY > topBarHeight) {
          logoContainer.classList.add("floating");
        } else {
          logoContainer.classList.remove("floating");
        }
      }
    };

    updateSizes();
    placeFloatingLogo();

    window.addEventListener(
      "resize",
      Liferay.Fragment.Commons.debounce(updateSizes, debounceDelay),
    );
    window.addEventListener(
      "scroll",
      Liferay.Fragment.Commons.debounce(placeFloatingLogo, 50),
    );
  }
};

initResponsiveSideMenu();
