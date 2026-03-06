const initServiceCard = () => {
  if (layoutMode !== "preview") {
    const card = fragmentElement.querySelector(".card");
    if (card && configuration.linkUrl) {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        window.location.href = configuration.linkUrl;
      });
    }
  }
};

initServiceCard();
