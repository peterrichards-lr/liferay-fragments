const state = {
  currentIndex: 0,
  isDragging: false,
  startX: 0,
  currentTranslate: 0,
  prevTranslate: 0,
};

const updateSlider = () => {
  const track = fragmentElement.querySelector(
    `#track-${fragmentEntryLinkNamespace}`
  );
  const slides = fragmentElement.querySelectorAll('.slider-slide');
  const dots = fragmentElement.querySelectorAll('.dot');

  if (track && slides.length > 0) {
    const slideWidth = slides[0].offsetWidth;
    state.currentTranslate = -state.currentIndex * slideWidth;
    state.prevTranslate = state.currentTranslate;
    track.style.transform = `translateX(${state.currentTranslate}px)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === state.currentIndex);
      dot.setAttribute('aria-current', index === state.currentIndex);
    });

    // Update visibility for screen readers
    slides.forEach((slide, index) => {
      if (index === state.currentIndex) {
        slide.removeAttribute('aria-hidden');
        slide.setAttribute('tabindex', '0');
      } else {
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('tabindex', '-1');
      }
    });
  }
};

const initSlider = () => {
  const track = fragmentElement.querySelector(
    `#track-${fragmentEntryLinkNamespace}`
  );
  const container = fragmentElement.querySelector('.dynamic-slider-container');
  const viewport = fragmentElement.querySelector('.slider-viewport');

  const setupSliderUI = () => {
    const slides = fragmentElement.querySelectorAll('.slider-slide');
    const dots = fragmentElement.querySelectorAll('.dot');
    const prevBtn = fragmentElement.querySelector('.prev-btn');
    const nextBtn = fragmentElement.querySelector('.next-btn');

    if (track && container && slides.length > 0) {
      const goToPrev = () => {
        state.currentIndex =
          (state.currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
      };

      const goToNext = () => {
        state.currentIndex = (state.currentIndex + 1) % slides.length;
        updateSlider();
      };

      // Basic Navigation
      if (prevBtn) {
        prevBtn.style.display = '';
        prevBtn.onclick = goToPrev;
      }

      if (nextBtn) {
        nextBtn.style.display = '';
        nextBtn.onclick = goToNext;
      }

      dots.forEach((dot, index) => {
        dot.onclick = () => {
          state.currentIndex = index;
          updateSlider();
        };
      });

      // Keyboard Navigation
      container.setAttribute('tabindex', '0');
      container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        }
      });

      // Touch/Mouse Events for Dragging
      const handleDragStart = (e) => {
        if (!e.target.closest('.slider-btn, .dot')) {
          state.isDragging = true;
          state.startX = e.type.includes('touch')
            ? e.touches[0].clientX
            : e.pageX;
          track.style.transition = 'none';
        }
      };

      const handleDragMove = (e) => {
        if (state.isDragging) {
          const currentX = e.type.includes('touch')
            ? e.touches[0].clientX
            : e.pageX;
          const diff = currentX - state.startX;
          state.currentTranslate = state.prevTranslate + diff;
          track.style.transform = `translateX(${state.currentTranslate}px)`;
        }
      };

      const handleDragEnd = () => {
        if (state.isDragging) {
          state.isDragging = false;
          track.style.transition = 'transform 0.3s ease-out';

          const movedBy = state.currentTranslate - state.prevTranslate;
          if (movedBy < -100 && state.currentIndex < slides.length - 1)
            state.currentIndex++;
          if (movedBy > 100 && state.currentIndex > 0) state.currentIndex--;

          updateSlider();
        }
      };

      container.addEventListener('touchstart', handleDragStart, {
        passive: true,
      });
      container.addEventListener('touchmove', handleDragMove, {
        passive: true,
      });
      container.addEventListener('touchend', handleDragEnd);
      container.addEventListener('mousedown', handleDragStart);
      container.addEventListener('mousemove', handleDragMove);
      container.addEventListener('mouseup', handleDragEnd);
      container.addEventListener('mouseleave', handleDragEnd);

      // Initial setup
      updateSlider();

      // Auto-slide if configured
      const interval = parseInt(configuration.autoplayInterval || '0');
      if (interval > 0 && layoutMode === 'view') {
        let intervalId = setInterval(() => {
          if (!state.isDragging && document.activeElement !== container) {
            goToNext();
          }
        }, interval);

        container.addEventListener('mouseenter', () =>
          clearInterval(intervalId)
        );
        container.addEventListener('mouseleave', () => {
          clearInterval(intervalId);
          intervalId = setInterval(() => {
            if (!state.isDragging && document.activeElement !== container) {
              goToNext();
            }
          }, interval);
        });
      }
    } else if (slides.length === 0 && layoutMode === 'view') {
      Liferay.Fragment.Commons.renderEmptyState(viewport, {
        title: 'Collection is Empty',
        description:
          'There are no items in this collection to display in the slider.',
      });
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  };

  const collectionId = configuration.collectionId || '';
  const initialSlides = fragmentElement.querySelectorAll('.slider-slide');

  if (initialSlides.length === 0 && collectionId && layoutMode === 'view') {
    const url = `/o/headless-delivery/v1.0/content-sets/${collectionId}/content-set-elements`;
    const fetchFn =
      typeof Liferay !== 'undefined' && Liferay.Util && Liferay.Util.fetch
        ? Liferay.Util.fetch
        : fetch;

    fetchFn(url)
      .then((res) => {
        if (!res.ok) throw new Error('Status: ' + res.status);
        return res.json();
      })
      .then((data) => {
        const items = data.items || [];
        if (items.length === 0) {
          setupSliderUI();
          return;
        }

        // Clear status
        const statusEl = track.querySelector('.slider-status');
        if (statusEl) statusEl.remove();

        const displayStyle = configuration.displayStyle || 'top';

        // Render each slide
        items.forEach((item) => {
          const slideEl = document.createElement('div');
          slideEl.className = `slider-slide style-${displayStyle}`;

          const title = item.title || '';
          let description = '';
          let imageUrl = '';

          const contentFields =
            item.content && item.content.contentFields
              ? item.content.contentFields
              : item.contentFields || [];

          if (contentFields.length > 0) {
            const descField = contentFields.find(
              (f) => f.name === 'description'
            );
            if (descField) {
              description =
                descField.contentFieldValue && descField.contentFieldValue.data
                  ? descField.contentFieldValue.data
                  : descField.value || '';
            }

            const imgField = contentFields.find((f) => f.name === 'image');
            if (imgField) {
              const rawImgValue =
                imgField.contentFieldValue && imgField.contentFieldValue.data
                  ? imgField.contentFieldValue.data
                  : imgField.value || '';
              if (rawImgValue) {
                try {
                  const imgData = JSON.parse(rawImgValue);
                  imageUrl = imgData.url || imgData.path || rawImgValue;
                } catch (e) {
                  imageUrl = rawImgValue;
                }
              }
            }
          }

          if (!imageUrl && item.image) {
            imageUrl = item.image.url || item.image.path || '';
          }

          const linkUrl = item.url || '#';

          let imageHTML = '';
          if (imageUrl) {
            if (displayStyle === 'background') {
              imageHTML = `<div class="slide-bg" style="background-image: url('${imageUrl}');"></div>`;
            } else {
              imageHTML = `<img class="slide-image" src="${imageUrl}" alt="${title}" />`;
            }
          }

          slideEl.innerHTML = `
            <a href="${linkUrl}" class="slide-link">
              ${imageHTML}
              <div class="slide-overlay"></div>
              <div class="slide-content-top">
                <h3 class="slide-title">${title}</h3>
                <p class="slide-content">${description}</p>
              </div>
            </a>
          `;
          track.appendChild(slideEl);
        });

        // Setup dots in pagination
        const pagination = fragmentElement.querySelector(
          `#pagination-${fragmentEntryLinkNamespace}`
        );
        if (pagination) {
          pagination.innerHTML = '';
          items.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            dot.setAttribute('aria-label', `Slide ${index + 1}`);
            pagination.appendChild(dot);
          });
        }

        setupSliderUI();
      })
      .catch((err) => {
        console.error('Error rendering Collection Slider:', err);
        const errorEl = fragmentElement.querySelector(
          `#error-${fragmentEntryLinkNamespace}`
        );
        if (errorEl) {
          errorEl.textContent =
            'Error loading collection items: ' + err.message;
          errorEl.classList.remove('d-none');
        }
        setupSliderUI();
      });
  } else {
    // Check config warning for non-view or empty collections
    if (initialSlides.length === 0 && layoutMode !== 'view') {
      const hasManualSlides = container.querySelector('[data-lfr-editable-id]');
      if (!hasManualSlides && !collectionId) {
        Liferay.Fragment.Commons.renderConfigWarning(
          viewport,
          'Please map this fragment to a Collection or add manual slides to see content.',
          layoutMode
        );
        return;
      }
    }
    setupSliderUI();
  }
};

initSlider();
