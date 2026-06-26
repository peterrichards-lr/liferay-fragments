const initServiceLinkButton = () => {
  const btn = fragmentElement.querySelector('.btn');
  const content = fragmentElement.querySelector(
    '.service-link-button___content'
  );
  const loader = fragmentElement.querySelector('.loading-animation-squares');

  if (loader) loader.classList.add('d-none');
  if (content) content.classList.remove('d-none');

  if (layoutMode !== 'preview') {
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

try {
  initServiceLinkButton();
} catch (err) {
  console.error('Error in service-link-button initialization:', err);
}
