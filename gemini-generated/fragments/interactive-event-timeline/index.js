const fetchData = async () => {
    const { objectPath } = configuration;
    if (!objectPath) throw new Error('Object path not configured.');

    const siteId = Liferay.ThemeDisplay.getScopeGroupId();
    const url = `/o/c/${objectPath}/scopes/${siteId}`;

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have permission to view milestones for this object.');
        }
        throw new Error(`Failed to fetch from ${objectPath}.`);
    }

    const data = await response.json();
    return data.items || [];
};

const renderTimeline = (items) => {
    const container = fragmentElement.querySelector(`#items-${fragmentEntryLinkNamespace}`);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="timeline-status text-muted">No milestones found for this object.</div>';
        return;
    }

    const { dateField, titleField, descriptionField } = configuration;

    // Sort items by date
    const sortedItems = items.sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));

    container.innerHTML = sortedItems.map(item => `
        <div class="timeline-item">
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
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.2 });

    fragmentElement.querySelectorAll('.timeline-item').forEach(item => {
        observer.observe(item);
    });
};

const init = async () => {
    try {
        const items = await fetchData();
        renderTimeline(items);
    } catch (err) {
        console.error('Timeline init failed:', err);
        const container = fragmentElement.querySelector('.timeline-items');
        if (container) container.innerHTML = `<div class="timeline-status text-danger">Error: ${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    init();
} else {
    // Static preview for edit/preview modes
    const mockItems = [
        { title: 'Project Start', date: '2025-01-01', description: 'Kickoff meeting and initial planning.' },
        { title: 'Design Phase', date: '2025-03-15', description: 'Completing the brand identity and UI/UX design.' }
    ];
    renderTimeline(mockItems);
    fragmentElement.querySelectorAll('.timeline-item').forEach(i => i.classList.add('is-visible'));
}
