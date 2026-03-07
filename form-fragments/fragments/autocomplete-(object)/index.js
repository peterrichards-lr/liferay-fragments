const initAutocomplete = () => {
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
    const apiPath = configuration.apiPath;
    const searchParam = configuration.searchParam;
    const valueField = configuration.valueField;
    const labelField = configuration.labelField;
    const inputFieldId = configuration.inputFieldId;

    const input = fragmentElement.querySelector("input");
    const list = fragmentElement.querySelector("ul");

    if (input && list) {
      const getItems = async (searchValue) => {
        if (!isValidIdentifier(searchValue)) return [];

        const response = await Liferay.Util.fetch(
          `${apiPath}?${searchParam}=${searchValue}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        const data = await response.json();
        return data.items;
      };

      const renderList = (items) => {
        list.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item[labelField];
          li.dataset.value = item[valueField];
          li.addEventListener("click", () => {
            input.value = item[labelField];
            const targetInput = document.querySelector(`#${inputFieldId}`);
            if (targetInput) {
              targetInput.value = item[valueField];
              targetInput.dispatchEvent(new Event("change", { bubbles: true }));
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

initAutocomplete();
