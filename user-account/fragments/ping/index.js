if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

const endpointUrl = configuration.endpointUrl;

const button = fragmentElement.querySelector('button');
const textArea = fragmentElement.querySelector('textarea');
const error = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-error`
);

if (endpointUrl && button && textArea && error) {
  const buttonEventListener = (evt) => {
    error.style.display = 'none';
    fetch(`https://${endpointUrl}`)
      .then((response) => response.text())
      .then((text) => {
        textArea.value += text + '\r\n';
      })
      .catch((err) => {
        if (err.status == 401) {
          error.innerText = 'Unauthorized';
        } else {
          console.log(err);
          error.innerText = 'Unexpected error. See console log';
        }
        error.style.display = 'block';
      });
  };

  button.addEventListener('click', buttonEventListener);
}
