const initRefreshPage = () => {
  if (layoutMode !== "view") return;

  const enableDebug = configuration.enableDebug;
  const enableRefreshTrigger = configuration.enableRefreshTrigger;
  const enableAutoRefresh = configuration.enableAutoRefresh;
  const refreshIntervalSec = configuration.refreshIntervalSec || 0;
  const refreshTriggerText = configuration.refreshTriggerText;

  const queryInnerTextAll = function (root, selector, regex) {
    if (typeof regex === "string") {
      regex = new RegExp(regex, "i");
    }
    const elements = [...root.querySelectorAll(selector)];
    const rtn = elements.filter((element) => {
      return element.innerText.match(regex);
    });

    return rtn.length === 0 ? null : rtn;
  };

  const queryInnerText = function (root, selector, text) {
    try {
      const result = queryInnerTextAll(root, selector, text);
      if (Array.isArray(result)) {
        return result[0];
      } else {
        return result;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const triggerHandler = () => {
    if (fragmentElement.children[0]) {
      fragmentElement.children[0].style.display = "block";
    }

    if (enableAutoRefresh) {
      if (enableDebug) console.debug("Refreshing page");
      setTimeout(function () {
        window.location.reload();
      }, refreshIntervalSec * 1000);
    }
  };

  const triggerSelector = () => {
    const commonParent =
      fragmentElement.parentElement.parentElement.parentElement;
    if (commonParent) {
      const triggerContainer = commonParent.querySelector(
        "div.portlet-forms-display",
      );
      if (triggerContainer) {
        const triggerElement = queryInnerText(
          triggerContainer,
          "h2",
          refreshTriggerText,
        );
        return triggerElement;
      }
    }
    return null;
  };

  const triggerChecker = (config, triggerSelectorCallback, triggerHandler) => {
    const waitInterval = configuration.waitIntervalMs || 500;
    const waitCount = (configuration.waitCount || 10) - 1;

    let c = 0;
    const intervalHandle = setInterval(() => {
      if (enableDebug)
        console.debug("retry : " + (c + 1) + " out of " + (waitCount + 1));
      let triggerElement = triggerSelectorCallback(config);
      if (triggerElement) {
        if (enableDebug) console.debug("Trigger found");
        clearInterval(intervalHandle);
        triggerHandler(config);
      }
      c++;
      if (c > waitCount) {
        clearInterval(intervalHandle);
        if (enableDebug)
          console.debug("Unable to find trigger within given bounds");
        return;
      }
    }, waitInterval);
  };

  if (!enableRefreshTrigger) {
    triggerHandler();
  } else {
    Liferay.on("allPortletsReady", () => {
      triggerChecker({}, triggerSelector, triggerHandler);
    });
  }
};

initRefreshPage();
