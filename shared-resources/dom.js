/**
 * Liferay Fragment Commons: DOM & UI
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

/**
 * Prevents a function from being called too frequently.
 */
window.Liferay.Fragment.Commons.debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Extracts all data-lfr-js-* attributes and returns them as a camelCase object.
 */
window.Liferay.Fragment.Commons.getDataAttributes = (el) => {
  const data = {};
  [...el.attributes].forEach((attr) => {
    if (attr.name.startsWith('data-lfr-js-')) {
      const key = attr.name
        .replace('data-lfr-js-', '')
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      data[key] = attr.value;
    }
  });
  return data;
};

/**
 * Fetches the value of a CSS variable (e.g. --primary).
 */
window.Liferay.Fragment.Commons.getCssVariable = (
  varName,
  root = document.documentElement
) => {
  return getComputedStyle(root).getPropertyValue(varName).trim();
};

/**
 * Renders a standard Liferay Empty State within a container.
 */
window.Liferay.Fragment.Commons.renderEmptyState = (
  container,
  options = {}
) => {
  const {
    title = 'No Results Found',
    description = 'Sorry, no results were found.',
    image = '/o/admin-theme/images/states/search_state.svg',
    reducedMotionImage = '/o/admin-theme/images/states/search_state_reduced_motion.svg',
  } = options;

  container.innerHTML = `
    <div class="c-empty-state c-empty-state-animation">
      <div class="c-empty-state-image">
        <div class="c-empty-state-aspect-ratio">
          <img alt="" class="aspect-ratio-item aspect-ratio-item-fluid d-none-c-prefers-reduced-motion" src="${image}">
          <img alt="" class="aspect-ratio-item aspect-ratio-item-fluid d-block-c-prefers-reduced-motion" src="${reducedMotionImage}">
        </div>
      </div>
      <div class="c-empty-state-title"><span>${title}</span></div>
      <div class="c-empty-state-text">${description}</div>
      <div class="c-empty-state-footer"></div>
    </div>
  `;
};

/**
 * Renders a configuration warning alert for Page Editors.
 */
window.Liferay.Fragment.Commons.renderConfigWarning = (
  container,
  message,
  layoutMode
) => {
  if (layoutMode !== 'view') {
    container.innerHTML = `
      <div class="alert alert-info" role="alert">
        <span class="alert-indicator">
          <svg class="lexicon-icon lexicon-icon-info-circle" focusable="false" role="presentation" viewBox="0 0 512 512">
            <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208-93.3 208-208 208z"></path>
            <path d="M256 128c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zM256 224c-17.7 0-32 14.3-32 32v96c0 17.7 14.3 32 32 32s32-14.3 32-32v-96c0-17.7-14.3-32-32-32z"></path>
          </svg>
        </span>
        <strong class="lead">Configuration Required:</strong> ${message}
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
};
