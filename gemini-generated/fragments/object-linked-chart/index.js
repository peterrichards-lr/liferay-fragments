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

const loadScript = (url) => {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
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
  const { objectERC } = configuration;
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
  return data.items || [];
};

const aggregateData = (items, labelField, valueFields, type) => {
  if (type === "none")
    return {
      labels: items.map((item) => item[labelField] || "N/A"),
      datasets: valueFields.map((field) =>
        items.map((item) => item[field] || 0),
      ),
    };

  const groups = {};
  items.forEach((item) => {
    const key = item[labelField] || "N/A";
    if (!groups[key]) {
      groups[key] = { count: 0 };
      valueFields.forEach((f) => (groups[key][f] = 0));
    }
    groups[key].count++;
    valueFields.forEach((f) => {
      const val = parseFloat(item[f]) || 0;
      groups[key][f] += val;
    });
  });

  const labels = Object.keys(groups);
  const datasets = valueFields.map((field) => {
    return labels.map((label) => {
      const group = groups[label];
      if (type === "sum") return group[field];
      if (type === "avg") return group[field] / group.count;
      if (type === "count") return group.count;
      return 0;
    });
  });

  return { labels, datasets };
};

const initChart = async (isEditMode) => {
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );
  const chartWrapper = fragmentElement.querySelector(".chart-wrapper");

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
    borderFilter,
  } = configuration;

  if (!objectERC) {
    showInfo("Please configure an Object External Reference Code.");
    return;
  }

  try {
    await loadScript(CHART_JS_URL);
    const items = await fetchData();

    if (items.length === 0) {
      showInfo(`No data found for object "${objectERC}".`);
      return;
    }

    const fields = (valueFields || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    if (fields.length === 0) {
      showInfo("Please configure at least one value field.");
      return;
    }

    const { labels, datasets: dataValues } = aggregateData(
      items,
      labelField,
      fields,
      aggregationType,
    );

    const datasets = fields.map((field, index) => {
      const baseColor = THEME_COLORS[index % THEME_COLORS.length];
      const resolvedBg = resolveColor(baseColor, fragmentElement);
      const resolvedBorder = resolveColor(
        baseColor,
        fragmentElement,
        borderFilter,
      );

      return {
        label:
          aggregationType !== "none" ? `${field} (${aggregationType})` : field,
        data: dataValues[index],
        backgroundColor: resolvedBg,
        borderColor: resolvedBorder,
        borderWidth: 2,
        fill: chartType === "line" ? false : true,
      };
    });

    const fallbackTable = fragmentElement.querySelector(
      `#fallback-table-${fragmentEntryLinkNamespace}`,
    );
    if (fallbackTable) {
      fallbackTable.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>${labelField}</th>
                            ${fields.map((f) => `<th>${f}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${labels
                          .map(
                            (label, i) => `
                            <tr>
                                <td>${label}</td>
                                ${fields.map((f, j) => `<td>${dataValues[j][i]}</td>`).join("")}
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
    }

    const canvas = fragmentElement.querySelector(
      `#chart-${fragmentEntryLinkNamespace}`,
    );
    if (!canvas) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: chartType || "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: isEditMode ? false : { duration: 1000 },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            display: !["pie", "doughnut"].includes(chartType),
          },
          x: {
            display: !["pie", "doughnut"].includes(chartType),
          },
        },
      },
    });
  } catch (err) {
    showError(err.message);
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
