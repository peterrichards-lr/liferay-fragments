/**
 * Liferay Fragment Commons: Localization
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

window.Liferay.Fragment.Commons.getLocalizedValue = (value, languageId) => {
  if (typeof value !== "object" || value === null) return value || "";
  const lang =
    languageId ||
    (Liferay.ThemeDisplay ? Liferay.ThemeDisplay.getLanguageId() : "en_US");
  return value[lang] || value["en_US"] || Object.values(value)[0] || "";
};
