const initSearchOverlay = () => {
  const { debounce, renderEmptyState } = Liferay.Fragment.Commons;
  const container = fragmentElement.querySelector('.modern-search-overlay');
  const modal = fragmentElement.querySelector('.search-modal');
  const trigger = fragmentElement.querySelector('.search-trigger');
  const closeBtn = fragmentElement.querySelector('.close-search');
  const input = fragmentElement.querySelector('.search-input');
  const resultsList = fragmentElement.querySelector('.results-list');
  const initialMsg = fragmentElement.querySelector('.initial-message');
  const loading = fragmentElement.querySelector('.loading-spinner');

  const SEARCH_API =
    '/o/headless-delivery/v1.0/sites/' +
    Liferay.ThemeDisplay.getScopeGroupId() +
    '/search';

  const toggleModal = (show) => {
    if (show) {
      modal.classList.remove('d-none');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input.focus(), 100);
    } else {
      modal.classList.add('d-none');
      document.body.style.overflow = '';
      input.value = '';
      resultsList.innerHTML = '';
      resultsList.classList.add('d-none');
      initialMsg.classList.remove('d-none');
    }
  };

  const renderResults = (items) => {
    loading.classList.add('d-none');

    if (!items || items.length === 0) {
      resultsList.innerHTML = '';
      resultsList.classList.remove('d-none');
      renderEmptyState(resultsList, {
        title: 'No Results Found',
        description: 'Adjust your search terms and try again.',
      });
      return;
    }

    // Group by category/className
    const groups = items.reduce((acc, item) => {
      const cat = item.className || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    resultsList.innerHTML = Object.entries(groups)
      .map(
        ([cat, docs]) => `
          <div class="col-12 mb-4">
              <h5 class="text-uppercase small font-weight-bold text-muted mb-3">${cat.split('.').pop()}</h5>
              <div class="row">
                  ${docs
                    .map(
                      (doc) => `
                      <div class="col-md-6 mb-3">
                          <a href="${doc.url}" class="search-result-card">
                              <div class="result-title">${doc.title || 'Untitled'}</div>
                              <div class="result-snippet">${doc.content ? doc.content.substring(0, 100) + '...' : ''}</div>
                          </a>
                      </div>
                  `
                    )
                    .join('')}
              </div>
          </div>
      `
      )
      .join('');

    resultsList.classList.remove('d-none');
  };

  const handleSearch = debounce(async (query) => {
    if (!query || query.length < 2) {
      resultsList.classList.add('d-none');
      initialMsg.classList.remove('d-none');
      return;
    }

    initialMsg.classList.add('d-none');
    resultsList.classList.add('d-none');
    loading.classList.remove('d-none');

    try {
      const response = await Liferay.Util.fetch(
        `${SEARCH_API}?search=${query}`
      );
      const data = await response.json();
      renderResults(data.items);
    } catch (err) {
      console.error('Search failed:', err);
      loading.classList.add('d-none');
    }
  }, 300);

  if (trigger) trigger.addEventListener('click', () => toggleModal(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleModal(false));

  input.addEventListener('input', (e) => handleSearch(e.target.value));

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleModal(false);
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleModal(true);
    }
  });
};

initSearchOverlay();
