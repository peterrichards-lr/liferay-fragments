const initAutocompleteObject = () => {
  const { objectERC, inputFieldId } = configuration;

  const autocompleteContainer = fragmentElement.querySelector(".autocomplete");
  const inputElement = fragmentElement.querySelector(".autocomplete-input");
  const resultsList = fragmentElement.querySelector(".autocomplete-results");

  const closeAllLists = () => {
    resultsList.innerHTML = "";
  };

  const getObjectEntries = async (searchValue) => {
    if (!Liferay.Fragment.Commons.isValidIdentifier(objectERC)) return [];

    try {
      // Use Commons for site-scoping discovery
      const { definition, apiPath } =
        await Liferay.Fragment.Commons.resolveObjectPath(
          `/o/c/${objectERC.toLowerCase()}`,
        );

      const url = `${apiPath}/?search=${searchValue}&pageSize=20`;
      const response = await Liferay.Util.fetch(url);
      const data = await response.json();

      const titleField = definition ? definition.titleObjectFieldName : "id";

      return (data.items || []).map((item) => ({
        label: item[titleField] || item.id,
        value: item.id,
      }));
    } catch (error) {
      console.error("Error fetching object entries:", error);
      return [];
    }
  };

  if (inputElement && resultsList) {
    if (Liferay.Fragment.Commons.isValidIdentifier(inputFieldId)) {
      const inputField = document.getElementById(inputFieldId);
      if (inputField) {
        // Initial setup for edit mode/re-hydration
        inputElement.value = inputField.dataset.label || inputField.value;
      }
    }

    inputElement.addEventListener(
      "input",
      Liferay.Fragment.Commons.debounce(async (e) => {
        const searchValue = e.target.value;

        closeAllLists();

        if (!Liferay.Fragment.Commons.isValidIdentifier(searchValue)) return;

        const entries = await getObjectEntries(searchValue);

        entries.forEach((entry) => {
          const listItem = document.createElement("li");
          listItem.innerHTML = entry.label;
          listItem.addEventListener("click", () => {
            inputElement.value = entry.label;
            if (Liferay.Fragment.Commons.isValidIdentifier(inputFieldId)) {
              const inputField = document.getElementById(inputFieldId);
              if (inputField) {
                inputField.value = entry.value;
                inputField.dataset.label = entry.label;
                inputField.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              }
            }
            closeAllLists();
          });
          resultsList.appendChild(listItem);
        });
      }, 300),
    );

    document.addEventListener("click", (e) => {
      if (!autocompleteContainer.contains(e.target)) {
        closeAllLists();
      }
    });
  }
};

initAutocompleteObject();
