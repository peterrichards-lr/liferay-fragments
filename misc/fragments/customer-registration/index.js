const initCustomerRegistration = () => {
  if (layoutMode === "view") {
    const form = fragmentElement.querySelector("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        // Registration logic
      });
    }
  }
};

initCustomerRegistration();
