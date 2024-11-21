const rangeInput = fragmentElement.querySelector(
	`#${fragmentNamespace}-range-input`
);

const valueLabel = fragmentElement.querySelector('label span.value');

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
