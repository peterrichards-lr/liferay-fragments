/**
 * Liferay Fragment Commons: Data Transformation
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

/**
 * Generates a unique identifier.
 */
window.Liferay.Fragment.Commons.uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Converts strings between camelCase, kebab-case, and snake_case.
 */
window.Liferay.Fragment.Commons.convertCase = (str, targetCase) => {
  if (!str) return "";
  const words = str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase());
  if (targetCase === "camelCase")
    return words
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join("");
  if (targetCase === "kebab-case") return words.join("-");
  if (targetCase === "snake_case") return words.join("_");
  return str;
};
