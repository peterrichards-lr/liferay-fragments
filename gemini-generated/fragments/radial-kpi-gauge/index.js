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

const updateGauge = (percent) => {
    const path = fragmentElement.querySelector(`#path-${fragmentEntryLinkNamespace}`);
    const text = fragmentElement.querySelector(`#text-${fragmentEntryLinkNamespace}`);
    if (path && text) {
        path.setAttribute('stroke-dasharray', `${percent}, 100`);
        text.textContent = `${Math.round(percent)}%`;
    }
};

const initGauge = async (isEditMode) => {
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const gaugeWrap = fragmentElement.querySelector('.gauge-wrap');
    
    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (gaugeWrap) gaugeWrap.classList.add('d-none');
        } else {
            console.error('Gauge Error:', msg);
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (gaugeWrap) gaugeWrap.classList.add('d-none');
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');
    if (gaugeWrap) gaugeWrap.classList.remove('d-none');

    const { objectPath, valueField, targetValue } = configuration;

    if (!objectPath) {
        showInfo('Please configure an Object Path in the configuration.');
        updateGauge(75);
        return;
    }

    try {
        const items = await fetchData();
        const target = parseFloat(targetValue || '100');
        const total = items.reduce((acc, item) => acc + parseFloat(item[valueField] || 0), 0);
        const percent = Math.min((total / target) * 100, 100);
        
        if (items.length === 0 && isEditMode) {
             showInfo(`No items found for object "${objectPath}". Rendering 75% as placeholder.`);
             updateGauge(75);
             return;
        }

        setTimeout(() => updateGauge(percent), 300);
    } catch (err) {
        showError(err.message);
        updateGauge(75);
    }
};

if (layoutMode === 'view') initGauge(false);
else initGauge(true);
