const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
    definition: null,
    items: [],
    page: 1
};

const getLocalizedValue = (value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const languageId = typeof Liferay !== 'undefined' ? Liferay.ThemeDisplay.getLanguageId() : 'en_US';
        return value[languageId] || value['en_US'] || '';
    }
    return value || '';
};

const formatCellValue = (item, field) => {
    let value = item[field.name];

    if (value === undefined || value === null) {
        if (field.name === 'createDate') value = item['dateCreated'];
        if (field.name === 'modifiedDate') value = item['dateModified'];
    }

    if (value === null || value === undefined || value === '') return '-';

    if (field.businessType === 'Date' || field.type === 'Date') {
        try {
            const languageId = typeof Liferay !== 'undefined' ? Liferay.ThemeDisplay.getLanguageId() : 'en_US';
            const locale = languageId.replace('_', '-');
            const dateObj = new Date(value);
            if (isNaN(dateObj.getTime())) return value;
            return dateObj.toLocaleString(locale, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return value; }
    }

    if (field.businessType === 'Picklist') return value.name || value.key || String(value);

    if (field.name === 'status' && typeof value === 'object') return value.label_i18n || value.label || String(value.code);
    
    if (field.name === 'creator' && typeof value === 'object') return value.name || value.givenName || String(value);

    if (field.localized) return getLocalizedValue(value);

    if (typeof value === 'object') {
        if (Array.isArray(value)) return value.map(v => v.name || v.title || String(v)).join(', ');
        return value.name || value.title || JSON.stringify(value);
    }

    return String(value);
};

const fetchData = async (url) => {
    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('Permission denied.');
        }
        if (response.status === 404) {
            throw new Error('Object not found.');
        }
        throw new Error('Fetch failed.');
    }
    return await response.json();
};

const initMetaTable = async (isEditMode) => {
    const { objectERC, columnsToDisplay, customizeColumns } = configuration;
    const tbody = fragmentElement.querySelector(`#tbody-${fragmentEntryLinkNamespace}`);
    const thead = fragmentElement.querySelector(`#thead-${fragmentEntryLinkNamespace}`);
    const titleEl = fragmentElement.querySelector('.object-title');
    const exportBtn = fragmentElement.querySelector(`#export-${fragmentEntryLinkNamespace}`);
    const pagination = fragmentElement.querySelector(`#pagination-${fragmentEntryLinkNamespace}`);
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);

    const clearAlerts = () => {
        if (errorEl) errorEl.classList.add('d-none');
        if (infoEl) infoEl.classList.add('d-none');
    };

    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
        }
        if (tbody) tbody.innerHTML = `<tr><td colspan="100" class="text-center p-5 text-danger">${msg}</td></tr>`;
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
        }
        if (tbody) tbody.innerHTML = `<tr><td colspan="100" class="text-center p-5 text-muted">${msg}</td></tr>`;
    };

    clearAlerts();

    if (!objectERC) {
        titleEl.textContent = 'Meta-Object Table';
        showInfo('Please provide an Object External Reference Code in the configuration.');
        return;
    }

    try {
        const defUrl = `${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`;
        state.definition = await fetchData(defUrl);
        titleEl.textContent = getLocalizedValue(state.definition.name) + (isEditMode ? ' (Preview)' : '');

        let fields = state.definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));

        if (customizeColumns && columnsToDisplay) {
            const desired = columnsToDisplay.split(',').map(col => col.trim());
            const reordered = [];
            desired.forEach(name => {
                const found = fields.find(f => f.name === name || getLocalizedValue(f.label) === name);
                if (found) reordered.push(found);
            });
            fields.forEach(f => { if (!reordered.includes(f)) reordered.push(f); });
            fields = reordered;
        }

        thead.innerHTML = fields.map(f => `<th>${getLocalizedValue(f.label)}</th>`).join('');

        const restPath = state.definition.restContextPath; 
        const pageSize = isEditMode ? 3 : (configuration.pageSize || 10);
        let dataUrl = `${restPath}/?pageSize=${pageSize}`;
        if (customizeColumns && columnsToDisplay) {
            dataUrl += `&fields=${columnsToDisplay}`;
        }
        
        const data = await fetchData(dataUrl);
        state.items = data.items || [];

        if (state.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${fields.length}" class="text-center p-5">No data found.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.items.map(item => `
            <tr>
                ${fields.map(f => `<td data-label="${getLocalizedValue(f.label)}">${formatCellValue(item, f)}</td>`).join('')}
            </tr>
        `).join('');

        if (!isEditMode) {
            if (exportBtn) {
                exportBtn.classList.remove('d-none');
                exportBtn.onclick = () => {
                    const header = fields.map(f => `"${getLocalizedValue(f.label)}"`).join(',');
                    const rows = state.items.map(item => fields.map(f => `"${String(formatCellValue(item, f)).replace(/"/g, '""')}"`).join(','));
                    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', `${state.definition.restContextPath.replace('/o/c/', '')}.csv`);
                    link.click();
                };
            }
            const info = fragmentElement.querySelector('.pagination-info');
            if (info) info.textContent = `Showing ${state.items.length} of ${data.totalCount} entries`;
            if (configuration.enablePagination && data.totalCount > pageSize) pagination.classList.remove('d-none');
        } else {
            if (exportBtn) exportBtn.classList.add('d-none');
            if (pagination) pagination.classList.add('d-none');
            const info = fragmentElement.querySelector('.pagination-info');
            if (info) info.textContent = `Showing ${state.items.length} entries (Editor Preview)`;
        }
    } catch (err) {
        showError(err.message);
    }
};

if (layoutMode === 'view') {
    initMetaTable(false);
} else {
    initMetaTable(true);
}
