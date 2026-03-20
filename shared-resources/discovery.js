/**
 * Liferay Fragment Commons: Object Discovery
 * Depends on: validation.js
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

window.Liferay.Fragment.Commons.resolveObjectPath = async (restContextPath) => {
  if (!window.Liferay.Fragment.Commons.isValidIdentifier(restContextPath)) {
    throw new Error('Invalid restContextPath');
  }

  const ADMIN_API_BASE = '/o/object-admin/v1.0';
  const objectPath = restContextPath.replace('/o/c/', '');

  try {
    // Attempt to find definition by 'name' (derived from path) or search
    // Since there is no 'by-rest-context-path' endpoint, we use search
    const response = await fetch(
      `${ADMIN_API_BASE}/object-definitions?search=${objectPath}`
    );
    if (!response.ok) throw new Error('Failed to fetch definitions');

    const data = await response.json();
    // Try to find an exact match for restContextPath in the results
    const definition = (data.items || []).find(
      (d) => d.restContextPath === restContextPath
    );

    let apiPath = restContextPath;

    if (definition && definition.scope === 'site' && Liferay.ThemeDisplay) {
      apiPath = `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
    }

    return {
      apiPath,
      definition,
    };
  } catch (e) {
    console.error('[Commons] Path resolution failed:', e);
    return { apiPath: restContextPath, definition: null };
  }
};

window.Liferay.Fragment.Commons.resolveObjectPathByERC = async (erc) => {
  if (!window.Liferay.Fragment.Commons.isValidIdentifier(erc)) {
    throw new Error('Invalid ERC');
  }

  const ADMIN_API_BASE = '/o/object-admin/v1.0';

  try {
    const response = await fetch(
      `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${erc}`
    );
    if (!response.ok) throw new Error('Failed to fetch definition');

    const definition = await response.json();
    const restContextPath = definition.restContextPath;
    let apiPath = restContextPath;

    if (definition.scope === 'site' && Liferay.ThemeDisplay) {
      apiPath = `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
    }

    return {
      apiPath,
      definition,
    };
  } catch (e) {
    console.error('[Commons] ERC resolution failed:', e);
    return { apiPath: null, definition: null };
  }
};
