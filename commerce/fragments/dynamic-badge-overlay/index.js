const fontSizePixels = parseFloat(getComputedStyle(document.documentElement).fontSize);

function convertToPixels(value, type = 'width', contextElement = document.documentElement) {
  const unit = value.match(/[a-z%]+$/i)?.[0];
  const number = parseFloat(value);

  if (isNaN(number) || !unit) return null;

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
  badgeFont,
  badgeTypePriority,
  newProductFreshness,
  newProductDateField,
  limitedStockLevelThreshold,
  enableDebug: debugEnabled,
  initializeDelay,
  allPortletsReady
} = configuration;

const mappings = (() => {
  const mappingArray = Array.from(fragmentElement.querySelector('.config').children);
  const mappings = {};

  for (let mapping of mappingArray) {
    const key = mapping.getAttribute('data-lfr-js-id');
    const type = mapping.getAttribute('data-lfr-type');
    const value = mapping.textContent;

    switch (type) {
      case "bool":
        mappings[key] = value === 'true';
        break;
      case "int":
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

debugWithContext('mappings', mappings);

debugWithContext('configuration', {
  badgeFont,
  badgeTypePriority,
  newProductFreshness,
  newProductDateField,
  limitedStockLevelThreshold,
  debugEnabled,
  initializeDelay,
  allPortletsReady
});

const {
  commerceChannelId: channelId,
  account
} = Liferay.CommerceContext;
debugWithContext('commerceContext', {
  channelId,
  account
});

const getSkuUrl = `/o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products/${mappings['productId']}/skus` + (account ? `?accountId=${account.accountId}` : '');
debugWithContext('getSkuUrl', getSkuUrl);

const applyBadgeOverlay = () => {
  Liferay.Util.fetch(getSkuUrl).then((response) => response.json()).then((json) => {
    const { items, totalCount } = json;
    let product = undefined, badgeType = undefined;
    if (items?.length === 1) {
      product = items[0];
      badgeType = determineBadgeType(product);
    }

    if (product && badgeType !== 'none') {
      const productCard = fragmentElement.querySelector('div.product-card');
      if (productCard) {
        applyOverlay(productCard, product, badgeType);
      }
    }
  });

  const drawBadgeShape = (ctx, x, y, width, height, radius = 0, shape = 'rectangle') => {
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
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    ctx.closePath();
  };

  const addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const determineBadgeType = (product) => {
    const freshnessDate = newProductFreshness
      ? addDays(new Date(), -newProductFreshness)
      : null;

    const stockQty = parseFloat(product?.availability?.stockQuantity ?? 'Infinity');
    const promoPrice = product?.price?.promoPrice;
    const regularPrice = product?.price?.price;
    const newDate = product?.[newProductDateField];

    const hasLimitedStock = stockQty <= parseFloat(limitedStockLevelThreshold);
    const hasDiscount = promoPrice < regularPrice;
    const isNew = freshnessDate && newDate && (new Date(newDate) >= freshnessDate);

    debugWithContext('determineBadgeType', {
      freshnessDate,
      product: product.id,
      stockQty,
      promoPrice,
      regularPrice,
      newProductDateField,
      newDate: new Date(newDate),
      hasLimitedStock,
      hasDiscount,
      isNew,
    });

    if (hasLimitedStock && hasDiscount && isNew) {
      switch (badgeTypePriority) {
        case 'limited-stock': return 'limited-stock';
        case 'offer': return 'offer';
        default: return 'new-product';
      }
    }

    if (hasLimitedStock) return 'limited-stock';
    if (hasDiscount) return 'offer';
    if (isNew) return 'new-product';

    return 'none';
  };

  const getCssVariable = (varName, root = document.documentElement) => {
    return getComputedStyle(root)
      .getPropertyValue(varName)
      .trim() || null;
  };

  const evaluateConfig = (value, root = document.documentElement) => {
    if (typeof value !== 'string') return value;
    const cssVarRegex = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?[\s*\)]\)?/g;

    const resolve = (input) => {
      let result = input;
      let match;

      while ((match = cssVarRegex.exec(result))) {
        const [, varName, fallback] = match;
        const resolved = getCssVariable(varName, root);

        if (resolved) {
          result = result.replace(match[0], resolve(resolved));
        } else if (fallback) {
          result = result.replace(match[0], resolve(fallback.trim()));
        } else {
          result = result.replace(match[0], '');
        }
        cssVarRegex.lastIndex = 0;
      }

      result = result.trim();

      if (result.startsWith('--')) {
        return getCssVariable(result, root);
      }
      return result;
    };

    return resolve(value);
  };

  const generateBadgeImage = (badgeConfig) => {
    debugWithContext('badgeConfig', badgeConfig);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = badgeConfig;

    canvas.width = width * 2;
    canvas.height = height * 2;

    let shadowBlur = 0;
    if (badgeConfig.shadow) {
      shadowBlur = 10;
      Object.assign(ctx, {
        shadowColor: 'rgba(0,0,0,1)',
        shadowBlur: shadowBlur,
        shadowOffsetX: 2,
        shadowOffsetY: 2
      });
    }

    const drawCornerRibbon = () => {
      const w = canvas.width;
      const h = canvas.height;
      const { position, color, textColor, fontWeight, fontSize, font, text } = badgeConfig;

      const positions = {
        'top-left': [[0, 0], [w, 0], [0, h], width / 2, height / 2, Math.atan2(h, w)],
        'top-right': [[w, 0], [w, h], [0, 0], w - width / 2, height / 2, -Math.atan2(h, w)],
        'bottom-left': [[0, h], [w, h], [0, 0], width / 2, h - height / 2, -Math.atan2(h, w)],
        'bottom-right': [[w, h], [w, 0], [0, h], w - width / 2, h - height / 2, Math.atan2(h, w)]
      };

      const [p1, p2, p3, tx, ty, rotation] = positions[position] || positions['top-left'];

      ctx.beginPath();
      ctx.moveTo(...p1);
      ctx.lineTo(...p2);
      ctx.lineTo(...p3);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} ${fontSize}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(rotation);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    const drawDefaultBadge = () => {
      const {
        color, textColor, fontWeight, fontSize, font, borderRadius, shape,
        text, maxLines
      } = badgeConfig;

      ctx.fillStyle = color;
      drawBadgeShape(ctx, 0, 0, (canvas.width - shadowBlur), (canvas.height - shadowBlur), parseInt(borderRadius), shape);

      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} ${fontSize}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = text.split('\n').slice(0, maxLines);
      const lineHeight = fontSize * 1.25;
      const startY = (canvas.height - shadowBlur) / 2 - (lineHeight * (lines.length - 1)) / 2;

      lines.forEach((line, i) => {
        ctx.fillText(line, (canvas.width - shadowBlur) / 2, startY + i * lineHeight);
      });
    };

    badgeConfig.styleType === 'corner-ribbon' ? drawCornerRibbon() : drawDefaultBadge();

    return canvas.toDataURL();
  };

  const convertToCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  const substituteTokens = (text, product) => {
    return text.replace(/{([^}]+)}/g, (_, token) => {
      const camelCasePath = token.split('.').map(convertToCamelCase);
      let value = product;

      for (const key of camelCasePath) {
        if (value && key in value) {
          value = value[key];
        } else {
          return `{${token}}`; // Leave token unchanged if path is invalid
        }
      }

      return value;
    });
  };

  const formatOfferText = (product) => {
    const { offerTextTemplate, offerType } = configuration;
    const { price, promoPrice } = product.price || {};

    if (!price || !promoPrice) return '';

    const discountValue = 1 - parseFloat(promoPrice) / parseFloat(price);
    const discountPercent = Math.round(discountValue * 100);

    let discount;
    switch (offerType) {
      case 'discount-percentage':
        discount = `${discountPercent}%`;
        break;
      case 'discount-value':
        discount = discountPercent;
        break;
      case 'discount-currency':
        discount = `$${discountPercent}`;
        break;
      default:
        return '';
    }

    return substituteTokens(offerTextTemplate, { ...product, discount });
  };

  const toTitleCase = (str) => {
    return str.toLocaleLowerCase().replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }


  const formatNewProductText = (product) => {
    const {
      newProductTextTemplate,
    } = configuration;

    return substituteTokens(newProductTextTemplate, product);
  };

  const formatLimitedStockText = (product) => {
    const {
      limitedStockTextTemplate,
    } = configuration;

    return substituteTokens(limitedStockTextTemplate, product);
  };

  const getProductImageSize = () => {
    const productImage = fragmentElement.querySelector('.card-item-first');
    return {
      width: productImage.clientWidth,
      height: productImage.clientHeight
    }
  };

  const applyOverlay = (productDiv, product, badgeType) => {
    const determineShape = (shape) => shape !== 'corner-ribbon' ? shape : undefined;
    const determineStyleType = (config) => config.shape !== 'corner-ribbon' ? 'normal' : 'corner-ribbon';
    const determineBorderRadius = (config) => {
      switch (config.shape) {
        case 'pill': return `${Math.max(config.width, config.height) / 2}px`;
        case 'rectangle': return '10px';
        default: return '0';
      }
    };

    const badgeDefaults = {
      offer: {
        text: formatOfferText(product),
        shape: 'corner-ribbon',
        color: '#e63946',
        textColor: 'white',
        position: 'top-left',
        fontSize: 18,
        fontWeight: '700',
        offset: 0,
        width: 160,
        height: 160
      },
      'new-product': {
        text: formatNewProductText(product),
        shape: 'pill',
        color: '#2a9d8f',
        textColor: '#ffffff',
        position: 'top-right',
        fontSize: 10,
        fontWeight: '600',
        offset: 10,
        width: 100,
        height: 40,
        shadow: true
      },
      'limited-stock': {
        text: formatLimitedStockText(product),
        shape: 'rectangle',
        color: '#f4a261',
        textColor: '#000000',
        position: 'bottom-right',
        fontSize: 10,
        fontWeight: '900',
        offset: 10,
        width: 120,
        height: 40,
        shadow: true
      }
    };

    const configMap = {
      offer: {
        position: configuration.offerBadgePosition,
        fontSize: configuration.offerFontSize,
        fontWeight: configuration.offerFontWeight,
        offset: configuration.offerBadgeOffset,
        width: configuration.offerBadgeWidth,
        height: configuration.offerBadgeHeight,
        shape: configuration.offerBadgeShape,
        color: configuration.offerBadgeColor,
        textColor: configuration.offerBadgeTextColor,
        shadow: configuration.offerBadgeShadow
      },
      'new-product': {
        position: configuration.newProductBadgePosition,
        fontSize: configuration.newProductFontSize,
        fontWeight: configuration.newProductFontWeight,
        offset: configuration.newProductBadgeOffset,
        width: configuration.newProductBadgeWidth,
        height: configuration.newProductBadgeHeight,
        shape: configuration.newProductBadgeShape,
        color: configuration.newProductBadgeColor,
        textColor: configuration.newProductBadgeTextColor,
        shadow: configuration.newProductBadgeShadow
      },
      'limited-stock': {
        position: configuration.limitedStockBadgePosition,
        fontSize: configuration.limitedStockFontSize,
        fontWeight: configuration.limitedStockFontWeight,
        offset: configuration.limitedStockBadgeOffset,
        width: configuration.limitedStockBadgeWidth,
        height: configuration.limitedStockBadgeHeight,
        shape: configuration.limitedStockBadgeShape,
        color: configuration.limitedStockBadgeColor,
        textColor: configuration.limitedStockBadgeTextColor,
        shadow: configuration.limitedStockBadgeShadow
      }
    };

    const defaults = badgeDefaults[badgeType];
    const customConfig = configMap[badgeType];

    if (!defaults || !customConfig) return;

    const evaluatedConfig = Object.fromEntries(
      Object.entries(customConfig).map(([key, value]) => [key, evaluateConfig(value)])
    );

    let badgeConfig = {
      font: evaluateConfig(badgeFont),
      text: defaults.text,
      position: evaluatedConfig.position || defaults.position,
      fontSize: convertToPixels(evaluatedConfig.fontSize) || defaults.fontSize,
      fontWeight: evaluatedConfig.fontWeight || defaults.fontWeight,
      offset: convertToPixels(evaluatedConfig.offset) || defaults.offset,
      width: convertToPixels(evaluatedConfig.width) || defaults.width,
      height: convertToPixels(evaluatedConfig.height) || defaults.height,
      shape: determineShape(evaluatedConfig.shape) || defaults.shape,
      color: evaluatedConfig.color || defaults.color,
      textColor: evaluatedConfig.textColor || defaults.textColor,
      shadow: evaluatedConfig.shadow
    };

    if (!badgeConfig.text) return;

    badgeConfig.width /= 2;
    badgeConfig.height /= 2;
    badgeConfig.styleType = determineStyleType(badgeConfig);
    badgeConfig.borderRadius = determineBorderRadius(badgeConfig);

    const badge = document.createElement('div');
    badge.className = 'product-badge';
    badge.classList.add(badgeConfig.position);

    const badgeImg = document.createElement('img');

    const productImageSize = getProductImageSize();
    debugWithContext('productImageSize', productImageSize);

    if (badgeConfig.position.includes('bottom')) {
      badge.style.top = `${productImageSize.height - badgeConfig.offset - (badgeConfig.height * 2)}px`;
    } else if (badgeConfig.position.includes('top')) {
      badge.style.top = `${badgeConfig.offset}px`;
    }

    if (badgeConfig.position.includes('left')) {
      badge.style.left = `${badgeConfig.offset}px`;
    } else if (badgeConfig.position.includes('right')) {
      badge.style.right = `${badgeConfig.offset}px`;
    }

    debugWithContext('badge.position', {
      top: badge.style.top,
      right: badge.style.right,
      bottom: badge.style.bottom,
      left: badge.style.left
    });

    badgeImg.src = generateBadgeImage(badgeConfig);
    badgeImg.alt = toTitleCase(badgeType.replaceAll('-', ' '));

    badge.appendChild(badgeImg);
    productDiv.appendChild(badge);

    return productDiv;
  };
};

if (allPortletsReady) {
  Liferay.on('allPortletsReady', () => {
    setTimeout(() => applyBadgeOverlay(), initializeDelay);
  });
} else {
  setTimeout(() => applyBadgeOverlay(), initializeDelay);
}
