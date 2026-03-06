const ADMIN_API_BASE = "/o/object-admin/v1.0";
const JSPDF_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const HTML2CANVAS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

const state = {
  definition: null,
  currentRecordId: null,
};

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

const getBaseUrl = () => {
  let url = state.definition.restContextPath;
  if (state.definition.scope === "site") {
    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    url += `/scopes/${siteId}`;
  }
  return url;
};

const isValidIdentifier = (val) => {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  return (
    s !== "" && s !== "undefined" && s !== "null" && s !== "[object Object]"
  );
};

const loadRecordData = async (recordId, recordERC, isEditMode) => {
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
        loadRecordData(recordId, recordERC, isEditMode);
      }
    }, 100);
    return;
  }

  try {
    let record = {};
    let hasIdentifier = false;

    if (isValidIdentifier(recordERC)) {
      const url = `${getBaseUrl()}/by-external-reference-code/${recordERC}`;
      const response = await Liferay.Util.fetch(url);
      if (!response.ok) throw new Error(`Record not found (ERC: ${recordERC})`);
      record = await response.json();
      hasIdentifier = true;
    } else if (isValidIdentifier(recordId)) {
      const url = `${getBaseUrl()}/${recordId}`;
      const response = await Liferay.Util.fetch(url);
      if (!response.ok) throw new Error(`Record not found (ID: ${recordId})`);
      record = await response.json();
      hasIdentifier = true;
    } else if (isEditMode) {
      const listRes = await Liferay.Util.fetch(`${getBaseUrl()}/?pageSize=1`);
      const data = await listRes.json();
      record = data.items?.[0] || {};
      hasIdentifier = !!record.id;
    }

    if (hasIdentifier) {
      state.currentRecordId = record.id;

      const displayFields = state.definition.objectFields.filter(
        (f) => !["id", "externalReferenceCode"].includes(f.name),
      );
      fieldsWrap.innerHTML = displayFields
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
        fieldsWrap.innerHTML = `<div class="alert alert-info">No record specified.</div>`;
      }
    }
  } catch (err) {
    fieldsWrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
};

const initRecordView = async (isEditMode) => {
  const {
    objectERC: configERC,
    fallbackRecordIdentifier,
    fallbackRecordIdentifierType,
    viewTitle: configTitle,
  } = configuration;
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
    '[data-lfr-editable-id="object-erc"]',
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
    if (e.detail && e.detail.objectERC === objectERC) {
      const eventId =
        e.detail.recordId ||
        (e.detail.identifier && !e.detail.recordERC
          ? e.detail.identifier
          : null);
      const eventERC =
        e.detail.recordERC ||
        e.detail.erc ||
        (e.detail.identifier && e.detail.recordERC
          ? e.detail.identifier
          : null);
      loadRecordData(eventId || null, eventERC || null, false);
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
        isEditMode
      ) {
        await loadRecordData(startId, startERC, isEditMode);
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
