const COLLECTION_BASE_URL = '/o/headless-delivery/v1.0/collections';

let state = {
    items: [],
    currentIndex: 0,
    slidesPerView: parseInt(configuration.slidesPerView || '3'),
    autoplayInterval: null
};

const cache = new Map();

const fetchCollectionItems = async (id) => {
    if (cache.has(id)) return cache.get(id);

    const response = await Liferay.Util.fetch(`${COLLECTION_BASE_URL}/${id}/items`);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have permission to access items in this collection.');
        }
        throw new Error('Failed to fetch collection items');
    }

    const data = await response.json();
    cache.set(id, data.items);
    return data.items;
};

const renderSlides = () => {
    const track = fragmentElement.querySelector(`#track-${fragmentEntryLinkNamespace}`);
    if (!track) return;

    if (state.items.length === 0) {
        track.innerHTML = '<div class="slider-status">No items found in this collection.</div>';
        return;
    }

    track.innerHTML = state.items.map(item => `
        <div class="slider-slide">
            <div class="slide-content-top">
                <div class="slide-title">${item.title || 'Untitled'}</div>
                <div class="slide-content">${item.description || ''}</div>
            </div>
            ${item.url ? `<a href="${item.url}" class="btn btn-sm btn-link p-0 text-left">Read More</a>` : ''}
        </div>
    `).join('');

    updatePagination();
    updatePosition();
};

const updatePagination = () => {
    const container = fragmentElement.querySelector(`#pagination-${fragmentEntryLinkNamespace}`);
    if (!container) return;

    const pageCount = Math.ceil(state.items.length / state.slidesPerView);
    container.innerHTML = Array.from({ length: pageCount }).map((_, i) => `
        <div class="dot ${Math.floor(state.currentIndex / state.slidesPerView) === i ? 'active' : ''}" data-index="${i * state.slidesPerView}"></div>
    `).join('');

    container.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.currentIndex = parseInt(dot.dataset.index);
            updatePosition();
            resetAutoplay();
        });
    });
};

const updatePosition = () => {
    const track = fragmentElement.querySelector(`#track-${fragmentEntryLinkNamespace}`);
    const slide = fragmentElement.querySelector('.slider-slide');
    if (!track || !slide) return;

    const gap = parseInt(getComputedStyle(fragmentElement.querySelector('.slider-track')).gap) || 0;
    const slideWidth = slide.offsetWidth;
    const move = state.currentIndex * (slideWidth + gap);

    track.style.transform = `translateX(-${move}px)`;
    updatePagination();
};

const nextSlide = () => {
    const max = state.items.length - state.slidesPerView;
    if (state.currentIndex < max) {
        state.currentIndex++;
    } else if (configuration.loop) {
        state.currentIndex = 0;
    }
    updatePosition();
};

const prevSlide = () => {
    if (state.currentIndex > 0) {
        state.currentIndex--;
    } else if (configuration.loop) {
        state.currentIndex = Math.max(0, state.items.length - state.slidesPerView);
    }
    updatePosition();
};

const startAutoplay = () => {
    if (configuration.autoplay && !state.autoplayInterval) {
        state.autoplayInterval = setInterval(nextSlide, 5000);
    }
};

const resetAutoplay = () => {
    if (state.autoplayInterval) {
        clearInterval(state.autoplayInterval);
        state.autoplayInterval = null;
        startAutoplay();
    }
};

const init = async () => {
    try {
        let { collectionId } = configuration;
        if (!collectionId) {
            fragmentElement.querySelector('.slider-status').textContent = 'Please select a collection in the configuration.';
            return;
        }

        if (typeof collectionId === 'object') {
            collectionId = collectionId.collectionKey || collectionId.collectionId || collectionId.id;
        }

        if (!collectionId) {
            fragmentElement.querySelector('.slider-status').textContent = 'Invalid collection selection.';
            return;
        }

        // Set slides per view for CSS variable
        fragmentElement.querySelector('.dynamic-slider-container').style.setProperty('--slides-per-view', state.slidesPerView);

        state.items = await fetchCollectionItems(collectionId);
        renderSlides();

        fragmentElement.querySelector('.next-btn').addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });

        fragmentElement.querySelector('.prev-btn').addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });

        window.addEventListener('resize', Liferay.Util.debounce(() => {
            updatePosition();
        }, 200));

        startAutoplay();

    } catch (err) {
        console.error('Slider init failed:', err);
        const track = fragmentElement.querySelector('.slider-track');
        if (track) track.innerHTML = `<div class="slider-status text-danger">Error: ${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    init();
} else {
    // Show static state in edit/preview
    fragmentElement.querySelector('.slider-status').textContent = 'Collection Slider (Data populated in View mode)';
}
