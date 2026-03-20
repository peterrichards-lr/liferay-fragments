const initCurrencyInput = () => {
  const visibleInput = fragmentElement.querySelector('.visible-currency-input');
  const hiddenInput = fragmentElement.querySelector('input[type="hidden"]');

  if (!visibleInput || !hiddenInput) return;

  const thousandsSeparator = configuration.thousandsSeparator || ',';
  const decimalSeparator = configuration.decimalSeparator || '.';
  const decimalPlaces = parseInt(configuration.decimalPlaces, 10) || 2;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';

    // Convert to number and back to string with fixed decimals
    const num = parseFloat(value).toFixed(decimalPlaces);
    const parts = num.split('.');

    // Add thousands separator
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

    return parts.join(decimalSeparator);
  };

  const parseCurrency = (value) => {
    // Remove all non-numeric characters except the decimal separator
    const regex = new RegExp('[^0-9\\' + decimalSeparator + '-]', 'g');
    let clean = value.replace(regex, '');

    // Replace custom decimal separator with standard point
    if (decimalSeparator !== '.') {
      clean = clean.replace(decimalSeparator, '.');
    }

    return parseFloat(clean);
  };

  // Initial Formatting
  if (hiddenInput.value) {
    visibleInput.value = formatCurrency(hiddenInput.value);
  }

  if (layoutMode === 'edit') {
    visibleInput.disabled = true;
    return;
  }

  visibleInput.addEventListener('input', (e) => {
    // Get cursor position to restore later
    const start = e.target.selectionStart;
    const oldLen = e.target.value.length;

    const rawValue = parseCurrency(e.target.value);

    if (!isNaN(rawValue)) {
      hiddenInput.value = rawValue;
      e.target.value = formatCurrency(rawValue);

      // Adjust cursor
      const newLen = e.target.value.length;
      e.target.setSelectionRange(
        start + (newLen - oldLen),
        start + (newLen - oldLen)
      );
    } else {
      hiddenInput.value = '';
    }

    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  visibleInput.addEventListener('blur', (e) => {
    const rawValue = parseCurrency(e.target.value);
    if (!isNaN(rawValue)) {
      e.target.value = formatCurrency(rawValue);
    }
  });
};

initCurrencyInput();
