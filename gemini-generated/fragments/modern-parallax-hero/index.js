const initParallax = () => {
    const hero = fragmentElement.querySelector('.parallax-hero');
    const bg = fragmentElement.querySelector('.parallax-bg');
    const speed = parseFloat(configuration.speed || '0.5');

    if (!hero || !bg || layoutMode !== 'view') return;

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
