const initFormPopulator = () => {
  if (layoutMode !== "view") return;

  const waitInterval = configuration.waitIntervalMs || 500;
  const waitCount = (configuration.waitCount || 10) - 1;
  const enableDebug = configuration.enableDebug;
  const typeTextDelay = configuration.typeTextDelay || 50;

  const search = location.search.substring(1);
  if (!search) {
    if (enableDebug)
      console.debug("There is no query string, so nothing to do");
    return;
  }

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  if (!configuration.fieldMapping) {
    console.error("Field mapping has not been configured.");
    return;
  }

  if (!isJsonString(configuration.fieldMapping)) {
    console.error("Field mapping is not in JSON format.");
    return;
  }

  const fieldMapping = JSON.parse(configuration.fieldMapping);
  if (!Array.isArray(fieldMapping)) {
    console.error("Field mapping is not an array.");
    return;
  }

  const setNativeValue = (el, value) => {
    const previousValue = el.value;

    if (el.type === "checkbox" || el.type === "radio") {
      if ((!!value && !el.checked) || (!!!value && el.checked)) {
        el.click();
      }
    } else el.value = value;

    const tracker = el._valueTracker;
    if (tracker) {
      tracker.setValue(previousValue);
    }

    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const populateFieldRetry = (
    config,
    fieldSelectorCallback,
    fieldSetterCallback,
  ) => {
    let c = 0;
    const intervalHandle = setInterval(() => {
      if (enableDebug)
        console.debug(
          config.fieldReference +
            " - retry : " +
            (c + 1) +
            " out of " +
            (waitCount + 1),
        );
      let field = fieldSelectorCallback(config);
      if (field) {
        clearInterval(intervalHandle);
        fieldSetterCallback(field, config);
        return;
      }
      c++;
      if (c > waitCount) {
        clearInterval(intervalHandle);
        if (enableDebug)
          console.debug(
            config.fieldReference + " - unable to find within given bounds",
          );
        return;
      }
    }, waitInterval);
  };

  const defaultFieldSelector = (config) => {
    const fieldDivSelector =
      "div[data-field-name='" + config.fieldReference + "']";
    const fieldDiv = document.querySelector(fieldDivSelector);
    if (!fieldDiv) return null;
    const selector = "input:not([type=hidden])";
    return fieldDiv.querySelector(selector);
  };

  const defaultFieldSetter = (field, config) => {
    if (config && config["fieldValue"]) {
      setNativeValue(field, config.fieldValue);
    }
  };

  const selectFieldSelector = (config) => {
    const fieldDivSelector =
      "div.dropdown-menu.ddm-btn-full.ddm-select-dropdown";
    const fieldDivs = document.querySelectorAll(fieldDivSelector);
    let fieldDiv;

    if (fieldDivs.length === 0) {
      return null;
    } else if (fieldDivs.length === 1) {
      fieldDiv = fieldDivs.item(0);
    } else if (fieldDivs.length > 1 && config["fieldConfig"]) {
      const index = (config.fieldConfig.listPosition || 1) - 1;
      fieldDiv = fieldDivs.item(index);
    }

    if (!fieldDiv) return null;

    if (config["fieldValue"]) {
      const selector =
        "button[label='" + config.fieldValue + "'][class='dropdown-item']";
      return fieldDiv.querySelector(selector);
    }
    return null;
  };

  const selectFieldSetter = (field) => {
    if (field && typeof field["click"] === "function") {
      field.click();
    }
  };

  const populateFields = (mapping) => {
    if (
      !mapping["parameter"] ||
      !mapping["fieldReference"] ||
      !mapping["fieldType"]
    )
      return;

    const urlParams = new URLSearchParams(window.location.search);
    const fieldValue = urlParams.get(mapping.parameter);

    if (!fieldValue) return;

    let fieldSelectorFunc;
    let fieldSetterFunc;

    switch (mapping.fieldType) {
      case "selectFromList":
        fieldSelectorFunc = selectFieldSelector;
        fieldSetterFunc = selectFieldSetter;
        break;
      default:
        fieldSelectorFunc = defaultFieldSelector;
        fieldSetterFunc = defaultFieldSetter;
        break;
    }

    populateFieldRetry(
      {
        fieldReference: mapping.fieldReference,
        fieldValue,
        fieldConfig: mapping.fieldConfig,
      },
      fieldSelectorFunc,
      fieldSetterFunc,
    );
  };

  Liferay.on("allPortletsReady", () => {
    fieldMapping.map(populateFields);
  });
};

initFormPopulator();
