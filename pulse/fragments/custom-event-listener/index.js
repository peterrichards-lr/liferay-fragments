const initCustomEventListener = () => {
  const ADMIN_API_BASE = "/o/object-admin/v1.0";

  const isValidIdentifier = (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    return (
      s !== "" &&
      s !== "undefined" &&
      s !== "null" &&
      s !== "0" &&
      s !== "[object object]"
    );
  };

  if (layoutMode !== "view") return;

  const { selectors, eventType, defaultAction } = configuration;
  if (!selectors) return;

  const cookieName = "__coId";
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  let apiPath = "";

  const resolveApiPath = async () => {
    try {
      const response = await Liferay.Util.fetch(
        `${ADMIN_API_BASE}/object-definitions/by-rest-context-path/campaigninteractions`,
      );
      if (!response.ok) throw new Error("Failed to fetch object definition");

      const definition = await response.json();
      let path = definition.restContextPath;

      if (definition.scope === "site") {
        const siteId = Liferay.ThemeDisplay.getScopeGroupId();
        path += `/scopes/${siteId}`;
      }

      apiPath = path;
    } catch (err) {
      console.error("[Event Listener] Scope resolution failed:", err);
      apiPath = "/o/c/campaigninteractions";
    }
  };

  const createInteraction = async (action, event) => {
    const campaignId = getCookie(cookieName);
    if (!isValidIdentifier(campaignId)) return;

    if (!apiPath) await resolveApiPath();

    const payload = {
      r_interaction_c_campaignId: campaignId,
      event: action,
      eventType: event.type,
      eventTarget: event.target.tagName,
    };

    try {
      await Liferay.Util.fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[Event Listener] Interaction Error:", err);
    }
  };

  const eventHandler = (e) => {
    const target = e.target;
    let action =
      target.getAttribute("custom-event-action") ||
      defaultAction ||
      `${e.type} on ${target.tagName}`;

    createInteraction(action, e);

    if (window.Analytics) {
      Analytics.track(action, {
        eventType: e.type,
        eventTarget: target.tagName,
        campaignId: getCookie(cookieName),
      });
    }
  };

  Liferay.on("allPortletsReady", () => {
    try {
      const elements = document.querySelectorAll(selectors);
      elements.forEach((el) => {
        el.addEventListener(eventType || "click", eventHandler);
      });
    } catch (err) {
      console.error("[Event Listener] Selector Error:", err);
    }
  });

  // Pre-resolve
  resolveApiPath();
};

initCustomEventListener();
