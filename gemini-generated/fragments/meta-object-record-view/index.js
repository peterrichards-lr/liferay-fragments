const ADMIN_API_BASE = '/o/object-admin/v1.0';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

const loadScript = (url) => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s);
});

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
        titleEl.textContent = `${definition.name} Detail` + (isEditMode ? ' (Preview)' : '');

        let record = {};
        if (recordId) {
            const dataRes = await Liferay.Util.fetch(`${definition.restContextPath}/${recordId}`);
            if (!dataRes.ok) throw new Error('Record not found.');
            record = await dataRes.json();
        } else if (isEditMode) {
            const listRes = await Liferay.Util.fetch(`${definition.restContextPath}/?pageSize=1`);
            const data = await listRes.json();
            record = data.items?.[0] || {};
        }

        const displayFields = definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));
        fieldsWrap.innerHTML = displayFields.map(f => `<div class="record-row"><div class="field-label">${f.label}</div><div class="field-value">${record[f.name] || '-'}</div></div>`).join('');

        const pdfBtn = fragmentElement.querySelector(`#pdf-${fragmentEntryLinkNamespace}`);
        if (pdfBtn && !isEditMode && recordId) {
            pdfBtn.classList.remove('d-none');
            pdfBtn.onclick = async () => {
                const doc = new window.jspdf.jsPDF('p', 'pt', 'a4');
                await doc.html(fragmentElement.querySelector(`#capture-${fragmentEntryLinkNamespace}`), {
                    callback: (pdf) => pdf.save(`${definition.restContextPath}_${recordId}.pdf`),
                    x: 40, y: 40, width: 515, windowWidth: 800
                });
            };
        }
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') initRecordView(false);
else initRecordView(true);
