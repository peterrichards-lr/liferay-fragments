const currentLength = fragmentElement.querySelector(
  `#${fragmentNamespace}-current-length`
);
const formGroup = fragmentElement.querySelector(`#${fragmentNamespace}-form-group`);
const lengthInfo = fragmentElement.querySelector(`#${fragmentNamespace}-length-info`);
const lengthWarning = fragmentElement.querySelector(
  `#${fragmentNamespace}-length-warning`
);
const lengthWarningText = fragmentElement.querySelector(
  `#${fragmentNamespace}-length-warning-text`
);
const inputElement = fragmentElement.querySelector(`#${fragmentNamespace}-text-input`);

function enableLenghtWarning() {
  formGroup.classList.add('has-error');
  lengthInfo.classList.add('text-danger', 'font-weight-semi-bold');
  lengthWarning.classList.remove('sr-only');

  const warningText = lengthWarningText.getAttribute('data-error-message');
  lengthWarningText.innerText = warningText;

  if (!configuration.showCharactersCount) {
    lengthInfo.classList.remove('sr-only');
  }
}

function disableLengthWarning() {
  formGroup.classList.remove('has-error');
  lengthInfo.classList.remove('text-danger', 'font-weight-semi-bold');
  lengthWarning.classList.add('sr-only');

  const validText = lengthWarningText.getAttribute('data-valid-message');
  lengthWarningText.innerText = validText;

  if (!configuration.showCharactersCount) {
    lengthInfo.classList.add('sr-only');
  }
}

function onInputKeyup(event) {
  const length = event.target.value.length;

  currentLength.innerText = length;

  if (length > input.attributes.maxLength) {
    enableLenghtWarning();
  }
  else if (formGroup.classList.contains('has-error')) {
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
}

function applyTemplate(template, values) {
  return template.replace(/\{([^{}]+)\}/g, (match, key) => {
    return key in values ? values[key] : match;
  });
}

function main() {
  if (layoutMode === 'edit' && inputElement) {
    inputElement.setAttribute('disabled', true);
  }
  else {
    if (configuration.deriveValue) {
      const setDeriveValue = (template, tokenValues) => {
        let value = applyTemplate(template, tokenValues);
        inputElement.value = value;
      };

      const template = configuration.deriveValueTemplate;
      const inputFieldNames = extractInputFieldNames(template);
      const form = fragmentElement.closest('form');
      const nameValues = {};
      inputFieldNames.forEach((inputFieldName) => {
        const inputField = form.querySelector(`input[name='${inputFieldName}']`);
        nameValues[inputFieldName] = inputField.value;
        inputField.addEventListener('input', (e) => {
          nameValues[e.target.name] = e.target.value;
          setDeriveValue(template, nameValues);
        });
      });
      setDeriveValue(template, nameValues);
    }

    currentLength.innerText = inputElement.value.length;

    if (inputElement.value.length > input.attributes.maxLength) {
      enableLenghtWarning();
    }

    inputElement.addEventListener('keyup', onInputKeyup);
  }
}

main();