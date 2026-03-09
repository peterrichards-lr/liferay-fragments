/**
 * Liferay Fragment Commons Utility Library
 * Centralized logic for recurring fragment patterns.
 */

window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};

window.Liferay.Fragment.Commons = {
  /**
   * Strict validation for record IDs or ERCs.
   * Prevents API calls with illegal values like "undefined" or "[object Object]".
   */
  isValidIdentifier: (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    const blocklist = ["undefined", "null", "0", "[object object]", ""];
    return s.length > 0 && !blocklist.includes(s);
  },

  /**
   * Safely retrieves a value from a Liferay localized JSON object.
   * Falls back to the raw value if not an object.
   */
  getLocalizedValue: (value, languageId) => {
    if (typeof value !== "object" || value === null) return value || "";
    const lang =
      languageId ||
      (Liferay.ThemeDisplay ? Liferay.ThemeDisplay.getLanguageId() : "en_US");
    return value[lang] || value["en_US"] || Object.values(value)[0] || "";
  },

  /**
   * Resolves the full API path for a Liferay Object based on its scope.
   * Handles /scopes/{siteId} automatically for site-scoped objects.
   */
  resolveObjectPath: async (restContextPath) => {
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
  },
};
