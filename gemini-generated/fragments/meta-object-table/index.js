const ADMIN_API_BASE = "/o/object-admin/v1.0";

const state = {
  definition: null,
  fields: [],
  items: [],
  page: 1,
  totalCount: 0,
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

const formatCellValue = (item, field) => {
  let value = item[field.name];

  if (value === undefined || value === null) {
    if (field.name === "createDate") value = item["dateCreated"];
    if (field.name === "modifiedDate") value = item["dateModified"];
  }

  if (value === null || value === undefined || value === "") return "-";

  if (field.businessType === "Date" || field.type === "Date") {
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

const fetchData = async (url) => {
  const response = await Liferay.Util.fetch(url);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Permission denied.");
    }
    if (response.status === 404) {
      throw new Error("Object not found.");
    }
    throw new Error("Fetch failed.");
  }
  return await response.json();
};

const renderPagination = (isEditMode) => {
  const pagination = fragmentElement.querySelector(
    `#pagination-${fragmentEntryLinkNamespace}`,
  );
  const info = fragmentElement.querySelector(".pagination-info");
  if (!pagination || isEditMode) return;

  const pageSize = parseInt(configuration.pageSize || 10);
  const totalPages = Math.ceil(state.totalCount / pageSize);

  if (configuration.enablePagination && totalPages > 1) {
    pagination.classList.remove("d-none");

    const prevItem = pagination.querySelector(".page-item:first-child");
    const nextItem = pagination.querySelector(".page-item:last-child");
    const activeLink = pagination.querySelector(".page-item.active .page-link");

    if (prevItem) {
      prevItem.classList.toggle("disabled", state.page === 1);
      prevItem.onclick = (e) => {
        e.preventDefault();
        if (state.page > 1) loadPage(state.page - 1);
      };
    }

    if (nextItem) {
      nextItem.classList.toggle("disabled", state.page === totalPages);
      nextItem.onclick = (e) => {
        e.preventDefault();
        if (state.page < totalPages) loadPage(state.page + 1);
      };
    }

    if (activeLink) activeLink.textContent = state.page;
  } else {
    pagination.classList.add("d-none");
  }

  if (info) {
    info.textContent = `Showing ${state.items.length} of ${state.totalCount} entries`;
  }
};

const toggleModal = (type, show) => {
  let suffix = "view";
  if (type === "edit") suffix = "edit";
  if (type === "add") suffix = "add";

  const overlay = fragmentElement.querySelector(
    `#overlay-${suffix}-${fragmentEntryLinkNamespace}`,
  );
  if (!overlay) return;

  if (show) {
    overlay.classList.remove("d-none");
    document.body.style.overflow = "hidden"; // Prevent background scroll
  } else {
    overlay.classList.add("d-none");
    document.body.style.overflow = "";
  }
};

const handleAction = (type, recordId, recordERC) => {
  const { objectERC, viewMode, viewUrl, editMode, editUrl, addMode, addUrl } =
    configuration;

  let mode = "event";
  let targetUrl = "";
  let eventName = "lfr-object-form-select";

  if (type === "view") {
    mode = viewMode;
    targetUrl = viewUrl;
    eventName = "lfr-object-view-select";
  } else if (type === "edit") {
    mode = editMode;
    targetUrl = editUrl;
    eventName = "lfr-object-form-select";
  } else if (type === "add") {
    mode = addMode;
    targetUrl = addUrl;
    eventName = "lfr-object-form-select";
  }

  if (mode === "event" || mode === "modal") {
    if (mode === "modal") {
      toggleModal(type, true);
    }

    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          objectERC,
          recordId: type === "add" ? null : recordId,
          recordERC: type === "add" ? null : recordERC,
        },
      }),
    );
  } else if (mode === "redirect" || mode === "tab") {
    const url = new URL(
      targetUrl || window.location.href,
      window.location.origin,
    );
    if (type !== "add") {
      url.searchParams.set("entryId", recordId);
      url.searchParams.set("entryERC", recordERC);
    }
    if (mode === "tab") window.open(url.toString(), "_blank");
    else window.location.href = url.toString();
  }
};

const loadPage = async (pageNumber, isEditMode = false) => {
  const tbody = fragmentElement.querySelector(
    `#tbody-${fragmentEntryLinkNamespace}`,
  );
  const pageSize = isEditMode ? 3 : parseInt(configuration.pageSize || 10);
  const { columnsToDisplay, customizeColumns, enableView, enableEdit } =
    configuration;

  const spritemap =
    typeof Liferay !== "undefined" && Liferay.Icons
      ? Liferay.Icons.spritemap
      : "/o/classic-theme/images/lexicon/icons.svg";

  state.page = pageNumber;

  try {
    let url = state.definition.restContextPath;
    if (state.definition.scope === "site") {
      const siteId = Liferay.ThemeDisplay.getScopeGroupId();
      url += `/scopes/${siteId}`;
    }

    let dataUrl = `${url}/?pageSize=${pageSize}&page=${state.page}`;
    if (customizeColumns && columnsToDisplay) {
      dataUrl += `&fields=${columnsToDisplay}`;
    }

    const data = await fetchData(dataUrl);
    state.items = data.items || [];
    state.totalCount = data.totalCount || 0;

    if (state.items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${state.fields.length + (enableView || enableEdit ? 1 : 0)}" class="text-center p-5">No data found.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.items
      .map((item) => {
        let actionsHtml = "";
        if (enableView || enableEdit) {
          actionsHtml = `<td class="text-right">
                    <div class="btn-group">
                        ${enableView ? `<button class="btn btn-monospaced btn-sm btn-secondary view-btn" data-id="${item.id}" data-erc="${item.externalReferenceCode || ""}" title="View"><svg class="lexicon-icon"><use xlink:href="${spritemap}#view"></use></svg></button>` : ""}
                        ${enableEdit ? `<button class="btn btn-monospaced btn-sm btn-secondary edit-btn" data-id="${item.id}" data-erc="${item.externalReferenceCode || ""}" title="Edit"><svg class="lexicon-icon"><use xlink:href="${spritemap}#pencil"></use></svg></button>` : ""}
                    </div>
                </td>`;
        }

        return `
                <tr>
                    ${state.fields.map((f) => `<td data-label="${getLocalizedValue(f.label)}">${formatCellValue(item, f)}</td>`).join("")}
                    ${actionsHtml}
                </tr>
            `;
      })
      .join("");

    // Attach action listeners
    tbody.querySelectorAll(".view-btn").forEach((btn) => {
      btn.onclick = () => handleAction("view", btn.dataset.id, btn.dataset.erc);
    });
    tbody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.onclick = () => handleAction("edit", btn.dataset.id, btn.dataset.erc);
    });

    if (!isEditMode) {
      renderPagination(false);
    } else {
      const info = fragmentElement.querySelector(".pagination-info");
      if (info)
        info.textContent = `Showing ${state.items.length} entries (Editor Preview)`;
    }
  } catch (err) {
    const errorEl = fragmentElement.querySelector(
      `#error-${fragmentEntryLinkNamespace}`,
    );
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("d-none");
    }
  }
};

const initMetaTable = async (isEditMode) => {
  const {
    objectERC,
    columnsToDisplay,
    customizeColumns,
    enableView,
    enableEdit,
    enableAdd,
  } = configuration;
  const thead = fragmentElement.querySelector(
    `#thead-${fragmentEntryLinkNamespace}`,
  );
  const titleEl = fragmentElement.querySelector(".object-title");
  const exportBtn = fragmentElement.querySelector(
    `#export-${fragmentEntryLinkNamespace}`,
  );
  const addBtn = fragmentElement.querySelector(
    `#add-${fragmentEntryLinkNamespace}`,
  );
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );

  // Modal setup helper
  const setupModal = (type) => {
    const suffix = type;
    const closeBtn = fragmentElement.querySelector(
      `#close-${suffix}-${fragmentEntryLinkNamespace}`,
    );
    const overlay = fragmentElement.querySelector(
      `#overlay-${suffix}-${fragmentEntryLinkNamespace}`,
    );

    if (closeBtn) closeBtn.onclick = () => toggleModal(type, false);
    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) toggleModal(type, false);
      };
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  // Initialize modals
  setupModal("view");
  setupModal("edit");
  setupModal("add");

  if (addBtn) {
    addBtn.onclick = () => handleAction("add");
  }

  if (!objectERC) {
    titleEl.textContent = "Meta-Object Table";
    if (isEditMode && infoEl) {
      infoEl.textContent =
        "Please provide an Object External Reference Code in the configuration.";
      infoEl.classList.remove("d-none");
    }
    return;
  }

  try {
    const defUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
    state.definition = await fetchData(defUrl);

    const objectLabel = getLocalizedValue(
      state.definition.pluralLabel ||
        state.definition.label ||
        state.definition.name,
    );
    const currentTitle = titleEl.innerText.trim();

    if (
      currentTitle === "Meta-Object Table" ||
      currentTitle === "" ||
      currentTitle === "Meta-Object Table (Preview)"
    ) {
      titleEl.innerText = objectLabel + (isEditMode ? " (Preview)" : "");
    }

    // Strict column filtering
    let fields = state.definition.objectFields.filter(
      (f) => !["id", "externalReferenceCode"].includes(f.name),
    );

    if (customizeColumns && columnsToDisplay) {
      const desired = columnsToDisplay.split(",").map((col) => col.trim());
      fields = desired
        .map((name) =>
          fields.find(
            (f) => f.name === name || getLocalizedValue(f.label) === name,
          ),
        )
        .filter(Boolean);
    }
    state.fields = fields;

    let headerHtml = state.fields
      .map((f) => `<th>${getLocalizedValue(f.label)}</th>`)
      .join("");
    if (enableView || enableEdit)
      headerHtml += '<th class="text-right">Actions</th>';
    thead.innerHTML = headerHtml;

    await loadPage(1, isEditMode);

    if (!isEditMode && exportBtn) {
      exportBtn.classList.remove("d-none");
      exportBtn.onclick = () => {
        const header = state.fields
          .map((f) => `"${getLocalizedValue(f.label)}"`)
          .join(",");
        const rows = state.items.map((item) =>
          state.fields
            .map(
              (f) =>
                `"${String(formatCellValue(item, f)).replace(/"/g, '""')}"`,
            )
            .join(","),
        );
        const blob = new Blob([[header, ...rows].join("\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute(
          "download",
          `${state.definition.restContextPath.replace("/o/c/", "")}.csv`,
        );
        link.click();
      };
    }
  } catch (err) {
    if (isEditMode && errorEl) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("d-none");
    }
  }
};

if (layoutMode === "view") {
  initMetaTable(false);
} else {
  initMetaTable(true);
}
