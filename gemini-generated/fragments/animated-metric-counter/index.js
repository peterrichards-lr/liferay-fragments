const initCounter = () => {
  const valueEl = fragmentElement.querySelector(
    `#value-${fragmentEntryLinkNamespace}`,
  );
  if (valueEl) {
    const startValue = parseFloat(configuration.startValue || "0");
    const endValue = parseFloat(configuration.endValue || "100");
    const duration = parseInt(configuration.duration || "2000");
    const decimals = parseInt(configuration.decimalPrecision || "0");

    const animate = () => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (endValue - startValue) + startValue;

        valueEl.textContent = current.toFixed(decimals);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    if (layoutMode === "view") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animate();
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(valueEl);
    } else {
      valueEl.textContent = endValue.toFixed(decimals);
    }
  }
};

initCounter();
