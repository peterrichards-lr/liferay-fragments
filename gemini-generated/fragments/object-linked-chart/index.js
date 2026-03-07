const CHART_JS_URL = "https://cdn.jsdelivr.net/npm/chart.js";

const THEME_COLORS = [
  "var(--orange, #cc4e00)",
  "var(--indigo, #4d5fff)",
  "var(--pink, #e50082)",
  "var(--cyan, #0077b3)",
  "var(--green, #458613)",
  "var(--red, #e60000)",
  "var(--purple, #aa33ff)",
  "var(--blue, #006eff)",
  "var(--teal, #1b7e6e)",
  "var(--yellow, #ffbb00)",
];

const RAINBOW_COLORS = [
  "var(--red, #ff0000)",
  "var(--orange, #ff7f00)",
  "var(--yellow, #ffff00)",
  "var(--green, #00ff00)",
  "var(--blue, #0000ff)",
  "var(--indigo, #4b0082)",
  "var(--purple, #8b00ff)",
];

const COOL_COLORS = [
  "var(--cyan, #0077b3)",
  "var(--teal, #1b7e6e)",
  "var(--blue, #006eff)",
  "var(--indigo, #4d5fff)",
  "var(--purple, #aa33ff)",
];

const WARM_COLORS = [
  "var(--red, #e60000)",
  "var(--orange, #cc4e00)",
  "var(--yellow, #ffbb00)",
  "var(--pink, #e50082)",
  "var(--warning, #ffcc00)",
];

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

const loadScript = (url) => {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
    } else {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
};

const resolveColor = (colorStr, element, filter = "") => {
  const temp = document.createElement("div");
  temp.style.color = colorStr;
  if (filter) temp.style.filter = filter;
  temp.style.display = "none";
  element.appendChild(temp);
  const resolved = getComputedStyle(temp).color;
  element.removeChild(temp);
  return resolved;
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
      mappedVal !== "SALES_REPORT" // Default value check
    ) {
      objectERC = mappedVal;
    }
  }

  if (!objectERC) throw new Error("Object ERC not configured.");

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

  const response = await Liferay.Util.fetch(`${url}/?pageSize=100`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("Permission denied.");
    throw new Error(
      `Failed to fetch data for "${definition.restContextPath}".`,
    );
  }
  const data = await response.json();
  return { items: data.items || [], definition };
};

const aggregateData = (items, labelField, valueFields, type, sortOrder) => {
  let processedLabels = [];
  let processedDatasets = [];

  if (type === "none") {
    processedLabels = items.map((item) => item[labelField] || "N/A");
    processedDatasets = valueFields.map((field) =>
      items.map((item) => item[field] || 0),
    );
  } else {
    const groups = {};
    items.forEach((item) => {
      const key = item[labelField] || "N/A";
      if (!groups[key]) {
        groups[key] = { count: 0, label: key };
        valueFields.forEach((f) => (groups[key][f] = 0));
      }
      groups[key].count++;
      valueFields.forEach((f) => {
        const val = parseFloat(item[f]) || 0;
        groups[key][f] += val;
      });
    });

    const sortedGroups = Object.values(groups);

    // Apply Sorting Logic
    if (sortOrder === "label-asc") {
      sortedGroups.sort((a, b) =>
        String(a.label).localeCompare(String(b.label)),
      );
    } else if (sortOrder === "label-desc") {
      sortedGroups.sort((a, b) =>
        String(b.label).localeCompare(String(a.label)),
      );
    } else if (sortOrder === "value-asc" || sortOrder === "value-desc") {
      const primaryField = valueFields[0];
      sortedGroups.sort((a, b) => {
        const valA = type === "count" ? a.count : a[primaryField];
        const valB = type === "count" ? b.count : b[primaryField];
        return sortOrder === "value-asc" ? valA - valB : valB - valA;
      });
    }

    processedLabels = sortedGroups.map((g) => g.label);
    processedDatasets = valueFields.map((field) => {
      return sortedGroups.map((group) => {
        if (type === "sum") return group[field];
        if (type === "avg") return group[field] / group.count;
        if (type === "count") return group.count;
        return 0;
      });
    });
  }

  return { labels: processedLabels, datasets: processedDatasets };
};

const initChart = async (isEditMode) => {
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );
  const chartWrapper = fragmentElement.querySelector(".chart-wrapper");
  const titleEl = fragmentElement.querySelector(".chart-title");

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
      if (chartWrapper) chartWrapper.innerHTML = "";
    } else if (chartWrapper) {
      chartWrapper.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-danger">${msg}</div>`;
    }
  };

  const showInfo = (msg) => {
    if (isEditMode && infoEl) {
      infoEl.textContent = msg;
      infoEl.classList.remove("d-none");
      if (chartWrapper) chartWrapper.innerHTML = "";
    } else if (chartWrapper) {
      chartWrapper.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted">${msg}</div>`;
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  const {
    objectERC,
    labelField,
    valueFields,
    aggregationType,
    chartType,
    sortOrder,
    borderFilter,
    colorMapping,
    colorPalette,
    showLegend,
    enableSecondaryYAxis,
    chartTitle: configTitle,
    xAxisLabel: configXLabel,
    yAxisLabel: configYLabel,
    secondaryYAxisLabel: configYLabel2,
  } = configuration;

  if (!objectERC) {
    showInfo("Please configure an Object External Reference Code.");
  } else {
    try {
      await loadScript(CHART_JS_URL);
      const { items, definition } = await fetchData();

      if (items.length === 0) {
        showInfo(`No data found for object "${objectERC}".`);
      } else {
        // Create field name to localized label map
        const fieldNameMap = {};
        definition.objectFields.forEach((f) => {
          fieldNameMap[f.name] = getLocalizedValue(f.label);
        });

        // Smart Title Logic
        const currentTitle = titleEl.innerText.trim();
        const defaultFragmentName =
          fragmentElement.dataset.fragmentName || "Object-Linked Chart";

        // "Evaluated Value" based on data
        const objectLabel = getLocalizedValue(
          definition.pluralLabel || definition.label || definition.name,
        );
        const evaluatedTitle = `${objectLabel} (${aggregationType !== "none" ? aggregationType : "Raw Data"})`;

        // Precedence: Configuration (configTitle) > Evaluated Value
        const preferredTitle = configTitle || evaluatedTitle;

        if (
          currentTitle === "Object-Linked Chart" ||
          currentTitle === "Object Data Chart" ||
          currentTitle === defaultFragmentName ||
          currentTitle === "" ||
          currentTitle === "Regional Sales Performance" || // Previous default
          currentTitle === `${defaultFragmentName} (Preview)`
        ) {
          titleEl.innerText = preferredTitle + (isEditMode ? " (Preview)" : "");
        }

        const fields = (valueFields || "")
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);

        if (fields.length === 0) {
          showInfo("Please configure at least one value field.");
        } else {
          const { labels, datasets: dataValues } = aggregateData(
            items,
            labelField,
            fields,
            aggregationType,
            sortOrder,
          );

          // Resolve effective color mapping mode
          let effectiveMapping = colorMapping || "auto";
          if (effectiveMapping === "auto") {
            if (fields.length === 1) {
              effectiveMapping = "label";
            } else {
              effectiveMapping = ["pie", "doughnut", "polarArea"].includes(
                chartType,
              )
                ? "label"
                : "series";
            }
          }

          // Determine color palette
          let palette = THEME_COLORS;
          if (colorPalette === "rainbow") palette = RAINBOW_COLORS;
          else if (colorPalette === "cool") palette = COOL_COLORS;
          else if (colorPalette === "warm") palette = WARM_COLORS;

          const datasets = fields.map((field, index) => {
            let bgColors, borderColors;

            if (effectiveMapping === "label") {
              bgColors = labels.map((_, i) =>
                resolveColor(palette[i % palette.length], fragmentElement),
              );
              borderColors = labels.map((_, i) =>
                resolveColor(
                  palette[i % palette.length],
                  fragmentElement,
                  borderFilter,
                ),
              );
            } else {
              const baseColor = palette[index % palette.length];
              bgColors = resolveColor(baseColor, fragmentElement);
              borderColors = resolveColor(
                baseColor,
                fragmentElement,
                borderFilter,
              );
            }

            const localizedFieldLabel = fieldNameMap[field] || field;

            const ds = {
              label:
                aggregationType !== "none"
                  ? `${localizedFieldLabel} (${aggregationType})`
                  : localizedFieldLabel,
              data: dataValues[index],
              backgroundColor: bgColors,
              borderColor: borderColors,
              borderWidth: 2,
              fill: chartType === "line" ? false : true,
            };

            if (
              enableSecondaryYAxis &&
              index > 0 &&
              ["bar", "line"].includes(chartType)
            ) {
              ds.yAxisID = "y1";
            }

            return ds;
          });

          const canvas = fragmentElement.querySelector(
            `#chart-${fragmentEntryLinkNamespace}`,
          );
          if (canvas) {
            const xLabelEl = fragmentElement.querySelector(
              '[data-lfr-editable-id="x-axis-label"]',
            );
            const yLabelEl = fragmentElement.querySelector(
              '[data-lfr-editable-id="y-axis-label"]',
            );
            const yLabelEl2 = fragmentElement.querySelector(
              '[data-lfr-editable-id="y-axis-label-2"]',
            );
            const resolvedXLabel = xLabelEl ? xLabelEl.innerText : configXLabel;
            const resolvedYLabel = yLabelEl ? yLabelEl.innerText : configYLabel;
            const resolvedYLabel2 = yLabelEl2
              ? yLabelEl2.innerText
              : configYLabel2;

            const existingChart = Chart.getChart(canvas);
            if (existingChart) existingChart.destroy();

            const isCartesian = ["bar", "line"].includes(chartType);
            const isRadial = ["radar", "polarArea"].includes(chartType);

            const chartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              animation: isEditMode ? false : { duration: 1000 },
              plugins: {
                legend: {
                  display: showLegend !== false,
                  position: "top",
                },
                tooltip: { mode: "index", intersect: false },
              },
            };

            if (isCartesian) {
              chartOptions.scales = {
                x: {
                  display: true,
                  title: {
                    display: !!resolvedXLabel,
                    text: resolvedXLabel,
                  },
                },
                y: {
                  beginAtZero: true,
                  display: true,
                  title: {
                    display: !!resolvedYLabel,
                    text: resolvedYLabel,
                  },
                },
              };

              if (enableSecondaryYAxis && datasets.length > 1) {
                chartOptions.scales.y1 = {
                  beginAtZero: true,
                  display: true,
                  position: "right",
                  grid: { drawOnChartArea: false },
                  title: {
                    display: !!resolvedYLabel2,
                    text: resolvedYLabel2,
                  },
                };
              }
            } else if (isRadial) {
              chartOptions.scales = {
                r: {
                  beginAtZero: true,
                  angleLines: { display: true },
                  suggestedMin: 0,
                },
              };
            }

            const ctx = canvas.getContext("2d");
            new Chart(ctx, {
              type: chartType || "bar",
              data: {
                labels: labels,
                datasets: datasets,
              },
              options: chartOptions,
            });
          }
        }
      }
    } catch (err) {
      showError(err.message);
    }
  }
};

if (layoutMode === "view") initChart(false);
else {
  if (configuration.objectERC) initChart(true);
  else {
    const chartWrapper = fragmentElement.querySelector(".chart-wrapper");
    if (chartWrapper) chartWrapper.innerHTML = "";
    showInfo(
      "Please provide an Object External Reference Code in the configuration.",
    );
  }
}
