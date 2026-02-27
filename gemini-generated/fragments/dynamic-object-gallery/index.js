const ADMIN_API_BASE = '/o/object-admin/v1.0';

const initGallery = async () => {
    const { objectERC, imageField, titleField, descriptionField } = configuration;
    const grid = fragmentElement.querySelector('.gallery-grid');

    if (!objectERC) {
        grid.innerHTML = '<div class="text-center p-5 w-100">Please configure an Object ERC.</div>';
        return;
    }

    try {
        // 1. Get Definition
        const defResponse = await Liferay.Util.fetch(`${ADMIN_API_BASE}/object-definitions/by-external-reference-code/${objectERC}`);
        if (!defResponse.ok) {
            if (defResponse.status === 401 || defResponse.status === 403) {
                throw new Error('You do not have permission to access the definition for this object.');
            }
            throw new Error('Definition fetch failed');
        }
        const definition = await defResponse.json();

        // 2. Get Data
        const dataResponse = await Liferay.Util.fetch(`${definition.restContextPath}/`); // Fixed: Use restContextPath directly
        if (!dataResponse.ok) {
            if (dataResponse.status === 401 || dataResponse.status === 403) {
                throw new Error('You do not have permission to view data for this object.');
            }
            throw new Error('Data fetch failed');
        }
        const data = await dataResponse.json();
        const items = data.items || [];

        if (items.length === 0) {
            grid.innerHTML = '<div class="text-center p-5 w-100">No entries found.</div>';
            return;
        }

        // 3. Render
        grid.innerHTML = items.map(item => {
            const imgUrl = item[imageField] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop';
            return `
                <div class="gallery-item">
                    <div class="item-image" style="background-image: url('${imgUrl}')"></div>
                    <div class="item-body">
                        <div class="item-title">${item[titleField] || 'Untitled'}</div>
                        <div class="item-desc">${item[descriptionField] || ''}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Gallery Error:', err);
        grid.innerHTML = `<div class="text-center p-5 w-100 text-danger">Error: ${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    initGallery();
} else {
    // Show placeholder
    fragmentElement.querySelector('.meta-status').textContent = 'Meta-Object Gallery (View mode only)';
}
