const ADMIN_API_BASE = "/o/object-admin/v1.0";

const initGauge = async (isEditMode) => {
  const { objectERC, targetField, currentField } = configuration;
  const errorEl = fragmentElement.querySelector(
    `#error-${fragmentEntryLinkNamespace}`,
  );
  const infoEl = fragmentElement.querySelector(
    `#info-${fragmentEntryLinkNamespace}`,
  );
  const path = fragmentElement.querySelector(
    `#path-${fragmentEntryLinkNamespace}`,
  );
  const text = fragmentElement.querySelector(
    `#text-${fragmentEntryLinkNamespace}`,
  );

  const showError = (msg) => {
    if (isEditMode && errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
    }
  };

  const showInfo = (msg) => {
    if (isEditMode && infoEl) {
      infoEl.textContent = msg;
      infoEl.classList.remove("d-none");
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  if (!objectERC) {
    showInfo("Please configure an Object External Reference Code.");
  } else {
    try {
      const defRes = await Liferay.Util.fetch(
        `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`,
      );
      if (!defRes.ok) throw new Error("Definition fetch failed.");
      const definition = await defRes.json();

      let url = definition.restContextPath;
      if (definition.scope === "site") {
        const siteId = Liferay.ThemeDisplay.getScopeGroupId();
        url += `/scopes/${siteId}`;
      }

      const dataRes = await Liferay.Util.fetch(`${url}/?pageSize=1`);
      const data = await dataRes.json();
      const record = data.items?.[0] || {};

      if (!record.id && !isEditMode) {
        showInfo("No records found.");
      } else {
        const target = parseFloat(record[targetField] || "100");
        const current = parseFloat(record[currentField] || "0");
        const percent = Math.min(Math.round((current / target) * 100), 100);

        if (path && text) {
          text.textContent = `${percent}%`;
          const offset = 283 - (percent / 100) * 283;
          path.style.strokeDashoffset = offset;
        }
      }
    } catch (err) {
      showError(err.message);
    }
  }
};

if (layoutMode === "view") initGauge(false);
else initGauge(true);
