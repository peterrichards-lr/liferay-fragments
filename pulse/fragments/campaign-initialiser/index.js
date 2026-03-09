const initCampaignInitialiser = () => {
  const ADMIN_API_BASE = "/o/object-admin/v1.0";

  if (layoutMode !== "view") return;

  const cookieName = "__coId";
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const setCookie = (name, value, days = 30) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()}`;
  };

  const getUtmParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {};
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ].forEach((key) => {
      const val = urlParams.get(key);
      if (val) utm[key] = val;
    });
    return utm;
  };

  let apiPath = "";

  const resolveApiPath = async () => {
    try {
      const { apiPath: resolvedPath } =
        await Liferay.Fragment.Commons.resolveObjectPath("/o/c/campaigns");
      apiPath = resolvedPath;
    } catch (err) {
      console.error("[Campaign Initialiser] Scope resolution failed:", err);
      apiPath = "/o/c/campaigns";
    }
  };

  const createCampaignEntry = async () => {
    if (!apiPath) await resolveApiPath();

    const utm = getUtmParameters();
    if (!utm.utm_campaign && !configuration.campaignId) return;

    const existingId = getCookie(cookieName);
    if (Liferay.Fragment.Commons.isValidIdentifier(existingId)) {
      const check = await Liferay.Util.fetch(`${apiPath}/${existingId}`);
      if (check.ok) return;
    }

    const payload = {
      name: utm.utm_campaign || configuration.campaignId || "Unknown Campaign",
      ...utm,
      referrer: document.referrer,
    };

    try {
      const res = await Liferay.Util.fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setCookie(cookieName, data.id);
      }
    } catch (err) {
      console.error("[Campaign Initialiser] Error:", err);
    }
  };

  createCampaignEntry();

  // Legacy Analytics tracking
  if (window.Analytics) {
    Analytics.track("Campaign Initialised", {
      campaignId: configuration.campaignId,
      referrer: document.referrer,
    });
  }
};

initCampaignInitialiser();
