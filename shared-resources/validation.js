/**
 * Liferay Fragment Commons: Validation
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

window.Liferay.Fragment.Commons.isValidIdentifier = (val) => {
  if (val === undefined || val === null) return false;
  const s = String(val).trim().toLowerCase();
  const blocklist = ['undefined', 'null', '0', '[object object]', ''];
  return s.length > 0 && !blocklist.includes(s);
};
