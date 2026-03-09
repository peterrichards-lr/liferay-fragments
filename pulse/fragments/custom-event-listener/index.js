const initCustomEventListener = () => {
  const { isValidIdentifier, resolveObjectPath } = Liferay.Fragment.Commons;

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
      const result = await resolveObjectPath("/o/c/campaigninteractions");

      if (result.apiPath) {
        apiPath = result.apiPath;
      } else {
        apiPath = "/o/c/campaigninteractions";
      }
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
