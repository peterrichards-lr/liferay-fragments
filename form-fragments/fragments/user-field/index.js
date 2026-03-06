const initUserField = () => {
  if (layoutMode !== "preview") {
    const input = fragmentElement.querySelector("input");
    if (input) {
      const type = configuration.userFieldType || "name";
      if (typeof Liferay !== "undefined" && Liferay.ThemeDisplay) {
        if (type === "name") {
          input.value = Liferay.ThemeDisplay.getUserName();
        } else if (type === "id") {
          input.value = Liferay.ThemeDisplay.getUserId();
        } else if (type === "email") {
          input.value = Liferay.ThemeDisplay.getUserEmailAddress();
        }
      }
    }
  }
};

initUserField();
