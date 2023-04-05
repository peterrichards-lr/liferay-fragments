if (!fragmentNamespace) // If it is not set then we are in fragment editor
	return;

if (document.body.classList.contains('has-edit-mode-menu')) // If present then we are in content page editor
{
	fragmentElement.querySelector('#action-configuration').classList.remove('configuration');
	return;
}

const formatDate = (d) => {
	return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};

const createAuditEntry = (entryDate, account, action) => {
	const auditEntry = {
		action,
		account,
		entryDate,
		userEmail: Liferay.ThemeDisplay.getUserEmailAddress()
	};
	Liferay.Util.fetch('/o/c/auditentries',
	{
		method: 'POST',
		headers: {
      "Content-Type": "application/json"
	  },
		body: JSON.stringify(auditEntry)
	})
	.then((response) => {
		const { status } = response;
    const responseContentType = response.headers.get('content-type');
    if (status === 204) {
      return { status };
    } else if (response.ok && responseContentType === 'application/json') {
      return response.json();
    } else {
      return response.text();
    }
	})
	.then((response) => {
		console.log(response);
	})
	.catch((reason) => console.error(reason));
};

const getEntryDate = () => {
	return formatDate(new Date());
};

const getAccount = () => {
	if (Liferay.CommerceContext && Liferay.CommerceContext.getAccountName) {
		return Liferay.CommerceContext.getAccountName();
	}
	return 'N/A';
};

const getAction = (btn) => {
	const usePrefixSuffix = configuration.usePrefixSuffix;
	const actionPrefix = configuration.auditActionPrefix + (configuration.addSpace ? ' ' : '');
	const actionSuffix = (configuration.addSpace ? ' ' : '') + configuration.auditActionSuffix;

	var action = usePrefixSuffix ? actionPrefix : '';
	if (configuration.useButtonText && btn) {
	  action += btn.innerHTML.trim();
	} else {
		const actionMessage = fragmentElement.querySelector('div.action-configuration');
		if (actionMessage)
			action += actionMessage.innerHTML.trim();
	}
	action += usePrefixSuffix ? actionSuffix : '';
	return action.trim();
}

const clickHandler = (evt) => {
	const btn = evt.currentTarget;
	
	const entryDate = getEntryDate();
	const account = getAccount();
	const action = getAction(btn);

	createAuditEntry(entryDate, account, action);
};

const btn = fragmentElement.querySelector('a.btn');
if (btn) {
	btn.addEventListener("click", clickHandler);
}