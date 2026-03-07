const initServiceCard = () => {
  const iconWrap = fragmentElement.querySelector(".circle");
  const iconSpan = fragmentElement.querySelector(".svg-icon");
  const titleEl = fragmentElement.querySelector(
    "[data-lfr-editable-id='service-title']",
  );
  const contentWrap = fragmentElement.querySelector(".service-card___content");
  const loadingEl = fragmentElement.querySelector(".loading-animation-squares");

  const SPRITEMAP = "/o/dialect-theme/images/clay/icons.svg";

  const updateIcon = (symbol) => {
    if (iconSpan && symbol) {
      iconSpan.innerHTML = `
        <svg class="lexicon-icon lexicon-icon-sites" role="presentation" viewBox="0 0 512 512">
          <use xlink:href="${SPRITEMAP}#${symbol}"></use>
        </svg>
      `;
    }
  };

  const updateTitle = (newTitle) => {
    if (titleEl && newTitle && newTitle !== "Title") {
      titleEl.innerText = newTitle;
    }
  };

  // 1. Resolve effective values
  // Mappable fields are prioritized if they contain real data
  const mappedIconEl = fragmentElement.querySelector(".config-icon");
  const mappedTitleEl = fragmentElement.querySelector(".config-title");

  const effectiveIcon =
    (mappedIconEl && mappedIconEl.innerText.trim()) ||
    configuration.icon ||
    configuration.defaultIcon ||
    "coin";
  const effectiveTitle =
    (mappedTitleEl && mappedTitleEl.innerText.trim()) || configuration.title;

  // 2. Apply updates
  if (effectiveIcon) updateIcon(effectiveIcon);
  if (effectiveTitle) updateTitle(effectiveTitle);

  // 3. Show content
  if (loadingEl) loadingEl.classList.add("d-none");
  if (contentWrap) contentWrap.classList.remove("d-none");
  if (contentWrap) contentWrap.classList.add("d-flex");

  // 4. Handle Link
  if (layoutMode !== "preview") {
    if (configuration.linkUrl) {
      fragmentElement.style.cursor = "pointer";
      fragmentElement.addEventListener("click", () => {
        window.location.href = configuration.linkUrl;
      });
    }
  }
};

initServiceCard();
