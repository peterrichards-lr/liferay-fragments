const parsePlans = () => {
    const data = configuration.plansData || '';
    return data.split(';').filter(p => p).map(planStr => {
        const parts = planStr.split(',');
        return {
            name: parts[0],
            yearPrice: parts[1],
            monthPrice: parts[2],
            features: parts.slice(3)
        };
    });
};

const renderGrid = (isYearly) => {
    const grid = fragmentElement.querySelector(`#grid-${fragmentEntryLinkNamespace}`);
    if (!grid) return;

    const plans = parsePlans();
    
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

const initToggle = () => {
    const toggle = fragmentElement.querySelector(`#toggle-${fragmentEntryLinkNamespace}`);
    if (!toggle) return;

    toggle.addEventListener('change', (e) => {
        renderGrid(e.target.checked);
    });
};

renderGrid(false);
initToggle();
