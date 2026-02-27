const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

const initCounter = () => {
    const valueEl = fragmentElement.querySelector(`#value-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    
    if (infoEl) infoEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    const endValue = parseInt(configuration.endValue || '0');
    const duration = parseInt(configuration.duration || '2000');

    if (!valueEl) return;

    if (layoutMode !== 'view') {
        if (!configuration.endValue && infoEl) {
            infoEl.textContent = 'Please provide an End Value in the configuration.';
            infoEl.classList.remove('d-none');
        }
        valueEl.innerHTML = endValue;
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(valueEl, 0, endValue, duration);
                observer.unobserve(valueEl);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(valueEl);
};

initCounter();
