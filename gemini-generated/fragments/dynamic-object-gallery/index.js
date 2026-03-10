const ADMIN_API_BASE = "/o/object-admin/v1.0";

const initGallery = async (isEditMode) => {
  const {
    objectERC: configERC,
    imageField,
    titleField,
    descriptionField,
  } = configuration;

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
      mappedVal !== "PRODUCT_SHOWCASE" // Default value check
    ) {
      objectERC = mappedVal;
    }
  }

  const grid = fragmentElement.querySelector(".gallery-grid");
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
      if (grid) grid.innerHTML = "";
    } else if (grid) {
      grid.innerHTML = `<div class="text-center p-5 w-100 text-danger">${msg}</div>`;
    }
  };

  if (errorEl) errorEl.classList.add("d-none");
  if (infoEl) infoEl.classList.add("d-none");

  if (!Liferay.Fragment.Commons.isValidIdentifier(objectERC)) {
    if (grid) {
      Liferay.Fragment.Commons.renderConfigWarning(
        grid,
        "Please select a Liferay Object ERC in the fragment settings to populate this gallery.",
        layoutMode,
      );
    }
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

      const pageSize = isEditMode ? 4 : 20;
      const dataRes = await Liferay.Util.fetch(`${url}/?pageSize=${pageSize}`);
      if (!dataRes.ok) {
        if (dataRes.status === 401 || dataRes.status === 403) {
          throw new Error(
            "You do not have permission to view data for this object.",
          );
        }
        throw new Error("Data fetch failed.");
      }
      const data = await dataRes.json();
      const items = data.items || [];

      if (items.length === 0) {
        if (grid) {
          Liferay.Fragment.Commons.renderEmptyState(grid, {
            title: "No Items Found",
            description: `This ${definition.name} object currently has no data to display in the gallery.`,
          });
        }
      } else {
        grid.innerHTML = items
          .map((item) => {
            const imgUrl =
              item[imageField] ||
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop";
            const title = item[titleField] || "Untitled";
            return `
                <div class="gallery-item" tabindex="0" role="button" aria-label="View details for ${title}">
                    <div class="item-image" style="background-image: url('${imgUrl}')"></div>
                    <div class="item-body">
                        <div class="item-title">${title}</div>
                        <div class="item-desc">${item[descriptionField] || ""}</div>
                    </div>
                </div>`;
          })
          .join("");

        // Add keyboard support
        grid.querySelectorAll(".gallery-item").forEach((item) => {
          item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              item.click();
            }
          });
        });
      }
    } catch (err) {
      showError(err.message);
    }
  }
};

if (layoutMode === "view") initGallery(false);
else initGallery(true);
