const SINGLETON_KEY = 'LFR_FRAG_SINGLETON_LOAN_CALC';

if (window[SINGLETON_KEY]) {
	const errorMsg = fragmentElement.querySelector('.singleton-error');
	const content = fragmentElement.querySelector('.calculator-content');

	if (errorMsg) errorMsg.classList.remove('d-none');
	if (content) content.classList.add('d-none');

	console.error('Collision detected: Multiple instances of Loan Calculator found.');
} else {
	window[SINGLETON_KEY] = true;

	const loanAmountInput = fragmentElement.querySelector(`#loanAmount-${fragmentEntryLinkNamespace}`);
	const loanTermInput = fragmentElement.querySelector(`#loanTerm-${fragmentEntryLinkNamespace}`);
	const amountValue = fragmentElement.querySelector(`#amountValue-${fragmentEntryLinkNamespace}`);
	const termValue = fragmentElement.querySelector(`#termValue-${fragmentEntryLinkNamespace}`);
	const totalPaymentText = fragmentElement.querySelector(`#totalPayment-${fragmentEntryLinkNamespace}`);
	const termMonthsText = fragmentElement.querySelector(`#termMonths-${fragmentEntryLinkNamespace}`);
	const interestRateText = fragmentElement.querySelector(`#interestRate-${fragmentEntryLinkNamespace}`);

	const getInterestRate = (amount) => {
		if (amount < 5000) {
			return 0.085;
		} else if (amount < 20000) {
			return 0.061;
		} else if (amount < 35000) {
			return 0.046;
		} else {
			return 0.032;
		}
	};

	const updateMinTerm = (amount) => {
		if (amount > 35000 && loanTermInput.value < 60) {
			loanTermInput.value = 60;
		} else if (amount > 20000 && loanTermInput.value < 36) {
			loanTermInput.value = 36;
		}
	};

	const updateSummary = () => {
		const amount = parseFloat(loanAmountInput.value);

		updateMinTerm(amount);

		const term = parseInt(loanTermInput.value);

		const interestRate = getInterestRate(amount);
		const totalPayment = amount + amount * interestRate * (term / 12);

		amountValue.textContent = amount.toFixed(2);
		termValue.textContent = loanTermInput.value;
		totalPaymentText.textContent = totalPayment.toFixed(2);
		termMonthsText.textContent = loanTermInput.value;
		interestRateText.textContent = `${interestRate * 100}%`;
	};

	loanAmountInput.addEventListener('input', updateSummary);
	loanTermInput.addEventListener('input', updateSummary);

	updateSummary();
}