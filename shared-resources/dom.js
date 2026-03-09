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
    if (attr.name.startsWith("data-lfr-js-")) {
      const key = attr.name
        .replace("data-lfr-js-", "")
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
  root = document.documentElement,
) => {
  return getComputedStyle(root).getPropertyValue(varName).trim();
};
