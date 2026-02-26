const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
    definition: null,
    items: [],
    page: 1
};

const fetchData = async (url) => {
    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have the required permissions to access this object data.');
        }
        throw new Error(`Fetch failed: ${response.statusText} (${response.status})`);
    }
    return await response.json();
};

const initMetaTable = async () => {
    const { objectERC } = configuration;
    const tbody = fragmentElement.querySelector(`#tbody-${fragmentEntryLinkNamespace}`);
    const thead = fragmentElement.querySelector(`#thead-${fragmentEntryLinkNamespace}`);
    const titleEl = fragmentElement.querySelector('.object-title');

    if (!objectERC) {
        tbody.innerHTML = '<tr><td colspan="100" class="text-center p-5">Please configure an Object ERC.</td></tr>';
        return;
    }

    try {
        // 1. Get Definition
        const defUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
        state.definition = await fetchData(defUrl);
        
        titleEl.textContent = state.definition.name;

        // 2. Filter displayable fields (exclude system fields or complex ones if needed)
        const fields = state.definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));

        // 3. Render Headers
        thead.innerHTML = fields.map(f => `<th>${f.label}</th>`).join('');

        // 4. Get Data
        const dataUrl = `/o/c/${state.definition.restContextPath}/?pageSize=${configuration.pageSize || 10}`;
        const data = await fetchData(dataUrl);
        state.items = data.items || [];

        // 5. Render Rows
        if (state.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${fields.length}" class="text-center p-5">No data found.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.items.map(item => `
            <tr>
                ${fields.map(f => `<td data-label="${f.label}">${item[f.name] || '-'}</td>`).join('')}
            </tr>
        `).join('');

        // 6. Enable Export
        const exportBtn = fragmentElement.querySelector(`#export-${fragmentEntryLinkNamespace}`);
        if (exportBtn) {
            exportBtn.classList.remove('d-none');
            exportBtn.onclick = () => {
                const csvHeader = fields.map(f => `"${f.label}"`).join(',');
                const csvRows = state.items.map(item => 
                    fields.map(f => `"${String(item[f.name] || '').replace(/"/g, '""')}"`).join(',')
                );
                const csvContent = [csvHeader, ...csvRows].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${state.definition.restContextPath}_export.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }

        // Update footer info
        fragmentElement.querySelector('.pagination-info').textContent = `Showing ${state.items.length} of ${data.totalCount} entries`;

    } catch (err) {
        console.error('Meta-Table Error:', err);
        tbody.innerHTML = `<tr><td colspan="100" class="text-center p-5 text-danger">Error: ${err.message}</td></tr>`;
    }
};

if (layoutMode === 'view') {
    initMetaTable();
} else {
    // Static dummy header for editor
    fragmentElement.querySelector('.object-title').textContent = 'Meta-Object Table';
}
