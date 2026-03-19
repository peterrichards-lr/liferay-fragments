const initWhoAmI = () => {
  const { isValidIdentifier } = Liferay.Fragment.Commons;

  if (layoutMode === "view") {
    const { endpointUrl, userAgentAppExtRefCode } = configuration;

    const button = fragmentElement.querySelector("button");
    const span = fragmentElement.querySelector("span");
    const textArea = fragmentElement.querySelector("textarea");
    const error = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-error`,
    );

    if (isValidIdentifier(endpointUrl) && button && span && textArea && error) {
      span.innerText = `${Liferay.ThemeDisplay.getUserName()} [${Liferay.ThemeDisplay.getUserId()}]`;

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

        // Determine final URL
        let finalUrl = endpointUrl;
        if (!finalUrl.startsWith("/") && !finalUrl.startsWith("http")) {
          finalUrl = `https://${finalUrl}`;
        }

        fetchFn(finalUrl)
          .then((response) => {
            if (!response.ok) throw response;
            return response.json();
          })
          .then((json) => {
            textArea.value += `${json.name || json.userName || "Unknown"} [${json.id || json.externalReferenceCode || "N/A"}]\r\n`;
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

      button.addEventListener("click", buttonEventListener);
    }
  }
};

initWhoAmI();
