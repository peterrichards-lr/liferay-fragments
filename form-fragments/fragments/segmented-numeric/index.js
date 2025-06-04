const debugMode = configuration.enableLogging;

const segmentedNumericContainer = fragmentElement.querySelector('div');
const errorMessage = segmentedNumericContainer.querySelector('span.error-message');
const errorMessageContainer = errorMessage.closest('p');

const digits = segmentedNumericContainer.querySelectorAll('input.digit');
const digitCount = digits.length;

const numericInput = segmentedNumericContainer.querySelector(`#${fragmentEntryLinkNamespace}-numeric-input`);

if (layoutMode !== 'view') {
  if (digits && digitCount > 0) {
    for (let i = 0; i < digitCount; i++) {
      const digit = digits[i];
      digit.setAttribute('disabled', true);
    }
  }
}
else {
  const messages = {
    invalidValue: {
      text: 'The clipboard content is not a valid number',
    },
    valueTooLong: {
      text: 'The value has too many digits',
    },
    valueTooShort: {
      text: 'The value does not have enough digits',
    },
  };

  const resetErrorMessage = () => {
    errorMessage.textContent = '';
    errorMessageContainer.style.display = 'none';
  };

  const setErrorMessage = (message) => {
    resetErrorMessage();
    errorMessage.textContent = message.text;
    errorMessageContainer.style.display = 'block';
  };

  if (digits && digitCount > 0) {
    const form = segmentedNumericContainer.closest('form');
    const integerDigitCount = configuration.integerDigitCount;

    form.addEventListener('submit', (event) => {
      let numberStr = '';
      for (let i = 0; i < digitCount; i++) {
        const digit = digits[i];
        if (!configuration.integerNumber && i == integerDigitCount)
          numberStr += '.';
        numberStr += digit.value;
      }
      const number = configuration.integerNumber
        ? parseInt(numberStr)
        : parseFloat(numberStr);

      numericInput.value = number;
    });

    segmentedNumericContainer.addEventListener('paste', (event) => {
      event.preventDefault();
      resetErrorMessage();
      let clipboardData = (event.clipboardData || window.clipboardData).getData(
        'text'
      )?.trim();
      if (!isNaN(parseFloat(clipboardData)) && isFinite(clipboardData)) {
        const numberDigits = clipboardData.split('');
        const numberOfDigits = numberDigits.length;
        const startDigit = digitCount - numberOfDigits;
        const activeEl = document.activeElement;

        if (
          numberOfDigits === digitCount ||
          (configuration.allowPartialPaste && numberOfDigits < digitCount)
        ) {
          if (activeEl.tagName === 'BODY' && numberOfDigits === digitCount) {
            let digitIndex = startDigit;
            for (let i = 0; i < numberOfDigits; i++) {
              const digit = digits[digitIndex];
              digit.value = numberDigits[i];
              digitIndex++;
            }
          } else if (
            activeEl.tagName === 'INPUT' &&
            activeEl.classList.contains('digit')
          ) {
            const digitPosition = parseInt(activeEl.getAttribute('data-digit'));
            const correctPlacement =
              numberOfDigits + (digitPosition - 1) === digitCount;
            if (correctPlacement) {
              let digitIndex = 0;
              for (let i = 0; i < digitCount; i++) {
                const digit = digits[i];
                if (i < startDigit) {
                  if (!digit.value) digit.value = '0';
                } else {
                  digit.value = numberDigits[digitIndex];
                  digitIndex++;
                }
              }
              activeEl.blur();
            } else {
              if (numberOfDigits + (digitPosition - 1) < digitCount)
                setErrorMessage(messages['valueTooShort']);
              else setErrorMessage(messages['valueTooLong']);
            }
          } else {
            if (numberOfDigits < digitCount)
              setErrorMessage(messages['valueTooShort']);
            else setErrorMessage(messages['valueTooLong']);
          }
        } else {
          if (numberOfDigits < digitCount)
            setErrorMessage(messages['valueTooShort']);
          else setErrorMessage(messages['valueTooLong']);
        }
      } else {
        setErrorMessage(messages['invalidValue']);
      }
    });

    for (let i = 0; i < digitCount; i++) {
      const digit = digits[i];
      const previousDigit = i - 1 >= 0 ? digits[i - 1] : null;
      const nextDigit = i + 1 < digitCount ? digits[i + 1] : null;

      digit.addEventListener('input', (event) => {
        const digit = event.target;
        digit.value = digit.value.replace(/[^0-9]/g, '').charAt(0);
        resetErrorMessage();
      });

      if (previousDigit && nextDigit) {
        digit.addEventListener('keyup', (event) => {
          const digit = event.target;
          const sizeAttr = digit.getAttribute('size');
          const size = parseInt(sizeAttr ? sizeAttr : '0');
          if (digit.value.length == size) nextDigit.focus();
        });

        digit.addEventListener('keydown', (event) => {
          const digit = event.target;
          const key = event.keyCode || event.charCode;
          if (key == 8 || key == 46) {
            digit.value = '';
            previousDigit.focus();
          }
        });
      } else if (previousDigit) {
        digit.addEventListener('keydown', (event) => {
          const digit = event.target;
          const key = event.keyCode || event.charCode;
          if (key == 8 || key == 46) {
            if (digit.value != '') {
              digit.value = '';
            } else {
              previousDigit.focus();
            }
          }
        });
      } else if (nextDigit) {
        digit.addEventListener('keyup', (event) => {
          const digit = event.target;
          const sizeAttr = digit.getAttribute('size');
          const size = parseInt(sizeAttr ? sizeAttr : '0');
          if (digit.value.length == size) nextDigit.focus();
        });
      }
    }
  }
}
