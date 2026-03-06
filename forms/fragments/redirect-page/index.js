const initRedirectPage = () => {
  if (layoutMode === "view") {
    const url = configuration.redirectUrl;
    if (url) {
      window.location.href = url;
    }
  }
};

initRedirectPage();
