const initMyDashboardLink = () => {
  const link = fragmentElement.querySelector('a');
  if (link) {
    const pageLocation = configuration.pageLocation || 'group';
    const pageLink = configuration.pageLink || '/dashboard';

    // Parse site prefix safely from window.location.pathname to avoid TypeError on themeDisplay
    let sitePrefix = '';
    const path = window.location.pathname;
    const parts = path.split('/');
    if (parts.length >= 3 && (parts[1] === 'web' || parts[1] === 'group')) {
      const type = pageLocation === 'group' ? 'group' : 'web';
      sitePrefix = `/${type}/${parts[2]}`;
    } else {
      const type = pageLocation === 'group' ? 'group' : 'web';
      sitePrefix = `/${type}/guest`;
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
  initMyDashboardLink();
} catch (err) {
  console.error('Error in my-dashboard-link initialization:', err);
}
