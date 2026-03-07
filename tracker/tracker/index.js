const initTracker = () => {
  const isDebug = configuration.enableDebug;

  if (layoutMode === "view") {
    const trackerSteps = fragmentElement.querySelectorAll(
      ".lfr-layout-structure-item-tracker-step",
    );
    if (trackerSteps && trackerSteps.length > 0) {
      const trackerStepCount = trackerSteps.length;
      if (isDebug) console.debug("trackerStepCount", trackerStepCount);
      const trackerStepWidth = 100 / trackerStepCount;
      for (let i = 0; i < trackerStepCount; i++) {
        const trackerStep = trackerSteps[i];
        trackerStep.style.width = `${trackerStepWidth}%`;
      }
    }
  } else if (layoutMode === "edit") {
    if (isDebug) console.debug("In edit mode");
  }
};

initTracker();
