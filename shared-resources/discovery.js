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
      apiPath,
      definition,
    };
  } catch (e) {
    console.error("[Commons] Path resolution failed:", e);
    return { apiPath: restContextPath, definition: null };
  }
};

window.Liferay.Fragment.Commons.resolveObjectPathByERC = async (erc) => {
  if (!window.Liferay.Fragment.Commons.isValidIdentifier(erc)) {
    throw new Error("Invalid ERC");
  }

  const ADMIN_API_BASE = "/o/object-admin/v1.0";

  try {
    const response = await fetch(
      `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${erc}`,
    );
    if (!response.ok) throw new Error("Failed to fetch definition");

    const definition = await response.json();
    const restContextPath = definition.restContextPath;
    let apiPath = restContextPath;

    if (definition.scope === "site" && Liferay.ThemeDisplay) {
      apiPath = `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
    }

    return {
      apiPath,
      definition,
    };
  } catch (e) {
    console.error("[Commons] ERC resolution failed:", e);
    return { apiPath: null, definition: null };
  }
};
