const initPopulateSelect = () => {
  const {
    useStorageValue,
    storageKeyPrefix,
    useSpecificStorageKey,
    specificStorageKey,
  } = configuration;

  const isRTL = document.documentElement.classList.contains("rtl");

  const buttonElement = fragmentElement.querySelector(".btn");
  const dropdownElement = fragmentElement.querySelector(".dropdown-menu");
  const optionListElement = fragmentElement.querySelector(".list-unstyled");

  const chooseOptionElement = fragmentElement.querySelector(
    ".select-from-list [id$='choose-option-message']",
  );
  const labelInputElement = fragmentElement.querySelector(
    "input[id$='label-input']",
  );
  const loadingResultsElement = fragmentElement.querySelector(
    "[id$='loading-results-message']",
  );
  const noResultsElement = fragmentElement.querySelector(
    "[id$='no-results-message']",
  );
  const uiInputElement = fragmentElement.querySelector(
    "input[id$='select-from-list-input']",
  );
  const valueInputElement = fragmentElement.querySelector(
    "input[id$='value-input']",
  );

  // Fallback to document for safety if fragmentElement fails for some reason
  const getById = (id) =>
    fragmentElement.querySelector(`#${id}`) || document.getElementById(id);

  const KEYS = {
    ArrowDown: "ArrowDown",
    ArrowUp: "ArrowUp",
    End: "End",
    Enter: "Enter",
    Home: "Home",
  };

  let lastSearchAbortController = new AbortController();
  let lastSearchQuery = null;

  // input global might be problematic if not defined, but it seems to be part of Liferay fragment context for form fields
  // If it's not defined, we should check attributes on uiInputElement
  const optionsAttr =
    (uiInputElement && uiInputElement.attributes.options) || [];
  const optionList = optionsAttr.map((option) => ({
    textContent: option.label,
    textValue: option.label.toLowerCase(),
    value: option.value,
  }));

  function debounce(fn, delay) {
    let debounceId = null;
    return function (...args) {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => fn(...args), delay);
    };
  }

  function handleResultListClick(event) {
    let selectedOptionElement = null;
    if (event.target.matches(".dropdown-item")) {
      selectedOptionElement = event.target;
    } else if (event.target.closest(".dropdown-item")) {
      selectedOptionElement = event.target.closest(".dropdown-item");
    }

    if (selectedOptionElement) {
      setFocusedOption(selectedOptionElement, { scrollToElement: false });
      setSelectedOption(selectedOptionElement);
    }
  }

  function handleInputBlur() {
    if (uiInputElement && labelInputElement) {
      uiInputElement.value = labelInputElement.value;
    }
    if (checkIsOpenDropdown()) {
      setTimeout(() => closeDropdown(), 500);
    }
  }

  function handleResultListBlur() {
    if (checkIsOpenDropdown()) {
      setTimeout(() => closeDropdown(), 500);
    }
  }

  function handleInputKeyDown(event) {
    if (!optionListElement || !optionListElement.firstElementChild) {
      return;
    }

    const currentFocusedOption = getById(
      optionListElement.getAttribute("aria-activedescendant"),
    );

    if (KEYS[event.key]) {
      openDropdown();
      event.preventDefault();
    }

    if (event.key === KEYS.ArrowDown && !event.altKey) {
      if (currentFocusedOption) {
        setFocusedOption(
          currentFocusedOption.nextElementSibling ||
            optionListElement.firstElementChild,
        );
      } else {
        setFocusedOption(optionListElement.firstElementChild);
      }
    } else if (event.key === KEYS.ArrowUp) {
      if (currentFocusedOption) {
        setFocusedOption(
          currentFocusedOption.previousElementSibling ||
            optionListElement.lastElementChild,
        );
      } else {
        setFocusedOption(optionListElement.lastElementChild);
      }
    } else if (event.key === KEYS.Home) {
      setFocusedOption(optionListElement.firstElementChild);
    } else if (event.key === KEYS.End) {
      setFocusedOption(optionListElement.lastElementChild);
    } else if (event.key === KEYS.Enter && currentFocusedOption) {
      setFocusedOption(currentFocusedOption);
      setSelectedOption(currentFocusedOption);
    }
  }

  function handleInputChange() {
    if (!uiInputElement) return;
    const filterValue = uiInputElement.value.toLowerCase();

    if (filterValue !== lastSearchQuery) {
      openDropdown();
      lastSearchQuery = filterValue;
      if (chooseOptionElement) chooseOptionElement.classList.add("d-none");
      if (loadingResultsElement)
        loadingResultsElement.classList.remove("d-none");

      filterOptions(filterValue).then((filteredOptions) => {
        if (loadingResultsElement)
          loadingResultsElement.classList.add("d-none");
        renderOptionList(filteredOptions);

        if (optionListElement && optionListElement.firstElementChild) {
          if (chooseOptionElement)
            chooseOptionElement.classList.remove("d-none");
          if (noResultsElement) noResultsElement.classList.add("d-none");
          setFocusedOption(optionListElement.firstElementChild, {
            scrollToElement: false,
          });
        } else {
          if (chooseOptionElement) chooseOptionElement.classList.add("d-none");
          if (noResultsElement) noResultsElement.classList.remove("d-none");
        }
      });
    }
  }

  function filterOptions(query) {
    return new Promise((resolve) => {
      // Check for relationshipURL attribute on the UI input element
      const relationshipURL =
        uiInputElement && uiInputElement.getAttribute("relationshipurl");
      if (relationshipURL) {
        lastSearchAbortController.abort();
        lastSearchAbortController = new AbortController();
        filterRemoteOptions(query, lastSearchAbortController).then(resolve);
      } else if (query) {
        resolve(filterLocalOptions(query));
      } else {
        resolve(optionList);
      }
    });
  }

  function filterLocalOptions(query) {
    const options = [];
    optionList.forEach((option) => {
      if (!option.value) return;
      if (option.textValue.startsWith(query)) {
        options.push(option);
      }
    });
    optionList.forEach((option) => {
      if (!option.value) return;
      if (option.textValue.includes(query) && !options.includes(option)) {
        options.push(option);
      }
    });
    return options;
  }

  function filterRemoteOptions(query, abortController) {
    if (!uiInputElement) return Promise.resolve({ items: [] });

    const relationshipLabelFieldName = uiInputElement.getAttribute(
      "relationshiplabelfieldname",
    );
    const relationshipURL = uiInputElement.getAttribute("relationshipurl");
    const relationshipValueFieldName = uiInputElement.getAttribute(
      "relationshipvaluefieldname",
    );

    if (
      !relationshipLabelFieldName ||
      !relationshipURL ||
      !relationshipValueFieldName
    ) {
      return Promise.resolve({ items: [] });
    }

    const url = new URL(relationshipURL);
    url.searchParams.set("search", query);

    return Liferay.Util.fetch(url, {
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      method: "GET",
      signal: abortController.signal,
    })
      .then((response) => response.json())
      .then((result) => {
        return result.items.map((entry) => {
          let label = entry[relationshipLabelFieldName];
          if (Array.isArray(label)) {
            label = label.map((label) => label.name).join(", ");
          } else if (typeof label === "object") {
            label = label.name;
          }
          return {
            textContent: label,
            textValue: label,
            value: `${entry[relationshipValueFieldName]}`,
          };
        });
      });
  }

  function handleWindowResizeOrScroll() {
    if (!document.body.contains(fragmentElement)) {
      window.removeEventListener("resize", handleWindowResizeOrScroll);
      window.removeEventListener("scroll", handleWindowResizeOrScroll);
      if (document.body.contains(dropdownElement)) {
        dropdownElement.parentElement.removeChild(dropdownElement);
      }
      return;
    }
    if (checkIsOpenDropdown()) {
      repositionDropdownElement();
    }
  }

  function setFocusedOption(
    optionElement,
    { scrollToElement = true } = { scrollToElement: true },
  ) {
    if (!optionListElement) return;

    const currentFocusedOption = getById(
      optionListElement.getAttribute("aria-activedescendant"),
    );
    if (currentFocusedOption) {
      currentFocusedOption.removeAttribute("aria-selected");
    }
    if (optionElement) {
      optionListElement.setAttribute("aria-activedescendant", optionElement.id);
      optionElement.setAttribute("aria-selected", "true");
      if (scrollToElement) {
        optionElement.scrollIntoView({ block: "nearest" });
      }
    } else {
      optionListElement.removeAttribute("aria-activedescendant");
    }
  }

  function createOptionElement(option) {
    const optionElement = document.createElement("li");
    optionElement.dataset.optionLabel = option.textContent;
    optionElement.dataset.optionValue = option.value;
    optionElement.id = `${fragmentEntryLinkNamespace}-option-${option.value}`;
    optionElement.textContent = option.textContent;
    optionElement.classList.add("dropdown-item");
    optionElement.setAttribute("role", "option");
    if (
      optionListElement &&
      optionListElement.getAttribute("aria-activedescendant") ===
        optionElement.id
    ) {
      optionElement.setAttribute("aria-selected", "true");
      optionElement.scrollIntoView({ block: "nearest" });
    }
    if (valueInputElement && valueInputElement.value === option.value) {
      optionElement.classList.add("active");
    }
    return optionElement;
  }

  function setSelectedOption(optionElement) {
    closeDropdown();
    if (!valueInputElement) return;

    const selectedOption = getById(
      `${fragmentEntryLinkNamespace}-option-${valueInputElement.value}`,
    );
    if (selectedOption) {
      selectedOption.classList.remove("active");
    }
    lastSearchQuery = optionElement.textContent.toLowerCase();
    optionElement.classList.add("active");
    if (labelInputElement)
      labelInputElement.value = optionElement.dataset.optionLabel;
    if (uiInputElement)
      uiInputElement.value = optionElement.dataset.optionLabel;
    valueInputElement.value = optionElement.dataset.optionValue;
  }

  function checkIsOpenDropdown() {
    if (!uiInputElement || !buttonElement) return false;
    return (
      uiInputElement.getAttribute("aria-expanded") === "true" &&
      buttonElement.getAttribute("aria-expanded") === "true"
    );
  }

  function openDropdown() {
    const relationshipURL =
      uiInputElement && uiInputElement.getAttribute("relationshipurl");
    if (!relationshipURL && !optionList.length) {
      return;
    }
    if (dropdownElement) dropdownElement.classList.replace("d-none", "show");
    if (uiInputElement) uiInputElement.setAttribute("aria-expanded", "true");
    if (buttonElement) buttonElement.setAttribute("aria-expanded", "true");
    const wrapperWidth = `${fragmentElement.getBoundingClientRect().width}px`;
    if (dropdownElement) {
      dropdownElement.style.maxWidth = wrapperWidth;
      dropdownElement.style.minWidth = wrapperWidth;
      dropdownElement.style.width = wrapperWidth;
    }
    requestAnimationFrame(() => {
      handleInputChange();
      repositionDropdownElement();
    });
  }

  function closeDropdown() {
    if (dropdownElement) dropdownElement.classList.replace("show", "d-none");
    if (uiInputElement) uiInputElement.setAttribute("aria-expanded", "false");
    if (buttonElement) buttonElement.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    if (checkIsOpenDropdown()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function repositionDropdownElement() {
    if (!uiInputElement) return;
    const uiInputRect = uiInputElement.getBoundingClientRect();
    if (document.body.contains(fragmentElement)) {
      if (fragmentElement.contains(dropdownElement)) {
        document.body.appendChild(dropdownElement);
      }
    } else if (document.body.contains(dropdownElement)) {
      dropdownElement.parentNode.removeChild(dropdownElement);
    }
    if (dropdownElement) {
      dropdownElement.style.transform = `
				translateX(${(isRTL ? uiInputRect.right - window.innerWidth : uiInputRect.left) + window.scrollX}px)
				translateY(${uiInputRect.bottom + window.scrollY}px)
			`;
    }
  }

  function renderOptionList(options) {
    if (!optionListElement) return;
    optionListElement.innerHTML = "";
    options.forEach((option) =>
      optionListElement.appendChild(createOptionElement(option)),
    );
  }

  const retriveStorageValue = (key) => {
    return Liferay.Util.SessionStorage.getItem(
      key,
      Liferay.Util.SessionStorage.TYPES.PERSONALIZATION,
    );
  };

  const convertCase = (str, targetCase) => {
    const words = str
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[-_]/g, " ")
      .toLowerCase()
      .split(/\s+/);

    switch (targetCase) {
      case "camel":
        return words
          .map((word, i) =>
            i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
          )
          .join("");
      case "kebab":
        return words.join("-");
      case "snake":
        return words.join("_");
      default:
        throw new Error(`Unsupported target case: ${targetCase}`);
    }
  };

  const setSelectedOptionByValue = (value) => {
    const searchValue = value.replace(/\s+/g, "");
    const selectedOption = optionList.find(
      (option) => option.value === searchValue,
    );

    if (selectedOption) {
      lastSearchQuery = selectedOption.label.toLowerCase();
      if (valueInputElement) valueInputElement.value = selectedOption.value;
      const selectedOptionElement = optionListElement
        ? optionListElement.querySelector(
            `.dropdown-item[data-option-value='${value}']`,
          )
        : null;
      if (selectedOptionElement) {
        setSelectedOption(selectedOptionElement);
      }
    }
  };

  // Initialization
  if (layoutMode === "edit") {
    if (buttonElement) buttonElement.setAttribute("disabled", true);
    if (uiInputElement) uiInputElement.setAttribute("disabled", true);
  }

  if (buttonElement) {
    buttonElement.addEventListener("click", toggleDropdown);
    buttonElement.addEventListener("blur", handleResultListBlur);
  }
  if (uiInputElement) {
    uiInputElement.addEventListener("click", toggleDropdown);
    uiInputElement.addEventListener("input", debounce(handleInputChange, 1000));
    uiInputElement.addEventListener("blur", handleInputBlur);
    uiInputElement.addEventListener("keydown", handleInputKeyDown);
  }
  if (optionListElement) {
    optionListElement.addEventListener("click", handleResultListClick);
  }

  window.addEventListener("resize", handleWindowResizeOrScroll, {
    passive: true,
  });
  window.addEventListener("scroll", handleWindowResizeOrScroll, {
    passive: true,
  });

  // input global might not exist if not in standard Liferay context
  const initialValue =
    (uiInputElement && uiInputElement.getAttribute("value")) || "";

  if (useStorageValue && !initialValue) {
    const inputName = uiInputElement ? uiInputElement.getAttribute("name") : "";
    if (inputName) {
      const storageKey = useSpecificStorageKey
        ? specificStorageKey
        : `${storageKeyPrefix}_${convertCase(inputName, "snake")}`;
      const value = retriveStorageValue(storageKey);
      if (value) {
        setSelectedOptionByValue(value);
      }
    }
  } else if (initialValue) {
    setSelectedOptionByValue(initialValue);
  }
};

initPopulateSelect();
