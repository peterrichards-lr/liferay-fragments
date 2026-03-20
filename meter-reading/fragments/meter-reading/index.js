const SINGLETON_KEY = 'LFR_FRAG_SINGLETON_METER_READING';

const { isValidIdentifier, resolveObjectPath } = Liferay.Fragment.Commons;

const showError = (message, details) => {
  const container = fragmentElement.querySelector('.error-container');
  if (container) {
    container.textContent = message;
    container.classList.remove('d-none');
  }
  console.error(`[Meter Reading] ${message}`, details);
};

if (window[SINGLETON_KEY]) {
  const errorMsg = fragmentElement.querySelector('.singleton-error');
  const content = fragmentElement.querySelector('.meter-reading-content');

  if (errorMsg) errorMsg.classList.remove('d-none');
  if (content) content.classList.add('d-none');

  console.error(
    'Collision detected: Multiple instances of Meter Reading found.'
  );
} else {
  window[SINGLETON_KEY] = true;

  const debugMode = configuration.enableDebug;

  const meterReadingContainer = fragmentElement.querySelector('div');
  const status = meterReadingContainer.querySelector('span.status');

  const digits = meterReadingContainer.querySelectorAll('input.digit');
  const digitCount = digits.length;

  if (layoutMode !== 'view') {
    if (digits && digitCount > 0) {
      for (let i = 0; i < digitCount; i++) {
        const digit = digits[i];
        digit.setAttribute('disabled', true);
      }
    }
  }

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

  const form = meterReadingContainer.querySelector('form');

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

  let apiPath = '';

  const resolveApiPath = async () => {
    const { objectERC, objectPath } = configuration;
    const effectivePath = objectPath || 'waterreadings';

    try {
      if (
        Liferay.Fragment.Commons.isValidIdentifier(objectERC) &&
        Liferay.Fragment.Commons.resolveObjectPathByERC
      ) {
        const result =
          await Liferay.Fragment.Commons.resolveObjectPathByERC(objectERC);
        if (result.apiPath) {
          apiPath = result.apiPath;
          return;
        }
      }

      const result = await resolveObjectPath(`/o/c/${effectivePath}`);

      if (result.apiPath) {
        apiPath = result.apiPath;
      } else {
        apiPath = `/o/c/${effectivePath}`;
      }
    } catch (err) {
      console.error('[Meter Reading] Scope resolution failed:', err);
      // Fallback to legacy path if resolution fails
      apiPath = `/o/c/${effectivePath}`;
    }
  };

  const readingCallback = async (readingDate, reading) => {
    if (!apiPath) await resolveApiPath();

    const useTestAccount = configuration.useTestAccount;
    let accountId = 0;

    if (useTestAccount) {
      accountId = parseInt(configuration?.testAccount || '0');
    } else if (Liferay.CommerceContext && Liferay.CommerceContext.account) {
      accountId = Liferay.CommerceContext.account.accountId;
    }

    if (!isValidIdentifier(accountId)) {
      console.error('[Meter Reading] Invalid Account ID:', accountId);
      setStatus(messages['unexpectedError']);
      return;
    }

    const readingPayload = {
      accountIdentifier: accountId,
      reading: reading,
      readingDate: readingDate,
    };

    Liferay.Util.fetch(apiPath, {
      method: 'POST',
      headers: [['content-type', 'application/json']],
      body: JSON.stringify(readingPayload),
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            showError(
              'You do not have permission to submit meter readings.',
              response.status
            );
            throw new Error('Permission denied');
          }
          throw new Error(`Submit failed: ${response.statusText}`);
        }
        setStatus(messages['successfulSubmission']);

        if (configuration.usePubSub && window.PubSub) {
          const msg = {
            refresh: true,
          };
          try {
            const token = window.PubSub.publish(configuration.pubSubTopic, msg);
            if (debugMode) console.debug('PubSub token', token);
          } catch (e) {
            console.warn('PubSub publish failed', e);
          }
        }
      })
      .catch((error) => {
        console.error(error);
        setStatus(messages['unexpectedError']);
      });
  };

  if (layoutMode === 'view') {
    // Pre-resolve path
    resolveApiPath();
  }

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
          if (numberOfDigits < digitCount) setStatus(messages['valueTooShort']);
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
        digit.value = digit.value.replace(/[^0-9]/g, '')?.charAt(0);
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
          if (event.key === 'Backspace' || event.key === 'Delete') {
            digit.value = '';
            previousDigit.focus();
          }
        });
      } else if (previousDigit) {
        digit.addEventListener('keydown', (event) => {
          const digit = event.target;
          if (event.key === 'Backspace' || event.key === 'Delete') {
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
