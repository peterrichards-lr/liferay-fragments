const ADMIN_API_BASE = "/o/object-admin/v1.0";

const state = {
  definition: null,
  items: [],
  daysToDisplay: parseInt(configuration.daysToDisplay || "365"),
};

const getLocalizedValue = (value) => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const languageId =
      typeof Liferay !== "undefined"
        ? Liferay.ThemeDisplay.getLanguageId()
        : "en_US";
    return value[languageId] || value["en_US"] || "";
  }
  return value || "";
};

const fetchData = async () => {
  const { objectERC: configERC } = configuration;

  // Resolve effective ERC (Prioritize mappable field)
  const mappableERCEl = fragmentElement.querySelector(
    "[data-lfr-editable-id='object-erc']",
  );
  let objectERC = configERC;
  if (mappableERCEl) {
    const mappedVal = mappableERCEl.innerText.trim();
    if (
      mappedVal &&
      mappedVal !== configERC &&
      mappedVal !== "ACTIVITY_LOG" // Default value check
    ) {
      objectERC = mappedVal;
    }
  }

  if (!objectERC) throw new Error("Object ERC not configured.");

  const adminUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
  const defRes = await Liferay.Util.fetch(adminUrl);
  if (!defRes.ok) throw new Error("Object definition not found.");
  state.definition = await defRes.json();

  let url = state.definition.restContextPath;
  if (state.definition.scope === "site") {
    url += `/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
  }

  const response = await Liferay.Util.fetch(`${url}/?pageSize=1000`);
  const data = await response.json();
  state.items = data.items || [];
  return state.items;
};

const renderHeatmap = () => {
  const grid = fragmentElement.querySelector(
    `#heatmap-grid-${fragmentEntryLinkNamespace}`,
  );
  const legend = fragmentElement.querySelector(
    `#heatmap-legend-${fragmentEntryLinkNamespace}`,
  );

  if (grid) {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - state.daysToDisplay);

    // Group items by date (YYYY-MM-DD)
    const counts = {};
    state.items.forEach((item) => {
      const dateStr = new Date(item.createDate || item.dateCreated)
        .toISOString()
        .split("T")[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    let html = "";
    const tempDate = new Date(startDate);

    while (tempDate <= now) {
      const dateStr = tempDate.toISOString().split("T")[0];
      const count = counts[dateStr] || 0;
      let level = 0;
      if (count > 0) level = Math.min(Math.ceil(count / 2), 4);

      html += `<div class="heatmap-cell level-${level}" title="${dateStr}: ${count} activities"></div>`;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    grid.innerHTML = html;

    if (legend) {
      legend.innerHTML = `
            <span>Less</span>
            <div class="heatmap-cell level-0"></div>
            <div class="heatmap-cell level-1"></div>
            <div class="heatmap-cell level-2"></div>
            <div class="heatmap-cell level-3"></div>
            <div class="heatmap-cell level-4"></div>
            <span>More</span>
        `;
    }
  }
};

const initSizeSelector = () => {
  const { showSizeSelector } = configuration;
  const container = fragmentElement.querySelector(
    `#size-selector-${fragmentEntryLinkNamespace}`,
  );

  if (container && showSizeSelector) {
    container.innerHTML = `
        <select class="form-control form-control-sm w-auto">
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365" selected>Last Year</option>
        </select>
    `;

    container.querySelector("select").onchange = (e) => {
      state.daysToDisplay = parseInt(e.target.value);
      renderHeatmap();
    };
  }
};

const initActivityHeatmap = async (isEditMode) => {
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );
  const titleEl = fragmentElement.querySelector(".heatmap-title");

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  const { objectERC } = configuration;

  if (!objectERC) {
    if (titleEl) titleEl.textContent = "Activity Heatmap";
    if (isEditMode && infoEl) {
      infoEl.textContent = "Please configure an Object ERC.";
      infoEl.classList.remove("d-none");
    }
  } else {
    try {
      await fetchData();

      // Smart Title defaulting
      const currentTitle = titleEl.innerText.trim();
      const defaultFragmentName =
        fragmentElement.dataset.fragmentName || "Activity Heatmap";

      if (
        currentTitle === "Activity Heatmap" ||
        currentTitle === defaultFragmentName ||
        currentTitle === "" ||
        currentTitle === `${defaultFragmentName} (Preview)`
      ) {
        const objectLabel = getLocalizedValue(
          state.definition.pluralLabel ||
            state.definition.label ||
            state.definition.name,
        );
        titleEl.innerText = objectLabel + (isEditMode ? " (Preview)" : "");
      }

      renderHeatmap();
      initSizeSelector();
    } catch (err) {
      showError(err.message);
    }
  }
};

if (layoutMode === "view") {
  initActivityHeatmap(false);
} else {
  initActivityHeatmap(true);
}
