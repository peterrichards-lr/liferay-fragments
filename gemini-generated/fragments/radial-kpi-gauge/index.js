const fetchData = async () => {
    const { objectERC } = configuration;
    if (!objectERC) throw new Error('Object ERC not configured.');
    
    try {
        // Fetch definition by ERC
        const adminUrl = `/o/object-admin/v1.0/object-definitions/by-external-reference-code/${objectERC}`;
        const defRes = await Liferay.Util.fetch(adminUrl);
        if (!defRes.ok) throw new Error(`Could not find object with ERC "${objectERC}".`);
        const definition = await defRes.json();

        let url = definition.restContextPath;
        if (definition.scope === 'site') {
            const siteId = Liferay.ThemeDisplay.getScopeGroupId();
            url += `/scopes/${siteId}`;
        }

        const response = await Liferay.Util.fetch(url);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('You do not have permission to view this data.');
            }
            throw new Error(`Failed to fetch data from "${definition.restContextPath}".`);
        }
        const data = await response.json();
        return data.items || [];
    } catch (err) {
        throw err;
    }
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

    const { objectERC, valueField, targetValue } = configuration;

    if (!objectERC) {
        showInfo('Please configure an Object ERC.');
        updateGauge(75);
        return;
    }

    try {
        const items = await fetchData();
        const target = parseFloat(targetValue || '100');
        const total = items.reduce((acc, item) => acc + parseFloat(item[valueField] || 0), 0);
        const percent = Math.min((total / target) * 100, 100);
        
        if (items.length === 0 && isEditMode) {
             showInfo(`No items found for object. Rendering 75% as placeholder.`);
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
