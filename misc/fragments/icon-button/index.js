const isDebug = configuration.enableDebug;
if (fragmentNamespace) {
  if (!document.body.classList.contains('has-edit-mode-menu')) {
    const elementId = fragmentElement.id.replace('fragment-', '');
    const iconSpan = fragmentElement.querySelector(`#icon-${elementId} span.svg-icon`);
    const button = fragmentElement.querySelector(`#button-${elementId}`);
    const textContent = button.textContent?.trim();
    if (isDebug) {
      console.debug('elementId', elementId);
      console.debug('iconSpan', iconSpan);
      console.debug('button', button);
      console.debug('textContent', textContent);
    }

    if (button) {
      button.innerHtml = textContent;
      button.appendChild(iconSpan);
    }
  } else {
    if (isDebug) console.debug('In edit mode');
  }
} else {
  if (isDebug) console.debug('fragmentNamespace is undefined');
}
