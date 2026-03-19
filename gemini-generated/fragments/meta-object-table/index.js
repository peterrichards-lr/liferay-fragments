const ADMIN_API_BASE = "/o/object-admin/v1.0";
const VERSION = "1.0.11";

const state = {
  definition: null,
  fields: [],
  items: [],
  page: 1,
  totalCount: 0,
};

// Use Commons for localization
const getLocalizedValue = (value) =>
  Liferay.Fragment.Commons.getLocalizedValue(value);

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
  if (pagination && !isEditMode) {
    const pageSize = parseInt(configuration.pageSize || 10);
    const totalPages = Math.ceil(state.totalCount / pageSize);

    if (configuration.enablePagination && totalPages > 1) {
      pagination.classList.remove("d-none");

      const prevItem = pagination.querySelector(".page-item:first-child");
      const nextItem = pagination.querySelector(".page-item:last-child");
      const activeLink = pagination.querySelector(
        ".page-item.active .page-link",
      );

      if (prevItem) {
        prevItem.classList.toggle("disabled", state.page === 1);
        const prevLink = prevItem.querySelector(".page-link");
        if (prevLink) {
          prevLink.onclick = (e) => {
            e.preventDefault();
            if (state.page > 1) loadPage(state.page - 1);
          };
        }
      }

      if (nextItem) {
        nextItem.classList.toggle("disabled", state.page === totalPages);
        const nextLink = nextItem.querySelector(".page-link");
        if (nextLink) {
          nextLink.onclick = (e) => {
            e.preventDefault();
            if (state.page < totalPages) loadPage(state.page + 1);
          };
        }
      }

      if (activeLink) activeLink.textContent = state.page;
    } else {
      pagination.classList.add("d-none");
    }

    if (info) {
      info.textContent = `Showing ${state.items.length} of ${state.totalCount} entries`;
    }
  }
};

const toggleModal = (type, show) => {
  let suffix = "view";
  if (type === "edit") suffix = "edit";
  if (type === "add") suffix = "add";

  const overlay = fragmentElement.querySelector(
    `#overlay-${suffix}-${fragmentEntryLinkNamespace}`,
  );
  if (overlay) {
    if (show) {
      overlay.classList.remove("d-none");
      document.body.style.overflow = "hidden"; // Prevent background scroll

      // Focus management: focus the first focusable element or the close button
      const closeBtn = overlay.querySelector(".close-modal-btn");
      if (closeBtn) setTimeout(() => closeBtn.focus(), 100);

      // Store the element that had focus before opening the modal
      state.previousFocusedElement = document.activeElement;
    } else {
      overlay.classList.add("d-none");
      document.body.style.overflow = "";

      // Return focus to the previous element
      if (state.previousFocusedElement) {
        state.previousFocusedElement.focus();
      }
    }
  }
};

const loadPage = async (pageNumber, isEditMode = false) => {
  const tableResponsive = fragmentElement.querySelector(".table-responsive");
  const paginationInfo = fragmentElement.querySelector(".pagination-info");
  const paginationNav = fragmentElement.querySelector(
    `#pagination-${fragmentEntryLinkNamespace}`,
  );

  const pageSize = isEditMode ? 3 : parseInt(configuration.pageSize || 10);
  const { enableView, enableEdit } = configuration;

  const spritemap =
    typeof Liferay !== "undefined" && Liferay.Icons
      ? Liferay.Icons.spritemap
      : "/o/classic-theme/images/lexicon/icons.svg";

  state.page = pageNumber;

  try {
    // Standard Object discovery pattern using Commons
    const { apiPath } = await Liferay.Fragment.Commons.resolveObjectPath(
      state.definition.restContextPath,
    );
    let dataUrl = `${apiPath}/?pageSize=${pageSize}&page=${state.page}`;

    const requestedFieldNames = new Set(state.fields.map((f) => f.name));
    requestedFieldNames.add("id");
    requestedFieldNames.add("externalReferenceCode");

    dataUrl += `&fields=${Array.from(requestedFieldNames).join(",")}`;

    const data = await fetchData(dataUrl);
    state.items = data.items || [];
    state.totalCount = data.totalCount || 0;

    if (state.items.length === 0) {
      if (tableResponsive) {
        Liferay.Fragment.Commons.renderEmptyState(tableResponsive, {
          title: "No Records Found",
          description: `This ${state.definition.name} object currently has no data to display.`,
        });
      }
      if (paginationInfo) paginationInfo.textContent = "";
      if (paginationNav) paginationNav.classList.add("d-none");
    } else {
      // Restore table if it was replaced by empty state
      if (tableResponsive && !tableResponsive.querySelector("table")) {
        tableResponsive.innerHTML = `
          <table class="table table-autofit show-quick-actions-on-hover table-hover table-list ${configuration.enableStriped ? "table-striped" : ""}" id="table-${fragmentEntryLinkNamespace}" aria-labelledby="table-title-${fragmentEntryLinkNamespace}">
            <thead><tr id="thead-${fragmentEntryLinkNamespace}"></tr></thead>
            <tbody id="tbody-${fragmentEntryLinkNamespace}"></tbody>
          </table>
        `;
        // Re-render headers
        const newThead = tableResponsive.querySelector(
          `#thead-${fragmentEntryLinkNamespace}`,
        );
        let headerHtml = state.fields
          .map((f) => `<th>${getLocalizedValue(f.label)}</th>`)
          .join("");
        if (enableView || enableEdit)
          headerHtml += '<th class="text-right">Actions</th>';
        newThead.innerHTML = headerHtml;
      }

      const activeTbody = fragmentElement.querySelector(
        `#tbody-${fragmentEntryLinkNamespace}`,
      );
      activeTbody.innerHTML = state.items
        .map((item) => {
          let recordId = item.id || item.entryId || "";
          let recordERC = item.externalReferenceCode || item.erc || "";

          let actionsHtml = "";
          if (enableView || enableEdit) {
            actionsHtml = `<td class="text-right">
                    <div class="btn-group">
                        ${enableView ? `<button class="btn btn-monospaced btn-sm btn-secondary view-btn" data-record-id="${recordId}" data-record-erc="${recordERC}" title="View Record" aria-label="View Record"><svg class="lexicon-icon"><use xlink:href="${spritemap}#view"></use></svg></button>` : ""}
                        ${enableEdit ? `<button class="btn btn-monospaced btn-sm btn-secondary edit-btn" data-record-id="${recordId}" data-record-erc="${recordERC}" title="Edit Record" aria-label="Edit Record"><svg class="lexicon-icon"><use xlink:href="${spritemap}#pencil"></use></svg></button>` : ""}
                    </div>
                </td>`;
          }

          return `
                <tr>
                    ${state.fields.map((f, i) => `<td ${i === 0 ? 'scope="row"' : ""} data-label="${getLocalizedValue(f.label)}">${formatCellValue(item, f)}</td>`).join("")}
                    ${actionsHtml}
                </tr>
            `;
        })
        .join("");

      // Attach action listeners
      activeTbody.querySelectorAll(".view-btn").forEach((btn) => {
        btn.onclick = () =>
          fragmentElement.handleAction(
            "view",
            btn.dataset.recordId,
            btn.dataset.recordErc,
          );
      });
      activeTbody.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.onclick = () =>
          fragmentElement.handleAction(
            "edit",
            btn.dataset.recordId,
            btn.dataset.recordErc,
          );
      });

      if (!isEditMode) {
        renderPagination(false);
      } else {
        if (paginationInfo)
          paginationInfo.textContent = `Showing ${state.items.length} entries (Editor Preview)`;
      }
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
    objectERC: configERC,
    columnsToDisplay,
    customizeColumns,
    enableView,
    enableEdit,
    enableAdd,
    tableTitle: configTitle,
  } = configuration;

  const thead = fragmentElement.querySelector(
    `#thead-${fragmentEntryLinkNamespace}`,
  );
  const titleEl = fragmentElement.querySelector(".object-title");
  const addBtn = fragmentElement.querySelector(
    `#add-${fragmentEntryLinkNamespace}`,
  );
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );

  // Resolve effective ERC
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

  const setupModal = (type) => {
    const suffix = type;
    const closeBtn = fragmentElement.querySelector(
      `#close-${suffix}-${fragmentEntryLinkNamespace}`,
    );
    const overlay = fragmentElement.querySelector(
      `#overlay-${suffix}-${fragmentEntryLinkNamespace}`,
    );

    if (closeBtn) {
      closeBtn.onclick = () => toggleModal(type, false);
      closeBtn.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleModal(type, false);
        }
      };
    }
    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) toggleModal(type, false);
      };
    }
  };

  const handleAction = (type, recordId, recordERC) => {
    const {
      viewMode,
      viewUrl,
      viewIdentifierType,
      editMode,
      editUrl,
      editIdentifierType,
      addMode,
      addUrl,
    } = configuration;

    let mode = "event";
    let targetUrl = "";
    let eventName = "lfr-object-form-select";
    let idType = "id";

    if (type === "view") {
      mode = viewMode;
      targetUrl = viewUrl;
      eventName = "lfr-object-view-select";
      idType = viewIdentifierType || "id";
    } else if (type === "edit") {
      mode = editMode;
      targetUrl = editUrl;
      eventName = "lfr-object-form-select";
      idType = editIdentifierType || "id";
    } else if (type === "add") {
      mode = addMode;
      targetUrl = addUrl;
      eventName = "lfr-object-form-select";
    }

    const hasValidId = Liferay.Fragment.Commons.isValidIdentifier(recordId);
    const hasValidERC = Liferay.Fragment.Commons.isValidIdentifier(recordERC);

    if (type !== "add" && !hasValidId && !hasValidERC) return;

    if (mode === "event" || mode === "modal") {
      if (mode === "modal") {
        toggleModal(type, true);
      }

      setTimeout(() => {
        const detail = {
          objectERC,
          recordId: hasValidId ? recordId : null,
          recordERC: hasValidERC ? recordERC : null,
          erc: hasValidERC ? recordERC : null,
        };

        if (type !== "add") {
          detail.identifier =
            idType === "erc"
              ? hasValidERC
                ? recordERC
                : null
              : hasValidId
                ? recordId
                : null;
        }

        window.dispatchEvent(new CustomEvent(eventName, { detail }));
      }, 100);
    } else if (mode === "redirect" || mode === "tab") {
      const url = new URL(
        targetUrl || window.location.href,
        window.location.origin,
      );
      if (type !== "add") {
        const val = idType === "erc" ? recordERC : recordId;
        const key = idType === "erc" ? "entryERC" : "entryId";
        url.searchParams.set(key, val);
        url.searchParams.set("id", recordId);
        if (recordERC) url.searchParams.set("erc", recordERC);
      }
      if (mode === "tab") window.open(url.toString(), "_blank");
      else window.location.href = url.toString();
    }
  };

  fragmentElement.handleAction = handleAction;

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  setupModal("view");
  setupModal("edit");
  setupModal("add");

  if (addBtn) {
    addBtn.addEventListener("click", () => handleAction("add"));
  }

  // Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleModal("view", false);
      toggleModal("edit", false);
      toggleModal("add", false);
    }
  });

  if (!Liferay.Fragment.Commons.isValidIdentifier(objectERC)) {
    Liferay.Fragment.Commons.renderConfigWarning(
      tableResponsive,
      "Please select a Liferay Object ERC in the fragment settings to populate this table.",
      layoutMode,
    );
  } else {
    try {
      const defUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
      state.definition = await fetchData(defUrl);

      const objectLabel = getLocalizedValue(
        state.definition.pluralLabel ||
          state.definition.label ||
          state.definition.name,
      );
      const currentTitle = titleEl.innerText.trim();
      const defaultFragmentName =
        fragmentElement.dataset.fragmentName || "Meta-Object Table";
      const preferredTitle = configTitle || objectLabel;

      if (
        currentTitle === "Meta-Object Table" ||
        currentTitle === defaultFragmentName ||
        currentTitle === "" ||
        currentTitle === "Milestones" ||
        currentTitle === `${defaultFragmentName} (Preview)`
      ) {
        titleEl.innerText = preferredTitle + (isEditMode ? " (Preview)" : "");
      }

      const allFields = state.definition.objectFields;
      let fields = [];

      if (customizeColumns && columnsToDisplay) {
        const desired = columnsToDisplay.split(",").map((col) => col.trim());
        const seen = new Set();
        fields = desired
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
        fields = allFields.filter(
          (f) => !["id", "externalReferenceCode"].includes(f.name),
        );
      }
      state.fields = fields;

      const thead = fragmentElement.querySelector(
        `#thead-${fragmentEntryLinkNamespace}`,
      );
      if (thead) {
        let headerHtml = state.fields
          .map((f) => `<th>${getLocalizedValue(f.label)}</th>`)
          .join("");
        if (enableView || enableEdit)
          headerHtml += '<th class="text-right">Actions</th>';
        thead.innerHTML = headerHtml;
      }

      await loadPage(1, isEditMode);
    } catch (err) {
      if (isEditMode && errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("d-none");
      }
    }
  }
};

// Listen for global refresh signals from Dashboard Filter
Liferay.on("refreshData", () => {
  if (layoutMode === "view") loadPage(1, false);
});

const init = () => {
  if (layoutMode === "view") {
    initMetaTable(false);
  } else {
    initMetaTable(true);
  }
};

init();
