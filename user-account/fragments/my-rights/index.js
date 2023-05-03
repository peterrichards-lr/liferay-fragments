if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

const rolesEndpointUrl = configuration.rolesEndpointUrl;
const sitesEndpointUrl = configuration.sitesEndpointUrl;
const userGroupsEndpointUrl = configuration.userGroupsEndpointUrl;
const userAgentAppExtRefCode = configuration.userAgentAppExtRefCode;

const button = fragmentElement.querySelector('button');
const span = fragmentElement.querySelector('span');
const roles = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-roles`
);
const sites = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-sites`
);
const userGroups = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-usergroups`
);
const error = fragmentElement.querySelector(
  `#fragment-${fragmentNamespace}-error`
);

if (
  rolesEndpointUrl &&
  sitesEndpointUrl &&
  userGroupsEndpointUrl &&
  userAgentAppExtRefCode &&
  button &&
  span &&
  roles &&
  sites &&
  userGroups &&
  error
) {
  const oAuth2Client = Liferay.OAuth2Client.FromUserAgentApplication(
    userAgentAppExtRefCode
  );
  span.textContent = `${Liferay.ThemeDisplay.getUserName()} [${Liferay.ThemeDisplay.getUserId()}]`;
  const buttonEventListener = (evt) => {
    error.style.display = 'none';
    if (oAuth2Client) {
      oAuth2Client
        .fetch(`https://${rolesEndpointUrl}`)
        .then((response) => response.json())
        .then((json) => {
          json.roles.forEach((role) => {
            roles.value += `${role.name} [${role.id}]\r\n`;
          });
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
      oAuth2Client
        .fetch(`https://${sitesEndpointUrl}`)
        .then((response) => response.json())
        .then((json) => {
          json.sites.forEach((site) => {
            sites.value += `${site.name} [${site.id}]\r\n`;
          });
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
      oAuth2Client
        .fetch(`https://${userGroupsEndpointUrl}`)
        .then((response) => response.json())
        .then((json) => {
          json.userGroups.forEach((userGroup) => {
            userGroups.value += `${userGroup.name} [${userGroup.id}]\r\n`;
          });
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
