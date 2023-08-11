if (!fragmentNamespace) {
  return;
}

const isEditMode = document.body.classList.contains('has-edit-mode-menu');

if (isEditMode) {
  if (fragmentElement) {
    const info = document.createElement('div');
    info.classList.add('alert');
    info.classList.add('alert-info');
    info.classList.add('mb-3');
    info.innerText =
      'This fragment listen for events and record them as custom events and Campaign Interaction object entires';
    fragmentElement.insertBefore(info, fragmentElement.firstChild);
  }
  return;
}

if (!configuration.selectors) {
  console.warn(`The selectors string has not been configured.`);
  return;
}

const campaignObjectIdCookieName = '__coId';

const buildInteractionObject = (event, campaignObjectId, eventProperties) => {
  const interaction = {
    r_interaction_c_campaignId: campaignObjectId,
    event,
    eventProperties,
  };
  return interaction;
};

const buildAnalyticsEventData = (
  campaignId,
  urlToken,
  interactionId,
  campaignObjectId,
  event
) => {
  const userIdStr = themeDisplay.getUserId();
  const userId = isNaN(userIdStr) ? userIdStr : parseInt(userIdStr);
  return {
    userId: userId,
    actionAt: pulseHelper.getJsonDate(),
    pulseCampaignId: campaignId,
    pulseUrlToken: urlToken,
    pulseInteractionId: interactionId,
    liferayObjectsCampaignId: campaignObjectId,
    eventType: event.type,
    eventTarget: event.target.tagName,
  };
};

const eventListener = (event) => {
  const eventTarget = event.target;
  let action = eventTarget.getAttribute('custom-event-action');
  if (!action && configuration.defaultAction) {
    action = configuration.defaultAction;
  }

  if (!action) {
    action = `${event.type} event on ${eventTarget.tagName} element`;
  }
	
	const campaignObjectId = getCookie(campaignObjectIdCookieName);
	if (!campaignObjectId) {
		console.warn(
			`Liferay Campaign Object not found. Cookie name : ${campaignObjectIdCookieName}`
		);
		return;
	}

  if (pulseHelper) {
    try {
      const eventProperties = {
        eventType: event.type,
        eventTarget: event.target.tagName,
      };

      pulseHelper.createObjectEntry(
        '/o/c/campaigninteractions/',
        buildInteractionObject(action, campaignObjectId, eventProperties)
      )
        .then((interaction) => {
          console.debug('Created campaign interaction', interaction);
        })
        .catch((reason) => console.error(reason));
    } catch (e) {
      console.error('Failed to create campaign interaction entry', e);
    }
  }
  if (window.Analytics) {
    try {
      const campaignId = getCookie('__pcId');
      const urlToken = getCookie('__pcUt');
      const interactionId = getCookie('__intId');
      const eventData = buildAnalyticsEventData(
        campaignId,
        urlToken,
        interactionId,
        campaignObjectId,
        event
      );
      Analytics.track(action, {...eventData});
      console.debug('Sent custom event to Analytics Coud', { action, eventData});
    } catch (e) {
      console.error('Failed to send custom event to Analytics Cloud', e);
    }
  }
};

const addEventListener = () => {
  let matches;
  try {
    const parent = configuration.dropzoneScoped ? fragmentElement : document;
    matches = parent.querySelectorAll(configuration.selectors);
  } catch {
    console.warn(
      `The selectors string is not valid : ${configuration.selectors}`
    );
    return;
  }
  if (!matches) {
    console.warn(
      `No matches found for the selectors string : ${configuration.selectors}`
    );
    return;
  }
  console.debug(
    `Found ${matches.length} matches for the selectors string : ${configuration.selectors}`
  );
  matches.forEach((match) => {
    match.addEventListener(configuration.eventType, eventListener);
  });
};

Liferay.on('allPortletsReady',() => {
  addEventListener();
});
