/**
 * Liferay Fragment Commons: Object Discovery
 * Depends on: validation.js
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

window.Liferay.Fragment.Commons.resolveObjectPath = async (restContextPath) => {
  if (!window.Liferay.Fragment.Commons.isValidIdentifier(restContextPath)) {
    throw new Error("Invalid restContextPath");
  }

  const ADMIN_API_BASE = "/o/object-admin/v1.0";
  const objectPath = restContextPath.replace("/o/c/", "");

  try {
    const response = await fetch(
      `${ADMIN_API_BASE}/object-definitions/by-rest-context-path/${objectPath}`,
    );
    if (!response.ok) throw new Error("Failed to fetch definition");

    const definition = await response.json();
    let apiPath = restContextPath;

    if (definition.scope === "site" && Liferay.ThemeDisplay) {
      apiPath = `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
    }

    return {
      definition,
      apiPath: apiPath,
    };
  } catch (e) {
    console.error("[Commons] Path resolution failed:", e);
    return { definition: null, apiPath: restContextPath };
  }
};
