const initIconButton = () => {
  const isDebug = configuration.enableDebug;

  if (layoutMode === 'view') {
    const elementId = fragmentElement.id.replace('fragment-', '');
    const iconSpan = fragmentElement.querySelector(
      `#icon-${elementId} span.svg-icon`
    );
    const button = fragmentElement.querySelector(`#button-${elementId}`);

    if (isDebug) {
      console.debug('elementId', elementId);
      console.debug('iconSpan', iconSpan);
      console.debug('button', button);
    }

    if (button && iconSpan) {
      // Find or create a text span to avoid innerHTML wiping out editable attributes
      let textSpan = button.querySelector('.btn-text');
      if (!textSpan) {
        const currentText = button.textContent.trim();
        button.textContent = '';
        textSpan = document.createElement('span');
        textSpan.className = 'btn-text';
        textSpan.textContent = currentText;
        button.appendChild(textSpan);
      }
      button.appendChild(iconSpan);
    }
  } else if (layoutMode === 'edit') {
    if (isDebug) console.debug('In edit mode');
  }
};

initIconButton();
