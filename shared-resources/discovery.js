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
      '/o/c/comments': 'Comment',
      '/o/c/waterreadings': 'Water Reading',
      '/o/c/salesreports': 'Sales Report',
      '/o/c/companymilestones': 'Company Milestone',
      '/o/c/activitylogs': 'Activity Log',
      '/o/c/tickets': 'Ticket',
      '/o/c/heartrates': 'Heart Rate',
      '/o/c/bloodpressures': 'Blood Pressure',
      '/o/c/stepses': 'Steps',
      '/o/c/weights': 'Weight',
      '/o/c/applicants': 'Applicant',
      '/o/c/productshowcases': 'Product Showcase',
      '/o/c/campaigns': 'Campaign',
      '/o/c/campaigninteractions': 'Campaign Interaction',
      '/o/c/auditentries': 'Audit Entry',
    };

    const cleanPath = restContextPath.replace(/\/$/, '');
    const name = fallbackPaths[cleanPath];

    if (name && Liferay.ThemeDisplay) {
      const apiPath = `${cleanPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
      console.log(
        `[Commons] Resolved path via fallback registry for ${restContextPath}: ${apiPath}`
      );
      return {
        apiPath,
        definition: {
          name,
          scope: 'site',
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
      },
      TICKET_COMMENT: { path: '/o/c/comments', name: 'Comment' },
      WATER_READING: { path: '/o/c/waterreadings', name: 'Water Reading' },
      SALES_REPORT: { path: '/o/c/salesreports', name: 'Sales Report' },
      COMPANY_MILESTONE: {
        path: '/o/c/companymilestones',
        name: 'Company Milestone',
      },
      ACTIVITY_LOG: { path: '/o/c/activitylogs', name: 'Activity Log' },
      TICKET: { path: '/o/c/tickets', name: 'Ticket' },
      HEART_RATE: { path: '/o/c/heartrates', name: 'Heart Rate' },
      BLOOD_PRESSURE: { path: '/o/c/bloodpressures', name: 'Blood Pressure' },
      STEPS: { path: '/o/c/stepses', name: 'Steps' },
      WEIGHT: { path: '/o/c/weights', name: 'Weight' },
      APPLICANT: { path: '/o/c/applicants', name: 'Applicant' },
      CAMPAIGN: { path: '/o/c/campaigns', name: 'Campaign' },
      CAMPAIGN_INTERACTION: {
        path: '/o/c/campaigninteractions',
        name: 'Campaign Interaction',
      },
      AUDIT_ENTRY: { path: '/o/c/auditentries', name: 'Audit Entry' },
    };

    const mapping = fallbackMap[erc];
    if (mapping && Liferay.ThemeDisplay) {
      const restContextPath = mapping.path;
      const apiPath = `${restContextPath}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
      console.log(
        `[Commons] Resolved path via fallback registry for ERC ${erc}: ${apiPath}`
      );
      return {
        apiPath,
        definition: {
          name: mapping.name,
          scope: 'site',
          restContextPath,
        },
      };
    }

    return { apiPath: null, definition: null };
  }
};
