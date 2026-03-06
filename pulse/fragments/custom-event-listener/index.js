const initCustomEventListener = () => {
  if (layoutMode === "view") {
    const eventName = configuration.eventName;
    if (eventName && window.Analytics) {
      window.addEventListener(eventName, (e) => {
        Analytics.track(eventName, e.detail || {});
      });
    }
  }
};

initCustomEventListener();
