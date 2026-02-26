const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
    definition: null
};

const mapFieldToInput = (field) => {
    const { type, name, label, required } = field;
    let inputHtml = '';

    const commonAttrs = `name="${name}" id="${name}-${fragmentEntryLinkNamespace}" class="form-control" ${required ? 'required' : ''}`;

    switch (type) {
        case 'Integer':
        case 'Decimal':
        case 'Double':
            inputHtml = `<input type="number" ${commonAttrs}>`;
            break;
        case 'DateTime':
        case 'Date':
            inputHtml = `<input type="date" ${commonAttrs}>`;
            break;
        case 'CPLongText':
            inputHtml = `<textarea ${commonAttrs} rows="4"></textarea>`;
            break;
        case 'Boolean':
            inputHtml = `
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" name="${name}" id="${name}-${fragmentEntryLinkNamespace}">
                    <label class="custom-control-label" for="${name}-${fragmentEntryLinkNamespace}">${label}</label>
                </div>`;
            return `<div class="form-group mb-4">${inputHtml}</div>`;
        default:
            inputHtml = `<input type="text" ${commonAttrs}>`;
    }

    return `
        <div class="form-group mb-4">
            <label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label>
            ${inputHtml}
        </div>
    `;
};

const initMetaForm = async () => {
    const { objectERC } = configuration;
    const fieldsWrap = fragmentElement.querySelector('.form-fields-wrap');
    const titleEl = fragmentElement.querySelector('.object-title');
    const form = fragmentElement.querySelector('form');

    if (!objectERC) {
        fieldsWrap.innerHTML = '<div class="alert alert-warning">Please configure an Object ERC.</div>';
        return;
    }

    try {
        const response = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('You do not have permission to access the definition for this object.');
            }
            throw new Error('Failed to fetch object definition');
        }
        
        state.definition = await response.json();
        titleEl.textContent = state.definition.name;

        const fields = state.definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name) && !f.readOnly);
        fieldsWrap.innerHTML = fields.map(mapFieldToInput).join('');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            // Handle checkboxes (boolean)
            fields.forEach(f => {
                if (f.type === 'Boolean') {
                    payload[f.name] = formData.has(f.name);
                }
            });

            const statusMsg = fragmentElement.querySelector('.form-status-msg');
            statusMsg.classList.add('d-none');

            try {
                const saveResponse = await Liferay.Util.fetch(`/o/c/${state.definition.restContextPath}/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (saveResponse.ok) {
                    statusMsg.textContent = 'Entry saved successfully!';
                    statusMsg.className = 'form-status-msg mt-3 alert alert-success';
                    statusMsg.classList.remove('d-none');
                    form.reset();
                } else {
                    if (saveResponse.status === 401 || saveResponse.status === 403) {
                        throw new Error('You do not have permission to save entries to this object.');
                    }
                    const errData = await saveResponse.json();
                    throw new Error(errData.message || 'Failed to save entry.');
                }
            } catch (err) {
                statusMsg.textContent = err.message;
                statusMsg.className = 'form-status-msg mt-3 alert alert-danger';
                statusMsg.classList.remove('d-none');
            }
        });

    } catch (err) {
        fieldsWrap.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    initMetaForm();
} else {
    fragmentElement.querySelector('.object-title').textContent = 'Meta-Object Form';
}
