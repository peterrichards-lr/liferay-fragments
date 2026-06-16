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

    // Fallback registry mapping REST Context paths to names for Guest scope resolution
    const fallbackPaths = {
      '/o/c/comments': { name: 'Comment', scope: 'site' },
      '/o/c/waterreadings': { name: 'Water Reading', scope: 'site' },
      '/o/c/salesreports': { name: 'Sales Report', scope: 'site' },
      '/o/c/companymilestones': { name: 'Company Milestone', scope: 'company' },
      '/o/c/activitylogs': { name: 'Activity Log', scope: 'company' },
      '/o/c/tickets': { name: 'Ticket', scope: 'site' },
      '/o/c/heartrates': { name: 'Heart Rate', scope: 'site' },
      '/o/c/bloodpressures': { name: 'Blood Pressure', scope: 'site' },
      '/o/c/stepses': { name: 'Steps', scope: 'site' },
      '/o/c/weights': { name: 'Weight', scope: 'site' },
      '/o/c/applicants': { name: 'Applicant', scope: 'site' },
      '/o/c/productshowcases': { name: 'Product Showcase', scope: 'company' },
      '/o/c/campaigns': { name: 'Campaign', scope: 'site' },
      '/o/c/campaigninteractions': {
        name: 'Campaign Interaction',
        scope: 'site',
      },
      '/o/c/auditentries': { name: 'Audit Entry', scope: 'site' },
    };

    const cleanPath = restContextPath.replace(/\/$/, '');
    const mapping = fallbackPaths[cleanPath];

    if (mapping && Liferay.ThemeDisplay) {
      const scope = mapping.scope || 'site';
      const apiPath =
        scope === 'site'
          ? `${cleanPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`
          : cleanPath;
      console.log(
        `[Commons] Resolved path via fallback registry for ${restContextPath}: ${apiPath}`
      );
      return {
        apiPath,
        definition: {
          name: mapping.name,
          scope,
          restContextPath: cleanPath,
        },
      };
    }

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

    // Fallback registry mapping ERCs to REST Context paths for Guest visitors
    const fallbackMap = {
      PRODUCT_SHOWCASE: {
        path: '/o/c/productshowcases',
        name: 'Product Showcase',
        scope: 'company',
      },
      TICKET_COMMENT: { path: '/o/c/comments', name: 'Comment', scope: 'site' },
      WATER_READING: {
        path: '/o/c/waterreadings',
        name: 'Water Reading',
        scope: 'site',
      },
      SALES_REPORT: {
        path: '/o/c/salesreports',
        name: 'Sales Report',
        scope: 'site',
      },
      COMPANY_MILESTONE: {
        path: '/o/c/companymilestones',
        name: 'Company Milestone',
        scope: 'company',
      },
      ACTIVITY_LOG: {
        path: '/o/c/activitylogs',
        name: 'Activity Log',
        scope: 'company',
      },
      TICKET: { path: '/o/c/tickets', name: 'Ticket', scope: 'site' },
      HEART_RATE: {
        path: '/o/c/heartrates',
        name: 'Heart Rate',
        scope: 'site',
      },
      BLOOD_PRESSURE: {
        path: '/o/c/bloodpressures',
        name: 'Blood Pressure',
        scope: 'site',
      },
      STEPS: { path: '/o/c/stepses', name: 'Steps', scope: 'site' },
      WEIGHT: { path: '/o/c/weights', name: 'Weight', scope: 'site' },
      APPLICANT: { path: '/o/c/applicants', name: 'Applicant', scope: 'site' },
      CAMPAIGN: { path: '/o/c/campaigns', name: 'Campaign', scope: 'site' },
      CAMPAIGN_INTERACTION: {
        path: '/o/c/campaigninteractions',
        name: 'Campaign Interaction',
        scope: 'site',
      },
      AUDIT_ENTRY: {
        path: '/o/c/auditentries',
        name: 'Audit Entry',
        scope: 'site',
      },
    };

    const mapping = fallbackMap[erc];
    if (mapping && Liferay.ThemeDisplay) {
      const restContextPath = mapping.path;
      const scope = mapping.scope || 'site';
      const apiPath =
        scope === 'site'
          ? `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`
          : restContextPath;
      console.log(
        `[Commons] Resolved path via fallback registry for ERC ${erc}: ${apiPath}`
      );
      return {
        apiPath,
        definition: {
          name: mapping.name,
          scope,
          restContextPath,
        },
      };
    }

    return { apiPath: null, definition: null };
  }
};
