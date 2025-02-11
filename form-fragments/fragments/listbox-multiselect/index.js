const availableOptions = fragmentElement.querySelector('.list-avaialble-options');
const selectedOptions = fragmentElement.querySelector('.list-selected-options');
const moveAllRightBtn = fragmentElement.querySelector('.btn-move-all-right');
const moveRightBtn = fragmentElement.querySelector('.btn-move-right');
const moveAllLeftBtn = fragmentElement.querySelector('.btn-move-all-left');
const moveLeftBtn = fragmentElement.querySelector('.btn-move-left');

if (layoutMode === 'edit' && availableOptions && selectedOptions) {
	availableOptions.setAttribute('disabled', true);
	selectedOptions.setAttribute('disabled', true);
}

if (layoutMode === 'edit' && moveRightBtn && moveLeftBtn) {
	moveRightBtn.setAttribute('disabled', true);
	moveLeftBtn.setAttribute('disabled', true);
}

if (layoutMode === 'edit' && configuration.showAllButtons && moveAllRightBtn && moveAllLeftBtn) {
	moveAllRightBtn.setAttribute('disabled', true);
	moveAllLeftBtn.setAttribute('disabled', true);
}

const selectSelectedValues = () => {
	const items = Array.from(selectedOptions.options);
	items.forEach(item => {
		item.selected = true;
	});
};

if (configuration.showAllButtons && moveAllRightBtn && moveAllLeftBtn) {
	moveAllRightBtn.addEventListener('click', (e) => {
	debugger;
		e.preventDefault();
		const options = Array.from(availableOptions.options);
		options.forEach(item => {
			selectedOptions.appendChild(item);
		});
		selectSelectedValues();
	});
																	 
	moveAllLeftBtn.addEventListener('click', (e) => {
		e.preventDefault();
		const options = Array.from(selectedOptions.options);
		options.forEach(item => {
			availableOptions.appendChild(item);
		});
		selectSelectedValues();
	});													 
}

moveRightBtn.addEventListener('click', (e) => {
	e.preventDefault();
	const selectedItems = Array.from(availableOptions.selectedOptions);
	selectedItems.forEach(item => {
		selectedOptions.appendChild(item);
	});
	selectSelectedValues();
});

moveLeftBtn.addEventListener('click', (e) => {
	e.preventDefault();
	const selectedItems = Array.from(selectedOptions.selectedOptions);
	selectedItems.forEach(item => {
		availableOptions.appendChild(item);
	});
	selectSelectedValues();
});
