const initSubmitButton = () => {
  const isValidIdentifier = (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    return (
      s !== "" &&
      s !== "undefined" &&
      s !== "null" &&
      s !== "0" &&
      s !== "[object object]"
    );
  };

  if (layoutMode !== "preview") {
    const button = fragmentElement.querySelector("button");
    const form = fragmentElement.closest("form");

    if (button && form) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (isValidIdentifier(configuration.apiPath)) {
          Liferay.Util.fetch(configuration.apiPath, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((res) => {
              if (res.ok) {
                alert("Form submitted successfully");
              } else {
                alert("Failed to submit form");
              }
            })
            .catch((err) => {
              console.error(err);
              alert("An error occurred during submission");
            });
        }
      });
    }
  }
};

initSubmitButton();
