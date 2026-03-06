const initFormPopulator = () => {
  if (layoutMode === "view") {
    const apiPath = configuration.apiPath;
    if (apiPath) {
      Liferay.Util.fetch(apiPath)
        .then((res) => res.json())
        .then((data) => {
          Object.keys(data).forEach((key) => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
              input.value = data[key];
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        })
        .catch((err) => console.error(err));
    }
  }
};

initFormPopulator();
