const initImageChoice = () => {
  const inputs = fragmentElement.querySelectorAll(
    'input[name="' + input.name + '"]'
  );

  if (layoutMode === 'edit') {
    inputs.forEach((input) => {
      input.disabled = true;
    });
    return;
  }

  // Handle change events if any extra logic is needed (e.g., custom analytics or UI feedback)
  inputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      // Trigger change on the container or other elements if necessary
      // for Liferay's dynamic form behavior.
      const event = new Event('change', { bubbles: true });
      fragmentElement.dispatchEvent(event);
    });
  });
};

initImageChoice();
