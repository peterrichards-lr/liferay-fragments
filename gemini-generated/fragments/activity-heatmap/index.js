const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
  definition: null,
  items: [],
  daysToDisplay: parseInt(configuration.daysToDisplay || '365'),
};

// Use Commons for localization
const getLocalizedValue = (value) =>
  Liferay.Fragment.Commons.getLocalizedValue(value);

const fetchData = async () => {
  const { objectERC: configERC } = configuration;

  // Resolve effective ERC (Prioritize mappable field)
  const mappableERCEl = fragmentElement.querySelector(
    "[data-lfr-editable-id='object-erc']"
  );
  let objectERC = configERC;
  if (mappableERCEl) {
    const mappedVal = mappableERCEl.innerText.trim();
    if (
      mappedVal &&
      mappedVal !== configERC &&
      mappedVal !== 'ACTIVITY_LOG' // Default value check
    ) {
      objectERC = mappedVal;
    }
  }

  if (!Liferay.Fragment.Commons.isValidIdentifier(objectERC))
    throw new Error('Object ERC not configured.');

  // Use Commons for discovery and path resolution
  const { definition, apiPath } =
    await Liferay.Fragment.Commons.resolveObjectPathByERC(objectERC);

  if (!definition) throw new Error('Object definition not found.');
  state.definition = definition;

  const response = await Liferay.Util.fetch(`${apiPath}/?pageSize=1000`);
  const data = await response.json();
  state.items = data.items || [];
  return state.items;
};

const renderHeatmap = () => {
  const grid = fragmentElement.querySelector(
    `#heatmap-grid-${fragmentEntryLinkNamespace}`
  );
  const legend = fragmentElement.querySelector(
    `#heatmap-legend-${fragmentEntryLinkNamespace}`
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
        .split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    let html = '';
    const tempDate = new Date(startDate);

    while (tempDate <= now) {
      const dateStr = tempDate.toISOString().split('T')[0];
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
    `#size-selector-${fragmentEntryLinkNamespace}`
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

    container.querySelector('select').onchange = (e) => {
      state.daysToDisplay = parseInt(e.target.value);
      renderHeatmap();
    };
  }
};

const initActivityHeatmap = async (isEditMode) => {
  const grid = fragmentElement.querySelector(
    `#heatmap-grid-${fragmentEntryLinkNamespace}`
  );
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`
  );
  const titleEl = fragmentElement.querySelector('.heatmap-title');
  const legend = fragmentElement.querySelector('.heatmap-legend');

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('d-none');
    }
  };

  if (errorEl) errorEl.classList.add('d-none');
  if (infoEl) infoEl.classList.add('d-none');

  const { objectERC: configERC, chartTitle: configTitle } = configuration;

  // Resolve effective ERC (Prioritize mappable field)
  const mappableERCEl = fragmentElement.querySelector(
    "[data-lfr-editable-id='object-erc']"
  );
  let objectERC = configERC;
  if (mappableERCEl) {
    const mappedVal = mappableERCEl.innerText.trim();
    if (mappedVal && mappedVal !== configERC && mappedVal !== 'ACTIVITY_LOG') {
      objectERC = mappedVal;
    }
  }

  const gridContainer = fragmentElement.querySelector('.heatmap-grid');

  if (!Liferay.Fragment.Commons.isValidIdentifier(objectERC)) {
    if (titleEl) titleEl.textContent = configTitle || 'Activity Heatmap';
    if (gridContainer) {
      Liferay.Fragment.Commons.renderConfigWarning(
        gridContainer,
        'Please select a Liferay Object ERC in the fragment settings to visualize activity.',
        layoutMode
      );
    }
    if (legend) legend.style.display = 'none';
  } else {
    try {
      await fetchData();

      if (state.items.length === 0) {
        if (gridContainer) {
          Liferay.Fragment.Commons.renderEmptyState(gridContainer, {
            title: 'No Activity Recorded',
            description: `The ${state.definition.name} object currently has no data to display in the heatmap.`,
          });
        }
        if (legend) legend.style.display = 'none';
      } else {
        if (legend) legend.style.display = 'flex';
        // Restore grid if it was replaced by empty state
        if (gridContainer && !gridContainer.id) {
          gridContainer.id = `heatmap-grid-${fragmentEntryLinkNamespace}`;
          gridContainer.classList.add('heatmap-grid');
        }

        // Smart Title defaulting
        const currentTitle = titleEl.innerText.trim();
        const defaultFragmentName =
          fragmentElement.dataset.fragmentName || 'Activity Heatmap';

        // Evaluated Value
        const objectLabel = getLocalizedValue(
          state.definition.pluralLabel ||
            state.definition.label ||
            state.definition.name
        );

        // Precedence: Configuration (configTitle) > Evaluated Value
        const preferredTitle = configTitle || objectLabel;

        if (
          currentTitle === 'Activity Heatmap' ||
          currentTitle === defaultFragmentName ||
          currentTitle === '' ||
          currentTitle === `${defaultFragmentName} (Preview)`
        ) {
          titleEl.innerText = preferredTitle + (isEditMode ? ' (Preview)' : '');
        }

        renderHeatmap();
        initSizeSelector();
      }
    } catch (err) {
      showError(err.message);
    }
  }
};

// Listen for global refresh signals from standardized Event Bus
Liferay.Fragment.Commons.EventBus.subscribe(
  'refreshData',
  (data) => {
    if (layoutMode === 'view') {
      console.debug('[Activity Heatmap] Received refresh signal', data);
      initActivityHeatmap(false);
    }
  },
  { replay: true }
);

if (layoutMode === 'view') {
  // Initial load handled by EventBus subscribe with replay:true
} else {
  initActivityHeatmap(true);
}
