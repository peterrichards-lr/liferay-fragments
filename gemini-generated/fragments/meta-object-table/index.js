const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
    definition: null,
    items: [],
    page: 1
};

const showError = (message, details) => {
    const tbody = fragmentElement.querySelector(`#tbody-${fragmentEntryLinkNamespace}`);
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="100" class="text-center p-5 text-danger">Error: ${message}</td></tr>`;
    }
    console.error(`[Meta-Object Table] ${message}`, details);
};

/**
 * Safely extracts the localized string based on current language.
 */
const getLocalizedValue = (value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const languageId = typeof Liferay !== 'undefined' ? Liferay.ThemeDisplay.getLanguageId() : 'en_US';
        return value[languageId] || value['en_US'] || '';
    }
    return value || '';
};

/**
 * Formats table cell data based on Liferay's field definitions
 */
const formatCellValue = (item, field) => {
    // 1. Try the primary field name from the definition
    let value = item[field.name];

    // 2. Fallback for Liferay's headless API key mappings if the primary is missing
    if (value === undefined || value === null) {
        if (field.name === 'createDate') value = item['dateCreated'];
        if (field.name === 'modifiedDate') value = item['dateModified'];
    }

    // Handle null, undefined, or empty
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // 3. Handle Dates using the Liferay user's locale
    if (field.businessType === 'Date' || field.type === 'Date') {
        try {
            // Convert Liferay's 'en_US' format to standard BCP 47 'en-US' format
            const languageId = typeof Liferay !== 'undefined' ? Liferay.ThemeDisplay.getLanguageId() : 'en_US';
            const locale = languageId.replace('_', '-');
            
            const dateObj = new Date(value);
            
            if (isNaN(dateObj.getTime())) {
                return value; 
            }

            return dateObj.toLocaleString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.warn('Date formatting error:', e);
            return value;
        }
    }

    // 4. Handle Picklists
    if (field.businessType === 'Picklist') {
        return value.name || value.key || String(value);
    }

    // 5. Handle specific System Fields that return nested objects
    if (field.name === 'status' && typeof value === 'object') {
        return value.label_i18n || value.label || String(value.code);
    }
    
    if (field.name === 'creator' && typeof value === 'object') {
        return value.name || value.givenName || String(value);
    }

    // 6. Handle Localized fields (relying on the definition flag)
    if (field.localized) {
        return getLocalizedValue(value);
    }

    // 7. Fallback for any other arrays or objects to prevent [object Object] rendering
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(v => v.name || v.title || String(v)).join(', ');
        }
        return value.name || value.title || JSON.stringify(value);
    }

    // 8. Return standard text/numbers
    return String(value);
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
    const { objectERC, columnsToDisplay, customizeColumns } = configuration;
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
        
        // Pass title through localizer
        titleEl.textContent = getLocalizedValue(state.definition.name);

        // 2. Filter and order displayable fields based on configuration
        let fields = state.definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));

        if (customizeColumns && columnsToDisplay) {
            const desiredColumnNames = columnsToDisplay.split(',').map(col => col.trim());
            const reorderedFields = [];
            
            // Add desired columns in specified order
            desiredColumnNames.forEach(colName => {
                const foundField = fields.find(f => f.name === colName || getLocalizedValue(f.label) === colName);
                if (foundField) {
                    reorderedFields.push(foundField);
                }
            });

            // Add any remaining fields not explicitly specified, but were not filtered out
            fields.forEach(f => {
                if (!reorderedFields.includes(f)) {
                    reorderedFields.push(f);
                }
            });
            fields = reorderedFields;
        }

        // 3. Render Headers
        thead.innerHTML = fields.map(f => `<th>${getLocalizedValue(f.label)}</th>`).join('');

        // 4. Get Data
        const restPath = state.definition.restContextPath; // Use restContextPath directly
        let dataUrl = `${restPath}/?pageSize=${configuration.pageSize || 10}`;
        
        if (customizeColumns && columnsToDisplay) {
            const desiredColumnNames = columnsToDisplay.split(',').map(col => col.trim());
            dataUrl += `&fields=${desiredColumnNames.join(',')}`;
        }
        
        const data = await fetchData(dataUrl);
        state.items = data.items || [];

        // 5. Render Rows
        if (state.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${fields.length}" class="text-center p-5">No data found.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.items.map(item => `
            <tr>
                ${fields.map(f => {
                    const label = getLocalizedValue(f.label);
                    const cellValue = formatCellValue(item, f);
                    return `<td data-label="${label}">${cellValue}</td>`;
                }).join('')}
            </tr>
        `).join('');

        // 6. Enable Export
        const exportBtn = fragmentElement.querySelector(`#export-${fragmentEntryLinkNamespace}`);
        if (exportBtn) {
            exportBtn.classList.remove('d-none');
            exportBtn.onclick = () => {
                const csvHeader = fields.map(f => `"${getLocalizedValue(f.label)}"`).join(',');
                
                const csvRows = state.items.map(item => 
                    fields.map(f => {
                        const cellValue = formatCellValue(item, f);
                        return `"${String(cellValue).replace(/"/g, '""')}"`;
                    }).join(',')
                );
                const csvContent = [csvHeader, ...csvRows].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${state.definition.restContextPath.replace('/o/c/', '')}_export.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }

        // Update footer info
        fragmentElement.querySelector('.pagination-info').textContent = `Showing ${state.items.length} of ${data.totalCount} entries`;

    } catch (err) {
        showError(err.message, err);
    }
};

if (layoutMode === 'view') {
    initMetaTable();
} else {
    // Static dummy header for editor
    fragmentElement.querySelector('.object-title').textContent = 'Meta-Object Table';
}