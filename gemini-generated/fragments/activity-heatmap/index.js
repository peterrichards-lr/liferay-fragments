const fetchData = async () => {
    const { objectPath } = configuration;
    if (!objectPath) throw new Error('Object path not configured.');

    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    const url = `/o/c/${objectPath}/scopes/${siteId}`;

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have permission to view activity data for this object.');
        }
        throw new Error(`Failed to fetch from ${objectPath}.`);
    }

    const data = await response.json();
    return data.items || [];
};

const renderHeatmap = (items) => {
    const grid = fragmentElement.querySelector(`#grid-${fragmentEntryLinkNamespace}`);
    if (!grid) return;

    const { dateField } = configuration;
    const today = new Date();
    const daysToShow = 90; // Last 3 months approx
    const activityMap = {};

    // Populate activity count per day
    items.forEach(item => {
        const dateStr = new Date(item[dateField]).toDateString();
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    let html = '';
    for (let i = daysToShow; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const count = activityMap[d.toDateString()] || 0;
        
        let level = 0;
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 5) level = 3;
        if (count > 10) level = 4;

        html += `<div class="heatmap-cell cell level-${level}" title="${d.toLocaleDateString()}: ${count} entries"></div>`;
    }

    grid.innerHTML = html;
};

const init = async () => {
    try {
        const items = await fetchData();
        renderHeatmap(items);
    } catch (err) {
        console.error('Heatmap init failed:', err);
        const grid = fragmentElement.querySelector('.heatmap-grid');
        if (grid) grid.innerHTML = `<div class="heatmap-status text-danger">Error loading data</div>`;
    }
};

if (layoutMode === 'view') {
    init();
} else {
    // Static preview for editor
    renderHeatmap([]);
}
