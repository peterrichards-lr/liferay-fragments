const {
	useStorageValue,
	storageKeyPrefix,
	useSpecificStorageKey,
	specificStorageKey
} = configuration;

const isRTL = document.documentElement.classList.contains('rtl');

const buttonElement = fragmentElement.querySelector('.btn');
const dropdownElement = fragmentElement.querySelector('.dropdown-menu');
const optionListElement = fragmentElement.querySelector('.list-unstyled');

const chooseOptionElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-choose-option-message`
);
const labelInputElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-label-input`
);
const loadingResultsElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-loading-results-message`
);
const noResultsElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-no-results-message`
);
const uiInputElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-select-from-list-input`
);
const valueInputElement = document.getElementById(

	// eslint-disable-next-line no-undef
	`${fragmentEntryLinkNamespace}-value-input`
);

if (layoutMode === 'edit') {
	buttonElement.setAttribute('disabled', true);
	uiInputElement.setAttribute('disabled', true);
}

buttonElement.addEventListener('click', toggleDropdown);
buttonElement.addEventListener('blur', handleResultListBlur);
uiInputElement.addEventListener('click', toggleDropdown);
uiInputElement.addEventListener('input', debounce(handleInputChange, 1000));
uiInputElement.addEventListener('blur', handleInputBlur);
uiInputElement.addEventListener('keydown', handleInputKeyDown);
optionListElement.addEventListener('click', handleResultListClick);

window.addEventListener('resize', handleWindowResizeOrScroll, {
	passive: true,
});
window.addEventListener('scroll', handleWindowResizeOrScroll, {
	passive: true,
});

let lastSearchAbortController = new AbortController();
let lastSearchQuery = null;

const setSelectedOptionByValue = (value) => {
	const searchValue = value.replace(/\s+/g, '');
	const selectedOption = (input.attributes.options || []).find(
		(option) => option.value === searchValue
	);

	if (selectedOption) {
		lastSearchQuery = selectedOption.label.toLowerCase();
		valueInputElement.value = selectedOption.value;

		const selectedOptionElement = optionListElement.querySelector(
			`.dropdown-item[data-option-value='${value}']`
		);

		if (selectedOptionElement) {
			setSelectedOption(selectedOptionElement);
		}
	}
}

const KEYS = {
	ArrowDown: 'ArrowDown',
	ArrowUp: 'ArrowUp',
	End: 'End',
	Enter: 'Enter',
	Home: 'Home',
};

const optionList = (input.attributes.options || []).map((option) => ({
	textContent: option.label,
	textValue: option.label.toLowerCase(),
	value: option.value,
}));

function handleResultListClick(event) {
	let selectedOptionElement = null;

	if (event.target.matches('.dropdown-item')) {
		selectedOptionElement = event.target;
	}
	else if (event.target.closest('.dropdown-item')) {
		selectedOptionElement = event.target.closest('.dropdown-item');
	}

	if (selectedOptionElement) {
		setFocusedOption(selectedOptionElement, { scrollToElement: false });
		setSelectedOption(selectedOptionElement);
	}
}

function handleInputBlur() {
	uiInputElement.value = labelInputElement.value;

	if (checkIsOpenDropdown()) {
		setTimeout(() => closeDropdown(), 500);
	}
}

function handleResultListBlur() {
	if (checkIsOpenDropdown()) {
		setTimeout(() => closeDropdown(), 500);
	}
}

function handleInputKeyDown(event) {
	if (!optionListElement.firstElementChild) {
		return;
	}

	const currentFocusedOption = document.getElementById(
		optionListElement.getAttribute('aria-activedescendant')
	);

	if (KEYS[event.key]) {
		openDropdown();
		event.preventDefault();
	}

	if (event.key === KEYS.ArrowDown && !event.altKey) {
		if (currentFocusedOption) {
			setFocusedOption(
				currentFocusedOption.nextElementSibling ||
				optionListElement.firstElementChild
			);
		}
		else {
			setFocusedOption(optionListElement.firstElementChild);
		}
	}
	else if (event.key === KEYS.ArrowUp) {
		if (currentFocusedOption) {
			setFocusedOption(
				currentFocusedOption.previousElementSibling ||
				optionListElement.lastElementChild
			);
		}
		else {
			setFocusedOption(optionListElement.lastElementChild);
		}
	}
	else if (event.key === KEYS.Home) {
		setFocusedOption(optionListElement.firstElementChild);
	}
	else if (event.key === KEYS.End) {
		setFocusedOption(optionListElement.lastElementChild);
	}
	else if (event.key === KEYS.Enter && currentFocusedOption) {
		setFocusedOption(currentFocusedOption);
		setSelectedOption(currentFocusedOption);
	}
}

function handleInputChange() {
	const filterValue = uiInputElement.value.toLowerCase();

	if (filterValue !== lastSearchQuery) {
		openDropdown();

		lastSearchQuery = filterValue;

		chooseOptionElement.classList.add('d-none');
		loadingResultsElement.classList.remove('d-none');

		filterOptions(filterValue).then((filteredOptions) => {
			loadingResultsElement.classList.add('d-none');
			renderOptionList(filteredOptions);

			if (optionListElement.firstElementChild) {
				chooseOptionElement.classList.remove('d-none');
				noResultsElement.classList.add('d-none');

				setFocusedOption(optionListElement.firstElementChild, {
					scrollToElement: false,
				});
			}
			else {
				chooseOptionElement.classList.add('d-none');
				noResultsElement.classList.remove('d-none');
			}
		});
	}
}

function filterOptions(query) {
	return new Promise((resolve) => {
		if (input.attributes.relationshipURL) {
			lastSearchAbortController.abort();
			lastSearchAbortController = new AbortController();
			filterRemoteOptions(query, lastSearchAbortController).then(resolve);
		}
		else if (query) {
			resolve(filterLocalOptions(query));
		}
		else {
			resolve(optionList);
		}
	});
}

function filterLocalOptions(query) {
	const options = [];

	optionList.forEach((option) => {
		if (!option.value) {
			return;
		}

		if (option.textValue.startsWith(query)) {
			options.push(option);
		}
	});

	optionList.forEach((option) => {
		if (!option.value) {
			return;
		}

		if (option.textValue.includes(query) && !options.includes(option)) {
			options.push(option);
		}
	});

	return options;
}

function filterRemoteOptions(query, abortController) {
	if (
		!input.attributes.relationshipLabelFieldName ||
		!input.attributes.relationshipURL ||
		!input.attributes.relationshipValueFieldName
	) {
		return Promise.resolve({ items: [] });
	}

	const url = new URL(input.attributes.relationshipURL);
	url.searchParams.set('search', query);

	return Liferay.Util.fetch(url, {
		headers: new Headers({
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		}),
		method: 'GET',
		signal: abortController.signal,
	})
		.then((response) => response.json())
		.then((result) => {
			return result.items.map((entry) => {
				let label = entry[input.attributes.relationshipLabelFieldName];

				if (Array.isArray(label)) {
					label = label.map((label) => label.name).join(', ');
				}
				else if (typeof label === 'object') {
					label = label.name;
				}

				return {
					textContent: label,
					textValue: label,
					value: `${entry[input.attributes.relationshipValueFieldName]
						}`,
				};
			});
		});
}

function handleWindowResizeOrScroll() {
	if (!document.body.contains(fragmentElement)) {
		window.removeEventListener('resize', handleWindowResizeOrScroll);
		window.removeEventListener('scroll', handleWindowResizeOrScroll);

		if (document.body.contains(dropdownElement)) {
			dropdownElement.parentElement.removeChild(dropdownElement);
		}

		return;
	}

	if (checkIsOpenDropdown()) {
		repositionDropdownElement();
	}
}

function setFocusedOption(
	optionElement,
	{ scrollToElement = true } = { scrollToElement: true }
) {
	const currentFocusedOption = document.getElementById(
		optionListElement.getAttribute('aria-activedescendant')
	);

	if (currentFocusedOption) {
		currentFocusedOption.removeAttribute('aria-selected');
	}

	if (optionElement) {
		optionListElement.setAttribute(
			'aria-activedescendant',
			optionElement.id
		);

		optionElement.setAttribute('aria-selected', 'true');

		if (scrollToElement) {
			optionElement.scrollIntoView({ block: 'nearest' });
		}
	}
	else {
		optionListElement.removeAttribute('aria-activedescendant');
	}
}

function createOptionElement(option) {
	const optionElement = document.createElement('li');

	optionElement.dataset.optionLabel = option.textContent;
	optionElement.dataset.optionValue = option.value;

	// eslint-disable-next-line no-undef
	optionElement.id = `${fragmentEntryLinkNamespace}-option-${option.value}`;
	optionElement.textContent = option.textContent;

	optionElement.classList.add('dropdown-item');
	optionElement.setAttribute('role', 'option');

	if (
		optionListElement.getAttribute('aria-activedescendant') ===
		optionElement.id
	) {
		optionElement.setAttribute('aria-selected', 'true');
		optionElement.scrollIntoView({ block: 'nearest' });
	}

	if (valueInputElement.value === option.value) {
		optionElement.classList.add('active');
	}

	return optionElement;
}

function setSelectedOption(optionElement) {
	closeDropdown();

	const selectedOption = document.getElementById(

		// eslint-disable-next-line no-undef
		`${fragmentEntryLinkNamespace}-option-${valueInputElement.value}`
	);

	if (selectedOption) {
		selectedOption.classList.remove('active');
	}

	lastSearchQuery = optionElement.textContent.toLowerCase();

	optionElement.classList.add('active');

	labelInputElement.value = optionElement.dataset.optionLabel;
	uiInputElement.value = optionElement.dataset.optionLabel;
	valueInputElement.value = optionElement.dataset.optionValue;
}

function checkIsOpenDropdown() {
	return (
		uiInputElement.getAttribute('aria-expanded') === 'true' &&
		buttonElement.getAttribute('aria-expanded') === 'true'
	);
}

function openDropdown() {
	const canFetchOptions = input.attributes.relationshipURL;

	if (!canFetchOptions && !optionList.length) {
		return;
	}

	dropdownElement.classList.replace('d-none', 'show');
	uiInputElement.setAttribute('aria-expanded', 'true');
	buttonElement.setAttribute('aria-expanded', 'true');

	const wrapperWidth = `${fragmentElement.getBoundingClientRect().width}px`;

	dropdownElement.style.maxWidth = wrapperWidth;
	dropdownElement.style.minWidth = wrapperWidth;
	dropdownElement.style.width = wrapperWidth;

	requestAnimationFrame(() => {
		handleInputChange();
		repositionDropdownElement();
	});
}

function closeDropdown() {
	dropdownElement.classList.replace('show', 'd-none');
	uiInputElement.setAttribute('aria-expanded', 'false');
	buttonElement.setAttribute('aria-expanded', 'false');
}

function toggleDropdown() {
	if (checkIsOpenDropdown()) {
		closeDropdown();
	}
	else {
		openDropdown();
	}
}

function repositionDropdownElement() {
	const uiInputRect = uiInputElement.getBoundingClientRect();

	if (document.body.contains(fragmentElement)) {
		if (fragmentElement.contains(dropdownElement)) {
			document.body.appendChild(dropdownElement);
		}
	}
	else if (document.body.contains(dropdownElement)) {
		dropdownElement.parentNode.removeChild(dropdownElement);
	}

	dropdownElement.style.transform = `
		translateX(${(isRTL ? uiInputRect.right - window.innerWidth : uiInputRect.left) +
		window.scrollX
		}px)
		translateY(${uiInputRect.bottom + window.scrollY}px)
	`;
}

function renderOptionList(options) {
	optionListElement.innerHTML = '';

	options.forEach((option) =>
		optionListElement.appendChild(createOptionElement(option))
	);
}

const retriveStorageValue = (key) => {
	return Liferay.Util.SessionStorage.getItem(
		key,
		Liferay.Util.SessionStorage.TYPES.PERSONALIZATION
	);
};

function debounce(fn, delay) {
	let debounceId = null;

	return function (...args) {
		clearTimeout(debounceId);
		debounceId = setTimeout(() => fn(...args), delay);
	};
}

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

if (useStorageValue && !input.value) {
	const storageKey = useSpecificStorageKey ? specificStorageKey : `${storageKeyPrefix}_${convertCase(input.name, 'snake')}`;
	const value = retriveStorageValue(storageKey);
	if (value) {
		setSelectedOptionByValue(value);
	}
} else {
	if (input.value) {
		setSelectedOptionByValue(input.value);
	}
}