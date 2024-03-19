const isDebug = configuration.enableDebug;
if (fragmentNamespace) {
  if (!document.body.classList.contains('has-edit-mode-menu')) {
    const setCookie = (cname, cvalue, exdays) => {
      let expires = undefined;
      if (exdays) {
        const d = new Date();
        d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
        expires = 'expires=' + d.toUTCString();
      }
      if (expires)
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
      else document.cookie = cname + '=' + cvalue + ';path=/';
    };
    const uuidv4 = () => {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    };
		const setFormSessionId = (inputTagName, formSessionId) => {
			const sessionIdFields = document.getElementsByName(inputTagName);
			if (isDebug) console.debug('sessionIdFields', sessionIdFields);
			if (sessionIdFields && sessionIdFields.length == 1) {
				const sessionIdField = sessionIdFields[0];
				sessionIdField.value = formSessionId;
				if (isDebug) console.debug('set form session id');
			}
		};
		const formSessionId = uuidv4();
    if (isDebug) console.debug('formSessionId', formSessionId);
		const cookieName = configuration.cookieName;
		if (isDebug) console.debug('cookieName', cookieName);
		setCookie(cookieName, formSessionId);
		const inputTagName = configuration.inputTagName;
		if (isDebug) console.debug('inputTagName', inputTagName);
		setFormSessionId(inputTagName, formSessionId);
  } else {
    if (isDebug) console.debug('In edit mode');
  }
} else {
  if (isDebug) console.debug('fragmentNamespace is undefined');
}
