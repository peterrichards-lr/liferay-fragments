const {
   autoFitBounds,
   collectionIdentier,
   contentTemplateId,
   displayPageTemplateUrl,
   enableDebug: debugEnabled,
   googleApiKey,
   googleMapId,
   infoWindowCloseDelay,
   infoWindowTrigger,
   mapProvider,
   mapZoom,
   navigateOnClick,
   openInNewTab,
   vocabularyId,
   useCustomDisplayPage,
   useCustomInfoTemplate,
   useCustomMarkers
} = configuration;

const mapCenter = [configuration.mapCenterLat, configuration.mapCenterLong];

const debug = (label, ...args) => {
   if (debugEnabled) console.debug(`[Content Map] ${label}`, ...args);
};

debug('configuration', {
   autoFitBounds,
   contentTemplateId,
   collectionIdentier,
   debugEnabled,
   displayPageTemplateUrl,
   googleApiKey,
   googleMapId,
   infoWindowCloseDelay,
   infoWindowTrigger,
   mapCenter,
   mapProvider,
   mapZoom,
   openInNewTab,
   navigateOnClick,
   vocabularyId,
   useCustomDisplayPage,
   useCustomInfoTemplate,
   useCustomMarkers
});

const defaultTemplate =
   openInNewTab ? `
  <div>
    <a href="{{displayPageUrl}}" target="_blank"><strong>{{title}}</strong><br></a>
    {{description}}
  </div>
` : `
  <div>
    <a href="{{displayPageUrl}}"><strong>{{title}}</strong><br></a>
    {{description}}
  </div>
`;

const loadScript = (src, opts = {}) => {
   const { async = false, defer = false } = opts;

   // 1) Check if already loaded
   if (document.querySelector(`script[src="${src}"]`)) {
      return Promise.resolve();
   }

   // 2) Otherwise, create and load
   return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = async;
      script.defer = defer;

      const cleanupAndResolve = () => {
         teardown();
         resolve();
      }
      const cleanupAndReject = () => {
         teardown();
         reject(new Error(`Failed to load script: ${src}`));
      }
      const teardown = () => {
         script.onload = script.onerror = script.onreadystatechange = null;
      }

      script.onload = cleanupAndResolve;
      script.onerror = cleanupAndReject;
      script.onreadystatechange = () => {
         if (/^(loaded|complete)$/.test(script.readyState)) {
            cleanupAndResolve();
         }
      };

      (document.head || document.documentElement).appendChild(script);
   });
}

const loadCSS = (href, opts = {}) => {
   const { async = false } = opts;

   // 1) If already present, skip
   if (document.querySelector(`link[href="${href}"]`)) {
      return Promise.resolve();
   }

   // 2) Otherwise, create and load
   return new Promise((resolve, reject) => {
      const link = document.createElement('link');

      if (async) {
         link.rel = 'preload';
         link.as = 'style';
         link.href = href;
         link.onload = () => {
            link.onload = null;
            // switch to real stylesheet
            link.rel = 'stylesheet';
            resolve();
         };
         link.onerror = () => {
            link.onload = null;
            reject(new Error(`Failed to preload CSS: ${href}`));
         };
      } else {
         link.rel = 'stylesheet';
         link.href = href;
         link.onload = () => resolve();
         link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      }

      document.head.appendChild(link);
   });
}

const collectionName2key = (name) => name?.toLowerCase().replace(/\s+/g, '-');

const toCamelCase = (str) => {
   return str
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((word, idx) => idx === 0
         ? word.charAt(0).toLowerCase() + word.slice(1)
         : word.charAt(0).toUpperCase() + word.slice(1)
      )
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
      const key = toCamelCase(label);

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
      }
   });

   return result;
}

const findGeolocation = (obj) => {
   if (!obj || typeof obj !== 'object') return null;

   if (obj.contentFieldValue
      && obj.contentFieldValue.geo
      && typeof obj.contentFieldValue.geo.latitude === 'number'
      && typeof obj.contentFieldValue.geo.longitude === 'number') {
      return obj.contentFieldValue.geo;
   }

   if (obj.geo
      && typeof obj.geo.latitude === 'number'
      && typeof obj.geo.longitude === 'number') {
      return obj.geo;
   }

   for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
         const found = findGeolocation(obj[key]);
         if (found) return found;
      }
   }

   return null;
}

const transformItems = (items, options = {}) => {
   const { prune = true } = options;
   if (!Array.isArray(items)) throw { "type": "unexpected", message: 'Expected an array of items' };

   return items.map(item => {
      const content = item.content || {};
      let out = {};

      // Top-level fields
      if (content.id !== undefined) out.id = content.id;
      if (content.title !== undefined) out.title = content.title;
      if (content.description !== undefined) out.description = content.description;
      if (content.friendlyUrlPath !== undefined) out.friendlyUrlPath = content.friendlyUrlPath;

      // Grouped content fields
      const contentFields = content.contentFields || [];
      Object.assign(out, collectFields(contentFields));

      if (Array.isArray(content.taxonomyCategoryBriefs)) {
         out.categories = content.taxonomyCategoryBriefs.map(cat => ({
            id: cat.taxonomyCategoryId,
            name: cat.taxonomyCategoryName
         }));
      }

      // relatedContents reduced to id & title array
      if (Array.isArray(content.relatedContents)) {
         out.relatedContents = content.relatedContents.map(rc => ({
            id: rc.id,
            title: rc.title
         }));
      }

      const geo = findGeolocation(item);
      if (!geo) {
         throw {
            "type": "data", message: `Geolocation not found for item "${out.title}"`
         };
      }

      const displayPageUrl = useCustomDisplayPage
         ? displayPageTemplateUrl.replace('{id}', encodeURIComponent(out.id))
         : `/w/${out.friendlyUrlPath}`;

      out = {
         ...out,
         geolocation: geo,
         displayPageUrl
      }

      // Prune empty/null if enabled
      if (prune) {
         out = pruneObject(out);
      }

      return out;
   });
}

const isUuidV4 = (str) => {
   const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
   return typeof str === 'string' && uuidV4Regex.test(str);
}

const buildContentSetUrl = (collectionIdentier, siteId = Liferay.ThemeDisplay.getSiteGroupId()) => {
   const headlessPrefix = '/o/headless-delivery/v1.0';
   if (!collectionIdentier) throw { type: "config", message: 'Specify a collection to map.' };

   if (!isNaN(collectionIdentier)) { // If it is an id
      return `${headlessPrefix}/content-sets/${collectionIdentier}/content-set-elements`;
   }

   if (!siteId) throw { type: "unexpected", message: 'Unable to determine site id' }; // A site id is now needed

   if (isUuidV4(collectionIdentier)) {
      return `${headlessPrefix}/sites/${siteId}/content-sets/by-uuid/${collectionIdentier}/content-set-elements`;
   } else {
      const collectionKey = collectionName2key(collectionIdentier);
      return `${headlessPrefix}/sites/${siteId}/content-sets/by-key/${collectionKey}/content-set-elements?fields=content`;
   }
}

const toTitleCase = (str) => {
   if (!str) return str;
   return str.toLocaleLowerCase().replace(/\b\w/g, (char) => {
      return char.toUpperCase();
   });
}

const loadingAnimation = fragmentElement.querySelector('.loading-animation-primary');

const errorHandler = (err) => {
   loadingAnimation.style.display = 'none';
   if (layoutMode !== 'view' || !(Liferay?.Util?.openToast)) {
      const heading = err.type === 'unexpected' ? 'Unexepcted exception' : 'Configure Your Content Map';
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

const loadCategoryStyles = async (taxonomyVocabularyId) => {
   if (!taxonomyVocabularyId) {
      debug('No taxonomyVocabularyId provided; using default map icons');
      return;
   }
   const headlessPrefix = '/o/headless-admin-taxonomy/v1.0';
   const headlessCallUrl = `${headlessPrefix}/taxonomy-vocabularies/${taxonomyVocabularyId}/taxonomy-categories`
      + '?fields=name,taxonomyCategoryProperties.key,taxonomyCategoryProperties.value,taxonomyCategoryProperties.priority'
      + '&flatten=true&page=0';

   try {
      debug('headlessCallUrl', headlessCallUrl);
      const response = await Liferay.Util.fetch(headlessCallUrl);
      if (!response.ok) {
         if (response.status === 401) throw { type: "access", message: "You are not signed in. Please log in to continue." };
         if (response.status === 403) throw { type: "access", message: "You do not have the necessary permissions to view this content." };
         if (response.status === 404) throw { type: "data", message: "The collection is not found" };
         throw { type: 'unexpected', message: response.statusText };
      }

      const json = await response.json();

      let categoryStyles = {};
      json.items.forEach(cat => {
         const props = {};
         cat.taxonomyCategoryProperties.forEach(p => {
            props[p.key] = p.value;
         });
         categoryStyles[cat.name] = {
            icon: props.icon,
            color: props.color,
            priority: parseInt(props.priority || "0", 10)
         };
      });

      return categoryStyles;
   }
   catch (err) {
      console.warn('Failed to load category styles, falling back to defaults:', err);
   }
}

const loadInfoTemplate = async (contentTemplateId, siteId = Liferay.ThemeDisplay.getSiteGroupId()) => {
   if (!contentTemplateId) throw { type: "config", message: "Please specify a content template ID or disable custom template" };

   const headlessPrefix = '/o/headless-delivery/v1.0';
   const headlessCallUrl = `${headlessPrefix}/sites/${siteId}`
      + `/content-templates/${contentTemplateId}?fields=templateScript`;
   debug('headlessCallUrl', headlessCallUrl);

   const response = await Liferay.Util.fetch(headlessCallUrl);
   if (!response.ok) {
      if (response.status === 401) throw { type: "access", message: "You are not signed in. Please log in to continue." };
      if (response.status === 403) throw { type: "access", message: "You do not have the necessary permissions to view this content." };
      if (response.status === 404) throw { type: "data", message: "The content template was not found" };
      throw { type: 'unexpected', message: response.statusText };
   }

   const json = await response.json();
   return json.templateScript;
}

const getValueByPath = (obj, path) => {
   return path.split('.').reduce(
      (o, key) => (o && o[key] != null) ? o[key] : '',
      obj
   );
}

const renderTemplate = (tpl, data) => {
   return tpl.replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
      const val = getValueByPath(data, path.trim());
      return Array.isArray(val) ? val.join(', ') : val;
   });
}

const flashMarker = (marker) => {
   const el = mapProvider === 'google'
      ? marker.element
      : marker.getElement();
   if (!el) return;

   el.style.transition = 'filter 0.2s ease';
   el.style.filter = 'brightness(1.5)';

   setTimeout(() => {
      el.style.filter = '';
   }, 200);
};

const doMapping = () => {
   const mapEl = fragmentElement.querySelector('.lfr-map');
   const headlessCallUrl = buildContentSetUrl(collectionIdentier);
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
         debug('Raw PoIs', items);

         const pois = transformItems(items);
         debug('Transformed PoIs', pois);

         const coloredIconCache = {};

         let mapInstance;
         let currentInfoWindow = null;  // for Google

         const initMap = async () => {
            if (mapProvider === 'google') {
               mapInstance = new google.maps.Map(mapEl, {
                  mapId: googleMapId
               });
            } else {
               mapInstance = L.map(mapEl);
               L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; OSM contributors'
               }).addTo(mapInstance);
            }

            await addMarkers();
         }

         const makiUrl = (name) => `https://unpkg.com/@mapbox/maki/icons/${name}.svg`;

         const getColoredIcon = async (iconName, color) => {
            const key = `${iconName}|${color}`;
            if (coloredIconCache[key]) return coloredIconCache[key];
            const svg = await fetch(makiUrl(iconName)).then(r => r.text());
            const tinted = svg.replace(
               /<svg([\s\S]*?)>/,
               `<svg$1 fill="${color}">`
            );
            const uri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(tinted)}`;
            return coloredIconCache[key] = uri;
         }

         const addMarkers = async () => {
            if (useCustomMarkers && !vocabularyId) {
               throw { type: "config", message: "Please specify a vocabulary ID or disable custom markers" };
            }
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const categoryStyles = await loadCategoryStyles(vocabularyId);

            const infoTemplate = useCustomInfoTemplate
               ? await loadInfoTemplate(contentTemplateId)
               : defaultTemplate;

            let bounds = mapProvider === 'google'
               ? new google.maps.LatLngBounds()
               : L.latLngBounds([]);

            let currentInfoWindow = null;

            for (const item of pois) {
               const { latitude: lat, longitude: lng } = item.geolocation;
               const title = item.title;
               const pageUrl = item.displayPageUrl;

               const cats = item.categories?.map(c => c.name) || [];
               const context = { ...item, categories: cats };
               const html = renderTemplate(infoTemplate, context);

               const availableStyles = cats
                  .map(name => categoryStyles[name])
                  .filter(s => s && s.icon);
               const style = availableStyles.length
                  ? availableStyles.reduce((best, cur) => cur.priority > best.priority ? cur : best)
                  : null;

               if (mapProvider === 'google') {
                  const opts = { position: { lat, lng }, map: mapInstance, title };
                  if (style) {
                     const url = await getColoredIcon(style.icon, style.color);
                     const img = Object.assign(document.createElement('img'), {
                        src: url, width: 32, height: 32
                     });
                     opts.content = img;
                  }

                  const marker = new google.maps.marker.AdvancedMarkerElement(opts);
                  bounds.extend({ lat, lng });

                  // grab the DOM element
                  const el = marker.element;
                  el.tabIndex = 0;
                  el.setAttribute('role', 'button');

                  // 1) HOVER opens InfoWindow (regardless of navigateOnClick)
                  if (infoWindowTrigger === 'hover') {
                     const info = new google.maps.InfoWindow({ content: html });
                     let closeTimeout;
                     const openInfo = () => {
                        if (closeTimeout) {
                           clearTimeout(closeTimeout);
                           closeTimeout = null;
                        }
                        if (currentInfoWindow) currentInfoWindow.close();
                        info.open(mapInstance, marker);
                        currentInfoWindow = info;
                     };
                     const delayedClose = () => {
                        closeTimeout = setTimeout(() => {
                           info.close()
                           closeTimeout = null;
                        }, infoWindowCloseDelay);
                     };

                     el.addEventListener('mouseenter', openInfo);
                     el.addEventListener('mouseleave', delayedClose);
                     el.addEventListener('focus', openInfo);
                     el.addEventListener('blur', delayedClose);
                     el.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') openInfo();
                     });
                     if (isTouch) el.addEventListener('click', openInfo);

                     // **also** hook into the InfoWindow’s own DOM
                     google.maps.event.addListener(info, 'domready', () => {
                        // the InfoWindow container has class "gm-style-iw"
                        const iw = document.querySelector('.gm-style-iw');
                        if (!iw) return;

                        // entering the popup cancels the close
                        iw.addEventListener('mouseenter', () => {
                           if (closeTimeout) {
                              clearTimeout(closeTimeout);
                              closeTimeout = null;
                           }
                        });
                        // leaving the popup re-schedules it
                        iw.addEventListener('mouseleave', delayedClose);
                     });
                  }

                  // 2) CLICK behavior
                  if (navigateOnClick) {
                     el.style.cursor = 'pointer';
                     el.addEventListener('click', e => {
                        e.stopPropagation();
                        if (layoutMode === 'view') {
                           // real navigation
                           if (!pageUrl) return;
                           if (openInNewTab) window.open(pageUrl, '_blank');
                           else window.location.href = pageUrl;
                        } else {
                           flashMarker(marker);
                        }
                     });
                  }
                  else if (infoWindowTrigger === 'click') {
                     // pure click–open InfoWindow
                     const info = new google.maps.InfoWindow({ content: html });
                     el.addEventListener('click', () => {
                        if (currentInfoWindow) currentInfoWindow.close();
                        info.open(mapInstance, marker);
                        currentInfoWindow = info;
                     });
                  }
                  // else: infoWindowTrigger==='none' & !navigateOnClick → nothing bound
               } else {
                  // 1) create and add the marker
                  let marker = style
                     ? L.marker([lat, lng], {
                        icon: L.icon({
                           iconUrl: await getColoredIcon(style.icon, style.color),
                           iconSize: [32, 32],
                           iconAnchor: [16, 32],
                        })
                     })
                     : L.marker([lat, lng]);
                  marker.addTo(mapInstance);
                  bounds.extend(marker.getLatLng());

                  // 2) only bind popups for hover or click modes
                  if (infoWindowTrigger === 'hover' || (!navigateOnClick && infoWindowTrigger === 'click')) {
                     marker.bindPopup(html);
                  }

                  marker.once('add', () => {
                     const el = marker.getElement();
                     if (!el) return;
                     el.tabIndex = 0;
                     el.setAttribute('role', 'button');
                     el.style.cursor = 'pointer';

                     let closeTimeout;
                     const openPopup = () => {
                        if (closeTimeout) {
                           clearTimeout(closeTimeout);
                           closeTimeout = null;
                        }
                        marker.openPopup();
                     };
                     const delayedClosePopup = () => {
                        closeTimeout = setTimeout(() => {
                           marker.closePopup();
                           closeTimeout = null;
                        }, 500);
                     };

                     // A) HOVER → open/close popup, regardless of navigateOnClick
                     if (infoWindowTrigger === 'hover') {
                        el.addEventListener('mouseover', openPopup);
                        el.addEventListener('mouseout', delayedClosePopup);
                        // keyboard
                        el.addEventListener('focus', openPopup);
                        el.addEventListener('blur', delayedClosePopup);
                        el.addEventListener('keydown', e => {
                           if (e.key === 'Enter' || e.key === ' ') openPopup;
                        });
                        if (isTouch) el.addEventListener('click', openPopup);
                     }

                     // B) CLICK → open popup (only when not navigating)
                     if (!navigateOnClick && infoWindowTrigger === 'click') {
                        marker.on('click', openPopup);
                     }

                     // C) CLICK → navigate or flash (always bound if navigateOnClick)
                     if (navigateOnClick) {
                        el.style.cursor = 'pointer';
                        marker.on('click', e => {
                           // Leaflet wraps the native event
                           e.originalEvent.stopPropagation();
                           if (layoutMode === 'view') {
                              if (!pageUrl) return;
                              if (openInNewTab) window.open(pageUrl, '_blank');
                              else window.location.href = pageUrl;
                           } else {
                              // flash feedback
                              el.style.transition = 'filter 0.2s ease';
                              el.style.filter = 'brightness(1.5)';
                              setTimeout(() => { el.style.filter = ''; }, 200);
                           }
                        });
                     }
                  });
               }
            }

            if (autoFitBounds) {
               mapProvider === 'google'
                  ? mapInstance.fitBounds(bounds)
                  : mapInstance.fitBounds(bounds, { padding: [20, 20] });
            } else {
               mapProvider === 'google'
                  ? (mapInstance.setCenter({ lat: mapCenter[0], lng: mapCenter[1] }), mapInstance.setZoom(mapZoom))
                  : mapInstance.setView(mapCenter, mapZoom);
            }
         };

         await initMap();

         loadingAnimation.style.display = 'none';
         mapEl.style.visibility = 'visible';

      })
      .catch(errorHandler);
}

if (mapProvider === 'google') {
   try {
      if (!googleApiKey) throw { type: "config", message: "Please specify your Google Maps API key" };
      if (!googleMapId) throw { type: "config", message: "Please specify your Google Maps Id" };
      const googleMapSrc = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=marker&map_ids=${googleMapId}`;
      loadScript(googleMapSrc)
         .then(doMapping)
         .catch(errorHandler);
   } catch (err) {
      errorHandler(err);
   }
} else {
   const osmSrc = `https://unpkg.com/leaflet/dist/leaflet.js`;
   const osmCssSrc = `https://unpkg.com/leaflet/dist/leaflet.css`;
   loadScript(osmSrc)
      .then(() => loadCSS(osmCssSrc))
      .then(doMapping)
      .catch(errorHandler);
}