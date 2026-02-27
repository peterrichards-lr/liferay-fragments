const ADMIN_API_BASE = '/o/object-admin/v1.0';

const initGallery = async (isEditMode) => {
    const { objectERC, imageField, titleField, descriptionField } = configuration;
    const grid = fragmentElement.querySelector('.gallery-grid');
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);

    const showError = (msg) => {
        if (isEditMode && errorEl) { errorEl.textContent = msg; errorEl.classList.remove('d-none'); }
        if (grid) grid.innerHTML = `<div class="text-center p-5 w-100 text-danger">${msg}</div>`;
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) { infoEl.textContent = msg; infoEl.classList.remove('d-none'); }
        if (grid) grid.innerHTML = `<div class="text-center p-5 w-100 text-muted">${msg}</div>`;
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    if (!objectERC) {
        showInfo('Please configure an Object External Reference Code.');
        return;
    }

    try {
        const defRes = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!defRes.ok) throw new Error('Definition fetch failed.');
        const definition = await defRes.json();

        const pageSize = isEditMode ? 4 : 20;
        const dataRes = await Liferay.Util.fetch(`${definition.restContextPath}/?pageSize=${pageSize}`);
        if (!dataRes.ok) throw new Error('Data fetch failed.');
        const data = await dataRes.json();
        const items = data.items || [];

        if (items.length === 0) {
            showInfo('No entries found.');
            return;
        }

        grid.innerHTML = items.map(item => {
            const imgUrl = item[imageField] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop';
            return `<div class="gallery-item"><div class="item-image" style="background-image: url('${imgUrl}')"></div><div class="item-body"><div class="item-title">${item[titleField] || 'Untitled'}</div><div class="item-desc">${item[descriptionField] || ''}</div></div></div>`;
        }).join('');
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') initGallery(false);
else initGallery(true);
