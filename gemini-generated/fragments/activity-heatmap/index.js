const state = {
  items: [],
  daysToShow: 90,
};

const fetchData = async () => {
  const { objectERC } = configuration;
  if (!objectERC) throw new Error("Object ERC not configured.");

  try {
    // Fetch definition by ERC
    const adminUrl = `/o/object-admin/v1.0/object-definitions/by-external-reference-code/${objectERC}`;
    const defRes = await Liferay.Util.fetch(adminUrl);
    if (!defRes.ok)
      throw new Error(`Could not find object with ERC "${objectERC}".`);
    const definition = await defRes.json();

    let url = definition.restContextPath;
    if (definition.scope === "site") {
      const siteId = Liferay.ThemeDisplay.getScopeGroupId();
      url += `/scopes/${siteId}`;
    }

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("You do not have permission to view this data.");
      }
      throw new Error(
        `Failed to fetch data from "${definition.restContextPath}".`,
      );
    }
    const data = await response.json();
    state.items = data.items || [];
    return state.items;
  } catch (err) {
    throw err;
  }
};

const renderHeatmap = () => {
  const grid = fragmentElement.querySelector(
    `#grid-${fragmentEntryLinkNamespace}`,
  );
  if (!grid) return;

  const { dateField } = configuration;
  const today = new Date();
  const activityMap = {};

  state.items.forEach((item) => {
    if (item[dateField]) {
      const dateStr = new Date(item[dateField]).toDateString();
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
  });

  let html = "";
  for (let i = state.daysToShow; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const count = activityMap[d.toDateString()] || 0;

    let level = 0;
    if (count > 0) level = 1;
    if (count > 2) level = 2;
    if (count > 5) level = 3;
    if (count > 10) level = 4;

    html += `<div class="heatmap-cell cell level-${level}" title="${d.toLocaleDateString()}: ${count} entries"></div>`;
  }
  grid.innerHTML = html;
};

const initSelector = () => {
  const { showSizeSelector, availableSizes, daysToDisplay } = configuration;
  const container = fragmentElement.querySelector(
    `#selector-${fragmentEntryLinkNamespace}`,
  );
  if (!container || !showSizeSelector) return;

  const sizes = (availableSizes || "5, 7, 14, 28, 30, 60, 90")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaultValue = daysToDisplay || "90";

  const select = document.createElement("select");
  select.className = "form-control form-control-sm";
  select.innerHTML = sizes
    .map(
      (size) =>
        `<option value="${size}" ${size === defaultValue ? "selected" : ""}>Last ${size} days</option>`,
    )
    .join("");

  select.addEventListener("change", (e) => {
    state.daysToShow = parseInt(e.target.value, 10);
    renderHeatmap();
  });

  container.appendChild(select);
};

const initHeatmap = async (isEditMode) => {
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );
  const grid = fragmentElement.querySelector(
    `#grid-${fragmentEntryLinkNamespace}`,
  );

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
      if (grid) grid.innerHTML = "";
    } else if (grid) {
      grid.innerHTML = `<div class="heatmap-status text-danger">${msg}</div>`;
    }
  };

  const showInfo = (msg) => {
    if (isEditMode && infoEl) {
      infoEl.textContent = msg;
      infoEl.classList.remove("d-none");
      if (grid) grid.innerHTML = "";
    } else if (grid) {
      grid.innerHTML = `<div class="heatmap-status">${msg}</div>`;
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  const { objectERC, daysToDisplay } = configuration;
  state.daysToShow = parseInt(daysToDisplay || "90", 10);

  if (!objectERC) {
    showInfo("Please configure an Object External Reference Code.");
    state.items = [];
    renderHeatmap();
    return;
  }

  try {
    await fetchData();
    if (state.items.length === 0 && isEditMode) {
      showInfo(`No items found for "${objectERC}". Rendering placeholder.`);
    }
    initSelector();
    renderHeatmap();
  } catch (err) {
    showError(err.message);
  }
};

if (layoutMode === "view") initHeatmap(false);
else initHeatmap(true);
