const loanAmountInput = fragmentElement.querySelector('#loanAmount');
const loanTermInput = fragmentElement.querySelector('#loanTerm');
const amountValue = fragmentElement.querySelector('#amountValue');
const termValue = fragmentElement.querySelector('#termValue');
const totalPaymentText = fragmentElement.querySelector('#totalPayment');
const termMonthsText = fragmentElement.querySelector('#termMonths');
const interestRateText = fragmentElement.querySelector('#interestRate');

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