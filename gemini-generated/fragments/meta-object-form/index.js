const ADMIN_API_BASE = '/o/object-admin/v1.0';

const state = {
    definition: null
};

const mapFieldToInput = (field) => {
    const { type, name, label, required } = field;
    const commonAttrs = `name="${name}" id="${name}-${fragmentEntryLinkNamespace}" class="form-control" ${required ? 'required' : ''}`;

    switch (type) {
        case 'Integer':
        case 'Decimal':
        case 'Double': return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="number" ${commonAttrs}></div>`;
        case 'DateTime':
        case 'Date': return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="date" ${commonAttrs}></div>`;
        case 'CPLongText': return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><textarea ${commonAttrs} rows="4"></textarea></div>`;
        case 'Boolean': return `<div class="form-group mb-4"><div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" name="${name}" id="${name}-${fragmentEntryLinkNamespace}"><label class="custom-control-label" for="${name}-${fragmentEntryLinkNamespace}">${label}</label></div></div>`;
        default: return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="text" ${commonAttrs}></div>`;
    }
};

const initMetaForm = async (isEditMode) => {
    const { objectERC } = configuration;
    const fieldsWrap = fragmentElement.querySelector('.form-fields-wrap');
    const titleEl = fragmentElement.querySelector('.object-title');
    const form = fragmentElement.querySelector('form');
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);

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
        titleEl.textContent = 'Meta-Object Form';
        showInfo('Please provide an Object External Reference Code in the configuration.');
        return;
    }

    try {
        const response = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('You do not have permission to view this object definition.');
            }
            throw new Error(response.status === 404 ? 'Object not found.' : 'Permission denied.');
        }
        
        state.definition = await response.json();
        titleEl.textContent = state.definition.name + (isEditMode ? ' (Preview)' : '');

        const fields = state.definition.objectFields.filter(f => !['id', 'externalReferenceCode'].includes(f.name) && !f.readOnly);
        fieldsWrap.innerHTML = fields.map(mapFieldToInput).join('');

        if (!isEditMode) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const payload = Object.fromEntries(formData.entries());
                fields.forEach(f => { if (f.type === 'Boolean') payload[f.name] = formData.has(f.name); });

                const statusMsg = fragmentElement.querySelector('.form-status-msg');
                statusMsg.classList.add('d-none');

                try {
                    const saveRes = await Liferay.Util.fetch(`${state.definition.restContextPath}/`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (saveRes.ok) {
                        statusMsg.textContent = 'Entry saved successfully!';
                        statusMsg.className = 'form-status-msg mt-3 alert alert-success';
                        statusMsg.classList.remove('d-none');
                        form.reset();
                    } else {
                        if (saveRes.status === 401 || saveRes.status === 403) {
                            throw new Error('You do not have permission to save entries to this object.');
                        }
                        throw new Error('Failed to save entry.');
                    }
                } catch (err) {
                    statusMsg.textContent = err.message;
                    statusMsg.className = 'form-status-msg mt-3 alert alert-danger';
                    statusMsg.classList.remove('d-none');
                }
            });
        } else {
            form.onsubmit = (e) => e.preventDefault();
        }
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') initMetaForm(false);
else initMetaForm(true);
