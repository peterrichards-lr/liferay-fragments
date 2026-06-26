const initModifyMyProfileLink = () => {
  const link = fragmentElement.querySelector('a');
  if (link) {
    const pageLink = configuration.pageLink || '/profile';

    // Parse site prefix safely from window.location.pathname to avoid TypeError on themeDisplay
    let sitePrefix = '';
    const path = window.location.pathname;
    const parts = path.split('/');
    if (parts.length >= 3 && (parts[1] === 'web' || parts[1] === 'group')) {
      sitePrefix = `/web/${parts[2]}`;
    } else {
      sitePrefix = '/web/guest';
    }

    link.href = `${sitePrefix}${pageLink}`;

    if (configuration.enableMenuText) {
      const btnText = link.querySelector('.btn-section');
      if (btnText && configuration.menuText) {
        btnText.textContent = configuration.menuText;
      }
    }
  }
};

try {
  initModifyMyProfileLink();
} catch (err) {
  console.error('Error in modify-my-profile-link initialization:', err);
}
