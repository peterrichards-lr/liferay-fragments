if (!fragmentNamespace) {
  return;
}

const isEditMode = document.body.classList.contains('has-edit-mode-menu');

if (isEditMode) {
  if (fragmentElement) {
    const info = document.createElement('div');
    info.classList.add('alert');
    info.classList.add('alert-info');
    info.innerText =
      'This fragment will intialise a Campaign Object based on Pulse cookies';
    fragmentElement.append(info);
  }
  return;
}

if (!pulseHelper) {
  if (fragmentElement) {
    const info = document.createElement('div');
    info.classList.add('alert');
    info.classList.add('alert-warn');
    info.innerText =
      'The JS client extension for Pulse has not been added to this page';
    fragmentElement.append(info);
  }
  return;
}

const cookieName = '__coId';
var campaignObjectId = getCookie(cookieName);
if (campaignObjectId) {
	const referrer = document.referrer ? new URL(document.referrer) : '';
	if (referrer && referrer.host.indexOf('pulse') === -1) {
		const response = pulseHelper.syncFetch(`/o/c/campaigns/${campaignObjectId}`);
  	if (response.status == 200) {
			console.debug('Liferay Campaign Object already exists : ' + campaignObjectId);
			return;
		} else {
			console.log('Campaign not found. Expiring cookie');
			document.cookie = cookieName + "=/;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";
		}
	} else {
		console.log('New Pulse redirect. Expiring cookie');
		document.cookie = cookieName + "=/;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";
	}		
}

const getUtmParameters = () => {
  var queryStringObj = pulseHelper.getQueryStringObj();
  if (!queryStringObj) {
		return { 
			utmCampaign: undefined
		};
	}
	for (const property in queryStringObj) {
    console.debug(`${property}: ${queryStringObj[property]}`);
    if (property.startsWith('utm')) {
      const newPropery = "uTM" + property.substring(4,5).toUpperCase() + property.substring(5);
			Object.defineProperty(queryStringObj, newPropery,
        Object.getOwnPropertyDescriptor(queryStringObj, property));
    }
		delete queryStringObj[property];
  }
  console.debug('queryStringObj', queryStringObj);
  return queryStringObj;
};

const createCampaignObject = () => {
  const campaignId = getCookie('__pcId');
	const interactionId = getCookie('__intId');
  const urlToken = getCookie('__pcUt');
  const {uTMCampaign, ...utmParameters} = getUtmParameters();
  const campaign = {
    pulseCampaignId: campaignId,
    name: uTMCampaign,
    uRLToken: urlToken,
		pulseInteractionId: interactionId,
    ...utmParameters,
  };
  return campaign;
};

if (pulseHelper) {
  pulseHelper.createObjectEntry('/o/c/campaigns/', createCampaignObject())
		.then((campaign) => {
  		pulseHelper.setCookie(cookieName, campaign.id);
			console.debug('Cookie has been set ' + cookieName + ' : ' + campaign.id);
		})
		.catch((reason) => console.error(reason));
}
