const initTextDerivedValue = () => {
  const getById = (idSuffix) =>
    fragmentElement.querySelector(`[id$='${idSuffix}']`);

  const currentLength = getById("current-length");
  const formGroup = getById("form-group");
  const lengthInfo = getById("length-info");
  const lengthWarning = getById("length-warning");
  const lengthWarningText = getById("length-warning-text");
  const inputElement = getById("text-input");

  if (!inputElement) return;

  function enableLengthWarning() {
    if (formGroup) formGroup.classList.add("has-error");
    if (lengthInfo)
      lengthInfo.classList.add("text-danger", "font-weight-semi-bold");
    if (lengthWarning) lengthWarning.classList.remove("sr-only");

    if (lengthWarningText) {
      const warningText = lengthWarningText.getAttribute("data-error-message");
      lengthWarningText.innerText = warningText;
    }

    if (!configuration.showCharactersCount && lengthInfo) {
      lengthInfo.classList.remove("sr-only");
    }
  }

  function disableLengthWarning() {
    if (formGroup) formGroup.classList.remove("has-error");
    if (lengthInfo)
      lengthInfo.classList.remove("text-danger", "font-weight-semi-bold");
    if (lengthWarning) lengthWarning.classList.add("sr-only");

    if (lengthWarningText) {
      const validText = lengthWarningText.getAttribute("data-valid-message");
      lengthWarningText.innerText = validText;
    }

    if (!configuration.showCharactersCount && lengthInfo) {
      lengthInfo.classList.add("sr-only");
    }
  }

  function onInputKeyup(event) {
    const length = event.target.value.length;
    if (currentLength) currentLength.innerText = length;

    // input.attributes might be provided by Liferay context
    const maxLength =
      (typeof input !== "undefined" && input.attributes.maxLength) || 0;

    if (maxLength > 0 && length > maxLength) {
      enableLengthWarning();
    } else if (formGroup && formGroup.classList.contains("has-error")) {
      disableLengthWarning();
    }
  }

  const extractInputFieldNames = (template) => {
    const regex = /\{([^{}]+)\}/g;
    const inputFieldNames = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      inputFieldNames.push(match[1]);
    }
    return inputFieldNames;
  };

  function applyTemplate(template, values) {
    return template.replace(/\{([^{}]+)\}/g, (match, key) => {
      return key in values ? values[key] : match;
    });
  }

  if (layoutMode === "edit") {
    inputElement.setAttribute("disabled", true);
  } else {
    if (configuration.deriveValue) {
      const template = configuration.deriveValueTemplate;
      if (template) {
        const inputFieldNames = extractInputFieldNames(template);
        const form =
          fragmentElement.closest("form") || document.querySelector("form");
        const nameValues = {};

        const setDerivedValue = () => {
          inputElement.value = applyTemplate(template, nameValues);
          if (currentLength)
            currentLength.innerText = inputElement.value.length;
        };

        if (form) {
          inputFieldNames.forEach((name) => {
            const field = form.querySelector(`[name='${name}']`);
            if (field) {
              nameValues[name] = field.value || "";
              field.addEventListener("input", (e) => {
                nameValues[name] = e.target.value;
                setDerivedValue();
              });
            }
          });
          setDerivedValue();
        }
      }
    }

    if (currentLength) currentLength.innerText = inputElement.value.length;
    inputElement.addEventListener("keyup", onInputKeyup);
  }
};

initTextDerivedValue();
