const ADMIN_API_BASE = '/o/object-admin/v1.0';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

const loadScript = (url) => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s);
});

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

    if (field.businessType === 'Date' || field.type === 'Date' || field.businessType === 'DateTime') {
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

const getRecordId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('entryId') || params.get('id') || configuration.recordId;
};

const initRecordView = async (isEditMode) => {
    const { objectERC } = configuration;
    const fieldsWrap = fragmentElement.querySelector(`#fields-${fragmentEntryLinkNamespace}`);
    const titleEl = fragmentElement.querySelector('.object-name-label');
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const recordId = getRecordId();

    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (fieldsWrap) fieldsWrap.innerHTML = '';
        } else if (fieldsWrap) {
            fieldsWrap.innerHTML = `<div class="text-center p-5 text-danger">${msg}</div>`;
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (fieldsWrap) fieldsWrap.innerHTML = '';
        } else if (fieldsWrap) {
            fieldsWrap.innerHTML = `<div class="text-center p-5 text-muted">${msg}</div>`;
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    if (!objectERC) {
        showInfo('Please configure an Object External Reference Code.');
        return;
    }
    if (!recordId && !isEditMode) {
        showInfo('No record ID found in URL or configuration.');
        return;
    }

    try {
        await Promise.all([loadScript(JSPDF_URL), loadScript(HTML2CANVAS_URL)]);
        const defRes = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!defRes.ok) throw new Error('Failed to fetch definition.');
        const definition = await defRes.json();
        titleEl.textContent = getLocalizedValue(definition.name) + (isEditMode ? ' (Preview)' : '');

        let url = definition.restContextPath;
        if (definition.scope === 'site') {
            const siteId = Liferay.ThemeDisplay.getScopeGroupId();
            url += `/scopes/${siteId}`;
        }

        let record = {};
        if (recordId) {
            const dataRes = await Liferay.Util.fetch(`${url}/${recordId}`);
            if (!dataRes.ok) {
                if (dataRes.status === 401 || dataRes.status === 403) {
                    throw new Error('You do not have permission to view this record.');
                }
                throw new Error('Record not found.');
            }
            record = await dataRes.json();
        } else if (isEditMode) {
            const listRes = await Liferay.Util.fetch(`${url}/?pageSize=1`);
            const data = await listRes.json();
            record = data.items?.[0] || {};
        }

        const displayFields = definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));
        fieldsWrap.innerHTML = displayFields.map(f => `
            <div class="record-row">
                <div class="field-label">${getLocalizedValue(f.label)}</div>
                <div class="field-value">${formatCellValue(record, f)}</div>
            </div>
        `).join('');

        const pdfBtn = fragmentElement.querySelector(`#pdf-${fragmentEntryLinkNamespace}`);
        if (pdfBtn && !isEditMode && recordId) {
            pdfBtn.classList.remove('d-none');
            pdfBtn.onclick = async () => {
                const doc = new window.jspdf.jsPDF('p', 'pt', 'a4');
                await doc.html(fragmentElement.querySelector(`#capture-${fragmentEntryLinkNamespace}`), {
                    callback: (pdf) => pdf.save(`${definition.restContextPath.replace('/o/c/', '')}_${recordId}.pdf`),
                    x: 40, y: 40, width: 515, windowWidth: 800
                });
            };
        }
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') initRecordView(false);
else initRecordView(true);
