const initServiceLinkButton = () => {
  if (layoutMode !== "preview") {
    const btn = fragmentElement.querySelector(".btn");
    if (btn && configuration.linkUrl) {
      btn.addEventListener("click", (e) => {
        if (configuration.openInNewTab) {
          e.preventDefault();
          window.open(configuration.linkUrl, "_blank");
        }
      });
    }
  }
};

initServiceLinkButton();
