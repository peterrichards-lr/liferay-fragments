const initServiceCard = () => {
  const logger = Logger.create('Service Card');

  const iconWrap = fragmentElement.querySelector('.circle');
  const iconSpan = fragmentElement.querySelector('.svg-icon');
  const titleEl = fragmentElement.querySelector(
    "[data-lfr-editable-id='service-title']"
  );
  const contentWrap = fragmentElement.querySelector('.service-card___content');
  const loadingEl = fragmentElement.querySelector('.loading-animation-squares');

  const SPRITEMAP =
    (Liferay.ThemeDisplay && Liferay.ThemeDisplay.getPathThemeImages()) +
      '/clay/icons.svg' ||
    (window.Liferay && Liferay.Icons && Liferay.Icons.spritemap) ||
    '/o/liferay-meridian-theme-spritemap/spritemap.8307d7990251156eda9756f23c14476cdae64be3.svg';

  const updateIcon = (symbol) => {
    if (iconSpan && symbol) {
      iconSpan.innerHTML = `
        <svg class="lexicon-icon lexicon-icon-sites" role="presentation" viewBox="0 0 512 512">
          <use xlink:href="${SPRITEMAP}#${symbol}"></use>
        </svg>
      `;
    }
  };

  const updateTitle = (newTitle) => {
    if (titleEl && newTitle) {
      const currentTitle = titleEl.innerText.trim();
      const defaultFragmentName =
        fragmentElement.dataset.fragmentName || 'Title';

      // Rule #8: Manually configured titles take precedence
      // Only fallback if the current title is a default placeholder
      if (
        currentTitle === 'Title' ||
        currentTitle === '' ||
        currentTitle === defaultFragmentName
      ) {
        titleEl.innerText = newTitle;
      }
    }
  };

  // 1. Resolve effective values
  // Mappable fields are prioritized if they contain real data
  const mappedIconEl = fragmentElement.querySelector('.config-icon');
  const mappedTitleEl = fragmentElement.querySelector('.config-title');

  const effectiveIcon =
    (mappedIconEl && mappedIconEl.innerText.trim()) ||
    configuration.icon ||
    'coin';

  // Smart Title Priority: Configuration title takes absolute precedence
  const effectiveTitle =
    configuration.title || (mappedTitleEl && mappedTitleEl.innerText.trim());

  logger.debug('Resolved values', { effectiveIcon, effectiveTitle });

  // 2. Apply updates
  if (effectiveIcon) updateIcon(effectiveIcon);
  if (effectiveTitle) updateTitle(effectiveTitle);

  // 3. Show content
  if (loadingEl) loadingEl.classList.add('d-none');
  if (contentWrap) {
    contentWrap.classList.remove('d-none');
    contentWrap.classList.add('d-flex');
  }

  // 4. Handle Link
  if (layoutMode !== 'preview') {
    if (configuration.linkUrl) {
      fragmentElement.style.cursor = 'pointer';
      fragmentElement.addEventListener('click', () => {
        window.location.href = configuration.linkUrl;
      });
    }
  }
};

initServiceCard();
