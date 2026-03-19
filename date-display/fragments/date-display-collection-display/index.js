const initDateDisplayCollection = () => {
  if (layoutMode === "preview") return;

  const idPrefix = `#${fragmentEntryLinkNamespace}`;
  const startDateInput = fragmentElement.querySelector(
    `${idPrefix}_startDateInput`,
  );
  const endDateInput = fragmentElement.querySelector(
    `${idPrefix}_endDateInput`,
  );

  if (layoutMode === "edit") {
    if (startDateInput) startDateInput.style.display = "inline";
    if (endDateInput) endDateInput.style.display = "inline";
    return;
  }

  const startDate = fragmentElement.querySelector(`${idPrefix}_startDate`);
  const startMonth = fragmentElement.querySelector(`${idPrefix}_startMonth`);
  const separator = fragmentElement.querySelector(`${idPrefix}_separator`);
  const endDate = fragmentElement.querySelector(`${idPrefix}_endDate`);
  const endMonth = fragmentElement.querySelector(`${idPrefix}_endMonth`);

  const parseDate = (text) => {
    if (
      !text ||
      text.trim() === "" ||
      text === "Start Date" ||
      text === "End Date"
    )
      return null;
    const d = new Date(text);
    return isNaN(d.getTime()) ? null : d;
  };

  const getAbbMonth = (date, abbLen = 3) => {
    const languageId = Liferay.ThemeDisplay.getLanguageId().replace("_", "-");
    const dateFormatter = new Intl.DateTimeFormat(languageId, {
      month: "long",
    });
    return dateFormatter.format(date).substring(0, abbLen);
  };

  const startDateValue = startDateInput
    ? parseDate(startDateInput.innerText)
    : null;
  const endDateValue = endDateInput ? parseDate(endDateInput.innerText) : null;

  if (startDateValue) {
    if (startDate) {
      const textnode = document.createTextNode(startDateValue.getDate());
      startDate.insertBefore(textnode, startDate.firstChild);
      startDate.classList.add("show");
    }
    if (startMonth) {
      startMonth.innerText = getAbbMonth(startDateValue);
      startMonth.classList.add("show");
    }
  }

  if (endDateValue) {
    if (separator && startDateValue) {
      separator.classList.add("show");
    }
    if (endDate) {
      const textnode = document.createTextNode(endDateValue.getDate());
      endDate.insertBefore(textnode, endDate.firstChild);
      endDate.classList.add("show");
    }
    if (endMonth) {
      endMonth.innerText = getAbbMonth(endDateValue);
      endMonth.classList.add("show");
    }
  }
};

initDateDisplayCollection();
