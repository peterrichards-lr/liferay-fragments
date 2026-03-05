const fetchData = async () => {
    const { objectERC } = configuration;
    if (!objectERC) throw new Error('Object ERC not configured.');
    
    // Fetch definition by ERC
    const adminUrl = `/o/object-admin/v1.0/object-definitions/by-external-reference-code/${objectERC}`;
    const defRes = await Liferay.Util.fetch(adminUrl);
    if (!defRes.ok) throw new Error(`Could not find object with ERC "${objectERC}".`);
    const definition = await defRes.json();

    let url = definition.restContextPath;
    if (definition.scope === 'site') {
        const siteId = Liferay.ThemeDisplay.getScopeGroupId();
        url += `/scopes/${siteId}`;
    }

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Permission denied.');
        throw new Error(`Failed to fetch from "${definition.restContextPath}".`);
    }
    const data = await response.json();
    return data.items || [];
};

const renderTimeline = (items) => {
    const container = fragmentElement.querySelector(`#items-${fragmentEntryLinkNamespace}`);
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<div class="timeline-status text-muted text-center p-5">No milestones found.</div>';
        return;
    }
    const { dateField, titleField, descriptionField } = configuration;
    const sortedItems = items.sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
    container.innerHTML = sortedItems.map(item => `
        <div class="timeline-item is-visible">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <span class="timeline-date">${item[dateField] ? new Date(item[dateField]).toLocaleDateString() : 'No Date'}</span>
                <div class="timeline-title">${item[titleField] || 'Untitled'}</div>
                <div class="timeline-desc">${item[descriptionField] || ''}</div>
            </div>
        </div>
    `).join('');
    initAnimations();
};

const initAnimations = () => {
    if (layoutMode !== 'view') return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0.2 });
    fragmentElement.querySelectorAll('.timeline-item').forEach(item => observer.observe(item));
};

const initTimeline = async (isEditMode) => {
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const itemsEl = fragmentElement.querySelector(`#items-${fragmentEntryLinkNamespace}`);
    
    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (itemsEl) itemsEl.innerHTML = '';
        } else if (itemsEl) {
            itemsEl.innerHTML = `<div class="timeline-status text-danger">${msg}</div>`;
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (itemsEl) itemsEl.innerHTML = '';
        } else if (itemsEl) {
            itemsEl.innerHTML = `<div class="timeline-status">${msg}</div>`;
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    const { objectERC } = configuration;

    if (!objectERC) {
        showInfo('Please configure an Object External Reference Code.');
        renderTimeline([{ title: 'Placeholder Item 1', date: '2025-01-01', description: 'Sample description.' }]);
        return;
    }

    try {
        const items = await fetchData();
        if (items.length === 0 && isEditMode) {
             showInfo(`No items found for "${objectERC}". Rendering placeholder.`);
             renderTimeline([{ title: 'Placeholder Item', date: '2025-01-01', description: 'Sample description.' }]);
             return;
        }
        renderTimeline(items);
    } catch (err) {
        showError(err.message);
    }
};

if (layoutMode === 'view') initTimeline(false);
else initTimeline(true);
