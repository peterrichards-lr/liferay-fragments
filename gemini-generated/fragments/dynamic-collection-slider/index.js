const state = {
  currentIndex: 0,
  isDragging: false,
  startX: 0,
  currentTranslate: 0,
  prevTranslate: 0,
};

const updateSlider = () => {
  const track = fragmentElement.querySelector(
    `#track-${fragmentEntryLinkNamespace}`,
  );
  const slides = fragmentElement.querySelectorAll(".slider-slide");
  const dots = fragmentElement.querySelectorAll(".dot");

  if (track && slides.length > 0) {
    const slideWidth = slides[0].offsetWidth;
    state.currentTranslate = -state.currentIndex * slideWidth;
    state.prevTranslate = state.currentTranslate;
    track.style.transform = `translateX(${state.currentTranslate}px)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === state.currentIndex);
      dot.setAttribute("aria-current", index === state.currentIndex);
    });

    // Update visibility for screen readers
    slides.forEach((slide, index) => {
      if (index === state.currentIndex) {
        slide.removeAttribute("aria-hidden");
        slide.setAttribute("tabindex", "0");
      } else {
        slide.setAttribute("aria-hidden", "true");
        slide.setAttribute("tabindex", "-1");
      }
    });
  }
};

const initSlider = () => {
  const track = fragmentElement.querySelector(
    `#track-${fragmentEntryLinkNamespace}`,
  );
  const container = fragmentElement.querySelector(".dynamic-slider-container");
  const viewport = fragmentElement.querySelector(".slider-viewport");
  const slides = fragmentElement.querySelectorAll(".slider-slide");
  const dots = fragmentElement.querySelectorAll(".dot");
  const prevBtn = fragmentElement.querySelector(".prev-btn");
  const nextBtn = fragmentElement.querySelector(".next-btn");

  // Check for configuration (Standard Collections check)
  if (!slides.length && layoutMode !== "view") {
    // Basic check for manual slides vs collection
    const hasManualSlides = container.querySelector("[data-lfr-editable-id]");
    if (!hasManualSlides) {
      Liferay.Fragment.Commons.renderConfigWarning(
        viewport,
        "Please map this fragment to a Collection or add manual slides to see content.",
        layoutMode,
      );
      return;
    }
  }

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
      prevBtn.onclick = goToPrev;
    }

    if (nextBtn) {
      nextBtn.onclick = goToNext;
    }

    dots.forEach((dot, index) => {
      dot.onclick = () => {
        state.currentIndex = index;
        updateSlider();
      };
    });

    // Keyboard Navigation
    container.setAttribute("tabindex", "0");
    container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    });

    // Touch/Mouse Events for Dragging
    const handleDragStart = (e) => {
      if (!e.target.closest(".slider-btn, .dot")) {
        state.isDragging = true;
        state.startX = e.type.includes("touch")
          ? e.touches[0].clientX
          : e.pageX;
        track.style.transition = "none";
      }
    };

    const handleDragMove = (e) => {
      if (state.isDragging) {
        const currentX = e.type.includes("touch")
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
        track.style.transition = "transform 0.3s ease-out";

        const movedBy = state.currentTranslate - state.prevTranslate;
        if (movedBy < -100 && state.currentIndex < slides.length - 1)
          state.currentIndex++;
        if (movedBy > 100 && state.currentIndex > 0) state.currentIndex--;

        updateSlider();
      }
    };

    container.addEventListener("touchstart", handleDragStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleDragMove, { passive: true });
    container.addEventListener("touchend", handleDragEnd);
    container.addEventListener("mousedown", handleDragStart);
    container.addEventListener("mousemove", handleDragMove);
    container.addEventListener("mouseup", handleDragEnd);
    container.addEventListener("mouseleave", handleDragEnd);

    // Initial setup
    updateSlider();

    // Auto-slide if configured
    const interval = parseInt(configuration.autoplayInterval || "0");
    if (interval > 0 && layoutMode === "view") {
      let intervalId = setInterval(() => {
        if (!state.isDragging && document.activeElement !== container) {
          goToNext();
        }
      }, interval);

      container.addEventListener("mouseenter", () => clearInterval(intervalId));
      container.addEventListener("mouseleave", () => {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
          if (!state.isDragging && document.activeElement !== container) {
            goToNext();
          }
        }, interval);
      });
    }
  } else if (slides.length === 0 && layoutMode === "view") {
    Liferay.Fragment.Commons.renderEmptyState(viewport, {
      title: "Collection is Empty",
      description:
        "There are no items in this collection to display in the slider.",
    });
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
  }
};

initSlider();
