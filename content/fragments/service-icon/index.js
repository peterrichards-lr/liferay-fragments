const initServiceIcon = () => {
  const logger = Logger.create('Service Icon');

  const iconSpan = fragmentElement.querySelector('.svg-icon');
  const textEl = fragmentElement.querySelector("[data-lfr-editable-id='text']");
  const contentWrap = fragmentElement.querySelector('.service-icon___content');
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

  const updateText = (newText) => {
    if (textEl && newText) {
      const currentText = textEl.innerText.trim();
      // Only fallback if the current text is a default placeholder
      if (currentText === 'This is a test' || currentText === '') {
        textEl.innerText = newText;
      }
    }
  };

  // 1. Resolve effective values
  const mappedIconEl = fragmentElement.querySelector('.config-icon');
  const mappedTitleEl = fragmentElement.querySelector('.config-title');

  const effectiveIcon =
    (mappedIconEl && mappedIconEl.innerText.trim()) ||
    configuration.defaultIcon ||
    'bolt';

  const effectiveTitle =
    configuration.title || (mappedTitleEl && mappedTitleEl.innerText.trim());

  logger.debug('Resolved values', { effectiveIcon, effectiveTitle });

  // 2. Apply updates
  if (effectiveIcon) updateIcon(effectiveIcon);
  if (effectiveTitle) updateText(effectiveTitle);

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

initServiceIcon();
