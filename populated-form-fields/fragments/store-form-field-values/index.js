const {
  enableDebug: debugEnabled,
  dataLfrJsType: dataType,
  initializeDelay,
  allPortletsReady,
  fieldsList,
  storageKeyPrefix,
  updateTargetFieldOnly,
} = configuration;

const convertCase = (str, targetCase) => {
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase → separate
    .replace(/[-_]/g, ' ') // kebab-case / snake_case → separate
    .toLowerCase()
    .split(/\s+/);

  switch (targetCase) {
    case 'camel':
      return words
        .map((word, i) =>
          i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
    case 'kebab':
      return words.join('-');
    case 'snake':
      return words.join('_');
    default:
      throw new Error(`Unsupported target case: ${targetCase}`);
  }
};

const getDataAttributes = (el) => {
  const dataAttributes = {};
  const re = /^data\-lfr\-js\-(.+)$/;
  const names = el.getAttributeNames();
  names.forEach((name) => {
    if (re.test(name)) {
      let propertyName = name.replace('data-lfr-js-', '');
      propertyName = convertCase(propertyName, 'camel');
      dataAttributes[propertyName] = el.getAttribute(name);
    }
  });
  return dataAttributes;
};

const mappings = (() => {
  let mappings = {};
  mappings = { ...getDataAttributes(fragmentElement.querySelector('div')) };

  const mappingArray = Array.from(
    fragmentElement.querySelectorAll('.config span')
  );

  for (let mapping of mappingArray) {
    const key = mapping.getAttribute('data-lfr-js-id');
    const type = mapping.getAttribute('data-lfr-js-type');
    const value = mapping.textContent;

    switch (type) {
      case 'bool':
        mappings[key] = value === 'true';
        break;
      case 'int':
        mappings[key] = parseInt(value, 10);
        break;
      default:
        mappings[key] = value;
    }
  }
  return mappings;
})();

const debug = (label, ...args) => {
  if (args.length > 0) {
    if (debugEnabled)
      console.debug(`${mappings.fragmentName} ${label}`, ...args);
  } else {
    if (debugEnabled) console.debug(`${mappings.fragmentName}`, `${label}`);
  }
};

const debugWithContext = (label, ...args) => {
  const context = `${mappings.fragmentUniqueClassName}`;
  debug(`[${context}] ${label}`, ...args);
};

debugWithContext('mappings', mappings);

debugWithContext('configuration', {
  dataType,
});

const storeValue = (key, value) => {
  Liferay.Util.SessionStorage.setItem(
    key,
    value,
    Liferay.Util.SessionStorage.TYPES.FUNCTIONAL
  );
};

const updateValue = (storageKey, inputField) => {
  const value = inputField.value;
  storeValue(storageKey, value);
  debugWithContext(`${storageKey} set to ${value}`);
};

const updateValues = (storageConfigArray) => {
  for (let storageConfig of storageConfigArray) {
    updateValue(storageConfig.storageKey, storageConfig.inputField);
  }
};

const run = () => {
  const fieldsArray = configuration.fieldsList
    .split(',')
    .map((field) => field.trim());
  const dropZone = fragmentElement.querySelector('div:not([class])');
  const inputFields = Array.from(dropZone.querySelectorAll('input'));
  debugWithContext('inputFields', inputFields);
  const storageConfigArray = [];
  for (let inputField of inputFields) {
    if (
      fieldsArray.includes(inputField?.id) > -1 ||
      fieldsArray.includes(inputField?.name) > -1
    ) {
      let storageKey;
      if (fieldsArray.includes(inputField?.id) > -1) {
        storageKey = (
          storageKeyPrefix
            ? `${convertCase(storageKeyPrefix, 'snake')}_${convertCase(
              inputField.id,
              'snake'
            )}`
            : inputField.id
        ).replace('__', '_');
      } else {
        storageKey = (
          storageKeyPrefix
            ? `${convertCase(storageKeyPrefix, 'snake')}_${convertCase(
              inputField.name,
              'snake'
            )}`
            : inputField.name
        ).replace('__', '_');
      }

      if (updateTargetFieldOnly) {
        updateValue(storageKey, inputField);
        inputField.addEventListener('input', (e) => {
          debugWithContext('Event fired for target field', e);
          updateValue(storageKey, e.target);
        });
      } else {
        storageConfigArray.push({
          storageKey,
          inputField,
        });
      }
    }
  }
  if (!updateTargetFieldOnly) {
    debugWithContext('storageConfigArray', storageConfigArray);
    updateValues(storageConfigArray);
    storageConfigArray.forEach((storageConfig) => {
      storageConfig.inputField.addEventListener('input', (e) => {
        debugWithContext('Event fired for all fields', e);
        updateValues(storageConfigArray);
      });
    });
  }
};

if (layoutMode === 'view') {
  if (allPortletsReady) {
    Liferay.on('allPortletsReady', () => {
      setTimeout(() => run(), initializeDelay);
    });
  } else {
    setTimeout(() => run(), initializeDelay);
  }
} else if (layoutMode === 'edit') {
  const config = fragmentElement.querySelector('.config');
  config.style.display = 'block';
}
