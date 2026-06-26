function initCourseProgressCard() {
  const progressBar = fragmentElement.querySelector('.progress-bar');
  const progressValueEl = fragmentElement.querySelector(
    '[data-lfr-editable-id="course-progress-value"]'
  );

  if (progressBar && progressValueEl) {
    const updateProgress = () => {
      const value = parseInt(progressValueEl.textContent.trim()) || 0;
      progressBar.style.width = value + '%';
      progressBar.setAttribute('aria-valuenow', value);
    };

    // Initial update
    updateProgress();

    // Listen for changes in edit mode
    if (layoutMode === 'edit') {
      const observer = new MutationObserver(updateProgress);
      observer.observe(progressValueEl, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }
  }
}

initCourseProgressCard();
