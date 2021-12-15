if (!fragmentNamespace) // If it is not set then we are in fragment editor
	return;

if (document.body.classList.contains('has-edit-mode-menu')) // If present then we are in content page editor
	return;

const waitInterval = configuration.waitIntervalMs;
const waitCount = configuration.waitCount - 1;
const enableDebug = configuration.enableDebug;

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
	console.error("Field mapping is not in JSON format. It should be an array of { parameter: '...', fieldReference: '...'} objects, where parameter is the query string parameter and fieldReference is the form Field Reference");
	return;
}

const fieldMapping = JSON.parse(configuration.fieldMapping);
if (!Array.isArray(fieldMapping)) {
	console.error("Field mapping is not an array. It should be an array of { parameter: '...', fieldReference: '...'} objects, where parameter is the query string parameter and fieldReference is the form Field Reference");
	return;
}

const searchObj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
const fieldSelector = "input:not([type=hidden])";
			
const populateFields = (mapping) => {
	if (!mapping["parameter"] || !mapping["fieldReference"])
		return;
	
	const queryStringParameter = mapping.parameter;
	const fieldReference = mapping.fieldReference;	
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
			fieldValue
		});
	
	const fieldDivSelector = "div[data-field-name='" + fieldReference + "']";
	
	const fieldDiv = document.querySelector(fieldDivSelector);
	if (!fieldDiv) {
		if (enableDebug) {
			console.log("Unable to find div wrapper for " + fieldReference);
			return;
		}
	}
	
	let c = 0;
	const timerHandle = setTimeout(() => 
	{
		let field = fieldDiv.querySelector(fieldSelector);	
	  if (field) {
			clearTimeout(timerHandle);
			if (enableDebug)
				console.debug({
					field,
					fieldValue,
					count: c
				});
			field.value = fieldValue;
			return;
		}
		c++;
		if (c > waitCount) {
			clearTimeout(timerHandle);
			if (enableDebug)
				console.debug("Unable to find " + fieldReference + " within given bounds");
			return;
		}
	}, waitInterval)
};

Liferay.on('allPortletsReady', () => {
	fieldMapping.map(populateFields);
});