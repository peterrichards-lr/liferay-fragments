const {
  assetLibraryCollection,
  assetLibraryId,
  backgroundColor,
  debugInErrorHandler,
  defaultIcon,
  defaultPageUrl,
  enableDebug: debugEnabled,
  iconColor,
  siteId,
  size,
  useDefaultPageUrl
} = configuration;

const debug = (label, ...args) => {
  if (debugEnabled) console.debug(`[Service Icon] ${label}`, ...args);
};

debug('configuration', {
  assetLibraryCollection,
  assetLibraryId,
  backgroundColor,
  debugInErrorHandler,
  defaultIcon,
  defaultPageUrl,
  debugEnabled,
  iconColor,
  siteId,
  size,
  useDefaultPageUrl
});

const iconConfig = fragmentElement.querySelector('span.config-icon');
const iconName = iconConfig?.textContent.trim() || defaultIcon;

const titleConfig = fragmentElement.querySelector('span.config-title');
const title = titleConfig?.textContent.trim() || defaultIcon;

if (iconName && title) {
  const loadingAnimation = fragmentElement.querySelector('.loading-animation-primary');

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

    loadingAnimation.style.display = 'none';
    if (layoutMode !== 'view' || !(Liferay?.Util?.openToast)) {
      const heading = err.type === 'unexpected' ? 'Unexepcted exception' : 'Configure Your Service Icon';
      const style = err.type === 'unexpected' ? 'style="color: var(--danger)"' : '';

      fragmentElement.innerHTML = `<div class="align-items-center justify-content-center bg-lighter d-flex flex-column" style="min-height: 300px;">
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

    const filter = contentTitle ? `&filter=title eq '${encodeURIComponent(contentTitle)}'` : '';
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

  if (layoutMode !== 'edit') {
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
    unwrapNestedAnchors(fragmentElement);

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
        if (items && items.length === 1) {
          const contentItem = collectFields(items[0]?.contentFields);
          debug('contentItem', contentItem);

          let pageUrl = getPageUrlBySiteId(contentItem, useDefaultPageUrl, defaultPageUrl);
          debug(`The pageUrl for ${Liferay.ThemeDisplay.getSiteGroupId()} is ${pageUrl}`);

          if (pageUrl) {
            const wrapperLink = document.createElement('a');
            wrapperLink.setAttribute('href', pageUrl);
            wrapperLink.style.display = 'block';
            wrapperLink.classList.add('service-icon');

            const serviceIcon = fragmentElement.querySelector('div.service-icon');
            fragmentElement.insertBefore(wrapperLink, serviceIcon);
            wrapperLink.appendChild(serviceIcon);
          }
        } else {
          debug('items', items);
        }
        const serviceCardContent = fragmentElement.querySelector('div.service-icon___content');
        serviceCardContent.classList.replace('d-none', 'd-flex');
        loadingAnimation.style.display = 'none';
      }).catch(errorHandler);
  }
}