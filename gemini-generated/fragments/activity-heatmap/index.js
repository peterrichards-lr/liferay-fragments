const fetchData = async () => {
    const { objectPath } = configuration;
    if (!objectPath) throw new Error('Object path not configured.');
    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    const url = `/o/c/${objectPath}/scopes/${siteId}`;
    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Permission denied.');
        throw new Error(`Failed to fetch from "${objectPath}".`);
    }
    const data = await response.json();
    return data.items || [];
};

const renderHeatmap = (items) => {
    const grid = fragmentElement.querySelector(`#grid-${fragmentEntryLinkNamespace}`);
    if (!grid) return;
    const { dateField } = configuration;
    const today = new Date();
    const daysToShow = 90; 
    const activityMap = {};
    items.forEach(item => { if (item[dateField]) activityMap[new Date(item[dateField]).toDateString()] = (activityMap[new Date(item[dateField]).toDateString()] || 0) + 1; });

    let html = '';
    for (let i = daysToShow; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i);
        const count = activityMap[d.toDateString()] || 0;
        let level = 0;
        if (count > 0) level = 1; if (count > 2) level = 2; if (count > 5) level = 3; if (count > 10) level = 4;
        html += `<div class="heatmap-cell cell level-${level}" title="${d.toLocaleDateString()}: ${count} entries"></div>`;
    }
    grid.innerHTML = html;
};

const initHeatmap = async (isEditMode) => {
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const grid = fragmentElement.querySelector(`#grid-${fragmentEntryLinkNamespace}`);
    
    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (grid) grid.innerHTML = '';
        } else if (grid) {
            grid.innerHTML = `<div class="heatmap-status text-danger">${msg}</div>`;
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (grid) grid.innerHTML = '';
        } else if (grid) {
            grid.innerHTML = `<div class="heatmap-status">${msg}</div>`;
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    const { objectPath } = configuration;

    if (!objectPath) {
        showInfo('Please configure an Object Path.');
        renderHeatmap([]);
        return;
    }

    try {
        const items = await fetchData();
        if (items.length === 0 && isEditMode) {
             showInfo(`No items found for "${objectPath}". Rendering placeholder.`);
        }
        renderHeatmap(items);
    } catch (err) {
        showError(err.message);
    }
};

if (layoutMode === 'view') initHeatmap(false);
else initHeatmap(true);
