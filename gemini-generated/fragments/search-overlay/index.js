const initSearchOverlay = () => {
  const container = fragmentElement.querySelector(".modern-search-overlay");
  const modal = fragmentElement.querySelector(".search-modal");
  const trigger = fragmentElement.querySelector(".search-trigger");
  const closeBtn = fragmentElement.querySelector(".close-search");
  const input = fragmentElement.querySelector(".search-input");
  const resultsList = fragmentElement.querySelector(".results-list");
  const initialMsg = fragmentElement.querySelector(".initial-message");
  const loading = fragmentElement.querySelector(".loading-spinner");

  const SEARCH_API = "/o/search/v1.0/search";

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const toggleModal = (show) => {
    if (show) {
      modal.classList.remove("d-none");
      document.body.style.overflow = "hidden";
      setTimeout(() => input.focus(), 100);
    } else {
      modal.classList.add("d-none");
      document.body.style.overflow = "";
      input.value = "";
      resultsList.innerHTML = "";
      resultsList.classList.add("d-none");
      initialMsg.classList.remove("d-none");
    }
  };

  const renderResults = (items) => {
    loading.classList.add("d-none");

    if (!items || items.length === 0) {
      resultsList.innerHTML =
        '<div class="col-12 text-center py-5"><p class="text-muted">No results found.</p></div>';
      resultsList.classList.remove("d-none");
      return;
    }

    // Group by category/className
    const groups = items.reduce((acc, item) => {
      const cat = item.className || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    resultsList.innerHTML = Object.entries(groups)
      .map(([cat, catItems]) => {
        const catName = cat.split(".").pop();
        return `
                <div class="result-category col-12">
                    <h4 class="result-category-title">${catName}</h4>
                    <div class="row">
                        ${catItems
                          .map(
                            (item) => `
                            <a href="${item.url || "#"}" class="result-item col-12 col-md-6">
                                <div class="result-title">${item.title || "Untitled"}</div>
                                <div class="result-snippet">${item.content || ""}</div>
                            </a>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `;
      })
      .join("");

    resultsList.classList.remove("d-none");
  };

  const performSearch = async (query) => {
    if (query.length < 3) {
      resultsList.classList.add("d-none");
      initialMsg.classList.remove("d-none");
      return;
    }

    initialMsg.classList.add("d-none");
    loading.classList.remove("d-none");
    resultsList.classList.add("d-none");

    try {
      const response = await Liferay.Util.fetch(`${SEARCH_API}?q=${query}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      renderResults(data.items || []);
    } catch (err) {
      console.error(err);
      resultsList.innerHTML =
        '<div class="col-12 text-center py-5 text-danger">Search unavailable.</div>';
      resultsList.classList.remove("d-none");
      loading.classList.add("d-none");
    }
  };

  if (layoutMode === "view") {
    if (trigger) trigger.onclick = () => toggleModal(true);
    if (closeBtn) closeBtn.onclick = () => toggleModal(false);

    if (input) {
      input.addEventListener(
        "input",
        debounce((e) => performSearch(e.target.value), 400),
      );

      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") toggleModal(false);
      });
    }

    // Global Esc key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("d-none")) {
        toggleModal(false);
      }
    });
  }
};

initSearchOverlay();
