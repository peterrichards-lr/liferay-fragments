const isDebug = configuration.enableDebug;
if (fragmentNamespace) {
  if (!document.body.classList.contains('has-edit-mode-menu')) {
		const trackerSteps = fragmentElement.querySelectorAll('.lfr-layout-structure-item-tracker-step');
		if (trackerSteps && trackerSteps.length > 0) {
			const trackerStepCount = trackerSteps.length;
			if (isDebug) console.debug('trackerStepCount', trackerStepCount);
			const trackerStepWidth = 100 / trackerStepCount;
			for(let i = 0; i < trackerStepCount; i++) {
				const trackerStep = trackerSteps[i];
				trackerStep.style.width = `${trackerStepWidth}%`;
			}
		}
	} else {
    if (isDebug) console.debug('In edit mode');
  }
} else {
  if (isDebug) console.debug('fragmentNamespace is undefined');
}