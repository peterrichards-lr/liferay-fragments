const ADMIN_API_BASE = "/o/object-admin/v1.0";

const state = {
  definition: null,
  items: [],
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

const fetchData = async () => {
  const { objectERC } = configuration;
  if (!objectERC) throw new Error("Object ERC not configured.");

  const adminUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
  const defRes = await Liferay.Util.fetch(adminUrl);
  if (!defRes.ok) throw new Error("Object definition not found.");
  state.definition = await defRes.json();

  let url = state.definition.restContextPath;
  if (state.definition.scope === "site") {
    url += `/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}`;
  }

  const response = await Liferay.Util.fetch(
    `${url}/?pageSize=100&sort=date:asc`,
  );
  const data = await response.json();
  return data.items || [];
};

const initTimeline = async () => {
  const container = fragmentElement.querySelector(
    `#timeline-${fragmentEntryLinkNamespace}`,
  );
  if (container) {
    const { objectERC, dateField, titleField, descriptionField } =
      configuration;

    if (!objectERC) {
      container.innerHTML =
        '<div class="text-center p-5 text-muted">Please configure an Object ERC.</div>';
    } else {
      try {
        state.items = await fetchData();

        if (state.items.length === 0) {
          container.innerHTML =
            '<div class="text-center p-5 text-muted">No events found.</div>';
        } else {
          container.innerHTML = state.items
            .map(
              (item, index) => `
                    <div class="timeline-item ${index % 2 === 0 ? "left" : "right"}" data-index="${index}">
                        <div class="timeline-content">
                            <div class="timeline-date">${new Date(item[dateField] || item.createDate).toLocaleDateString()}</div>
                            <h4 class="timeline-title">${item[titleField] || "Untitled Event"}</h4>
                            <p class="timeline-description">${item[descriptionField] || ""}</p>
                        </div>
                    </div>
                `,
            )
            .join("");

          if (layoutMode === "view") {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                  }
                });
              },
              { threshold: 0.2 },
            );

            container.querySelectorAll(".timeline-item").forEach((item) => {
              observer.observe(item);
            });
          }
        }
      } catch (err) {
        container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    }
  }
};

initTimeline();
