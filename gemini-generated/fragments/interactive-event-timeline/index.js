const state = {
  definition: null,
  items: [],
};

const getLocalizedValue = (value) => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const languageId =
      typeof Liferay !== 'undefined'
        ? Liferay.ThemeDisplay.getLanguageId()
        : 'en_US';
    return value[languageId] || value['en_US'] || '';
  }
  return value || '';
};

const fetchData = async () => {
  const { objectERC } = configuration;
  if (!objectERC) throw new Error('Object ERC not configured.');

  const { definition, apiPath } =
    await Liferay.Fragment.Commons.resolveObjectPathByERC(objectERC);

  if (!definition) throw new Error('Object definition not found.');
  state.definition = definition;

  const response = await Liferay.Util.fetch(
    `${apiPath}/?pageSize=100&sort=date:asc`
  );
  const data = await response.json();
  return data.items || [];
};

const initTimeline = async () => {
  const container = fragmentElement.querySelector(
    `#items-${fragmentEntryLinkNamespace}`
  );
  if (container) {
    const { objectERC, dateField, titleField, descriptionField } =
      configuration;

    if (!objectERC) {
      container.innerHTML =
        '<li class="text-center p-5 text-muted">Please configure an Object ERC.</li>';
    } else {
      try {
        state.items = await fetchData();

        if (state.items.length === 0) {
          container.innerHTML =
            '<li class="text-center p-5 text-muted">No events found.</li>';
        } else {
          container.innerHTML = state.items
            .map(
              (item, index) => `
                    <li class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}" data-index="${index}">
                        <div class="timeline-content">
                            <time class="timeline-date" datetime="${new Date(item[dateField] || item.createDate).toISOString()}">${new Date(item[dateField] || item.createDate).toLocaleDateString()}</time>
                            <h4 class="timeline-title">${item[titleField] || 'Untitled Event'}</h4>
                            <p class="timeline-description">${item[descriptionField] || ''}</p>
                        </div>
                    </li>
                `
            )
            .join('');

          if (layoutMode === 'view') {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                  }
                });
              },
              { threshold: 0.2 }
            );

            container.querySelectorAll('.timeline-item').forEach((item) => {
              observer.observe(item);
            });
          }
        }
      } catch (err) {
        container.innerHTML = `<li class="alert alert-danger">${err.message}</li>`;
      }
    }
  }
};

initTimeline();
