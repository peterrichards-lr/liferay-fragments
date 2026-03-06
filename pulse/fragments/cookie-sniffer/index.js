const initCookieSniffer = () => {
  if (layoutMode === "view") {
    const cookieName = configuration.cookieName;
    if (cookieName && window.Analytics) {
      const value = Liferay.Util.getCookie(cookieName);
      if (value) {
        Analytics.track("Cookie Detected", {
          cookieName: cookieName,
          cookieValue: value,
        });
      }
    }
  }
};

initCookieSniffer();
