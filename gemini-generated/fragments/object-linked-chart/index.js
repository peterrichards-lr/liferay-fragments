const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';

const loadScript = (url) => {
    return new Promise((resolve, reject) => {
        if (window.Chart) { resolve(); return; }
        const script = document.createElement('script');
        script.src = url; script.onload = resolve; script.onerror = reject;
        document.head.appendChild(script);
    });
};

const fetchData = async () => {
    const { objectPath } = configuration;
    if (!objectPath) throw new Error('Object path not configured.');
    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    const url = `/o/c/${objectPath}/scopes/${siteId}`;
    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Permission denied.');
        throw new Error(`Failed to fetch data for "${objectPath}".`);
    }
    const data = await response.json();
    return data.items || [];
};

const initChart = async (isEditMode) => {
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const chartWrapper = fragmentElement.querySelector('.chart-wrapper');

    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (chartWrapper) chartWrapper.innerHTML = '';
        } else if (chartWrapper) {
            chartWrapper.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-danger">${msg}</div>`;
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (chartWrapper) chartWrapper.innerHTML = '';
        } else if (chartWrapper) {
            chartWrapper.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted">${msg}</div>`;
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    const { objectPath, labelField, valueField, chartType, chartColor } = configuration;

    if (!objectPath) {
        showInfo('Please configure an Object Path.');
        return;
    }

    try {
        await loadScript(CHART_JS_URL);
        const items = await fetchData();

        if (items.length === 0) {
            showInfo(`No data found for object "${objectPath}".`);
            return;
        }

        const labels = items.map(item => item[labelField] || 'N/A');
        const values = items.map(item => item[valueField] || 0);

        const fallbackTable = fragmentElement.querySelector(`#fallback-table-${fragmentEntryLinkNamespace}`);
        if (fallbackTable) {
            fallbackTable.innerHTML = `<table><thead><tr><th>${labelField}</th><th>${valueField}</th></tr></thead><tbody>${items.map(item => `<tr><td>${item[labelField]}</td><td>${item[valueField]}</td></tr>`).join('')}</tbody></table>`;
        }

        const canvas = fragmentElement.querySelector(`#chart-${fragmentEntryLinkNamespace}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: chartType || 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: objectPath, data: values,
                    backgroundColor: chartColor || '#007dad', borderColor: chartColor || '#007dad', borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: isEditMode ? false : { duration: 1000 },
                plugins: { legend: { display: ['pie', 'doughnut'].includes(chartType) } },
                scales: { y: { beginAtZero: true, display: !['pie', 'doughnut'].includes(chartType) } }
            }
        });
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') initChart(false);
else {
    if (configuration.objectPath) initChart(true);
    else {
         const chartWrapper = fragmentElement.querySelector('.chart-wrapper');
         if (chartWrapper) chartWrapper.innerHTML = '';
         showInfo('Please provide an Object Path in the configuration.');
    }
}
