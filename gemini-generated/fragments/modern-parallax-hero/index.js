const initParallax = () => {
    const hero = fragmentElement.querySelector('.parallax-hero');
    const bg = fragmentElement.querySelector('.parallax-bg');
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);
    const speed = parseFloat(configuration.speed || '0.5');

    if (infoEl) infoEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    if (layoutMode !== 'view') {
        if (!configuration.speed && infoEl) {
            infoEl.textContent = 'Parallax speed is not configured. Using default (0.5).';
            infoEl.classList.remove('d-none');
        }
        return;
    }

    if (!hero || !bg) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const offset = hero.offsetTop;
        const height = hero.offsetHeight;

        // Only animate if in viewport
        if (scrollY + window.innerHeight > offset && scrollY < offset + height) {
            const yPos = -((scrollY - offset) * speed);
            bg.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
    });
};

initParallax();
