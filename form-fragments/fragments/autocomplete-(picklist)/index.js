const initAutocompletePicklist = () => {
  const isValidIdentifier = (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    return (
      s !== "" &&
      s !== "undefined" &&
      s !== "null" &&
      s !== "0" &&
      s !== "[object object]"
    );
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  if (layoutMode !== "preview") {
    const { picklistERC, inputFieldId } = configuration;

    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");

    if (input && list) {
      const getItems = async (searchValue) => {
        if (!isValidIdentifier(picklistERC)) return [];

        const response = await Liferay.Util.fetch(
          `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries?search=${searchValue}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch picklist items");
        }
        const data = await response.json();
        return data.items || [];
      };

      const renderList = (items) => {
        list.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          const label = item.name_i18n || item.name || "Unnamed";
          const value = item.key || item.externalReferenceCode || "";

          li.textContent = label;
          li.dataset.key = value;
          li.addEventListener("click", () => {
            input.value = label;
            if (isValidIdentifier(inputFieldId)) {
              const targetInput = document.querySelector(`#${inputFieldId}`);
              if (targetInput) {
                targetInput.value = value;
                targetInput.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              }
            }
            list.style.display = "none";
          });
          list.appendChild(li);
        });
        list.style.display = items.length > 0 ? "block" : "none";
      };

      const handleInput = debounce(async (e) => {
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
      }, 300);

      input.addEventListener("input", handleInput);

      document.addEventListener("click", (e) => {
        if (!fragmentElement.contains(e.target)) {
          list.style.display = "none";
        }
      });
    }
  }
};

initAutocompletePicklist();
