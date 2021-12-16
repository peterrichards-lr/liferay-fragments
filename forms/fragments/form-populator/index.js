if (!fragmentNamespace) // If it is not set then we are in fragment editor
	return;

if (document.body.classList.contains('has-edit-mode-menu')) // If present then we are in content page editor
	return;

const waitInterval = configuration.waitIntervalMs;
const waitCount = configuration.waitCount - 1;
const enableDebug = configuration.enableDebug;
const typeTextDelay = configuration.typeTextDelay;

const search = location.search.substring(1);
if (!search) { // If it is not set then there is no query string to map
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
	
if (!configuration.fieldMapping) { // If it is not set then the fragment has not been configured
	console.error("Field mapping has not been configured.");
	return;
}
	
if (!isJsonString(configuration.fieldMapping)) {
	console.error("Field mapping is not in JSON format. It should be an array of { parameter: '...', fieldReference: '...', fieldType: '...'} objects, where parameter is the query string parameter, fieldReference is the form Field Reference and the fieldType is the Field Type");
	return;
}

const fieldMapping = JSON.parse(configuration.fieldMapping);
if (!Array.isArray(fieldMapping)) {
	console.error("Field mapping is not an array. It should be an array of { parameter: '...', fieldReference: '...', fieldType: '...'} objects, where parameter is the query string parameter, fieldReference is the form Field Reference and the fieldType is the Field Type");
	return;
}

const searchObj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

const populateFieldRetry = (config, fieldSelectorCallback, fieldSetterCallback) => {
	if (!(typeof config === 'object') || !(typeof fieldSelectorCallback === 'function') || !(typeof fieldSetterCallback  === 'function')) {
		if (enableDebug)
			console.debug("The parameters passed to populateFieldRetry are incorrect");
		return;
	}
	let c = 0;
	const intervalHandle = setInterval(() => 
	{
		if (enableDebug)
			console.debug(config.fieldReference + " - retry : " + (c + 1) + " out of " + (waitCount + 1));
		let field = fieldSelectorCallback(config);
	  if (field) {
			console.debug(config.fieldReference + " - found field");
			clearInterval(intervalHandle);
			if (enableDebug)
				console.debug({
					field,
					fieldValue: config.fieldValue,
					count: c
				});
			fieldSetterCallback(field, config)
			return;
		}
		c++;
		if (c > waitCount) {
			clearInterval(intervalHandle);
			if (enableDebug)
				console.debug(config.fieldReference + " - unable to find within given bounds");
			return;
		}
	}, waitInterval);
};

const defaultFieldSelector = (config) => {
	if (enableDebug)
		console.debug("defaultFieldSelector");
	if (config && config["rootElement"]) {
		const selector = "input:not([type=hidden])";
		return config.rootElement.querySelector(selector);
	}
};

const typeText = (field, text, current = 0, time = typeTextDelay) => {
  const l = text.length;
	field.value += text[current];
  if(current < l - 1) {
    current++;
    setTimeout(function(){typeText(field, text, current)}, time);
  } else {
    field.setAttribute('value',field.value);
  }
};

const setNativeValue = (el, value) => {
  const previousValue = el.value;

  if (el.type === 'checkbox' || el.type === 'radio') {
    if ((!!value && !el.checked) || (!!!value && el.checked)) {
      el.click();
    }
  } else el.value = value;

  const tracker = el._valueTracker;
  if (tracker) {
    tracker.setValue(previousValue);
  }

  el.dispatchEvent(new Event('change', { bubbles: true }));
};

const defaultFieldSetter = async (field, config) => {
	if (enableDebug)
		console.debug("defaultFieldSetter");
	if (config && config["fieldValue"]) {
		setNativeValue(field, config.fieldValue);
	}
};

const selectFieldSelector = (config) => {
	if (enableDebug)
		console.debug("selectFieldSelector");
	if (config && config["fieldValue"]) {
		const selector = "button[label='" + config.fieldValue + "'][class='dropdown-item']";
		return document.querySelector(selector);
	}
	return null;
};

const selectFieldSetter = (field, config) => {
	if (enableDebug)
		console.debug("selectFieldSetter");
	if (field && typeof field["click"] === 'function');
		field.click();
};

const populateFields = (mapping) => {
	if (!mapping["parameter"] || !mapping["fieldReference"] || !mapping["fieldType"]) {
		if (enableDebug) {
			console.debug("The mapping is missing an attribute");
			console.log(mapping);
		}
		return;
	}
	
	const queryStringParameter = mapping.parameter;
	const fieldReference = mapping.fieldReference;
	const fieldType = mapping.fieldType;
	const fieldValue = searchObj[queryStringParameter];
	
	if (!fieldValue) {
		if (enableDebug)
			console.debug("Query string does not contain value for " + queryStringParameter);
		return;
	}
	
	if (enableDebug)
		console.debug({
			queryStringParameter,
			fieldReference,
			fieldValue,
			fieldType
		});
	
	const fieldDivSelector = "div[data-field-name='" + fieldReference + "']";
	const fieldDiv = document.querySelector(fieldDivSelector);
	
	if (!fieldDiv) {
		if (enableDebug) {
			console.log("Unable to find div wrapper for " + fieldReference);
			return;
		}
	}
	
	let fieldSelectorFunc;
	let fieldSetterFunc;
	
	switch(fieldType) {
		case "selectFromList":
			fieldSelectorFunc = selectFieldSelector;
			fieldSetterFunc = selectFieldSetter;
			break;
		case "numeric":
		case "text":
		case "default":
			fieldSelectorFunc = defaultFieldSelector;
			fieldSetterFunc = defaultFieldSetter;
			break;
	}
	
	populateFieldRetry({
		fieldReference,
		rootElement: fieldDiv,
		fieldValue,
	}, fieldSelectorFunc, fieldSetterFunc);
};

Liferay.on('allPortletsReady', () => {
	fieldMapping.map(populateFields);
});