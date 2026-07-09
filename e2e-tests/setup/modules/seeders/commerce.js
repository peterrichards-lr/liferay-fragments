async function seed(ctx, apiContext) {
  let e2eChannelId = null;
  const targetSiteName = 'Fragments E2E Test Site';
  const siteId = ctx.siteId;

  try {
    console.log('Verifying Liferay Commerce channels for the E2E site...');
    const channelsResp = await apiContext.get(
      '/o/headless-commerce-admin-channel/v1.0/channels'
    );
    if (channelsResp.ok()) {
      const channelsJson = await channelsResp.json();
      const existingChannel =
        channelsJson.items &&
        channelsJson.items.find((c) => c.siteGroupId === siteId);
      if (existingChannel) {
        e2eChannelId = existingChannel.id;
        console.log(
          `  -> Commerce Channel already exists for E2E site. ID: ${existingChannel.id}`
        );
      } else {
        console.log('  -> No Channel found for E2E site. Creating one...');
        const createChannelResp = await apiContext.post(
          '/o/headless-commerce-admin-channel/v1.0/channels',
          {
            data: {
              currencyCode: 'USD',
              name: `Commerce Channel for ${targetSiteName}`,
              type: 'site',
              siteGroupId: siteId,
            },
          }
        );
        if (createChannelResp.ok()) {
          const newChannel = await createChannelResp.json();
          e2eChannelId = newChannel.id;
          console.log(
            `  -> Successfully created Commerce Channel. ID: ${newChannel.id}`
          );
        } else {
          console.warn(
            '  -> [WARN] Failed to create Commerce Channel:',
            await createChannelResp.text()
          );
        }
      }
    }
  } catch (channelErr) {
    console.warn(
      '  -> [WARN] Error setting up Commerce Channel:',
      channelErr.message
    );
  }

  const commerceAssetMap = {};
  try {
    console.log('Seeding Liferay Commerce products...');
    let catalogId = 33837; // Default fallback catalog ID
    const catalogResp = await apiContext.get(
      '/o/headless-commerce-admin-catalog/v1.0/catalogs'
    );
    if (catalogResp.ok()) {
      const catalogsJson = await catalogResp.json();
      if (catalogsJson.items && catalogsJson.items.length > 0) {
        catalogId = catalogsJson.items[0].id;
      }
    }
    console.log(`  -> Using Catalog ID: ${catalogId}`);

    // prettier-ignore
    const productsToSeed = [
      { key: 'COMMERCE_PRODUCT_1', name: 'Timing Belt', sku: 'MIN93023' }, // pragma: allowlist secret
      { key: 'COMMERCE_PRODUCT_2', name: 'Master Cylinder', sku: 'MIN93024' }, // pragma: allowlist secret
      { key: 'COMMERCE_PRODUCT_3', name: 'Alternator Assembly', sku: 'MIN93025' }, // pragma: allowlist secret
      { key: 'COMMERCE_PRODUCT_4', name: 'Power Steering Pump', sku: 'MIN93026' }, // pragma: allowlist secret
    ];

    const prodListResp = await apiContext.get(
      '/o/headless-commerce-admin-catalog/v1.0/products'
    );
    const existingProducts = prodListResp.ok()
      ? (await prodListResp.json()).items || []
      : [];

    for (const prodData of productsToSeed) {
      let productId;
      const matched = existingProducts.find(
        (p) => p.name && p.name.en_US === prodData.name
      );

      if (matched) {
        productId = matched.productId;
        console.log(
          `  -> Product "${prodData.name}" already exists. ID: ${productId}`
        );
      } else {
        const createResp = await apiContext.post(
          '/o/headless-commerce-admin-catalog/v1.0/products',
          {
            data: {
              catalogId,
              name: { en_US: prodData.name },
              productType: 'simple',
              active: true,
            },
          }
        );

        if (createResp.ok()) {
          const created = await createResp.json();
          productId = created.productId;
          console.log(
            `  -> Successfully created product "${prodData.name}". ID: ${productId}`
          );
        } else {
          console.warn(
            `  -> [WARN] Failed to create product "${prodData.name}":`,
            await createResp.text()
          );
          continue;
        }
      }

      // Link product to the E2E channel if present
      if (productId && e2eChannelId) {
        const linkResp = await apiContext.patch(
          `/o/headless-commerce-admin-catalog/v1.0/products/${productId}`,
          {
            data: {
              productChannels: [
                {
                  channelId: e2eChannelId,
                },
              ],
            },
          }
        );
        if (linkResp.ok()) {
          console.log(
            `  -> Successfully linked product ${productId} to channel ${e2eChannelId}`
          );
        } else {
          console.warn(
            `  -> [WARN] Failed to link product ${productId} to channel ${e2eChannelId}:`,
            await linkResp.text()
          );
        }
      }

      // Add product ID to assetMap so test-data.json can resolve it
      commerceAssetMap[prodData.key] = productId;

      // Create SKU and Base Price for the product
      if (productId) {
        const skuResp = await apiContext.post(
          `/o/headless-commerce-admin-catalog/v1.0/products/${productId}/skus`,
          {
            data: {
              sku: prodData.sku,
              published: true,
              purchasable: true,
            },
          }
        );
        if (skuResp.ok()) {
          const skuData = await skuResp.json();
          console.log(
            `  -> Successfully created SKU ${prodData.sku} (ID: ${skuData.id})`
          );

          // Set a mock price and promo price so it registers as an offer
          const priceResp = await apiContext.patch(
            `/o/headless-commerce-admin-catalog/v1.0/skus/${skuData.id}`,
            {
              data: {
                price: 150.0,
                promoPrice: 99.0,
              },
            }
          );
          if (priceResp.ok()) {
            console.log(
              `  -> Successfully set pricing for SKU ${prodData.sku}`
            );
          }
        } else {
          console.warn(
            `  -> [WARN] Failed to create SKU ${prodData.sku}:`,
            await skuResp.text()
          );
        }
      }
    }
  } catch (commErr) {
    console.warn(
      '  -> [WARN] Error seeding commerce products:',
      commErr.message
    );
  }

  ctx.commerceAssetMap = commerceAssetMap;
}

module.exports = { seed };
