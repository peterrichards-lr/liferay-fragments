const initServiceLinkButton = () => {
  if (layoutMode !== 'preview') {
    const btn = fragmentElement.querySelector('.btn');
    if (btn && configuration.defaultPageUrl) {
      btn.addEventListener('click', (e) => {
        if (configuration.openInNewTab) {
          e.preventDefault();
          window.open(configuration.defaultPageUrl, '_blank');
        }
      });
    }
  }
};

initServiceLinkButton();
