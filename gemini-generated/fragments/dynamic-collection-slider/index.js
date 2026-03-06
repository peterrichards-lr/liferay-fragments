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
    });
  }
};

const initSlider = () => {
  const track = fragmentElement.querySelector(
    `#track-${fragmentEntryLinkNamespace}`,
  );
  const container = fragmentElement.querySelector(".slider-container");
  const slides = fragmentElement.querySelectorAll(".slider-slide");
  const dots = fragmentElement.querySelectorAll(".dot");
  const prevBtn = fragmentElement.querySelector(".prev-btn");
  const nextBtn = fragmentElement.querySelector(".next-btn");

  if (track && container && slides.length > 0) {
    // Basic Navigation
    if (prevBtn) {
      prevBtn.onclick = () => {
        state.currentIndex =
          (state.currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        state.currentIndex = (state.currentIndex + 1) % slides.length;
        updateSlider();
      };
    }

    dots.forEach((dot, index) => {
      dot.onclick = () => {
        state.currentIndex = index;
        updateSlider();
      };
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

    container.addEventListener("touchstart", handleDragStart);
    container.addEventListener("touchmove", handleDragMove);
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
      setInterval(() => {
        if (!state.isDragging) {
          state.currentIndex = (state.currentIndex + 1) % slides.length;
          updateSlider();
        }
      }, interval);
    }
  }
};

initSlider();
