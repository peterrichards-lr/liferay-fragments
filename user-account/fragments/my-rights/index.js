const initMyRights = () => {
  if (layoutMode === "view") {
    const {
      rolesEndpointUrl,
      sitesEndpointUrl,
      userGroupsEndpointUrl,
      userAgentAppExtRefCode,
    } = configuration;

    const button = fragmentElement.querySelector("button");
    const span = fragmentElement.querySelector("span");
    const roles = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-roles`,
    );
    const sites = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-sites`,
    );
    const userGroups = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-usergroups`,
    );
    const error = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-error`,
    );

    if (
      rolesEndpointUrl &&
      sitesEndpointUrl &&
      userGroupsEndpointUrl &&
      button &&
      span &&
      roles &&
      sites &&
      userGroups &&
      error
    ) {
      span.textContent = `${Liferay.ThemeDisplay.getUserName()} [${Liferay.ThemeDisplay.getUserId()}]`;

      const buttonEventListener = (evt) => {
        error.style.display = "none";

        // Determine which fetch to use
        let fetchFn;
        if (userAgentAppExtRefCode) {
          const { fetch } = Liferay.OAuth2Client.fromUserAgent(
            userAgentAppExtRefCode,
          );
          fetchFn = fetch;
        } else {
          fetchFn = Liferay.Util.fetch;
        }

        const resolveUrl = (url) => {
          if (!url.startsWith("/") && !url.startsWith("http")) {
            return `https://${url}`;
          }
          return url;
        };

        const handleFetch = (url, targetEl, collectionKey, itemLabelKey) => {
          fetchFn(resolveUrl(url))
            .then((response) => {
              if (!response.ok) throw response;
              return response.json();
            })
            .then((json) => {
              const items = json[collectionKey] || [];
              items.forEach((item) => {
                targetEl.value += `${item[itemLabelKey] || "Unknown"} [${item.id || "N/A"}]\r\n`;
              });
            })
            .catch((err) => {
              if (err.status == 401) {
                error.innerText = "Unauthorized";
              } else {
                console.error(err);
                error.innerText = "Unexpected error. See console log";
              }
              error.style.display = "block";
            });
        };

        roles.value = "";
        sites.value = "";
        userGroups.value = "";

        handleFetch(rolesEndpointUrl, roles, "roles", "name");
        handleFetch(sitesEndpointUrl, sites, "sites", "name");
        handleFetch(userGroupsEndpointUrl, userGroups, "userGroups", "name");
      };

      button.addEventListener("click", buttonEventListener);
    }
  }
};

initMyRights();
