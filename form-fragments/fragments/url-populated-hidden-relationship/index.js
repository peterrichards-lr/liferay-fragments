if (layoutMode === 'view') {
	const urlParams = new URLSearchParams(document.location.search);
	
	let id = null;
	if (configuration.sourceMethod === 'path') {
		const pathPosition = configuration.pathPosition;
		const pathTokens = document.location.pathname.split('/')
		if (pathTokens && !isNaN(pathPosition)) {
			id = pathTokens.slice(pathPosition)[0];
		}
	} else if (configuration.sourceMethod === 'queryString') {
		const idParameter = configuration.idParameter;
		id = urlParams.get(idParameter);
	} else {
		console.warn(`Unknown sourceMethod: ${sourceMethod}`);
	}

	if (id) {
		const inputField = fragmentElement.querySelector(`input[name='${input.name}']`);
		if (inputField) inputField.value = id;
	} else {
		console.warn('id not set');
	}
	
	const labelParameter = configuration.labelParameter;
	const label = urlParams.get(labelParameter);
	
	if (label) {
		const inputField = fragmentElement.querySelector(`input[name='${input.name}-label']`);
		if (inputField) inputField.value = label;
 	} else {
		console.warn('label not set');
	}
}