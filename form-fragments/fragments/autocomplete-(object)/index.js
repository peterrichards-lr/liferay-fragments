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

    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");
    const errorContainer = fragmentElement.querySelector(".error-container");

    let apiPath = "";

    const showError = (msg) => {
      if (errorContainer) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove("d-none");
      }
    };

    const resolveApiPath = async () => {
      if (!isValidIdentifier(objectERC)) {
        return;
      }

      try {
        const response = await Liferay.Util.fetch(
          `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
        );
        if (!response.ok) throw new Error("Failed to fetch object definition");

        const definition = await response.json();
        let path = definition.restContextPath;

        if (definition.scope === "site") {
          const siteId = Liferay.ThemeDisplay.getScopeGroupId();
          path += `/scopes/${siteId}`;
        }

        apiPath = path;
      } catch (err) {
        console.error(err);
        showError("Error: Could not resolve object API path.");
      }
    };

    if (input && list) {
      const getItems = async (searchValue) => {
        if (!isValidIdentifier(searchValue)) return [];
        if (!apiPath) await resolveApiPath();
        if (!apiPath) return [];

        try {
          const response = await Liferay.Util.fetch(
            `${apiPath}?search=${searchValue}`,
          );
          if (!response.ok) {
            throw new Error("Failed to fetch items");
          }
          const data = await response.json();
          return data.items || [];
        } catch (err) {
          console.error(err);
          return [];
        }
      };

      const renderList = (items) => {
        list.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          const label = item[objectField] || "Unnamed";
          const value = item[valueField] || item.id || "";

          li.textContent = label;
          li.dataset.value = value;
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
        if (searchValue.length >= 3) {
          const items = await getItems(searchValue);
          renderList(items);
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

      // Initial resolve
      resolveApiPath();
    }
  }
};

initAutocomplete();
