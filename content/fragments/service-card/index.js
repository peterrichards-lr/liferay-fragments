const {
  assetLibraryCollection,
  assetLibraryId,
  backgroundColor,
  contentStructureId,
  debugInErrorHandler,
  defaultIcon,
  defaultPageUrl,
  enableDebug: debugEnabled,
  iconColor,
  showIcon,
  size,
  useDefaultPageUrl
} = configuration;

const debug = (label, ...args) => {
  if (debugEnabled) console.debug(`[Service Card] ${label}`, ...args);
};

debug('configuration', {
  assetLibraryCollection,
  assetLibraryId,
  backgroundColor,
  contentStructureId,
  debugInErrorHandler,
  defaultIcon,
  defaultPageUrl,
  debugEnabled,
  iconColor,
  showIcon,
  size,
  useDefaultPageUrl
});

const resetFragment = (showFragmentContent = true) => {
  if (showFragmentContent) {
    const serviceLinkButtonContent = fragmentElement.querySelector('div.service-card___content');
    serviceLinkButtonContent.classList.replace('d-none', 'd-flex');
  }
  const loadingAnimation = fragmentElement.querySelector('.loading-animation-primary');
  loadingAnimation.style.display = 'none';
}

const titleEl = fragmentElement.querySelector('div[data-lfr-editable-id="service-title"]');
const title = titleEl?.textContent.trim();

if (title) {
  if (showIcon) {
    const iconConfig = fragmentElement.querySelector('span.config-icon');
    const iconName = iconConfig?.textContent.trim() || defaultIcon;

    const svgClass = `lexicon-icon lexicon-icon-${iconName}`;
    const xlinkHref = `${Liferay.Icons.spritemap}#${iconName}`

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('role', 'presentation');
    svgElement.setAttribute('viewBox', '0 0 512 512');
    svgElement.setAttribute('class', svgClass);

    const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', xlinkHref);

    svgElement.appendChild(useElement);

    const svgSpan = fragmentElement.querySelector('span.svg-icon');
    svgSpan.appendChild(svgElement);
  }

  const toCamelCase = (str) => {
    if (!/\s/.test(str)) {
      return str.trim();
    }

    return str
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((word, idx) => {
        const lower = word.toLowerCase();
        return idx === 0
          ? lower
          : lower.charAt(0).toUpperCase() + lower.slice(1)
      })
      .join('');
  }

  const pruneObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj
        .map(item => pruneObject(item))
        .filter(item => item !== null && item !== undefined && !(typeof item === 'object' && (Array.isArray(item) ? item.length === 0 : Object.keys(item).length === 0)));
    }
    if (obj && typeof obj === 'object') {
      const result = {};
      Object.entries(obj).forEach(([key, value]) => {
        const pruned = pruneObject(value);
        if (pruned !== null && pruned !== undefined && !(typeof pruned === 'string' && pruned === '') && !(typeof pruned === 'object' && (Array.isArray(pruned) ? pruned.length === 0 : Object.keys(pruned).length === 0))) {
          result[key] = pruned;
        }
      });
      return result;
    }
    return obj;
  }

  const convertValue = (rawData, dataType) => {
    if (rawData == null) return null;
    switch (dataType) {
      case 'string': return String(rawData);
      case 'number': {
        const num = Number(rawData);
        return isNaN(num) ? null : num;
      }
      case 'boolean': return rawData === 'true' || rawData === true;
      case 'geolocation': return rawData; // expected { latitude, longitude }
      case 'date': return new Date(rawData);
      default: return rawData;
    }
  }

  const collectFields = (fields) => {
    const result = {};

    fields.forEach(field => {
      const { name, label, dataType, nestedContentFields = [], repeatable } = field;
      const key = toCamelCase(label || name);

      if (!dataType && /^Fieldset/i.test(name)) {
        const group = collectFields(nestedContentFields);
        if (repeatable) {
          result[key] = result[key] || [];
          result[key].push(group);
        } else {
          result[key] = group;
        }
      } else if (dataType) {
        const rawData = field.contentFieldValue?.data ?? field.contentFieldValue?.geo;
        const value = convertValue(rawData, dataType);
        if (repeatable) {
          result[key] = result[key] || [];
          result[key].push(value);
        } else {
          result[key] = value;
        }
      } else if (nestedContentFields.length > 0) {
        const nestedKey = toCamelCase(name);
        const group = collectFields(nestedContentFields);
        result[nestedKey] = result[nestedKey] || [];
        result[nestedKey].push(group);
      }
    });

    return result;
  }

  const getPageUrlBySiteId = (fieldsObject, useDefaultPageUrl, defaultPageUrl, siteId = Liferay.ThemeDisplay.getSiteGroupId()) => {
    const siteUrls = fieldsObject?.siteUrls;

    if (!Array.isArray(siteUrls)) {
      return useDefaultPageUrl ? defaultPageUrl : undefined;
    }

    debug('siteId', siteId);
    debug('siteUrls', siteUrls);

    const match = siteUrls.find(entry => entry.siteId === `${siteId}`);

    return match?.pageUrl ?? (useDefaultPageUrl ? defaultPageUrl : null);
  };

  const errorHandler = (err) => {
    if (debugInErrorHandler)
      debugger;

    resetFragment(false);
    if (layoutMode !== 'view' || !(Liferay?.Util?.openToast)) {
      const heading = err.type === 'unexpected' ? 'Unexepcted exception' : 'Configure Your Service Card';
      const style = err.type === 'unexpected' ? 'style="color: var(--danger)"' : '';

      fragmentElement.innerHTML = `<div class="align-items-center justify-content-center bg-lighter d-flex flex-column" style="padding-top: var(--spacer-3, 1rem) !important;">
         <p class="page-editor__no-fragments-state__title">${heading}</p>
         <p class="mb-3 page-editor__no-fragments-state__message" ${style}>${err.message}</p>
         </div>`;
      return;
    }

    switch (err.type) {
      case 'access':
        Liferay.Util.openToast({
          message: err.message,
          type: 'info',
          title: toTitleCase(err.type)
        });
        break;
      case 'config':
      case 'data':
        Liferay.Util.openToast({
          message: err.message,
          type: 'warning',
          title: toTitleCase(err.type)
        });
        break;
      default:
        Liferay.Util.openToast({
          message: err.message,
          type: 'danger',
          title: toTitleCase(err.type)
        });
        break;
    }

    if (err.type === undefined || err.type === 'unexpected') console.error(err);
  };

  const buildStructureContentUrl = (contentTitle, assetLibraryCollection, assetLibraryId, siteId = Liferay.ThemeDisplay.getSiteGroupId()) => {
    const headlessPrefix = '/o/headless-delivery/v1.0';

    if (assetLibraryCollection && !assetLibraryId && !isNaN(assetLibraryId)) { // If it is an id
      throw { type: "config", message: 'Specify a asset library id.' };
    }

    let filter;
    if (contentStructureId) {
      filter = `&filter=contentStructureId eq ${contentStructureId}`;
    }

    const titleFilter = contentTitle ? `title eq '${encodeURIComponent(contentTitle)}'` : '';
    if (filter) {
      filter += ` and ${titleFilter}`;
    } else {
      filter = `&filter=${titleFilter}`;
    }

    const queryString = `?fields=id%2CcontentFields&flatten=true${filter}`;

    if (assetLibraryId) {
      return `${headlessPrefix}/asset-libraries/${assetLibraryId}/structured-contents${queryString}`;
    } else {
      if (!siteId) throw { type: "unexpected", message: 'Unable to determine site id' }; // A site id is now needed

      return `${headlessPrefix}/sites/${siteId}/structured-contents${queryString}`;
    }
  }

  const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLocaleLowerCase().replace(/\b\w/g, (char) => {
      return char.toUpperCase();
    });
  }

  // First remove existing links
  const unwrapNestedAnchors = (root) => {
    const nestedAnchors = root.querySelectorAll('a');
    nestedAnchors.forEach(anchor => {
      const parent = anchor.parentNode;
      while (anchor.firstChild) {
        parent.insertBefore(anchor.firstChild, anchor);
      }
      parent.removeChild(anchor);
    });
  }

  try {
    if (layoutMode === 'view') {
      unwrapNestedAnchors(fragmentElement);
    }

    const headlessCallUrl = buildStructureContentUrl(title, assetLibraryCollection, assetLibraryId);
    debug('headlessCallUrl', headlessCallUrl);
    Liferay.Util.fetch(headlessCallUrl)
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) throw { type: "access", message: "You are not signed in. Please log in to continue." };
          if (response.status === 403) throw { type: "access", message: "You do not have the necessary permissions to view this content." };
          if (response.status === 404) throw { type: "data", message: "The collection was not found" };
          throw { type: 'unexpected', message: response.statusText };
        }
        return response.json();
      })
      .then(async data => {
        const { items } = data;
        if (layoutMode === 'view') {
          if (items && items.length === 1) {
            const contentItem = collectFields(items[0]?.contentFields);
            debug('contentItem', contentItem);

            let pageUrl = getPageUrlBySiteId(contentItem, useDefaultPageUrl, defaultPageUrl);
            debug(`The pageUrl for ${Liferay.ThemeDisplay.getSiteGroupId()} is ${pageUrl}`);

            if (pageUrl) {
              const wrapperLink = document.createElement('a');
              wrapperLink.setAttribute('href', pageUrl);
              wrapperLink.style.display = 'block';
              wrapperLink.classList.add('service-card');

              const serviceCard = fragmentElement.querySelector('div.service-card');
              fragmentElement.insertBefore(wrapperLink, serviceCard);
              wrapperLink.appendChild(serviceCard);
            }
          } else {
            debug('items', items);
          }
        } else {
          debug('items', items);
        }
        resetFragment();
      }).catch(errorHandler);
  } catch (err) {
    errorHandler(err);
  }
} else {
  resetFragment();
}