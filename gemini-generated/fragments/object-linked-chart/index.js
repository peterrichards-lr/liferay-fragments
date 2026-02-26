const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';

const showError = (message) => {
    const errorDiv = fragmentElement.querySelector('.chart-error');
    const messageSpan = fragmentElement.querySelector('.error-message');
    if (errorDiv && messageSpan) {
        messageSpan.textContent = message;
        errorDiv.classList.remove('d-none');
    }
};

const loadScript = (url) => {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

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

const initChart = async () => {
    try {
        await loadScript(CHART_JS_URL);
        const items = await fetchData();

        if (items.length === 0) {
            showError('No data found for the selected object.');
            return;
        }

        const { labelField, valueField, chartType, chartColor } = configuration;
        
        const labels = items.map(item => item[labelField] || 'N/A');
        const values = items.map(item => item[valueField] || 0);

        // Populate fallback table for accessibility
        const fallbackTable = fragmentElement.querySelector(`#fallback-table-${fragmentEntryLinkNamespace}`);
        if (fallbackTable) {
            fallbackTable.innerHTML = `
                <table aria-label="Data table for the chart above">
                    <thead><tr><th>${labelField}</th><th>${valueField}</th></tr></thead>
                    <tbody>
                        ${items.map(item => `<tr><td>${item[labelField]}</td><td>${item[valueField]}</td></tr>`).join('')}
                    </tbody>
                </table>
            `;
        }

        const ctx = fragmentElement.querySelector(`#chart-${fragmentEntryLinkNamespace}`).getContext('2d');
        
        new Chart(ctx, {
            type: chartType || 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: configuration.objectPath,
                    data: values,
                    backgroundColor: chartColor || '#007dad',
                    borderColor: chartColor || '#007dad',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartType === 'pie' || chartType === 'doughnut'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: chartType !== 'pie' && chartType !== 'doughnut'
                    }
                }
            }
        });

    } catch (err) {
        console.error('Chart initialization failed:', err);
        showError(err.message);
    }
};

if (layoutMode === 'view') {
    initChart();
} else {
    // Show placeholder in edit/preview
    const ctx = fragmentElement.querySelector(`#chart-${fragmentEntryLinkNamespace}`).getContext('2d');
    fragmentElement.querySelector('.chart-wrapper').innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 bg-light text-muted">Chart Placeholder (Dynamic data loaded in View mode)</div>';
}
