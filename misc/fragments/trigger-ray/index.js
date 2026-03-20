const initTriggerRay = () => {
  if (layoutMode === 'view') {
    const btn = fragmentElement.querySelector('.trigger-ray-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        // Trigger Ray logic
      });
    }
  }
};

initTriggerRay();
