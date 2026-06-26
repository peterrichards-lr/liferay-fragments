const initContentMap = () => {
  const mapElement = fragmentElement.querySelector('.lfr-map');
  const loadingElement = fragmentElement.querySelector(
    '.loading-animation-squares'
  );

  if (!mapElement) return;

  // Set explicit height to show the map
  mapElement.style.height = '400px';
  mapElement.style.width = '100%';
  mapElement.style.display = 'block';

  const provider = configuration.mapProvider || 'osm';
  const lat = parseFloat(configuration.mapCenterLat || 20);
  const lng = parseFloat(configuration.mapCenterLong || 0);
  const zoom = parseInt(configuration.mapZoom || 2, 10);
  const collectionId = configuration.collectionIdentier || '';

  const hideLoader = () => {
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    mapElement.style.visibility = 'visible';
    mapElement.style.display = 'block';
  };

  const loadLeaflet = () => {
    if (window.L) {
      initLeaflet();
      return;
    }

    // Load stylesheet
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      initLeaflet();
    };
    script.onerror = () => {
      console.error('Failed to load Leaflet.');
      hideLoader();
    };
    document.head.appendChild(script);
  };

  const initLeaflet = () => {
    try {
      const map = L.map(mapElement).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      if (!collectionId) {
        L.marker([lat, lng]).addTo(map);
        hideLoader();
        return;
      }

      const url = `/o/headless-delivery/v1.0/content-sets/${collectionId}/content-set-elements`;
      const fetchFn =
        typeof Liferay !== 'undefined' && Liferay.Util && Liferay.Util.fetch
          ? Liferay.Util.fetch
          : fetch;

      fetchFn(url)
        .then((res) => {
          if (!res.ok) throw new Error('Status: ' + res.status);
          return res.json();
        })
        .then((data) => {
          const items = data.items || [];
          if (items.length === 0) {
            L.marker([lat, lng]).addTo(map);
            return;
          }

          items.forEach((item) => {
            const contentFields =
              item.content && item.content.contentFields
                ? item.content.contentFields
                : item.contentFields || [];

            let title = item.title || '';
            let description = '';
            let markerLat = null;
            let markerLng = null;

            if (contentFields.length > 0) {
              const titleField = contentFields.find((f) => f.name === 'title');
              if (titleField) {
                title =
                  titleField.contentFieldValue &&
                  titleField.contentFieldValue.data
                    ? titleField.contentFieldValue.data
                    : titleField.value || title;
              }

              const descField = contentFields.find(
                (f) => f.name === 'description'
              );
              if (descField) {
                description =
                  descField.contentFieldValue &&
                  descField.contentFieldValue.data
                    ? descField.contentFieldValue.data
                    : descField.value || '';
              }

              const latField = contentFields.find((f) => f.name === 'latitude');
              if (latField) {
                const val =
                  latField.contentFieldValue && latField.contentFieldValue.data
                    ? latField.contentFieldValue.data
                    : latField.value;
                markerLat = parseFloat(val);
              }

              const lngField = contentFields.find(
                (f) => f.name === 'longitude'
              );
              if (lngField) {
                const val =
                  lngField.contentFieldValue && lngField.contentFieldValue.data
                    ? lngField.contentFieldValue.data
                    : lngField.value;
                markerLng = parseFloat(val);
              }
            }

            if (
              markerLat !== null &&
              !isNaN(markerLat) &&
              markerLng !== null &&
              !isNaN(markerLng)
            ) {
              const marker = L.marker([markerLat, markerLng]).addTo(map);
              if (title || description) {
                marker.bindPopup(`<b>${title}</b><br>${description}`);
              }
            }
          });
        })
        .catch((err) => {
          console.error('Error fetching Leaflet markers:', err);
          L.marker([lat, lng]).addTo(map);
        })
        .finally(() => {
          hideLoader();
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        });
    } catch (e) {
      console.error('Leaflet initialization error:', e);
      hideLoader();
    }
  };

  const loadGoogleMaps = () => {
    const apiKey = configuration.googleApiKey;
    if (!apiKey) {
      loadLeaflet();
      return;
    }

    const callbackName = `initGoogleMap_${fragmentNamespace}`;
    window[callbackName] = () => {
      try {
        const map = new google.maps.Map(mapElement, {
          center: { lat, lng },
          zoom,
        });

        if (!collectionId) {
          new google.maps.Marker({ position: { lat, lng }, map });
          hideLoader();
          return;
        }

        const url = `/o/headless-delivery/v1.0/content-sets/${collectionId}/content-set-elements`;
        const fetchFn =
          typeof Liferay !== 'undefined' && Liferay.Util && Liferay.Util.fetch
            ? Liferay.Util.fetch
            : fetch;

        fetchFn(url)
          .then((res) => {
            if (!res.ok) throw new Error('Status: ' + res.status);
            return res.json();
          })
          .then((data) => {
            const items = data.items || [];
            if (items.length === 0) {
              new google.maps.Marker({ position: { lat, lng }, map });
              return;
            }

            items.forEach((item) => {
              const contentFields =
                item.content && item.content.contentFields
                  ? item.content.contentFields
                  : item.contentFields || [];

              let title = item.title || '';
              let description = '';
              let markerLat = null;
              let markerLng = null;

              if (contentFields.length > 0) {
                const titleField = contentFields.find(
                  (f) => f.name === 'title'
                );
                if (titleField) {
                  title =
                    titleField.contentFieldValue &&
                    titleField.contentFieldValue.data
                      ? titleField.contentFieldValue.data
                      : titleField.value || title;
                }

                const descField = contentFields.find(
                  (f) => f.name === 'description'
                );
                if (descField) {
                  description =
                    descField.contentFieldValue &&
                    descField.contentFieldValue.data
                      ? descField.contentFieldValue.data
                      : descField.value || '';
                }

                const latField = contentFields.find(
                  (f) => f.name === 'latitude'
                );
                if (latField) {
                  markerLat = parseFloat(
                    latField.contentFieldValue &&
                      latField.contentFieldValue.data
                      ? latField.contentFieldValue.data
                      : latField.value
                  );
                }

                const lngField = contentFields.find(
                  (f) => f.name === 'longitude'
                );
                if (lngField) {
                  markerLng = parseFloat(
                    lngField.contentFieldValue &&
                      lngField.contentFieldValue.data
                      ? lngField.contentFieldValue.data
                      : lngField.value
                  );
                }
              }

              if (
                markerLat !== null &&
                !isNaN(markerLat) &&
                markerLng !== null &&
                !isNaN(markerLng)
              ) {
                const marker = new google.maps.Marker({
                  position: { lat: markerLat, lng: markerLng },
                  map,
                  title,
                });
                if (description) {
                  const infowindow = new google.maps.InfoWindow({
                    content: `<b>${title}</b><br>${description}`,
                  });
                  marker.addListener('click', () => {
                    infowindow.open(map, marker);
                  });
                }
              }
            });
          })
          .catch((err) => {
            console.error('Error fetching Google Maps markers:', err);
            new google.maps.Marker({ position: { lat, lng }, map });
          })
          .finally(() => {
            hideLoader();
          });
      } catch (e) {
        console.error('Google Maps initialization error:', e);
        hideLoader();
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps.');
      loadLeaflet();
    };
    document.head.appendChild(script);
  };

  if (provider === 'google') {
    loadGoogleMaps();
  } else {
    loadLeaflet();
  }
};

try {
  initContentMap();
} catch (err) {
  console.error('Error in content-map initialization:', err);
}
