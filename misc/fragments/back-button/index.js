const initBackButton = () => {
  if (layoutMode === "view") {
    const link = fragmentElement.querySelector(
      `#fragment-${fragmentNamespace}-link`,
    );
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Fallback if no history
          window.location.href = "/";
        }
      });

      // Add keyboard support if needed, though <a> already handles Enter
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          link.click();
        }
      });
    }
  }
};

initBackButton();
