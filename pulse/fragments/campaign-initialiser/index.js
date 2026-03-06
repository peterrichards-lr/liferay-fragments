const initCampaignInitialiser = () => {
  if (layoutMode === "view") {
    const campaignId = configuration.campaignId;
    if (campaignId && window.Analytics) {
      Analytics.track("Campaign Initialised", {
        campaignId: campaignId,
        referrer: document.referrer,
      });
    }
  }
};

initCampaignInitialiser();
