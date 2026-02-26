const fetchData = async () => {
    const { objectPath } = configuration;
    if (!objectPath) {
        throw new Error('Object path not configured.');
    }

    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    const url = `/o/c/${objectPath}/scopes/${siteId}`;

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have permission to view data for this object.');
        }
        throw new Error(`Failed to fetch data from ${objectPath}.`);
    }

    const data = await response.json();
    return data.items || [];
};

const updateGauge = (percent) => {
    const path = fragmentElement.querySelector(`#path-${fragmentEntryLinkNamespace}`);
    const text = fragmentElement.querySelector(`#text-${fragmentEntryLinkNamespace}`);
    
    if (path && text) {
        path.setAttribute('stroke-dasharray', `${percent}, 100`);
        text.textContent = `${Math.round(percent)}%`;
    }
};

const initGauge = async () => {
    try {
        const items = await fetchData();
        const { valueField, targetValue } = configuration;
        const target = parseFloat(targetValue || '100');

        // Sum up all values from the object collection
        const total = items.reduce((acc, item) => acc + parseFloat(item[valueField] || 0), 0);
        
        const percent = Math.min((total / target) * 100, 100);

        // Delay animation slightly for effect
        setTimeout(() => {
            updateGauge(percent);
        }, 300);

    } catch (err) {
        console.error('Gauge initialization failed:', err);
    }
};

if (layoutMode === 'view') {
    initGauge();
} else {
    // Show static 75% in edit/preview
    updateGauge(75);
}
