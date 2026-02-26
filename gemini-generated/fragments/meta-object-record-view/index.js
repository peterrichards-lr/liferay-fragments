const ADMIN_API_BASE = '/o/object-admin/v1.0';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

const loadScript = (url) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const getRecordId = () => {
    const params = new URLSearchParams(window.location.search);
    // Common Liferay URL patterns for object entries
    return params.get('entryId') || params.get('id') || configuration.recordId;
};

const initRecordView = async () => {
    const { objectERC } = configuration;
    const fieldsWrap = fragmentElement.querySelector(`#fields-${fragmentEntryLinkNamespace}`);
    const recordId = getRecordId();

    if (!objectERC || !recordId) {
        fieldsWrap.innerHTML = '<div class="alert alert-warning">Please configure an Object ERC and provide a Record ID (via URL or config).</div>';
        return;
    }

    try {
        // 1. Load PDF dependencies
        await Promise.all([loadScript(JSPDF_URL), loadScript(HTML2CANVAS_URL)]);

        // 2. Get Definition
        const defResponse = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!defResponse.ok) {
            if (defResponse.status === 401 || defResponse.status === 403) {
                throw new Error('You do not have permission to access the definition for this object.');
            }
            throw new Error('Failed to fetch object definition');
        }
        const definition = await defResponse.json();
        
        fragmentElement.querySelector('.object-name-label').textContent = `${definition.name} Detail`;

        // 3. Get Record
        const dataResponse = await Liferay.Util.fetch(`/o/c/${definition.restContextPath}/${recordId}`);
        if (!dataResponse.ok) {
            if (dataResponse.status === 401 || dataResponse.status === 403) {
                throw new Error('You do not have permission to view this record.');
            }
            throw new Error('Record not found.');
        }
        const record = await dataResponse.json();

        // 4. Render
        const displayFields = definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name));
        
        fieldsWrap.innerHTML = displayFields.map(f => `
            <div class="record-row">
                <div class="field-label">${f.label}</div>
                <div class="field-value">${record[f.name] || '-'}</div>
            </div>
        `).join('');

        // 5. Enable PDF
        const pdfBtn = fragmentElement.querySelector(`#pdf-${fragmentEntryLinkNamespace}`);
        if (pdfBtn) {
            pdfBtn.classList.remove('d-none');
            pdfBtn.onclick = async () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'pt', 'a4');
                const element = fragmentElement.querySelector(`#capture-${fragmentEntryLinkNamespace}`);
                
                await doc.html(element, {
                    callback: function(pdf) {
                        pdf.save(`${definition.restContextPath}_record_${recordId}.pdf`);
                    },
                    x: 40,
                    y: 40,
                    width: 515, // a4 width - margins
                    windowWidth: 800
                });
            };
        }

    } catch (err) {
        console.error('Record View Error:', err);
        fieldsWrap.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    initRecordView();
} else {
    fragmentElement.querySelector('.object-name-label').textContent = 'Meta-Object Record View';
}
