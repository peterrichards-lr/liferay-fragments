const parsePlans = () => {
    const data = configuration.plansData || '';
    return data.split(';').filter(p => p).map(planStr => {
        const parts = planStr.split(',');
        return {
            name: parts[0] || 'Plan',
            yearPrice: parts[1] || '0',
            monthPrice: parts[2] || '0',
            features: parts.slice(3)
        };
    });
};

const renderGrid = (isYearly) => {
    const grid = fragmentElement.querySelector(`#grid-${fragmentEntryLinkNamespace}`);
    const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
    
    if (infoEl) infoEl.classList.add('d-none');
    if (!grid) return;

    const plans = parsePlans();
    
    if (plans.length === 0) {
        if (layoutMode !== 'view' && infoEl) {
            infoEl.textContent = 'Please provide plans data in the configuration.';
            infoEl.classList.remove('d-none');
        }
        grid.innerHTML = '<div class="text-center p-5 w-100 text-muted">No pricing plans configured.</div>';
        return;
    }
    
    grid.innerHTML = plans.map((plan, index) => `
        <div class="pricing-card ${index === 1 ? 'featured' : ''}">
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">
                $${isYearly ? plan.yearPrice : plan.monthPrice}
                <span>/${isYearly ? 'yr' : 'mo'}</span>
            </div>
            <ul class="plan-features">
                ${plan.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <a href="#" class="plan-btn">Choose ${plan.name}</a>
        </div>
    `).join('');
};

const initPricing = () => {
    const toggle = fragmentElement.querySelector(`#toggle-${fragmentEntryLinkNamespace}`);
    
    renderGrid(false);

    if (toggle) {
        toggle.addEventListener('change', (e) => {
            renderGrid(e.target.checked);
        });
    }
};

initPricing();
