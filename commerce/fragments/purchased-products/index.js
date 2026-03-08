const initPurchasedProducts = () => {
  const isValidIdentifier = (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    return (
      s !== "" &&
      s !== "undefined" &&
      s !== "null" &&
      s !== "0" &&
      s !== "[object object]"
    );
  };

  if (layoutMode === "view") {
    var config = undefined;
    if (configuration.useCommerceContext) {
      if (Liferay.CommerceContext) {
        config = {
          accountId: Liferay.CommerceContext.getAccountId(),
          channelId: Liferay.CommerceContext.getChannelId(),
        };
      } else {
        console.error(
          "The JavaScript Liferay.CommerceContext object not found.",
        );
      }
    } else {
      if (configuration.accountId && configuration.channelId) {
        config = {
          accountId: configuration.accountId,
          channelId: configuration.channelId,
        };
      } else {
        console.error(
          "The JavaScript config cannot be defined. Both the accountId and channelId need to be populated",
        );
      }
    }

    if (
      config &&
      isValidIdentifier(config.accountId) &&
      isValidIdentifier(config.channelId)
    ) {
      console.debug(
        `Processing placed orders for account ${config.accountId} on channel ${config.channelId}`,
      );
      Liferay.Util.fetch(
        `/o/headless-commerce-delivery-order/v1.0/channels/${config.channelId}/accounts/${config.accountId}/placed-orders`,
      )
        .then((response) => {
          const { status } = response;
          const responseContentType = response.headers.get("content-type");
          if (status === 204) {
            return { status };
          } else if (
            response.ok &&
            responseContentType === "application/json"
          ) {
            return response.json();
          } else {
            return response.text();
          }
        })
        .then((data) => {
          const { items, totalCount } = data;
          console.debug(`Found ${totalCount} order(s)`);
          const results = fragmentElement.querySelector(".results-placeholder");
          if (!results) {
            console.error("No results placeholder found");
          } else {
            if (items && items.length > 0) {
              const productCardTemplate = fragmentElement.querySelector(
                ".product-card-template",
              ).firstElementChild;
              if (!productCardTemplate) {
                console.error("No product card template was found");
              } else if (Array.isArray(items)) {
                Promise.all(
                  items.map((order) => {
                    if (isValidIdentifier(order.id)) {
                      console.debug(
                        `Retrieving order items for order ${order.id}`,
                      );
                      return Liferay.Util.fetch(
                        `/o/headless-commerce-delivery-order/v1.0/placed-orders/${order.id}/placed-order-items`,
                      );
                    }
                  }),
                ).then((responses) =>
                  Promise.all(
                    responses.filter(Boolean).map((response) => {
                      const { status } = response;
                      const responseContentType =
                        response.headers.get("content-type");
                      if (status === 204) {
                        return { status };
                      } else if (
                        response.ok &&
                        responseContentType === "application/json"
                      ) {
                        return response.json();
                      } else {
                        return response.text();
                      }
                    }),
                  ).then((responses) => {
                    const uniqueProductsFilter = (value, index, self) =>
                      index ===
                      self.findIndex((o) => o.productId === value.productId);
                    const orderItems = responses
                      .map((response) => response.items)
                      .flat(1);
                    console.log(
                      `The total order items is ${orderItems.length}`,
                    );
                    const ordersItemsWithUniqueProduct =
                      orderItems.filter(uniqueProductsFilter);
                    console.log(
                      `The number of unique products is ${ordersItemsWithUniqueProduct.length}`,
                    );
                    ordersItemsWithUniqueProduct.forEach((orderItem) => {
                      const { productId, productURLs, name, thumbnail } =
                        orderItem;
                      const currentProduct =
                        productCardTemplate.cloneNode(true);
                      const productPicture =
                        currentProduct.getElementsByClassName(
                          "product-card-picture",
                        )[0];
                      productPicture.id = `${productId}-pic`;
                      productPicture.style.backgroundImage = `url(${thumbnail})`;
                      const productName =
                        currentProduct.getElementsByTagName("h3")[0];
                      productName.innerText = name;
                      if (productURLs) {
                        const languageId = Liferay.ThemeDisplay.getLanguageId();
                        if (languageId) {
                          var clickHandler;
                          if (configuration.enableCookie) {
                            const expiry = configuration.expiryInSeconds
                              ? configuration.expiryInSeconds
                              : 10;
                            clickHandler = () => {
                              var expires = new Date();
                              expires.setSeconds(expires.getSeconds + expiry);
                              document.cookie = `purchased=true;expires=${expires.toUTCString()};path=/;`;
                              document.cookie = `productId=${productId};expires=${expires.toUTCString()};path=/;`;
                            };
                          } else {
                            clickHandler = undefined;
                          }
                          const productUrl = productURLs[languageId]
                            ? productURLs[languageId]
                            : productURLs.length > 0
                              ? productURLs[0]
                              : undefined;
                          if (productUrl) {
                            const anchors =
                              currentProduct.getElementsByTagName("a");
                            if (anchors) {
                              for (let i = 0; i < anchors.length; i++) {
                                let anchor = anchors[i];
                                anchor.href = `/p/${productUrl}`;
                                if (
                                  configuration.enableCookie &&
                                  clickHandler
                                ) {
                                  anchor.addEventListener(
                                    "click",
                                    clickHandler,
                                  );
                                }
                              }
                            } else {
                              console.error(
                                `Unable to find the anchor tags for ${productId}`,
                              );
                            }
                          } else {
                            console.error(
                              `Unable to find the product URL for ${productId} and language ${languageId}`,
                            );
                          }
                        }
                      }
                      console.debug(
                        `Appending product card for ${name} [${productId}]`,
                      );
                      results.append(currentProduct);
                    });
                  }),
                );
              }
            } else {
              const noResults = document.createElement("div");
              noResults.classList.add("alert");
              noResults.classList.add("alert-info");
              noResults.innerText = configuration.notfoundMessage
                ? configuration.notfoundMessage
                : "You currently have no purchased products";
              results.append(noResults);
            }
          }
        });
    }
  }
};

initPurchasedProducts();
