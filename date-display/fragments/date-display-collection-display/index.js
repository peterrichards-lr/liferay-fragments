const initDateDisplayCollection = () => {
  if (layoutMode !== "preview") {
    const dateElements = fragmentElement.querySelectorAll(
      ".date-display-entry",
    );
    dateElements.forEach((el) => {
      const dateStr = el.dataset.date;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const format = configuration.dateFormat || "MMMM d, yyyy";
          // Basic formatting logic for prototype
          el.textContent = date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }
    });
  }
};

initDateDisplayCollection();
