const initAutocompletePicklist = () => {
  const { picklistERC, inputFieldId } = configuration;

  const autocompleteContainer = fragmentElement.querySelector('.autocomplete');
  const inputElement = fragmentElement.querySelector('.autocomplete-input');
  const resultsList = fragmentElement.querySelector('.autocomplete-results');

  const closeAllLists = () => {
    resultsList.innerHTML = '';
  };

  const getPicklistEntries = async (searchValue) => {
    if (!Liferay.Fragment.Commons.isValidIdentifier(picklistERC)) return [];

    const url = `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries?search=${searchValue}`;

    try {
      const response = await Liferay.Util.fetch(url);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching picklist entries:', error);
      return [];
    }
  };

  if (inputElement && resultsList) {
    if (Liferay.Fragment.Commons.isValidIdentifier(inputFieldId)) {
      const inputField = document.getElementById(inputFieldId);

      if (inputField) {
        inputElement.value = inputField.value;
      }
    }

    inputElement.addEventListener(
      'input',
      Liferay.Fragment.Commons.debounce(async (e) => {
        const searchValue = e.target.value;

        closeAllLists();

        if (!searchValue) return;

        const entries = await getPicklistEntries(searchValue);

        entries.forEach((entry) => {
          const listItem = document.createElement('li');
          listItem.innerHTML = entry.name;
          listItem.addEventListener('click', () => {
            inputElement.value = entry.name;
            if (Liferay.Fragment.Commons.isValidIdentifier(inputFieldId)) {
              const inputField = document.getElementById(inputFieldId);
              if (inputField) {
                inputField.value = entry.key;
                // Dispatch event for Liferay Forms
                inputField.dispatchEvent(
                  new Event('change', { bubbles: true })
                );
              }
            }
            closeAllLists();
          });
          resultsList.appendChild(listItem);
        });
      }, 300)
    );

    document.addEventListener('click', (e) => {
      if (!autocompleteContainer.contains(e.target)) {
        closeAllLists();
      }
    });
  }
};

initAutocompletePicklist();
