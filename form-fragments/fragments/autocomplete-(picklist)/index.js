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

    const container = fragmentElement.querySelector(".autocomplete");
    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");

    let focusedIndex = -1;

    const toggleList = (show) => {
      if (!list || !container) return;
      if (show) {
        list.classList.remove("d-none");
        container.setAttribute("aria-expanded", "true");
      } else {
        list.classList.add("d-none");
        container.setAttribute("aria-expanded", "false");
        focusedIndex = -1;
        input.removeAttribute("aria-activedescendant");
      }
    };

    const selectItem = (item) => {
      const label = item.name_i18n || item.name || "Unnamed";
      const value = item.key || item.externalReferenceCode || "";
      input.value = label;
      if (isValidIdentifier(inputFieldId)) {
        const targetInput = document.querySelector(`#${inputFieldId}`);
        if (targetInput) {
          targetInput.value = value;
          targetInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      toggleList(false);
    };

    const updateFocus = () => {
      const items = list.querySelectorAll("li");
      items.forEach((li, index) => {
        if (index === focusedIndex) {
          li.classList.add("autocomplete-active");
          input.setAttribute("aria-activedescendant", li.id);
          li.scrollIntoView({ block: "nearest" });
        } else {
          li.classList.remove("autocomplete-active");
        }
      });
    };

    const renderList = (items) => {
      list.innerHTML = "";
      focusedIndex = -1;
      items.forEach((item, index) => {
        const li = document.createElement("li");
        li.id = `${fragmentNamespace}_item_${index}`;
        li.role = "option";
        li.textContent = item.name_i18n || item.name || "Unnamed";
        li.addEventListener("click", () => selectItem(item));
        list.appendChild(li);
      });
      toggleList(items.length > 0);
    };

    const getItems = async (searchValue) => {
      if (!isValidIdentifier(picklistERC)) return [];

      try {
        const response = await Liferay.Util.fetch(
          `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries?search=${searchValue}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch picklist items");
        }
        const data = await response.json();
        return data.items || [];
      } catch (err) {
        console.error(err);
        return [];
      }
    };

    if (input && list) {
      input.addEventListener(
        "input",
        debounce(async (e) => {
          const searchValue = e.target.value;
          if (searchValue.length >= 1) {
            const items = await getItems(searchValue);
            renderList(items);
          } else {
            toggleList(false);
          }
        }, 300),
      );

      input.addEventListener("keydown", (e) => {
        const items = list.querySelectorAll("li");
        if (!items.length) return;

        if (e.key === "ArrowDown") {
          focusedIndex = (focusedIndex + 1) % items.length;
          updateFocus();
          e.preventDefault();
        } else if (e.key === "ArrowUp") {
          focusedIndex = (focusedIndex - 1 + items.length) % items.length;
          updateFocus();
          e.preventDefault();
        } else if (e.key === "Enter") {
          if (focusedIndex > -1) {
            items[focusedIndex].click();
            e.preventDefault();
          }
        } else if (e.key === "Escape") {
          toggleList(false);
        }
      });

      document.addEventListener("click", (e) => {
        if (!fragmentElement.contains(e.target)) {
          toggleList(false);
        }
      });
    }
  }
};

initAutocompletePicklist();
