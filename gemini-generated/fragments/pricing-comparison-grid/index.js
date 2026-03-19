const initPricing = () => {
  const toggle = fragmentElement.querySelector(
    `#toggle-${fragmentEntryLinkNamespace}`,
  );

  const parsePlans = () => {
    const data = configuration.plansData || "";
    return data
      .split(";")
      .filter((p) => p)
      .map((planStr) => {
        const parts = planStr.split(",");
        return {
          name: parts[0] || "Plan",
          yearPrice: parts[1] || "0",
          monthPrice: parts[2] || "0",
          features: parts.slice(3),
        };
      });
  };

  const renderGrid = (isYearly) => {
    const grid = fragmentElement.querySelector(
      `#grid-${fragmentEntryLinkNamespace}`,
    );
    const infoEl = fragmentElement.querySelector(
      `#info-${fragmentEntryLinkNamespace}`,
    );

    if (infoEl) infoEl.classList.add("d-none");
    if (grid) {
      const plans = parsePlans();

      if (plans.length === 0) {
        if (layoutMode !== "view" && infoEl) {
          infoEl.textContent =
            "Please provide plans data in the configuration.";
          infoEl.classList.remove("d-none");
        }
        grid.innerHTML =
          '<div class="text-center p-5 w-100 text-muted">No pricing plans configured.</div>';
      } else {
        grid.innerHTML = plans
          .map(
            (plan, index) => `
                  <article class="pricing-card ${index === 1 ? "featured" : ""}">
                      <h3 class="plan-name">${plan.name}</h3>
                      <div class="plan-price">
                          $${isYearly ? plan.yearPrice : plan.monthPrice}
                          <span>/${isYearly ? "yr" : "mo"}</span>
                      </div>
                      <ul class="plan-features">
                          ${plan.features.map((f) => `<li>${f}</li>`).join("")}
                      </ul>
                      <a href="#" class="plan-btn" aria-label="Choose ${plan.name} Plan">Choose ${plan.name}</a>
                  </article>
              `,
          )
          .join("");
      }
    }
  };

  renderGrid(false);

  if (toggle) {
    toggle.addEventListener("change", (e) => {
      toggle.setAttribute("aria-checked", e.target.checked);
      renderGrid(e.target.checked);
    });

    // Add keyboard support for toggle if not using a native checkbox label
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        toggle.checked = !toggle.checked;
        toggle.setAttribute("aria-checked", toggle.checked);
        renderGrid(toggle.checked);
      }
    });
  }
};

initPricing();
