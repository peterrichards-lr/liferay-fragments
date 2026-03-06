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

const loadRecordData = async (identifier, isEditMode) => {
  const fieldsWrap = fragmentElement.querySelector(
    `#fields-${fragmentEntryLinkNamespace}`,
  );
  const titleEl = fragmentElement.querySelector(".object-name-label");
  const pdfBtn = fragmentElement.querySelector(
    `#pdf-${fragmentEntryLinkNamespace}`,
  );

  try {
    let record = {};
    if (identifier) {
      const isERC = isNaN(identifier);
      const url = isERC
        ? `${getBaseUrl()}/by-external-reference-code/${identifier}`
        : `${getBaseUrl()}/${identifier}`;

      const dataRes = await Liferay.Util.fetch(url);
      if (!dataRes.ok) throw new Error("Record not found.");
      record = await dataRes.json();
      state.currentRecordId = record.id;
    } else if (isEditMode) {
      const listRes = await Liferay.Util.fetch(`${getBaseUrl()}/?pageSize=1`);
      const data = await listRes.json();
      record = data.items?.[0] || {};
      state.currentRecordId = record.id || null;
    }

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
  } catch (err) {
    fieldsWrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
};

const initRecordView = async (isEditMode) => {
  const { objectERC, fallbackRecordIdentifier } = configuration;
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

  if (!objectERC) {
    titleEl.textContent = "Meta-Object Record View";
    showInfo("Please configure an Object External Reference Code.");
    return;
  }

  try {
    await Promise.all([loadScript(JSPDF_URL), loadScript(HTML2CANVAS_URL)]);
    const defRes = await Liferay.Util.fetch(
      `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
    );
    if (!defRes.ok) throw new Error("Failed to fetch definition.");
    state.definition = await defRes.json();

    const objectLabel = getLocalizedValue(state.definition.name);
    const currentTitle = titleEl.innerText.trim();

    if (
      currentTitle === "Record Detail" ||
      currentTitle === "" ||
      currentTitle === "Record Detail (Preview)"
    ) {
      titleEl.innerText = objectLabel + (isEditMode ? " (Preview)" : "");
    }

    const params = new URLSearchParams(window.location.search);
    let identifier = null;

    if (fallbackRecordIdentifier) {
      identifier = fallbackRecordIdentifier;
    } else {
      identifier =
        params.get("entryId") ||
        params.get("id") ||
        params.get("entryERC") ||
        params.get("erc");
    }

    if (identifier || isEditMode) {
      await loadRecordData(identifier, isEditMode);
    } else {
      showInfo("No record ID found in URL or configuration.");
    }

    // Listen for external record requests
    window.addEventListener("lfr-object-view-select", (e) => {
      if (e.detail && e.detail.objectERC === objectERC) {
        const eventIdentifier =
          e.detail.recordId || e.detail.recordERC || e.detail.erc;
        if (eventIdentifier) loadRecordData(eventIdentifier, false);
      }
    });
  } catch (err) {
    showError(err.message);
  }
};

if (layoutMode === "view") initRecordView(false);
else initRecordView(true);
