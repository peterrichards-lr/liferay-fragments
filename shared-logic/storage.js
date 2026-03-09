/**
 * Liferay Fragment Commons: Storage & Cookies
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

/**
 * Sets a cookie with optional expiration.
 */
window.Liferay.Fragment.Commons.setCookie = (name, value, days = 30) => {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()}`;
};

/**
 * Retrieves a cookie by name.
 */
window.Liferay.Fragment.Commons.getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};
