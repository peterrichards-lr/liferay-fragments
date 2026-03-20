<div
  class="pricing-grid-fragment pricing-${fragmentEntryLinkNamespace}"
  style="--highlight-color: ${configuration.highlightColor!}"
>
  <div
    class="alert alert-info d-none mb-3"
    id="info-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>
  <div
    class="alert alert-danger d-none mb-3"
    id="error-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>

  <div class="pricing-toggle-wrap">
    <span
      class="toggle-label monthly"
      id="label-monthly-${fragmentEntryLinkNamespace}"
      >Monthly</span
    >
    <label class="pricing-toggle">
      <input
        type="checkbox"
        id="toggle-${fragmentEntryLinkNamespace}"
        role="switch"
        aria-checked="false"
        aria-labelledby="label-monthly-${fragmentEntryLinkNamespace} label-yearly-${fragmentEntryLinkNamespace}"
      />
      <span class="toggle-slider"></span>
    </label>
    <span
      class="toggle-label yearly"
      id="label-yearly-${fragmentEntryLinkNamespace}"
      >Yearly <span class="badge badge-success badge-sm">Save 20%</span></span
    >
  </div>

  <div
    class="pricing-grid"
    id="grid-${fragmentEntryLinkNamespace}"
    role="region"
    aria-label="Pricing Plans"
  >
    <!-- Plans dynamically injected here as articles -->
  </div>
</div>
