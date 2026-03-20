const initPing = () => {
  const { isValidIdentifier } = Liferay.Fragment.Commons;

  if (layoutMode === 'view') {
    const { endpointUrl } = configuration;

    const button = fragmentElement.querySelector('button');
    const textArea = fragmentElement.querySelector('textarea');
    const error = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-error`
    );

    if (isValidIdentifier(endpointUrl) && button && textArea && error) {
      const buttonEventListener = (evt) => {
        error.style.display = 'none';

        // Determine final URL
        let finalUrl = endpointUrl;
        if (!finalUrl.startsWith('/') && !finalUrl.startsWith('http')) {
          finalUrl = `https://${finalUrl}`;
        }

        Liferay.Util.fetch(finalUrl)
          .then((response) => {
            if (!response.ok) throw response;
            return response.text();
          })
          .then((text) => {
            textArea.value += text + '\r\n';
          })
          .catch((err) => {
            if (err.status == 401) {
              error.innerText = 'Unauthorized';
            } else {
              console.error(err);
              error.innerText = 'Unexpected error. See console log';
            }
            error.style.display = 'block';
          });
      };

      button.addEventListener('click', buttonEventListener);
    }
  }
};

initPing();
