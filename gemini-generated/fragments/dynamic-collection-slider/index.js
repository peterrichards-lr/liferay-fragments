const COLLECTION_BASE_URL = '/o/headless-delivery/v1.0';

let state = {
    items: [],
    currentIndex: 0,
    slidesPerView: 3,
    autoplayInterval: null
};

const cache = new Map();

const collectionName2key = (name) => name?.toLowerCase().replace(/\s+/g, '-');

const isUuidV4 = (str) => {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof str === 'string' && uuidV4Regex.test(str);
};

const buildCollectionUrl = (identifier) => {
    const siteId = Liferay.ThemeDisplay.getSiteGroupId();
    
    if (!identifier) return null;

    if (!isNaN(identifier)) { // If it is a numeric id
        return `${COLLECTION_BASE_URL}/content-sets/${identifier}/content-set-elements`;
    }

    if (isUuidV4(identifier)) {
        return `${COLLECTION_BASE_URL}/sites/${siteId}/content-sets/by-uuid/${identifier}/content-set-elements`;
    } else {
        const collectionKey = collectionName2key(identifier);
        return `${COLLECTION_BASE_URL}/sites/${siteId}/content-sets/by-key/${collectionKey}/content-set-elements`;
    }
};

const fetchCollectionItems = async (identifier) => {
    const url = buildCollectionUrl(identifier);
    if (!url) throw new Error('Invalid collection identifier.');

    if (cache.has(url)) return cache.get(url);

    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You do not have permission to access items in this collection.');
        }
        if (response.status === 404) {
            throw new Error(`Collection "${identifier}" not found.`);
        }
        throw new Error('Failed to fetch collection items');
    }

    const data = await response.json();
    const items = data.items.map(i => i.content || i);
    cache.set(url, items);
    return items;
};

const renderSlides = () => {
    const track = fragmentElement.querySelector(`#track-${fragmentEntryLinkNamespace}`);
    if (!track) return;

    if (state.items.length === 0) {
        track.innerHTML = '<div class="slider-status">No items found in this collection.</div>';
        return;
    }

    const { displayStyle } = configuration;

    track.innerHTML = state.items.map((item, index) => {
        // Handle image extraction (different sources possible in Headless)
        let imageUrl = item.image?.url || item.featuredImage?.url || item.thumbnail?.url || '';
        
        // Fallback: Check contentFields for an image field or an <img> tag in text
        if (!imageUrl && item.contentFields) {
            // 1. Try to find a specific image field
            const imageField = item.contentFields.find(f => f.dataType === 'image');
            if (imageField?.contentFieldValue?.image?.url) {
                imageUrl = imageField.contentFieldValue.image.url;
            } 
            // 2. Try to extract from first <img> tag in any string/rich-text field (User's case)
            else {
                const textField = item.contentFields.find(f => f.dataType === 'string' && f.contentFieldValue?.data?.includes('<img'));
                if (textField) {
                    const match = textField.contentFieldValue.data.match(/<img[^>]+src=['"]([^'"]+)['"]/);
                    if (match) imageUrl = match[1];
                }
            }
        }

        const hasImage = !!imageUrl;

        // Extract Link URL
        let itemUrl = '#';
        if (item.renderedContents && item.renderedContents.length > 0) {
            itemUrl = item.renderedContents[0].renderedContentURL;
        } else if (item.friendlyUrlPath) {
             const sitePath = Liferay.ThemeDisplay.getPathFriendlyURLPublic() + Liferay.ThemeDisplay.getSiteGroupFriendlyURL();
             itemUrl = `${sitePath}/w/${item.friendlyUrlPath}`;
        } else if (item.url) {
            itemUrl = item.url;
        }

        let contentHtml = '';
        if (displayStyle === 'background' && hasImage) {
            contentHtml = `
                <img class="slide-bg" src="${imageUrl}" alt="${item.title || 'Slide Image'}" loading="lazy" />
                <div class="slide-overlay"></div>
                <div class="slide-content-top">
                    <div class="slide-title">${item.title || 'Untitled'}</div>
                    <div class="slide-content">${item.description || ''}</div>
                </div>
            `;
        } else {
            contentHtml = `
                ${hasImage ? `<img class="slide-image" src="${imageUrl}" alt="${item.title || 'Slide Image'}" loading="lazy" />` : ''}
                <div class="slide-content-top">
                    <div class="slide-title">${item.title || 'Untitled'}</div>
                    <div class="slide-content">${item.description || ''}</div>
                </div>
            `;
        }

        return `
            <div class="slider-slide style-${displayStyle}" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${state.items.length}">
                <a href="${itemUrl}" class="slide-link">
                    ${contentHtml}
                </a>
            </div>
        `;
    }).join('');

    updatePagination();
    updatePosition();
};

const updatePagination = () => {
    const container = fragmentElement.querySelector(`#pagination-${fragmentEntryLinkNamespace}`);
    if (!container) return;

    const pageCount = Math.ceil(state.items.length / state.slidesPerView);
    container.innerHTML = Array.from({ length: pageCount }).map((_, i) => `
        <button class="dot ${Math.floor(state.currentIndex / state.slidesPerView) === i ? 'active' : ''}" 
                data-index="${i * state.slidesPerView}"
                role="tab"
                aria-selected="${Math.floor(state.currentIndex / state.slidesPerView) === i}"
                aria-label="Go to slide ${i + 1}"
                aria-controls="track-${fragmentEntryLinkNamespace}"></button>
    `).join('');

    container.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.currentIndex = parseInt(dot.dataset.index);
            updatePosition();
            resetAutoplay();
        });
    });
};

const getSlidesPerView = () => {
    const configured = parseInt(configuration.slidesPerView || '3');
    if (window.innerWidth < 576) return 1;
    if (window.innerWidth < 992) return Math.min(configured, 2);
    return configured;
};

const updatePosition = () => {
    const track = fragmentElement.querySelector(`#track-${fragmentEntryLinkNamespace}`);
    const slide = fragmentElement.querySelector('.slider-slide');
    if (!track || !slide) return;

    state.slidesPerView = getSlidesPerView();
    fragmentElement.querySelector('.dynamic-slider-container').style.setProperty('--slides-per-view', state.slidesPerView);

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
        const { collectionId } = configuration;
        if (!collectionId) {
            fragmentElement.querySelector('.slider-status').textContent = 'Please provide a Collection Name, Key, or ID in the configuration.';
            return;
        }

        state.slidesPerView = getSlidesPerView();
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
        if (track) track.innerHTML = `<div class="slider-status text-danger">${err.message}</div>`;
    }
};

if (layoutMode === 'view') {
    init();
} else {
    // Show static state in edit/preview
    fragmentElement.querySelector('.slider-status').textContent = 'Collection Slider (Data populated in View mode)';
}
