const {
  enableDebug: debugEnabled,
  dataLfrJsType: dataType,
  initializeDelay,
  allPortletsReady,
  useConditionField,
  conditionValue
} = configuration;

const getDataAttributes = (el) => {
  const dataAttributes = {}
  const re = /^data\-lfr\-js\-(.+)$/;
  const names = el.getAttributeNames();
  names.forEach((name) => {
    if (re.test(name)) {
      let propertyName = name.replace('data-lfr-js-', '');
      propertyName = propertyName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      dataAttributes[propertyName] = el.getAttribute(name);
    }
  });
  return dataAttributes;
};

const mappings = (() => {
  let mappings = {};
  mappings = { ...getDataAttributes(fragmentElement.querySelector('div')) };

  const mappingArray = Array.from(fragmentElement.querySelectorAll('.config span'));

  for (let mapping of mappingArray) {
    const key = mapping.getAttribute('data-lfr-js-id');
    const type = mapping.getAttribute('data-lfr-js-type');
    const value = mapping.textContent;

    switch (type) {
      case "bool":
        mappings[key] = value === 'true';
        break;
      case "int":
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
    if (debugEnabled) console.debug(`${mappings.fragmentName} ${label}`, ...args);
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
  dataType
});

const storeValue = (key, value) => {
  Liferay.Util.SessionStorage.setItem(
    key,
    value,
    Liferay.Util.SessionStorage.TYPES.FUNCTIONAL
  );
};

const run = () => {
  const isKeySet = mappings?.key !== '*** key not set ***';
  const isValueSet = mappings?.value !== '*** value not set ***';

  if (isKeySet && isValueSet) {
    if (useConditionField) {
      debugWithContext(`testing whether ${mappings.conditionFieldValue} === ${conditionValue}`);
      if (mappings.conditionFieldValue === conditionValue) {
        storeValue(mappings.key, mappings.value);
        debugWithContext(`${mappings.key} set to ${mappings.value}`);
      } else {
        debugWithContext('condition was not met');
      }
    } else {
      storeValue(mappings.key, mappings.value);
      debugWithContext(`${mappings.key} set to ${mappings.value}}`);
    }
  } else if (!isKeySet) {
    debugWithContext('01-key is not set');
  } else {
    debugWithContext('01-value is not set');
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