const initAutocomplete = () => {
  const ADMIN_API_BASE = "/o/object-admin/v1.0";

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
    const { objectERC, objectField, valueField, inputFieldId } = configuration;

    const container = fragmentElement.querySelector(".autocomplete");
    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");
    const errorContainer = fragmentElement.querySelector(".error-container");

    let apiPath = "";
    let focusedIndex = -1;

    const showError = (msg) => {
      if (errorContainer) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove("d-none");
      }
    };

    const resolveApiPath = async () => {
      if (!isValidIdentifier(objectERC)) return;
      try {
        const response = await Liferay.Util.fetch(
          `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
        );
        if (!response.ok) throw new Error("Failed to fetch object definition");
        const definition = await response.json();
        let path = definition.restContextPath;
        if (definition.scope === "site") {
          path += `/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
        }
        apiPath = path;
      } catch (err) {
        console.error(err);
        showError("Error: Could not resolve object API path.");
      }
    };

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
      const label = item[objectField] || "Unnamed";
      const value = item[valueField] || item.id || "";
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
        li.textContent = item[objectField] || "Unnamed";
        li.addEventListener("click", () => selectItem(item));
        list.appendChild(li);
      });
      toggleList(items.length > 0);
    };

    const getItems = async (searchValue) => {
      if (!isValidIdentifier(searchValue)) return [];
      if (!apiPath) await resolveApiPath();
      if (!apiPath) return [];
      try {
        const response = await Liferay.Util.fetch(
          `${apiPath}?search=${searchValue}`,
        );
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        return data.items || [];
      } catch (err) {
        return [];
      }
    };

    if (input && list) {
      input.addEventListener(
        "input",
        debounce(async (e) => {
          const val = e.target.value;
          if (val.length >= 3) {
            const items = await getItems(val);
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
        if (!fragmentElement.contains(e.target)) toggleList(false);
      });

      resolveApiPath();
    }
  }
};

initAutocomplete();
