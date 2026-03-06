const initDateDisplayStatic = () => {
  if (layoutMode !== "preview") {
    const dateEl = fragmentElement.querySelector(".date-static");
    if (dateEl) {
      const dateStr = configuration.staticDate;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          dateEl.textContent = date.toLocaleDateString();
        }
      }
    }
  }
};

initDateDisplayStatic();
