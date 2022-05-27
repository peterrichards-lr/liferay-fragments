if (!fragmentNamespace) // If it is not set then we are in fragment editor
    return;

const idPrefix = '#' + fragmentNamespace;
const startDateInput = fragmentElement.querySelector(idPrefix + '_startDateInput');
const endDateInput = fragmentElement.querySelector(idPrefix + '_endDateInput');

if (document.body.classList.contains('has-edit-mode-menu')) { // If present then we are in content page editor
if (startDateInput)
    startDateInput.style.display = "inline";

if (endDateInput)
    endDateInput.style.display = "inline";

    return;
}

const startDate = fragmentElement.querySelector(idPrefix + '_startDate');
const startMonth = fragmentElement.querySelector(idPrefix + '_startMonth');
const separator = fragmentElement.querySelector(idPrefix + '_separator');
const endDate = fragmentElement.querySelector(idPrefix + '_endDate');
const endMonth = fragmentElement.querySelector(idPrefix + '_endMonth');

let startDateValue;
try {
    if (startDateInput.innerText) {
        startDateValue = new Date(startDateInput.innerText);
        if (isNaN(startDateValue))
            startDateValue = undefined;
    }
} catch (e) {
    Liferay.Util.openToast({
        message: 'Invalid date value. Use yyyy-MM-ddd format',
        type: 'danger',
    });
    return;
}

let endDateValue;
try {
    if (endDateInput.innerText) {
        endDateValue = new Date(endDateInput.innerText);
        if (isNaN(endDateValue))
            endDateValue = undefined;
    }
} catch (e) {
    Liferay.Util.openToast({
        message: 'Invalid date value. Use yyyy-MM-ddd format',
        type: 'danger',
    });
    return;
}

const getAbbMonth = (date, abbLen = 3) => {
    const dateOptions = { month: 'long'};
    const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
    return dateFormatter.format(date).substring(0, abbLen);
}

if (startDate) {
    if (startDateValue) {
        var textnode = document.createTextNode(startDateValue.getDate());
        startDate.insertBefore(textnode, startDate.firstChild);
        startDate.classList.add("show");
    } else {
        startDate.classList.remove("show");
    }
}

if (startMonth) {
    if (startDateValue) {
        startMonth.innerText = getAbbMonth(startDateValue);
        startMonth.classList.add("show");
    } else {
        startMonth.classList.remove("show");
    }
}

if (!endDateValue) {
    if (endDate)
        endDate.classList.remove("show");
    if (endMonth)
        endMonth.classList.remove("show");
    if (separator)
        separator.classList.remove("show");
    return;
}

if (separator && startDateValue && endDateValue)
    separator.classList.add("show");

if (endDate) {
    var textnode = document.createTextNode(endDateValue.getDate());
    endDate.insertBefore(textnode, endDate.firstChild);
    endDate.classList.add("show");
}

if (endMonth) {
    endMonth.innerText = getAbbMonth(endDateValue);
    endMonth.classList.add("show");
}