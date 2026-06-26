const initColorSwatches = () => {
  const inputs = fragmentElement.querySelectorAll(
    'input[name="' + input.name + '"]'
  );
  const selectedNameDisplay = fragmentElement.querySelector(
    '.selected-color-name'
  );

  if (layoutMode === 'edit') {
    inputs.forEach((input) => {
      input.disabled = true;
    });
    return;
  }

  inputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      if (e.target.checked && selectedNameDisplay) {
        selectedNameDisplay.textContent = e.target.value;
      }

      const event = new Event('change', { bubbles: true });
      fragmentElement.dispatchEvent(event);
    });
  });
};

initColorSwatches();
