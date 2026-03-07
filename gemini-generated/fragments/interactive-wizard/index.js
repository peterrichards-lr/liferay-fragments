const initInteractiveWizard = () => {
  const container = fragmentElement.querySelector(".interactive-wizard");
  const steps = Array.from(fragmentElement.querySelectorAll(".step-item"));
  const panels = Array.from(fragmentElement.querySelectorAll(".step-panel"));
  const backBtn = fragmentElement.querySelector(".back-btn");
  const nextBtn = fragmentElement.querySelector(".next-btn");
  const finishBtn = fragmentElement.querySelector(".finish-btn");

  let currentStep = 0;

  const updateUI = () => {
    // Update Indicators
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
      step.classList.toggle("completed", index < currentStep);
      step.setAttribute(
        "aria-current",
        index === currentStep ? "step" : "false",
      );
    });

    // Update Panels
    panels.forEach((panel, index) => {
      panel.classList.toggle("d-none", index !== currentStep);
    });

    // Update Buttons
    if (backBtn) {
      backBtn.classList.toggle("d-none", currentStep === 0);
    }

    if (nextBtn && finishBtn) {
      if (currentStep === steps.length - 1) {
        nextBtn.classList.add("d-none");
        finishBtn.classList.remove("d-none");
      } else {
        nextBtn.classList.remove("d-none");
        finishBtn.classList.add("d-none");
      }
    }

    // Set focus to the current panel
    if (panels[currentStep]) {
      panels[currentStep].focus();
    }
  };

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      updateUI();
    }
  };

  const goToBack = () => {
    if (currentStep > 0) {
      currentStep--;
      updateUI();
    }
  };

  if (layoutMode === "view") {
    if (nextBtn) nextBtn.addEventListener("click", goToNext);
    if (backBtn) backBtn.addEventListener("click", goToBack);
    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        alert("Wizard completed!");
        // Optional: Trigger a custom event or redirect
      });
    }

    // Keyboard support
    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Optional: Reset wizard
      }
    });
  }

  // Initialize
  updateUI();
};

initInteractiveWizard();
