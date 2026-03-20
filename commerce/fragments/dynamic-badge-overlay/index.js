const initBadgeOverlay = () => {
  if (layoutMode !== 'view') return;

  const fontSizePixels = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );

  function convertToPixels(
    value,
    type = 'width',
    contextElement = document.documentElement
  ) {
    if (!value) return null;
    const unit = String(value).match(/[a-z%]+$/i)?.[0];
    const number = parseFloat(value);

    if (isNaN(number)) return null;
    if (!unit) return number;

    switch (unit) {
      case 'px':
        return number;
      case 'rem':
        return number * fontSizePixels;
      case 'em':
        return number * parseFloat(getComputedStyle(contextElement).fontSize);
      case '%':
        const parent = contextElement.parentElement || document.documentElement;
        return (number / 100) * parseFloat(getComputedStyle(parent)[type]);
      case 'vw':
        return (number / 100) * window.innerWidth;
      case 'vh':
        return (number / 100) * window.innerHeight;
      default:
        return number;
    }
  }

  const {
    objectERC,
    objectIdField,
    objectSkuField,
    objectBadgeField,
    badgeTypePriority,
    newProductFreshness,
    newProductDateField,
    limitedStockLevelThreshold,
    badgePosition,
    badgeMargin,
    badgeShape,
    badgeBgColor,
    badgeTextColor,
    badgeFontSize,
    enableDebug: debugEnabled,
  } = configuration;

  const mappings = (() => {
    const configEl = fragmentElement.querySelector('.config');
    if (!configEl) return {};
    const mappingArray = Array.from(configEl.children);
    const mappings = {};

    for (let mapping of mappingArray) {
      const key = mapping.getAttribute('data-lfr-js-id');
      const type = mapping.getAttribute('data-lfr-js-type');
      const value = mapping.textContent;

      switch (type) {
        case 'bool':
          mappings[key] = value === 'true';
          break;
        case 'int':
          mappings[key] = parseInt(value, 10);
          break;
        default:
          mappings[key] = value;
      }
    }
    return mappings;
  })();

  const debug = (label, ...args) => {
    if (debugEnabled) console.debug(`[Product Badge] ${label}`, ...args);
  };

  const debugWithContext = (label, ...args) => {
    const context = `${mappings.productId} - ${mappings.sku}`;
    debug(`${label} [${context}]:`, ...args);
  };

  const commerceContext = Liferay.CommerceContext || {};
  const channelId = commerceContext.commerceChannelId;
  const account = commerceContext.account;

  const getSkuUrl =
    `/o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products/${mappings['productId']}/skus` +
    (account ? `?accountId=${account.accountId}` : '');

  const drawBadgeShape = (
    ctx,
    x,
    y,
    width,
    height,
    radius = 0,
    shape = 'rectangle'
  ) => {
    ctx.beginPath();
    if (shape === 'circle') {
      const r = Math.min(width, height) / 2;
      ctx.arc(x + width / 2, y + height / 2, r, 0, Math.PI * 2);
    } else {
      radius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    ctx.closePath();
  };

  const generateBadgeImage = (text, config) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 200; // Fixed relative canvas size for drawing
    const height = 80;

    canvas.width = width * 2;
    canvas.height = height * 2;

    const resolvedBgColor = evaluateCssVar(badgeBgColor);
    const resolvedTextColor = evaluateCssVar(badgeTextColor);
    const resolvedFontSize = convertToPixels(badgeFontSize) || 12;

    ctx.fillStyle = resolvedBgColor;
    let borderRadius = 0;
    if (badgeShape === 'pill') borderRadius = height;
    else if (badgeShape === 'rectangle') borderRadius = 8;

    drawBadgeShape(
      ctx,
      0,
      0,
      canvas.width,
      canvas.height,
      borderRadius * 2,
      badgeShape
    );
    ctx.fill();

    ctx.fillStyle = resolvedTextColor;
    ctx.font = `bold ${resolvedFontSize * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  };

  const evaluateCssVar = (value) => {
    if (typeof value !== 'string') return value;
    if (value.startsWith('var(')) {
      const match = value.match(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/);
      if (match) {
        const [, varName, fallback] = match;
        return (
          getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim() || fallback
        );
      }
    }
    return value;
  };

  const determineSmartBadge = (product) => {
    const stockQty = parseFloat(
      product?.availability?.stockQuantity ?? 'Infinity'
    );
    const promoPrice = product?.price?.promoPrice;
    const regularPrice = product?.price?.price;
    const newDateStr = product?.[newProductDateField || 'displayDate'];

    const hasLimitedStock =
      stockQty <= parseFloat(limitedStockLevelThreshold || '10');
    const hasDiscount = promoPrice < regularPrice;

    let isNew = false;
    if (newDateStr) {
      const freshnessDate = new Date();
      freshnessDate.setDate(
        freshnessDate.getDate() - parseInt(newProductFreshness || '14')
      );
      isNew = new Date(newDateStr) >= freshnessDate;
    }

    if (
      hasLimitedStock &&
      (badgeTypePriority === 'limited-stock' || (!hasDiscount && !isNew))
    ) {
      return configuration.limitedStockTextTemplate || 'Limited Stock!';
    }
    if (hasDiscount && (badgeTypePriority === 'offer' || !isNew)) {
      return (configuration.offerTextTemplate || '{discount} off!').replace(
        '{discount}',
        Math.round((1 - promoPrice / regularPrice) * 100) + '%'
      );
    }
    if (isNew) {
      return configuration.newProductTextTemplate || 'New!';
    }
    return null;
  };

  const applyBadge = (text) => {
    if (!text) return;
    const productCard = fragmentElement.querySelector('div.product-card');
    if (!productCard) return;

    const badge = document.createElement('div');
    badge.className = `product-badge ${badgePosition}`;

    const margin = badgeMargin || '10px';
    badge.style.position = 'absolute';
    badge.style.zIndex = '10';

    if (badgePosition.includes('top')) badge.style.top = margin;
    if (badgePosition.includes('bottom')) badge.style.bottom = margin;
    if (badgePosition.includes('left')) badge.style.left = margin;
    if (badgePosition.includes('right')) badge.style.right = margin;

    const badgeImg = document.createElement('img');
    badgeImg.src = generateBadgeImage(text);
    badgeImg.style.maxWidth = '120px';
    badgeImg.style.height = 'auto';

    badge.appendChild(badgeImg);
    productCard.style.position = 'relative';
    productCard.appendChild(badge);
  };

  const fetchAndApply = async () => {
    try {
      // 1. Try Object Mapping if configured
      if (objectERC && objectBadgeField) {
        const recordId = mappings[objectIdField || 'productId'];
        const sku = mappings[objectSkuField || 'sku'];

        if (recordId) {
          const { definition, apiPath } =
            await Liferay.Fragment.Commons.resolveObjectPathByERC(objectERC);

          if (apiPath) {
            const url = `${apiPath}/${recordId}`;
            const res = await Liferay.Util.fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data[objectBadgeField]) {
                applyBadge(data[objectBadgeField]);
                return;
              }
            }
          }
        }
      }

      // 2. Fallback to Smart Commerce logic
      if (mappings.productId) {
        const res = await Liferay.Util.fetch(getSkuUrl);
        const json = await res.json();
        const product = json.items?.[0];
        if (product) {
          const badgeText = determineSmartBadge(product);
          applyBadge(badgeText);
        }
      }
    } catch (err) {
      debug('Error initializing badge', err);
    }
  };

  fetchAndApply();
};

initBadgeOverlay();
