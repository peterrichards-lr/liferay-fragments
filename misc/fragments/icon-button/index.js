const initIconButton = () => {
  const isDebug = configuration.enableDebug;

  if (layoutMode === "view") {
    const elementId = fragmentElement.id.replace("fragment-", "");
    const iconSpan = fragmentElement.querySelector(
      `#icon-${elementId} span.svg-icon`,
    );
    const button = fragmentElement.querySelector(`#button-${elementId}`);
    const textContent = button.textContent?.trim();

    if (isDebug) {
      console.debug("elementId", elementId);
      console.debug("iconSpan", iconSpan);
      console.debug("button", button);
      console.debug("textContent", textContent);
    }

    if (button) {
      button.innerHTML = textContent;
      button.appendChild(iconSpan);
    }
  } else if (layoutMode === "edit") {
    if (isDebug) console.debug("In edit mode");
  }
};

initIconButton();
