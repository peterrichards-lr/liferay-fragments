const COLLECTION_BASE_URL = '/o/headless-delivery/v1.0';

let state = {
    items: [],
    currentIndex: 0,
    slidesPerView: 3,
    autoplayInterval: null,
    pointerStartX: 0,
    pointerCurrentX: 0,
    isDragging: false,
    dragThreshold: 10
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
    if (!isNaN(identifier)) return `${COLLECTION_BASE_URL}/content-sets/${identifier}/content-set-elements`;
    if (isUuidV4(identifier)) return `${COLLECTION_BASE_URL}/sites/${siteId}/content-sets/by-uuid/${identifier}/content-set-elements`;
    return `${COLLECTION_BASE_URL}/sites/${siteId}/content-sets/by-key/${collectionName2key(identifier)}/content-set-elements`;
};

const fetchCollectionItems = async (identifier) => {
    const url = buildCollectionUrl(identifier);
    if (!url) throw new Error('Invalid collection identifier.');
    if (cache.has(url)) return cache.get(url);
    const response = await Liferay.Util.fetch(url);
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Permission denied.');
        if (response.status === 404) throw new Error(`Collection "${identifier}" not found.`);
        throw new Error('Fetch failed.');
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
        track.innerHTML = '<div class="slider-status">No items found.</div>';
        return;
    }
    const { displayStyle } = configuration;
    track.innerHTML = state.items.map((item, index) => {
        let imageUrl = item.image?.url || item.featuredImage?.url || item.thumbnail?.url || '';
        if (!imageUrl && item.contentFields) {
            const imgField = item.contentFields.find(f => f.dataType === 'image');
            if (imgField?.contentFieldValue?.image?.url) imageUrl = imgField.contentFieldValue.image.url;
            else {
                const textField = item.contentFields.find(f => f.dataType === 'string' && f.contentFieldValue?.data?.includes('<img'));
                if (textField) {
                    const match = textField.contentFieldValue.data.match(/<img[^>]+src=['"]([^'"]+)['"]/);
                    if (match) imageUrl = match[1];
                }
            }
        }
        const hasImage = !!imageUrl;
        let itemUrl = '#';
        if (item.renderedContents?.length > 0) itemUrl = item.renderedContents[0].renderedContentURL;
        else if (item.friendlyUrlPath) {
             const sitePath = Liferay.ThemeDisplay.getPathFriendlyURLPublic() + Liferay.ThemeDisplay.getSiteGroupFriendlyURL();
             itemUrl = `${sitePath}/w/${item.friendlyUrlPath}`;
        } else if (item.url) itemUrl = item.url;

        let contentHtml = '';
        if ((displayStyle === 'background' || displayStyle === 'inset') && hasImage) {
            contentHtml = `
                <img class="slide-bg" src="${imageUrl}" alt="${item.title || ''}" loading="lazy" draggable="false" />
                <div class="slide-overlay"></div>
                <div class="slide-content-top">
                    <div class="slide-title">${item.title || 'Untitled'}</div>
                    <div class="slide-content">${item.description || ''}</div>
                </div>
            `;
        } else {
            contentHtml = `
                ${hasImage ? `<img class="slide-image" src="${imageUrl}" alt="${item.title || ''}" loading="lazy" draggable="false" />` : ''}
                <div class="slide-content-top">
                    <div class="slide-title">${item.title || 'Untitled'}</div>
                    <div class="slide-content">${item.description || ''}</div>
                </div>
            `;
        }
        return `<div class="slider-slide style-${displayStyle}" data-index="${index}" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${state.items.length}"><a href="${itemUrl}" class="slide-link">${contentHtml}</a></div>`;
    }).join('');
    updatePagination();
    updatePosition();
};

const updatePagination = () => {
    const container = fragmentElement.querySelector(`#pagination-${fragmentEntryLinkNamespace}`);
    if (!container || !configuration.showPagination) {
        if (container) container.classList.add('d-none');
        return;
    }
    container.classList.remove('d-none');

    if (layoutMode !== 'view') {
        // Mock two dots for editor preview
        container.innerHTML = `
            <button class="dot active" role="tab" aria-selected="true" aria-label="Mock active dot"></button>
            <button class="dot" role="tab" aria-selected="false" aria-label="Mock inactive dot"></button>
        `;
        return;
    }

    const pageCount = Math.ceil(state.items.length / state.slidesPerView);
    container.innerHTML = Array.from({ length: pageCount }).map((_, i) => `<button class="dot ${Math.floor(state.currentIndex / state.slidesPerView) === i ? 'active' : ''}" data-index="${i * state.slidesPerView}" role="tab" aria-selected="${Math.floor(state.currentIndex / state.slidesPerView) === i}" aria-label="Go to slide ${i + 1}" aria-controls="track-${fragmentEntryLinkNamespace}"></button>`).join('');
    
    container.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => { state.currentIndex = parseInt(dot.dataset.index); updatePosition(); resetAutoplay(); });
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
    track.style.transform = `translateX(-${state.currentIndex * (slideWidth + gap)}px)`;

    const slides = fragmentElement.querySelectorAll('.slider-slide');
    const activeMidOffset = Math.floor(state.slidesPerView / 2);
    const activeIndex = state.currentIndex + activeMidOffset;

    slides.forEach((s, i) => {
        s.classList.remove('is-active', 'is-visible');
        if (i >= state.currentIndex && i < state.currentIndex + state.slidesPerView) {
            s.classList.add('is-visible');
        }
        if (configuration.enableDepthEffect) {
            if (i === activeIndex || (state.slidesPerView === 1 && i === state.currentIndex)) {
                s.classList.add('is-active');
            }
        } else {
            if (i >= state.currentIndex && i < state.currentIndex + state.slidesPerView) {
                s.classList.add('is-active');
            }
        }
    });

    updatePagination();
};

const nextSlide = () => {
    const max = state.items.length - state.slidesPerView;
    if (state.currentIndex < max) state.currentIndex++;
    else if (configuration.loop) state.currentIndex = 0;
    updatePosition();
};

const prevSlide = () => {
    if (state.currentIndex > 0) state.currentIndex--;
    else if (configuration.loop) state.currentIndex = Math.max(0, state.items.length - state.slidesPerView);
    updatePosition();
};

const startAutoplay = () => {
    if (configuration.autoplay && !state.autoplayInterval) {
        state.autoplayInterval = setInterval(nextSlide, parseInt(configuration.autoplayInterval) || 5000);
    }
};

const resetAutoplay = () => {
    if (state.autoplayInterval) { clearInterval(state.autoplayInterval); state.autoplayInterval = null; startAutoplay(); }
};

const handleGesture = () => {
    const deltaX = state.pointerStartX - state.pointerCurrentX;
    if (Math.abs(deltaX) > state.dragThreshold * 5) {
        if (deltaX > 0) nextSlide();
        else prevSlide();
        resetAutoplay();
    }
};

const init = async (isEditMode) => {
    const { collectionId } = configuration;
    const track = fragmentElement.querySelector(`#track-${fragmentEntryLinkNamespace}`);
    const sliderControls = fragmentElement.querySelector('.slider-controls');
    const sliderPagination = fragmentElement.querySelector('.slider-pagination');
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);

    const showError = (msg) => {
        if (isEditMode && errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('d-none');
            if (track) track.innerHTML = '';
        } else if (track) {
            track.innerHTML = `<div class="slider-status text-danger">${msg}</div>`;
        }
    };

    const showInfo = (msg) => {
        if (isEditMode && infoEl) {
            infoEl.textContent = msg;
            infoEl.classList.remove('d-none');
            if (track) track.innerHTML = '';
        } else if (track) {
            track.innerHTML = `<div class="slider-status">${msg}</div>`;
        }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    if (sliderControls && !configuration.showControls) sliderControls.classList.add('d-none');
    if (sliderPagination && !configuration.showPagination) sliderPagination.classList.add('d-none');

    try {
        if (!collectionId) {
            showInfo('Please provide a Collection Name, Key, or ID.');
            if (sliderControls) sliderControls.style.display = 'none';
            if (sliderPagination) sliderPagination.style.display = 'none';
            return;
        }
        
        state.slidesPerView = getSlidesPerView();
        state.items = await fetchCollectionItems(collectionId);

        if (state.items.length === 0) {
            showInfo('No items found in this collection.');
            if (sliderControls) sliderControls.style.display = 'none';
            if (sliderPagination) sliderPagination.style.display = 'none';
            return;
        }

        if (isEditMode) {
            state.items = state.items.slice(0, state.slidesPerView);
            renderSlides();
            track.style.transition = `none`;
        } else {
            renderSlides();
            
            if (configuration.showControls) {
                fragmentElement.querySelector('.next-btn').addEventListener('click', (e) => { e.preventDefault(); nextSlide(); resetAutoplay(); });
                fragmentElement.querySelector('.prev-btn').addEventListener('click', (e) => { e.preventDefault(); prevSlide(); resetAutoplay(); });
            }

            fragmentElement.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') { prevSlide(); resetAutoplay(); }
                if (e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
            });

            fragmentElement.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.slider-btn, .dot')) return;
                state.isDragging = true;
                state.pointerStartX = e.pageX;
                state.pointerCurrentX = e.pageX;
                fragmentElement.classList.add('is-dragging');
                resetAutoplay();
            });

            window.addEventListener('pointermove', (e) => {
                if (!state.isDragging) return;
                state.pointerCurrentX = e.pageX;
            });

            window.addEventListener('pointerup', (e) => {
                if (!state.isDragging) return;
                state.isDragging = false;
                fragmentElement.classList.remove('is-dragging');
                handleGesture();
            });

            fragmentElement.addEventListener('click', (e) => {
                const deltaX = Math.abs(state.pointerStartX - state.pointerCurrentX);
                if (deltaX > state.dragThreshold) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);

            window.addEventListener('resize', Liferay.Util.debounce(() => updatePosition(), 200));
            startAutoplay();
        }
    } catch (err) { showError(err.message); }
};

if (layoutMode === 'view') init(false);
else init(true);
