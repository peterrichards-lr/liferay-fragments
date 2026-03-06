const ADMIN_API_BASE = "/o/object-admin/v1.0";

const state = {
  definition: null,
  currentRecordId: null,
  records: [],
  fieldOptions: {}, // Cache for picklist/relationship options
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

  const input = container.querySelector('input[type="text"]');
  const hidden = container.querySelector('input[type="hidden"]');
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

const mapFieldToInput = (field, value = "") => {
  const { type, businessType, name, required } = field;
  const label = getLocalizedValue(field.label);
  const commonAttrs = `name="${name}" id="${name}-${fragmentEntryLinkNamespace}" class="form-control" ${required ? "required" : ""}`;

  if (businessType === "Picklist" || businessType === "Relationship") {
    const selectedId = value && typeof value === "object" ? value.id : value;
    const initialLabel = value ? value.label || value.name || value : "";

    return `
            <div class="form-group mb-4">
                <label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? " *" : ""}</label>
                <div class="searchable-field-wrap" data-field-name="${name}" data-value="${selectedId || ""}" data-label="${initialLabel || ""}">
                    <div class="meta-status small text-muted">Initializing ${businessType.toLowerCase()}...</div>
                </div>
            </div>
        `;
  }

  switch (type) {
    case "Integer":
    case "Decimal":
    case "Double":
      return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? " *" : ""}</label><input type="number" ${commonAttrs} value="${value}"></div>`;
    case "DateTime":
    case "Date": {
      const dateValue = value
        ? new Date(value).toISOString().split("T")[0]
        : "";
      return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? " *" : ""}</label><input type="date" ${commonAttrs} value="${dateValue}"></div>`;
    }
    case "CPLongText":
      return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? " *" : ""}</label><textarea ${commonAttrs} rows="4">${value}</textarea></div>`;
    case "Boolean":
      return `<div class="form-group mb-4"><div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" name="${name}" id="${name}-${fragmentEntryLinkNamespace}" ${value ? "checked" : ""}><label class="custom-control-label" for="${name}-${fragmentEntryLinkNamespace}">${label}</label></div></div>`;
    default:
      return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? " *" : ""}</label><input type="text" ${commonAttrs} value="${value}"></div>`;
  }
};

const getBaseUrl = () => {
  let url = state.definition.restContextPath;
  if (state.definition.scope === "site") {
    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    url += `/scopes/${siteId}`;
  }
  return url;
};

const fetchOptionsForField = async (field, term = "") => {
  const { businessType } = field;

  if (businessType === "Picklist") {
    const erc = field.listTypeDefinitionExternalReferenceCode;
    const res = await Liferay.Util.fetch(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries?search=${term}`,
    );
    const data = await res.json();
    return (data.items || []).map((item) => ({
      label: getLocalizedValue(item.name),
      value: item.key,
    }));
  } else if (businessType === "Relationship") {
    const erc = field.objectDefinitionExternalReferenceCode1;
    const defRes = await Liferay.Util.fetch(
      `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${erc}`,
    );
    const relDef = await defRes.json();

    let url = relDef.restContextPath;
    if (relDef.scope === "site")
      url += `/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;

    const entriesRes = await Liferay.Util.fetch(
      `${url}/?search=${term}&pageSize=20`,
    );
    const data = await entriesRes.json();
    const titleField = relDef.titleObjectFieldName || "id";

    return (data.items || []).map((item) => ({
      label: item[titleField] || item.id,
      value: item.id,
    }));
  }
  return [];
};

const loadRecord = async (id) => {
  const fieldsWrap = fragmentElement.querySelector(".form-fields-wrap");
  const form = fragmentElement.querySelector("form");

  try {
    let record = {};
    if (id) {
      const response = await Liferay.Util.fetch(`${getBaseUrl()}/${id}`);
      if (!response.ok) throw new Error("Failed to fetch record.");
      record = await response.json();
      state.currentRecordId = id;
    } else {
      state.currentRecordId = null;
    }

    const fields = state.definition.objectFields.filter(
      (f) => !["id", "externalReferenceCode"].includes(f.name) && !f.readOnly,
    );
    fieldsWrap.innerHTML = fields
      .map((f) => mapFieldToInput(f, record[f.name] || ""))
      .join("");

    // Initialize searchable fields
    fields.forEach((f) => {
      if (f.businessType === "Picklist" || f.businessType === "Relationship") {
        const wrap = fieldsWrap.querySelector(
          `.searchable-field-wrap[data-field-name="${f.name}"]`,
        );
        const val = wrap.dataset.value;
        const label = wrap.dataset.label;

        createSearchableSelect(wrap, {
          placeholder: `Select ${getLocalizedValue(f.label)}...`,
          defaultValue: label,
          fetchFn: (term) => fetchOptionsForField(f, term),
          onSelect: (v) => {
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = f.name;
            hidden.value = v;
            // Replace existing hidden input if any
            const old = wrap.querySelector(`input[name="${f.name}"]`);
            if (old) old.remove();
            wrap.appendChild(hidden);
          },
        }).setValue(val, label);

        // Initial hidden input for form submission
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = f.name;
        hidden.value = val;
        wrap.appendChild(hidden);
      }
    });

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = state.currentRecordId
      ? "Update Entry"
      : "Add New Entry";
  } catch (err) {
    fieldsWrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
};

const initSelector = async () => {
  const { enableRecordSelection } = configuration;
  const container = fragmentElement.querySelector(
    `#selector-${fragmentEntryLinkNamespace}`,
  );
  if (!container || !enableRecordSelection) return;

  createSearchableSelect(container, {
    placeholder: "Search records to edit...",
    fetchFn: async (term) => {
      const response = await Liferay.Util.fetch(
        `${getBaseUrl()}/?search=${term}&pageSize=20`,
      );
      const data = await response.json();
      const titleField = state.definition.titleObjectFieldName || "id";
      return (data.items || []).map((r) => ({
        label: r[titleField] || r.id,
        value: r.id,
      }));
    },
    onSelect: (id) => loadRecord(id),
  });
};

const initMetaForm = async (isEditMode) => {
  const { objectERC, fixedRecordId, enableAddNew, enableRecordSelection } =
    configuration;
  const fieldsWrap = fragmentElement.querySelector(".form-fields-wrap");
  const titleEl = fragmentElement.querySelector(".object-title");
  const form = fragmentElement.querySelector("form");
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

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  if (!objectERC) {
    titleEl.textContent = "Meta-Object Form";
    if (infoEl) {
      infoEl.textContent =
        "Please provide an Object External Reference Code in the configuration.";
      infoEl.classList.remove("d-none");
    }
    return;
  }

  try {
    const response = await Liferay.Util.fetch(
      `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
    );
    if (!response.ok) throw new Error("Object not found.");

    state.definition = await response.json();
    titleEl.textContent =
      getLocalizedValue(state.definition.name) +
      (isEditMode ? " (Preview)" : "");

    const params = new URLSearchParams(window.location.search);
    let startId = fixedRecordId || params.get("entryId") || params.get("id");

    if (!startId && !enableAddNew && !enableRecordSelection) {
      showError('Record ID not specified and "Add New" is disabled.');
      return;
    }

    await loadRecord(startId);
    if (!isEditMode && enableRecordSelection) await initSelector();

    window.addEventListener("lfr-object-form-select", (e) => {
      if (e.detail && e.detail.objectERC === objectERC)
        loadRecord(e.detail.recordId);
    });

    if (!isEditMode) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        state.definition.objectFields.forEach((f) => {
          if (f.type === "Boolean") payload[f.name] = formData.has(f.name);
        });

        const statusMsg = fragmentElement.querySelector(".form-status-msg");
        statusMsg.classList.add("d-none");

        try {
          const method = state.currentRecordId ? "PATCH" : "POST";
          const url = state.currentRecordId
            ? `${getBaseUrl()}/${state.currentRecordId}`
            : `${getBaseUrl()}/`;

          const saveRes = await Liferay.Util.fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (saveRes.ok) {
            statusMsg.textContent = state.currentRecordId
              ? "Entry updated successfully!"
              : "Entry saved successfully!";
            statusMsg.className = "form-status-msg mt-3 alert alert-success";
            statusMsg.classList.remove("d-none");
            if (!state.currentRecordId) form.reset();
          } else {
            const errData = await saveRes.json();
            throw new Error(errData.title || "Failed to save entry.");
          }
        } catch (err) {
          statusMsg.textContent = err.message;
          statusMsg.className = "form-status-msg mt-3 alert alert-danger";
          statusMsg.classList.remove("d-none");
        }
      });
    } else {
      form.onsubmit = (e) => e.preventDefault();
    }
  } catch (err) {
    showError(err.message);
  }
};

if (layoutMode === "view") initMetaForm(false);
else initMetaForm(true);
