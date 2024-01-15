if (fragmentNamespace) {
  if (!document.body.classList.contains('has-edit-mode-menu')) {
    const debugMode = configuration.enableLogging;

    const messages = {
      successfulSubmission: {
        useToaster: true,
        className: 'success',
        text: 'Thank you for submitting your reading',
      },
      unexpectedError: {
        useToaster: true,
        className: 'error',
        text: 'Ops! Something has gone wrong',
      },
      invalidValue: {
        useToaster: true,
        className: 'invalid',
        text: 'The clipboard content is not a valid meter reading',
      },
      valueTooLong: {
        useToaster: false,
        className: 'invalid',
        text: 'The value has too many digits',
      },
      valueTooShort: {
        useToaster: false,
        className: 'invalid',
        text: 'The value does not have enough digits',
      },
    };

    const meterReadingContainer = fragmentElement.querySelector('div');
    const form = meterReadingContainer.querySelector('form');
    const status = form.querySelector('span.status');
    const dateOfReading = form.querySelector('input.date');

    if (dateOfReading) {
      dateOfReading.valueAsDate = new Date();
      if (layoutMode === 'edit') {
        dateOfReading.setAttribute('disabled', true);
      }
    }

    const resetStatus = () => {
      status.className = 'status';
      status.textContent = '';
    };

    const setStatus = (message) => {
      resetStatus();
      if (message.useToaster) {
        let toastType;
        switch (message.className) {
          case 'invalid':
            toastType = 'warning';
            break;
          case 'error':
            toastType = 'danger';
            break;
          case 'success':
            toastType = 'success';
            break;
          default:
            toastType = 'info';
            break;
        }
        if (Liferay?.Util.openToast) {
          Liferay.Util.openToast({
            type: toastType,
            message: message.text,
          });
        }
      } else {
        status.classList.add(message.className);
        status.textContent = message.text;
      }
    };

    const readingCallback = (readingDate, reading) => {
      const useTestAccount = configuration.useTestAccount;
      const siteId = Liferay.ThemeDisplay.getScopeGroupId();
      const accountId = useTestAccount
        ? parseInt(configuration?.testAccount || '0')
        : Liferay.CommerceContext.account.accountId;

      const readingPayload = {
        accountIdentifier: accountId,
        reading: reading,
        readingDate: readingDate,
      };

      Liferay.Util.fetch(`/o/c/waterreadings/scopes/${siteId}`, {
        method: 'POST',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify(readingPayload),
      })
        .then((response) => {
          console.debug(response);
          if (response.ok) {
            setStatus(messages['successfulSubmission']);

            if (configuration.usePubSub) {
              const msg = {
                refresh: true,
              };
              try {
                const token = PubSub.publish(configuration.pubSubTopic, msg);
                if (debugMode) console.debug('PubSub token', token);
              } catch (e) {
                console.warn('PubSub not defined');
              }
            }
          } else {
            setStatus(messages['unexpectedError']);
          }
        })
        .catch((error) => {
          console.error(error);
          setStatus(messages['unexpectedError']);
        });
    };

    const digits = form.querySelectorAll('input.digit');
    const digitCount = digits.length;

    if (digits && digitCount > 0) {
      form.addEventListener('reset', (event) => {
        const firstDigit = digits[0];
        firstDigit.focus();
        resetStatus();
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const integerDigitCount = configuration.integerDigitCount;
        let readingStr = '';
        for (let i = 0; i < digitCount; i++) {
          const digit = digits[i];
          if (!configuration.integerReading && i == integerDigitCount)
            readingStr += '.';
          readingStr += digit.value;
        }
        const reading = configuration.integerReading
          ? parseInt(readingStr)
          : parseFloat(readingStr);
        const readingDate = dateOfReading.valueAsDate;
        if (readingCallback) {
          form.reset();
          readingCallback(readingDate, reading);
        }
      });

      meterReadingContainer.addEventListener('paste', (event) => {
        event.preventDefault();
        resetStatus();
        let reading = (event.clipboardData || window.clipboardData).getData(
          'text'
        );
        if (!isNaN(parseFloat(reading)) && isFinite(reading)) {
          const readingDigits = reading.split('');
          const numberOfDigits = readingDigits.length;
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
                digit.value = readingDigits[i];
                digitIndex++;
              }
            } else if (
              activeEl.tagName === 'INPUT' &&
              activeEl.classList.contains('digit')
            ) {
              const digitPosition = parseInt(activeEl.getAttribute('digit'));
              const correctPlacement =
                numberOfDigits + (digitPosition - 1) === digitCount;
              if (correctPlacement) {
                let readingIndex = 0;
                for (let i = 0; i < digitCount; i++) {
                  const digit = digits[i];
                  if (i < startDigit) {
                    if (!digit.value) digit.value = '0';
                  } else {
                    digit.value = readingDigits[readingIndex];
                    readingIndex++;
                  }
                }
                activeEl.blur();
              } else {
                if (numberOfDigits + (digitPosition - 1) < digitCount)
                  setStatus(messages['valueTooShort']);
                else setStatus(messages['valueTooLong']);
              }
            } else {
              if (numberOfDigits < digitCount)
                setStatus(messages['valueTooShort']);
              else setStatus(messages['valueTooLong']);
            }
          } else {
            if (numberOfDigits < digitCount)
              setStatus(messages['valueTooShort']);
            else setStatus(messages['valueTooLong']);
          }
        } else {
          setStatus(messages['invalidValue']);
        }
      });

      for (let i = 0; i < digitCount; i++) {
        const digit = digits[i];
        const previousDigit = i - 1 >= 0 ? digits[i - 1] : null;
        const nextDigit = i + 1 < digitCount ? digits[i + 1] : null;

        digit.addEventListener('input', (event) => {
          const digit = event.target;
          digit.value = digit.value.replace(/[^0-9]/, '');
          resetStatus();
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
}
