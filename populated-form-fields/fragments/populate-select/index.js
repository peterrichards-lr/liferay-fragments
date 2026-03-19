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

  const getById = (idSuffix) =>
    fragmentElement.querySelector(`[id$='${idSuffix}']`);

  const chooseOptionElement = getById("choose-option-message");
  const labelInputElement = getById("label-input");
  const loadingResultsElement = getById("loading-results-message");
  const noResultsElement = getById("no-results-message");
  const uiInputElement = getById("select-from-list-input");
  const valueInputElement = getById("value-input");

  if (!uiInputElement || !buttonElement) return;

  if (layoutMode === "edit") {
    buttonElement.setAttribute("disabled", true);
    uiInputElement.setAttribute("disabled", true);
    return;
  }

  const KEYS = {
    ArrowDown: "ArrowDown",
    ArrowUp: "ArrowUp",
    End: "End",
    Enter: "Enter",
    Home: "Home",
    Escape: "Escape",
  };

  let lastSearchAbortController = new AbortController();
  let lastSearchQuery = null;

  // input global might be provided by Liferay, but we use attributes on elements for safety
  const getOptions = () => {
    // Attempt to get options from input context or attributes
    try {
      return (typeof input !== "undefined" && input.attributes.options) || [];
    } catch (e) {
      return [];
    }
  };

  const optionList = getOptions().map((option) => ({
    textContent: option.label,
    textValue: option.label.toLowerCase(),
    value: option.value,
  }));

  const setSelectedOptionByValue = (value) => {
    if (!value) return;
    const searchValue = String(value).replace(/\s+/g, "");
    const options = getOptions();
    const selectedOption = options.find(
      (option) => option.value === searchValue,
    );

    if (selectedOption) {
      lastSearchQuery = selectedOption.label.toLowerCase();
      valueInputElement.value = selectedOption.value;
      labelInputElement.value = selectedOption.label;
      uiInputElement.value = selectedOption.label;
    }
  };

  function handleResultListClick(event) {
    const selectedOptionElement = event.target.closest(".dropdown-item");
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

  function handleInputKeyDown(event) {
    if (!optionListElement || !optionListElement.firstElementChild) return;

    const currentFocusedOption = fragmentElement.querySelector(
      `#${optionListElement.getAttribute("aria-activedescendant")}`,
    );

    if (KEYS[event.key]) {
      openDropdown();
      if (event.key !== "Enter") event.preventDefault();
    }

    if (event.key === KEYS.ArrowDown && !event.altKey) {
      setFocusedOption(
        currentFocusedOption?.nextElementSibling ||
          optionListElement.firstElementChild,
      );
    } else if (event.key === KEYS.ArrowUp) {
      setFocusedOption(
        currentFocusedOption?.previousElementSibling ||
          optionListElement.lastElementChild,
      );
    } else if (event.key === KEYS.Home) {
      setFocusedOption(optionListElement.firstElementChild);
    } else if (event.key === KEYS.End) {
      setFocusedOption(optionListElement.lastElementChild);
    } else if (event.key === KEYS.Enter && currentFocusedOption) {
      setSelectedOption(currentFocusedOption);
    } else if (event.key === KEYS.Escape) {
      closeDropdown();
    }
  }

  function handleInputChange() {
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

        if (optionListElement.firstElementChild) {
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
      const relationshipURL = uiInputElement.getAttribute("relationshipurl");
      if (relationshipURL) {
        lastSearchAbortController.abort();
        lastSearchAbortController = new AbortController();
        filterRemoteOptions(query, lastSearchAbortController).then(resolve);
      } else if (query) {
        const filtered = optionList.filter((opt) =>
          opt.textValue.includes(query),
        );
        resolve(filtered);
      } else {
        resolve(optionList);
      }
    });
  }

  function filterRemoteOptions(query, abortController) {
    const relationshipURL = uiInputElement.getAttribute("relationshipurl");
    const labelField = uiInputElement.getAttribute(
      "relationshiplabelfieldname",
    );
    const valueField = uiInputElement.getAttribute(
      "relationshipvaluefieldname",
    );

    if (!relationshipURL || !labelField || !valueField)
      return Promise.resolve([]);

    const url = new URL(relationshipURL, window.location.origin);
    url.searchParams.set("search", query);

    return Liferay.Util.fetch(url, { signal: abortController.signal })
      .then((res) => res.json())
      .then((result) => {
        return (result.items || []).map((entry) => {
          let label = entry[labelField];
          if (Array.isArray(label)) label = label[0]?.name || "";
          else if (typeof label === "object") label = label.name || "";

          return {
            textContent: label,
            textValue: String(label).toLowerCase(),
            value: String(entry[valueField]),
          };
        });
      });
  }

  function setFocusedOption(el, { scrollToElement = true } = {}) {
    if (!optionListElement) return;
    const current = fragmentElement.querySelector(
      `#${optionListElement.getAttribute("aria-activedescendant")}`,
    );
    if (current) current.removeAttribute("aria-selected");

    if (el) {
      optionListElement.setAttribute("aria-activedescendant", el.id);
      el.setAttribute("aria-selected", "true");
      if (scrollToElement) el.scrollIntoView({ block: "nearest" });
    }
  }

  function setSelectedOption(el) {
    const val = el.dataset.optionValue;
    const label = el.dataset.optionLabel;

    valueInputElement.value = val;
    labelInputElement.value = label;
    uiInputElement.value = label;
    lastSearchQuery = label.toLowerCase();

    closeDropdown();

    // Persist if enabled
    if (useStorageValue) {
      const storageKey = useSpecificStorageKey
        ? specificStorageKey
        : `${storageKeyPrefix}_${uiInputElement.name}`;
      Liferay.Util.SessionStorage.setItem(
        storageKey,
        val,
        Liferay.Util.SessionStorage.TYPES.PERSONALIZATION,
      );
    }

    uiInputElement.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function checkIsOpenDropdown() {
    return uiInputElement.getAttribute("aria-expanded") === "true";
  }

  function openDropdown() {
    dropdownElement.classList.replace("d-none", "show");
    uiInputElement.setAttribute("aria-expanded", "true");
    buttonElement.setAttribute("aria-expanded", "true");
    repositionDropdown();
  }

  function closeDropdown() {
    dropdownElement.classList.replace("show", "d-none");
    uiInputElement.setAttribute("aria-expanded", "false");
    buttonElement.setAttribute("aria-expanded", "false");
  }

  function repositionDropdown() {
    const rect = uiInputElement.getBoundingClientRect();
    dropdownElement.style.width = `${rect.width}px`;
    dropdownElement.style.top = `${rect.bottom + window.scrollY}px`;
    dropdownElement.style.left = `${rect.left + window.scrollX}px`;
  }

  function renderOptionList(options) {
    optionListElement.innerHTML = options
      .map(
        (opt) => `
      <li class="dropdown-item" role="option" id="${fragmentEntryLinkNamespace}-opt-${opt.value}" 
          data-option-value="${opt.value}" data-option-label="${opt.textContent}">
        ${opt.textContent}
      </li>`,
      )
      .join("");
  }

  function debounce(fn, delay) {
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), delay);
    };
  }

  // Initialization
  buttonElement.onclick = () =>
    checkIsOpenDropdown() ? closeDropdown() : openDropdown();
  uiInputElement.onclick = openDropdown;
  uiInputElement.oninput = debounce(handleInputChange, 300);
  uiInputElement.onkeydown = handleInputKeyDown;
  uiInputElement.onblur = handleInputBlur;
  optionListElement.onclick = handleResultListClick;

  if (useStorageValue) {
    const storageKey = useSpecificStorageKey
      ? specificStorageKey
      : `${storageKeyPrefix}_${uiInputElement.name}`;
    const storedVal = Liferay.Util.SessionStorage.getItem(
      storageKey,
      Liferay.Util.SessionStorage.TYPES.PERSONALIZATION,
    );
    if (storedVal) setSelectedOptionByValue(storedVal);
  }

  renderOptionList(optionList);
};

initPopulateSelect();
