const initSegmentedNumeric = () => {
  const segmentedNumericContainer =
    fragmentElement.querySelector(".segmented-numeric");
  if (!segmentedNumericContainer) return;

  const errorMessage =
    segmentedNumericContainer.querySelector("span.error-message");
  const errorMessageContainer = errorMessage ? errorMessage.closest("p") : null;
  const digits = Array.from(
    segmentedNumericContainer.querySelectorAll("input.digit"),
  );
  const digitCount = digits.length;
  const numericInput =
    segmentedNumericContainer.querySelector(`input[type="hidden"]`);

  const resetErrorMessage = () => {
    if (errorMessage) errorMessage.textContent = "";
    if (errorMessageContainer) errorMessageContainer.style.display = "none";
  };

  const setErrorMessage = (text) => {
    if (errorMessage) errorMessage.textContent = text;
    if (errorMessageContainer) errorMessageContainer.style.display = "block";
  };

  const updateHiddenInput = () => {
    if (!numericInput) return;
    let numberStr = "";
    const integerDigitCount = configuration.integerDigitCount || 0;

    digits.forEach((digit, i) => {
      if (!configuration.integerNumber && i === integerDigitCount) {
        numberStr += ".";
      }
      numberStr += digit.value || "0";
    });

    numericInput.value = configuration.integerNumber
      ? parseInt(numberStr, 10)
      : parseFloat(numberStr);

    // Trigger change event for Liferay form validation
    numericInput.dispatchEvent(new Event("change", { bubbles: true }));
  };

  if (layoutMode !== "view") {
    digits.forEach((digit) => digit.setAttribute("disabled", true));
    return;
  }

  // Handle Form Submit
  const form = segmentedNumericContainer.closest("form");
  if (form) {
    form.addEventListener("submit", updateHiddenInput);
  }

  // Handle Paste
  segmentedNumericContainer.addEventListener("paste", (event) => {
    event.preventDefault();
    resetErrorMessage();

    const clipboardData = (event.clipboardData || window.clipboardData)
      .getData("text")
      ?.trim();

    if (
      clipboardData &&
      !isNaN(parseFloat(clipboardData)) &&
      isFinite(clipboardData)
    ) {
      const numberDigits = clipboardData.replace(/[^0-9]/g, "").split("");
      const numberOfDigits = numberDigits.length;

      if (numberOfDigits > digitCount) {
        setErrorMessage("Value too long.");
        return;
      }

      // Fill from right to left (standard for numbers)
      const startAt = digitCount - numberOfDigits;
      digits.forEach((digit, i) => {
        if (i < startAt) {
          digit.value = "0";
        } else {
          digit.value = numberDigits[i - startAt];
        }
      });
      updateHiddenInput();
    } else {
      setErrorMessage("Invalid numeric value.");
    }
  });

  digits.forEach((digit, i) => {
    digit.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "").charAt(0);
      resetErrorMessage();
      updateHiddenInput();

      // Auto-tab to next
      if (e.target.value.length === 1 && i < digitCount - 1) {
        digits[i + 1].focus();
      }
    });

    digit.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (digit.value === "" && i > 0) {
          digits[i - 1].focus();
          digits[i - 1].value = "";
        } else {
          digit.value = "";
        }
        updateHiddenInput();
      } else if (e.key === "ArrowLeft" && i > 0) {
        digits[i - 1].focus();
      } else if (e.key === "ArrowRight" && i < digitCount - 1) {
        digits[i + 1].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        let val = parseInt(digit.value || "0", 10);
        digit.value = (val + 1) % 10;
        updateHiddenInput();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let val = parseInt(digit.value || "0", 10);
        digit.value = (val - 1 + 10) % 10;
        updateHiddenInput();
      }
    });

    // Select on focus for easier editing
    digit.addEventListener("focus", () => digit.select());
  });
};

initSegmentedNumeric();
