const ADMIN_API_BASE = "/o/object-admin/v1.0";
const JSPDF_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const HTML2CANVAS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

const loadScript = (url) =>
  new Promise((res, rej) => {
    if (url.includes("jspdf") && window.jspdf) return res();
    if (url.includes("html2canvas") && window.html2canvas) return res();
    const s = document.createElement("script");
    s.src = url;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

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

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const createSearchableSelect = (container, options = {}) => {
  const {
    placeholder = "Search...",
    defaultValue = "",
    onSelect = () => {},
    fetchFn = null,
    initialOptions = [],
  } = options;

  container.innerHTML = `
        <div class="searchable-select-container">
            <input type="text" class="form-control form-control-sm" placeholder="${placeholder}" value="${defaultValue}">
            <input type="hidden" value="${defaultValue}">
            <div class="searchable-select-results"></div>
        </div>
    `;

  const input = container.querySelector("input[type='text']");
  const hidden = container.querySelector("input[type='hidden']");
  const results = container.querySelector(".searchable-select-results");
  let currentOptions = initialOptions;

  const renderResults = (items) => {
    if (!items || items.length === 0) {
      results.innerHTML =
        '<div class="search-result-item no-results">No results found</div>';
    } else {
      results.innerHTML = items
        .map(
          (item) => `
                <div class="search-result-item" data-value="${item.value}">${item.label}</div>
            `,
        )
        .join("");
    }
    results.classList.add("show");
  };

  const handleSearch = debounce(async (term) => {
    if (fetchFn) {
      const items = await fetchFn(term);
      currentOptions = items;
      renderResults(items);
    } else {
      const filtered = initialOptions.filter((opt) =>
        opt.label.toLowerCase().includes(term.toLowerCase()),
      );
      renderResults(filtered);
    }
  }, 300);

  input.addEventListener("input", (e) => {
    const term = e.target.value;
    if (term.length >= 0) {
      handleSearch(term);
    } else {
      results.classList.remove("show");
    }
  });

  input.addEventListener("focus", () => {
    if (currentOptions.length > 0 || input.value.length === 0) {
      renderResults(currentOptions);
    }
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      results.classList.remove("show");
    }
  });

  results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (item && !item.classList.contains("no-results")) {
      const val = item.dataset.value;
      const label = item.textContent;
      input.value = label;
      hidden.value = val;
      results.classList.remove("show");
      onSelect(val, label);
    }
  });

  return {
    setValue: (val, label) => {
      input.value = label || "";
      hidden.value = val || "";
    },
  };
};

const formatCellValue = (item, field) => {
  let value = item[field.name];

  if (value === undefined || value === null) {
    if (field.name === "createDate") value = item["dateCreated"];
    if (field.name === "modifiedDate") value = item["dateModified"];
  }

  if (value === null || value === undefined || value === "") return "-";

  if (
    field.businessType === "Date" ||
    field.type === "Date" ||
    field.businessType === "DateTime"
  ) {
    try {
      const languageId =
        typeof Liferay !== "undefined"
          ? Liferay.ThemeDisplay.getLanguageId()
          : "en_US";
      const locale = languageId.replace("_", "-");
      const dateObj = new Date(value);
      if (isNaN(dateObj.getTime())) return value;
      return dateObj.toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return value;
    }
  }

  if (field.businessType === "Picklist")
    return value.name || value.key || String(value);

  if (field.name === "status" && typeof value === "object")
    return value.label_i18n || value.label || String(value.code);

  if (field.name === "creator" && typeof value === "object")
    return value.name || value.givenName || String(value);

  if (field.localized) return getLocalizedValue(value);

  if (typeof value === "object") {
    if (Array.isArray(value))
      return value.map((v) => v.name || v.title || String(v)).join(", ");
    return value.name || value.title || JSON.stringify(value);
  }

  return String(value);
};

const getBaseUrl = (state) => {
  let url = state.definition.restContextPath;
  if (state.definition.scope === "site") {
    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    url += `/scopes/${siteId}`;
  }
  return url;
};

const isValidIdentifier = (val) => {
  if (val === undefined || val === null) return false;
  const s = String(val).trim().toLowerCase();
  return (
    s !== "" &&
    s !== "undefined" &&
    s !== "null" &&
    s !== "0" &&
    s !== "[object object]"
  );
};

const loadRecordData = async (recordId, recordERC, isEditMode, state) => {
  console.debug(
    `[Meta-Object Record View] loadRecordData called - ID: ${recordId}, ERC: ${recordERC}`,
  );
  const fieldsWrap = fragmentElement.querySelector(
    `#fields-${fragmentEntryLinkNamespace}`,
  );
  const pdfBtn = fragmentElement.querySelector(
    `#pdf-${fragmentEntryLinkNamespace}`,
  );

  // Ensure definition is loaded
  if (!state.definition) {
    const timer = setInterval(() => {
      if (state.definition) {
        clearInterval(timer);
        loadRecordData(recordId, recordERC, isEditMode, state);
      }
    }, 100);
    return;
  }

  try {
    let record = null;
    let hasIdentifier = false;

    // Build fields list for request
    const requestedFieldNames = new Set(state.fields.map((f) => f.name));
    requestedFieldNames.add("id");
    requestedFieldNames.add("externalReferenceCode");
    const fieldsParam = `fields=${Array.from(requestedFieldNames).join(",")}`;

    // 1. Try ERC
    if (isValidIdentifier(recordERC)) {
      const url = `${getBaseUrl(state)}/by-external-reference-code/${recordERC}?${fieldsParam}`;
      console.debug(`[Meta-Object Record View] Fetching record by ERC: ${url}`);
      const response = await Liferay.Util.fetch(url);
      if (response.ok) {
        record = await response.json();
        hasIdentifier = true;
      }
    }

    // 2. Fallback to ID
    if (!record && isValidIdentifier(recordId)) {
      const url = `${getBaseUrl(state)}/${recordId}?${fieldsParam}`;
      console.debug(`[Meta-Object Record View] Fetching record by ID: ${url}`);
      const response = await Liferay.Util.fetch(url);
      if (response.ok) {
        record = await response.json();
        hasIdentifier = true;
      }
    }

    // 3. Fallback to first item in edit mode (preview)
    if (!record && isEditMode) {
      const listRes = await Liferay.Util.fetch(
        `${getBaseUrl(state)}/?pageSize=1&${fieldsParam}`,
      );
      if (listRes.ok) {
        const data = await listRes.json();
        record = data.items?.[0] || null;
        hasIdentifier = !!record;
      }
    }

    if (record) {
      state.currentRecordId = record.id;

      fieldsWrap.innerHTML = state.fields
        .map(
          (f) => `
            <div class="record-row">
                <div class="field-label">${getLocalizedValue(f.label)}</div>
                <div class="field-value">${formatCellValue(record, f)}</div>
            </div>
        `,
        )
        .join("");

      if (pdfBtn) {
        if (!isEditMode && state.currentRecordId) {
          pdfBtn.classList.remove("d-none");
          pdfBtn.onclick = async () => {
            const doc = new window.jspdf.jsPDF("p", "pt", "a4");
            await doc.html(
              fragmentElement.querySelector(
                `#capture-${fragmentEntryLinkNamespace}`,
              ),
              {
                callback: (pdf) =>
                  pdf.save(
                    `${state.definition.restContextPath.replace("/o/c/", "")}_${state.currentRecordId}.pdf`,
                  ),
                x: 40,
                y: 40,
                width: 515,
                windowWidth: 800,
              },
            );
          };
        } else {
          pdfBtn.classList.add("d-none");
        }
      }
    } else {
      state.currentRecordId = null;
      if (!isEditMode) {
        fieldsWrap.innerHTML =
          '<div class="alert alert-info">No record found matching the provided identifier.</div>';
      }
    }
  } catch (err) {
    fieldsWrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
};

const initSelector = async (state) => {
  const { enableRecordSelection } = configuration;
  const container = fragmentElement.querySelector(
    `#selector-${fragmentEntryLinkNamespace}`,
  );
  if (container && enableRecordSelection) {
    createSearchableSelect(container, {
      placeholder: "Search records to view...",
      fetchFn: async (term) => {
        const response = await Liferay.Util.fetch(
          `${getBaseUrl(state)}/?search=${term}&pageSize=20`,
        );
        const data = await response.json();
        const titleField = state.definition.titleObjectFieldName || "id";
        return (data.items || []).map((r) => ({
          label: r[titleField] || r.id,
          value: r.id,
        }));
      },
      onSelect: (id) => loadRecordData(id, null, false, state),
    });
  }
};

const initRecordView = async (isEditMode) => {
  const {
    objectERC: configERC,
    fallbackRecordIdentifier,
    fallbackRecordIdentifierType,
    enableRecordSelection,
    customizeColumns,
    columnsToDisplay,
    viewTitle: configTitle,
  } = configuration;

  const state = {
    definition: null,
    fields: [],
    currentRecordId: null,
  };

  const fieldsWrap = fragmentElement.querySelector(
    `#fields-${fragmentEntryLinkNamespace}`,
  );
  const titleEl = fragmentElement.querySelector(".object-name-label");
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
      if (fieldsWrap) fieldsWrap.innerHTML = "";
    } else if (fieldsWrap) {
      fieldsWrap.innerHTML = `<div class="text-center p-5 text-danger">${msg}</div>`;
    }
  };

  const showInfo = (msg) => {
    if (isEditMode && infoEl) {
      infoEl.textContent = msg;
      infoEl.classList.remove("d-none");
      if (fieldsWrap) fieldsWrap.innerHTML = "";
    } else if (fieldsWrap) {
      fieldsWrap.innerHTML = `<div class="text-center p-5 text-muted">${msg}</div>`;
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

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
      mappedVal !== "COMPANY_MILESTONE"
    ) {
      objectERC = mappedVal;
    }
  }

  // Register event listener IMMEDIATELY
  window.addEventListener("lfr-object-view-select", (e) => {
    console.debug(
      `[Meta-Object Record View] Received lfr-object-view-select for ${objectERC}`,
      e.detail,
    );
    if (e.detail && e.detail.objectERC === objectERC) {
      const eventId = e.detail.recordId || e.detail.identifier || null;
      const eventERC = e.detail.recordERC || e.detail.erc || null;

      if (isValidIdentifier(eventId) || isValidIdentifier(eventERC)) {
        console.debug(
          `[Meta-Object Record View] Loading record from event - ID: ${eventId}, ERC: ${eventERC}`,
        );
        loadRecordData(eventId, eventERC, false, state);
      }
    }
  });

  if (!objectERC) {
    titleEl.textContent = "Meta-Object Record View";
    showInfo("Please configure an Object External Reference Code.");
  } else {
    try {
      await Promise.all([loadScript(JSPDF_URL), loadScript(HTML2CANVAS_URL)]);
      const defRes = await Liferay.Util.fetch(
        `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
      );
      if (!defRes.ok)
        throw new Error(`Failed to fetch definition (ERC: ${objectERC}).`);
      state.definition = await defRes.json();

      // Smart Title Logic
      const currentTitle = titleEl.innerText.trim();
      const defaultFragmentName =
        fragmentElement.dataset.fragmentName || "Meta-Object Record View";

      const objectLabel = getLocalizedValue(
        state.definition.label || state.definition.name,
      );

      // Precedence: Configuration (configTitle) > Evaluated Value (objectLabel)
      const preferredTitle = configTitle || objectLabel;

      if (
        currentTitle === "Record Detail" ||
        currentTitle === defaultFragmentName ||
        currentTitle === "" ||
        currentTitle === `${defaultFragmentName} (Preview)`
      ) {
        titleEl.innerText = preferredTitle + (isEditMode ? " (Preview)" : "");
      }

      // Resolve fields to display
      const allFields = state.definition.objectFields;
      if (customizeColumns && columnsToDisplay) {
        const desired = columnsToDisplay.split(",").map((c) => c.trim());
        const seen = new Set();
        state.fields = desired
          .map((name) =>
            allFields.find(
              (f) => f.name === name || getLocalizedValue(f.label) === name,
            ),
          )
          .filter((f) => {
            if (!f || seen.has(f.name)) return false;
            seen.add(f.name);
            return true;
          });
      } else {
        state.fields = allFields.filter(
          (f) => !["id", "externalReferenceCode"].includes(f.name),
        );
      }

      const params = new URLSearchParams(window.location.search);
      let startId = params.get("entryId") || params.get("id");
      let startERC = params.get("entryERC") || params.get("erc");

      if (isValidIdentifier(fallbackRecordIdentifier)) {
        if (fallbackRecordIdentifierType === "erc")
          startERC = fallbackRecordIdentifier;
        else startId = fallbackRecordIdentifier;
      }

      if (
        isValidIdentifier(startId) ||
        isValidIdentifier(startERC) ||
        isEditMode ||
        enableRecordSelection
      ) {
        await loadRecordData(startId, startERC, isEditMode, state);
        if (!isEditMode && enableRecordSelection) await initSelector(state);
      } else {
        showInfo("No record ID found in URL or configuration.");
      }
    } catch (err) {
      showError(err.message);
    }
  }
};

if (layoutMode === "view") initRecordView(false);
else initRecordView(true);
