const initAutocompletePicklist = () => {
  if (layoutMode !== "preview") {
    const listTypeDefinitionERC = configuration.listTypeDefinitionERC;
    const inputFieldId = configuration.inputFieldId;

    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");

    if (input && list) {
      const getItems = async (searchValue) => {
        const response = await Liferay.Util.fetch(
          `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${listTypeDefinitionERC}/list-type-entries?search=${searchValue}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch picklist items");
        }
        const data = await response.json();
        return data.items;
      };

      const renderList = (items) => {
        list.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item.name_i18n;
          li.dataset.key = item.key;
          li.addEventListener("click", () => {
            input.value = item.name_i18n;
            const targetInput = document.querySelector(`#${inputFieldId}`);
            if (targetInput) {
              targetInput.value = item.key;
              targetInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            list.style.display = "none";
          });
          list.appendChild(li);
        });
        list.style.display = items.length > 0 ? "block" : "none";
      };

      input.addEventListener("input", async (e) => {
        const searchValue = e.target.value;
        if (searchValue.length >= 1) {
          try {
            const items = await getItems(searchValue);
            renderList(items);
          } catch (error) {
            console.error(error);
          }
        } else {
          list.style.display = "none";
        }
      });

      document.addEventListener("click", (e) => {
        if (!fragmentElement.contains(e.target)) {
          list.style.display = "none";
        }
      });
    }
  }
};

initAutocompletePicklist();
