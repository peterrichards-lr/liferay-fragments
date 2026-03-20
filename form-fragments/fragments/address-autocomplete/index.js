const initAddressAutocomplete = () => {
  const inputEl = fragmentElement.querySelector('.address-input');
  const resultsList = fragmentElement.querySelector('.autocomplete-results');

  if (!inputEl || !resultsList) return;

  const closeResults = () => {
    resultsList.classList.add('d-none');
    resultsList.innerHTML = '';
  };

  const fetchOSM = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.map((item) => ({
        label: item.display_name,
        value: item.display_name,
        raw: item,
      }));
    } catch (error) {
      console.error('OSM Fetch Error:', error);
      return [];
    }
  };

  const fetchGoogle = async (query) => {
    // Note: This requires the Google Maps Places library to be loaded or a proxy.
    // For this fragment, we'll focus on OSM as a built-in example.
    console.warn('Google Places requires external script loading.');
    return [];
  };

  if (layoutMode === 'edit') {
    inputEl.disabled = true;
    return;
  }

  inputEl.addEventListener(
    'input',
    Liferay.Fragment.Commons.debounce(async (e) => {
      const query = e.target.value;
      if (query.length < 3) {
        closeResults();
        return;
      }

      let suggestions = [];
      if (configuration.apiProvider === 'osm') {
        suggestions = await fetchOSM(query);
      } else if (configuration.apiProvider === 'google') {
        suggestions = await fetchGoogle(query);
      }

      if (suggestions.length > 0) {
        resultsList.innerHTML = '';
        suggestions.forEach((item) => {
          const li = document.createElement('li');
          li.className = 'suggestion-item';
          li.textContent = item.label;
          li.addEventListener('click', () => {
            const val =
              configuration.storageMode === 'json'
                ? JSON.stringify(item.raw)
                : item.value;
            inputEl.value = item.value;

            // We might want to store the JSON in a hidden field if mapping to text
            // but for now we follow inputEl value.

            closeResults();
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          });
          resultsList.appendChild(li);
        });
        resultsList.classList.remove('d-none');
      } else {
        closeResults();
      }
    }, 400)
  );

  document.addEventListener('click', (e) => {
    if (!fragmentElement.contains(e.target)) {
      closeResults();
    }
  });
};

initAddressAutocomplete();
