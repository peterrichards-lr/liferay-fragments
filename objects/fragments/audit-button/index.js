const initAuditButton = () => {
  const { resolveObjectPathByERC } = Liferay.Fragment.Commons;

  if (layoutMode === "view") {
    const formatDate = (d) => {
      return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    };

    let apiPath = "";

    const resolveApiPath = async () => {
      const objectERC = configuration.objectERC || "AUDIT_ENTRY";
      try {
        const result = await resolveObjectPathByERC(objectERC);

        if (result.apiPath) {
          apiPath = result.apiPath;
        } else {
          // Fallback to legacy path if resolution fails
          apiPath = "/o/c/auditentries";
        }
      } catch (err) {
        console.error(err);
        apiPath = "/o/c/auditentries";
      }
    };

    const createAuditEntry = async (entryDate, account, action) => {
      if (!apiPath) await resolveApiPath();

      const auditEntry = {
        action,
        account,
        entryDate,
        userEmail: Liferay.ThemeDisplay.getUserEmailAddress(),
      };

      Liferay.Util.fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditEntry),
      })
        .then((response) => {
          const { status } = response;
          const responseContentType = response.headers.get("content-type");
          if (status === 204) {
            return { status };
          } else if (
            response.ok &&
            responseContentType === "application/json"
          ) {
            return response.json();
          } else {
            return response.text();
          }
        })
        .then((response) => {
          console.log("Audit Success:", response);
        })
        .catch((reason) => console.error("Audit Error:", reason));
    };

    const getEntryDate = () => {
      return formatDate(new Date());
    };

    const getAccount = () => {
      if (Liferay.CommerceContext && Liferay.CommerceContext.getAccountName) {
        return Liferay.CommerceContext.getAccountName();
      }
      return "N/A";
    };

    const getAction = (btn) => {
      const usePrefixSuffix = configuration.usePrefixAndSuffix;
      const actionPrefix =
        (configuration.auditActionPrefix || "") +
        (configuration.addSpace ? " " : "");
      const actionSuffix =
        (configuration.addSpace ? " " : "") +
        (configuration.auditActionSuffix || "");

      var action = usePrefixSuffix ? actionPrefix : "";
      if (configuration.useButtonText && btn) {
        action += btn.innerHTML.trim();
      } else {
        const actionMessage = fragmentElement.querySelector(
          "div.action-configuration",
        );
        if (actionMessage) action += actionMessage.innerHTML.trim();
      }
      action += usePrefixSuffix ? actionSuffix : "";
      return action.trim();
    };

    const clickHandler = (evt) => {
      const btn = evt.currentTarget;

      const entryDate = getEntryDate();
      const account = getAccount();
      const action = getAction(btn);

      createAuditEntry(entryDate, account, action);
    };

    const btn = fragmentElement.querySelector("a.btn");
    if (btn) {
      btn.addEventListener("click", clickHandler);
    }

    // Pre-resolve
    resolveApiPath();
  } else if (layoutMode === "edit") {
    const configEl = fragmentElement.querySelector("#action-configuration");
    if (configEl) configEl.classList.remove("configuration");
  }
};

initAuditButton();
