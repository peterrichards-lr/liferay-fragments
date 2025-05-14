const rangeInput = fragmentElement.querySelector(
  `#${fragmentNamespace}-range-input`
);

const valueLabel = fragmentElement.querySelector('label span.value');

const convertCase = (str, targetCase) => {
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase → separate
    .replace(/[-_]/g, ' ')                  // kebab-case / snake_case → separate
    .toLowerCase()
    .split(/\s+/);

  switch (targetCase) {
    case 'camel':
      return words
        .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    case 'kebab':
      return words.join('-');
    case 'snake':
      return words.join('_');
    default:
      throw new Error(`Unsupported target case: ${targetCase}`);
  }
}

const retriveStorageValue = (key) => {
  return Liferay.Util.SessionStorage.getItem(
    key,
    Liferay.Util.SessionStorage.TYPES.PERSONALIZATION
  );
};

function updateValue() {
  const amount = parseFloat(rangeInput.value);
  valueLabel.textContent = amount;
}

if (rangeInput) {
  if (layoutMode === 'edit') {
    rangeInput.setAttribute('disabled', true);
  }
  else if (configuration.displayValue) {
    rangeInput.addEventListener('input', updateValue);
    updateValue()
  }
}

const {
  useStorageValue,
  useSpecificStorageKey,
  specificStorageKey,
  storageKeyPrefix
} = configuration;

if (useStorageValue) {
  const storageKey = useSpecificStorageKey ? specificStorageKey : `${convertCase(storageKeyPrefix, 'snake')}_${convertCase(input.name, 'snake')}`.replace('__', '_');
  const value = retriveStorageValue(storageKey);
  if (value) {
    const amount = parseFloat(value);
    rangeInput.value = amount;
  }
}