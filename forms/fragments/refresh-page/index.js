/* eslint-disable no-console */
/* eslint-disable no-undef */
/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

if (!fragmentNamespace) {
	return;
}

if (document.body.classList.contains('has-edit-mode-menu')) {

	// If present then we are in content page editor

	return;
}

const enableDebug = configuration.enableDebug;
const enableRefreshTrigger = configuration.enableRefreshTrigger;
const enableAutoRefresh = configuration.enableAutoRefresh;
const refreshIntervalSec = configuration.refreshIntervalSec;
const refreshTriggerText = configuration.refreshTriggerText;

if (!enableRefreshTrigger) {
  triggerHandler();
	return;
}

const queryInnerTextAll = function (root, selector, regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex, 'i');
	}
	const elements = [...root.querySelectorAll(selector)];
	const rtn = elements.filter((element) => {
		return element.innerText.match(regex);
	});

	return rtn.length === 0 ? null : rtn;
};

const queryInnerText = function (root, selector, text) {
	try {
		const result = queryInnerTextAll(root, selector, text);
		if (Array.isArray(result)) {
			return result[0];
		}
		else {
			return result;
		}
	}
	catch (error) {
		console.log(error);

		return null;
	}
};

const triggerHandler = () => {
	fragmentElement.children[0].style.display = 'block';
	if (enableAutoRefresh) {
		setTimeout(function(){
			window.location.reload();
		}, refreshIntervalSec * 1000);
	}
};

const triggerSelector = () => {
	const commonParent = fragmentElement.parentElement.parentElement.parentElement;
	if (commonParent) {
		const triggerContainer = commonParent.querySelector("div.portlet-forms-display");
		if (triggerContainer) {
			const triggerElement = queryInnerText(triggerContainer, 'h2', refreshTriggerText);
			return triggerElement;
		}
	}
	return null;
};

const triggerChecker = (config, triggerSelectorCallback, triggerHandler) => {
	const waitInterval = configuration.waitIntervalMs;
  const waitCount = configuration.waitCount - 1;
	if (!(typeof config === 'object') || !(typeof triggerSelectorCallback === 'function') || !(typeof triggerHandler  === 'function')) {
		if (enableDebug)
			console.debug("The parameters passed to triggerChecker are incorrect");
		return;
	}
	let c = 0;
	const intervalHandle = setInterval(() => 
	{
		if (enableDebug)
			console.debug("retry : " + (c + 1) + " out of " + (waitCount + 1));
		let triggerElement = triggerSelectorCallback(config);
	  if (triggerElement) {
			console.debug("Tigger found");
			clearInterval(intervalHandle);
			triggerHandler(config);
		}
		c++;
		if (c > waitCount) {
			clearInterval(intervalHandle);
			if (enableDebug)
				console.debug("Unable to find trigger within given bounds");
			return;
		}
	}, waitInterval);
}

Liferay.on('allPortletsReady', () => {
	triggerChecker({}, triggerSelector, triggerHandler);
});