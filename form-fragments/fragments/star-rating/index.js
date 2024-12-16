const inputElements = fragmentElement.querySelectorAll(
  `input[name="${input.name}"]`
);

if (inputElements) {
  for (let i = 0; i < inputElements.length; i++) {
    const inputElement = inputElements[i];
    if (inputElement.attributes?.readOnly) {
      const label = fragmentElement.querySelector(`label[for="${inputElement.id}"]`);
      inputElement.addEventListener('click', (event) => event.preventDefault());

      label.addEventListener('click', (event) => event.preventDefault());
    }
  }
}
