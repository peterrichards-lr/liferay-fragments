const SINGLETON_KEY = "LFR_FRAG_SINGLETON_LOAN_APP_CALC";

const initLoanAppCalc = () => {
  if (window[SINGLETON_KEY]) {
    console.warn("Multiple Loan Application Calculators detected.");
    return;
  }
  window[SINGLETON_KEY] = true;

  const loanAmountDiv = fragmentElement.querySelector("#loanAmount");
  const loanTermDiv = fragmentElement.querySelector("#loanTerm");

  if (!loanAmountDiv || !loanTermDiv) {
    if (layoutMode === "edit") {
      console.info(
        "Loan Application Calculator: Please drop 'Range' fragments into the drop-zone and set their IDs to 'loanAmount' and 'loanTerm'.",
      );
    }
    return;
  }

  const loanAmountInput = loanAmountDiv.querySelector("input");
  const loanTermInput = loanTermDiv.querySelector("input");
  const amountValue = loanAmountDiv.querySelector("span.value");
  const termValue = loanTermDiv.querySelector("span.value");
  const totalPaymentText = fragmentElement.querySelector("#totalPayment");
  const termMonthsText = fragmentElement.querySelector("#termMonths");
  const interestRateText = fragmentElement.querySelector("#interestRate");

  const getInterestRate = (amount) => {
    if (amount < 5000) return 0.085;
    if (amount < 20000) return 0.061;
    if (amount < 35000) return 0.046;
    return 0.032;
  };

  const updateMinTerm = (amount) => {
    if (amount > 35000 && parseInt(loanTermInput.value) < 60) {
      loanTermInput.value = 60;
    } else if (amount > 20000 && parseInt(loanTermInput.value) < 36) {
      loanTermInput.value = 36;
    }
  };

  const updateSummary = () => {
    const amount = parseFloat(loanAmountInput.value) || 0;
    const term = parseInt(loanTermInput.value) || 0;

    updateMinTerm(amount);

    const interestRate = getInterestRate(amount);
    const totalPayment = amount + amount * interestRate * (term / 12);

    if (amountValue) amountValue.textContent = amount.toFixed(2);
    if (termValue) termValue.textContent = term;
    if (totalPaymentText)
      totalPaymentText.textContent = totalPayment.toFixed(2);
    if (termMonthsText) termMonthsText.textContent = term;
    if (interestRateText)
      interestRateText.textContent = `${(interestRate * 100).toFixed(1)}%`;
  };

  if (loanAmountInput) loanAmountInput.addEventListener("input", updateSummary);
  if (loanTermInput) loanTermInput.addEventListener("input", updateSummary);

  updateSummary();
};

initLoanAppCalc();
