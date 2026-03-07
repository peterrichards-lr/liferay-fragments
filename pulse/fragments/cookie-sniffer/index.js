const initCookieSniffer = () => {
  const { cookieName, consentCategory, enableDebug } = configuration;

  if (layoutMode === "view") {
    const debug = (msg, data) => {
      if (enableDebug) console.debug("[CookieSniffer]", msg, data);
    };

    const trackCookie = () => {
      if (!cookieName) {
        debug("No cookie name configured.");
        return;
      }

      if (!window.Analytics) {
        debug("Liferay Analytics not found.");
        return;
      }

      const value = Liferay.Util.getCookie(cookieName);
      if (value) {
        debug("Cookie detected, tracking...", { cookieName, value });
        Analytics.track("Cookie Detected", {
          cookieName: cookieName,
          cookieValue: value,
        });
      } else {
        debug("Cookie not found:", cookieName);
      }
    };

    // Check for Liferay Consent API
    if (window.Liferay && Liferay.Consent && Liferay.Consent.hasConsent) {
      const category = consentCategory || "marketing";
      if (Liferay.Consent.hasConsent(category)) {
        debug("Consent granted for category:", category);
        trackCookie();
      } else {
        debug("No consent for category:", category);
        // Subscribe to consent changes
        Liferay.on("consentChanged", (event) => {
          if (Liferay.Consent.hasConsent(category)) {
            debug("Consent newly granted for category:", category);
            trackCookie();
          }
        });
      }
    } else {
      debug("Consent API not found, falling back to direct track.");
      trackCookie();
    }
  }
};

initCookieSniffer();
