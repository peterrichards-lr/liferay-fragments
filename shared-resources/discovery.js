/**
 * Liferay Fragment Commons: Object Discovery
 * Depends on: validation.js
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

// Shared fallback definitions to bypass 403 Forbidden errors for Guest users
const sharedFallbacks = {
  PRODUCT_SHOWCASE: {
    path: '/o/c/productshowcases',
    name: 'Product Showcase',
    scope: 'company',
    objectFields: [
      {
        name: 'title',
        label: { en_US: 'Title' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'description',
        label: { en_US: 'Description' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'imageUrl',
        label: { en_US: 'Image URL' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  TICKET_COMMENT: {
    path: '/o/c/comments',
    name: 'Comment',
    scope: 'site',
    objectFields: [
      {
        name: 'comment',
        label: { en_US: 'Comment' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'visibility',
        label: { en_US: 'Visibility' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  WATER_READING: {
    path: '/o/c/waterreadings',
    name: 'Water Reading',
    scope: 'site',
    objectFields: [
      {
        name: 'readingDate',
        label: { en_US: 'Reading Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'value',
        label: { en_US: 'Value' },
        type: 'Double',
        businessType: 'Decimal',
      },
      {
        name: 'status',
        label: { en_US: 'Status' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  SALES_REPORT: {
    path: '/o/c/salesreports',
    name: 'Sales Report',
    scope: 'site',
    objectFields: [
      {
        name: 'salesRegion',
        label: { en_US: 'Sales Region' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'revenue',
        label: { en_US: 'Revenue' },
        type: 'Double',
        businessType: 'Decimal',
      },
      {
        name: 'unitsSold',
        label: { en_US: 'Units Sold' },
        type: 'Integer',
        businessType: 'Integer',
      },
      {
        name: 'saleDate',
        label: { en_US: 'Sale Date' },
        type: 'Date',
        businessType: 'Date',
      },
    ],
  },
  COMPANY_MILESTONE: {
    path: '/o/c/companymilestones',
    name: 'Company Milestone',
    scope: 'company',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'title',
        label: { en_US: 'Title' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'description',
        label: { en_US: 'Description' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  ACTIVITY_LOG: {
    path: '/o/c/activitylogs',
    name: 'Activity Log',
    scope: 'company',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'title',
        label: { en_US: 'Title' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'description',
        label: { en_US: 'Description' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  TICKET: {
    path: '/o/c/tickets',
    name: 'Ticket',
    scope: 'site',
    objectFields: [
      {
        name: 'title',
        label: { en_US: 'Title' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  HEART_RATE: {
    path: '/o/c/heartrates',
    name: 'Heart Rate',
    scope: 'site',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'bpm',
        label: { en_US: 'BPM' },
        type: 'Integer',
        businessType: 'Integer',
      },
    ],
  },
  BLOOD_PRESSURE: {
    path: '/o/c/bloodpressures',
    name: 'Blood Pressure',
    scope: 'site',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'systolic',
        label: { en_US: 'Systolic' },
        type: 'Integer',
        businessType: 'Integer',
      },
      {
        name: 'diastolic',
        label: { en_US: 'Diastolic' },
        type: 'Integer',
        businessType: 'Integer',
      },
    ],
  },
  STEPS: {
    path: '/o/c/stepses',
    name: 'Steps',
    scope: 'site',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'count',
        label: { en_US: 'Count' },
        type: 'Integer',
        businessType: 'Integer',
      },
    ],
  },
  WEIGHT: {
    path: '/o/c/weights',
    name: 'Weight',
    scope: 'site',
    objectFields: [
      {
        name: 'date',
        label: { en_US: 'Date' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'weight',
        label: { en_US: 'Weight' },
        type: 'Double',
        businessType: 'Decimal',
      },
    ],
  },
  APPLICANT: {
    path: '/o/c/applicants',
    name: 'Applicant',
    scope: 'site',
    objectFields: [
      {
        name: 'name',
        label: { en_US: 'Name' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'emailAddress',
        label: { en_US: 'Email Address' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  CAMPAIGN: {
    path: '/o/c/campaigns',
    name: 'Campaign',
    scope: 'site',
    objectFields: [
      {
        name: 'title',
        label: { en_US: 'Title' },
        type: 'String',
        businessType: 'Text',
      },
      {
        name: 'description',
        label: { en_US: 'Description' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  CAMPAIGN_INTERACTION: {
    path: '/o/c/campaigninteractions',
    name: 'Campaign Interaction',
    scope: 'site',
    objectFields: [
      {
        name: 'type',
        label: { en_US: 'Type' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
  AUDIT_ENTRY: {
    path: '/o/c/auditentries',
    name: 'Audit Entry',
    scope: 'site',
    objectFields: [
      {
        name: 'timestamp',
        label: { en_US: 'Timestamp' },
        type: 'Date',
        businessType: 'Date',
      },
      {
        name: 'action',
        label: { en_US: 'Action' },
        type: 'String',
        businessType: 'Text',
      },
    ],
  },
};

const fallbackPaths = {};
const fallbackMap = {};
Object.keys(sharedFallbacks).forEach((erc) => {
  const fallback = sharedFallbacks[erc];
  fallbackPaths[fallback.path] = {
    name: fallback.name,
    scope: fallback.scope,
    objectFields: fallback.objectFields,
  };
  fallbackMap[erc] = {
    path: fallback.path,
    name: fallback.name,
    scope: fallback.scope,
    objectFields: fallback.objectFields,
  };
});

window.Liferay.Fragment.Commons.resolveObjectPath = async (restContextPath) => {
  if (!window.Liferay.Fragment.Commons.isValidIdentifier(restContextPath)) {
    throw new Error('Invalid restContextPath');
  }

  const ADMIN_API_BASE = '/o/object-admin/v1.0';
  const objectPath = restContextPath.replace('/o/c/', '');

  try {
    const response = await fetch(
      `${ADMIN_API_BASE}/object-definitions?search=${objectPath}`
    );
    if (!response.ok) throw new Error('Failed to fetch definitions');

    const data = await response.json();
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
          objectFields: mapping.objectFields || [],
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
          objectFields: mapping.objectFields || [],
        },
      };
    }

    return { apiPath: null, definition: null };
  }
};
