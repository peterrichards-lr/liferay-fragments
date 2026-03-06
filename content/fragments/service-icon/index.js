const initServiceIcon = () => {
  if (layoutMode !== "preview") {
    const iconWrap = fragmentElement.querySelector(".service-icon-wrap");
    if (iconWrap && configuration.linkUrl) {
      iconWrap.style.cursor = "pointer";
      iconWrap.addEventListener("click", () => {
        window.location.href = configuration.linkUrl;
      });
    }
  }
};

initServiceIcon();
