if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

const endpointUrl = configuration.endpointUrl;
const userAgentAppExtRefCode = configuration.userAgentAppExtRefCode;

const button = fragmentElement.querySelector('button');
const span = fragmentElement.querySelector('span');
const textArea = fragmentElement.querySelector('textarea');
const error = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-error`
);

if (
  endpointUrl &&
  userAgentAppExtRefCode &&
  button &&
  span &&
  textArea &&
  error
) {
  const oAuth2Client = Liferay.OAuth2Client.FromUserAgentApplication(
    userAgentAppExtRefCode
  );
  span.innerText = `${Liferay.ThemeDisplay.getUserName()} [${Liferay.ThemeDisplay.getUserId()}]`;
  const buttonEventListener = (evt) => {
    error.style.display = 'none';
    if (oAuth2Client) {
      oAuth2Client
        .fetch(`https://${endpointUrl}`)
        .then((response) => response.json())
        .then((json) => {
          textArea.value += `${json.name} [${json.id}]\r\n`;
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
    }
  };

  button.addEventListener('click', buttonEventListener);
}
