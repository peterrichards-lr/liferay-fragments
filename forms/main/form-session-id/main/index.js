const initFormSessionId = () => {
  const { isValidIdentifier, resolveObjectPath } = Liferay.Fragment.Commons;

  const isDebug = configuration.enableDebug;

  if (layoutMode === 'view') {
    const getSelectKeyValueFields = (inputTagName) => {
      const keyFields = document.getElementsByName(inputTagName);
      if (keyFields && keyFields.length == 1) {
        const keyField = keyFields[0];
        const valueFields = document.getElementsByName(`${inputTagName}-label`);
        if (valueFields && valueFields.length == 1) {
          const valueField = valueFields[0];
          return { keyField, valueField };
        }
      }
    };

    let apiPath = '';

    const resolveApiPath = async () => {
      try {
        const { apiPath: resolvedPath } =
          await Liferay.Fragment.Commons.resolveObjectPathByERC('APPLICANT');

        if (resolvedPath) {
          apiPath = resolvedPath;
        } else {
          apiPath = '/o/c/applicants';
        }
      } catch (err) {
        console.error('[Form Session ID] Scope resolution failed:', err);
        apiPath = '/o/c/applicants';
      }
    };

    const selectApplicant = async (formFieldName, formSessionId) => {
      if (
        !isValidIdentifier(formSessionId) ||
        !isValidIdentifier(formFieldName)
      )
        return;

      if (!apiPath) await resolveApiPath();

      var url = apiPath;
      url += '?fields=id,emailAddress';
      url += '&flatten=true';
      url += '&page=1&pageSize=1';
      url += '&sort=dateCreated:desc';
      url += "&filter=sessionID eq '" + formSessionId + "'";
      const encodedUrl = encodeURI(url);
      if (isDebug) console.debug('url', encodedUrl);

      Liferay.Util.fetch(encodedUrl)
        .then((response) => response.json())
        .then((json) => {
          if (json) {
            const { items } = json;
            if (items && items.length == 1) {
              const applicantId = items[0]['id'];
              const emailAddress = items[0]['emailAddress'];
              const keyValue = getSelectKeyValueFields(formFieldName);
              if (isDebug) console.debug('applicantId', applicantId);
              if (isDebug) console.debug('emailAddress', emailAddress);
              if (isDebug) console.debug('keyValue', keyValue);
              if (keyValue && keyValue['keyField'] && keyValue['valueField']) {
                keyValue['keyField'].value = applicantId;
                keyValue['valueField'].value = emailAddress;
              }
            }
          }
        });
    };

    const getCookie = (cname) => {
      let name = cname + '=';
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return '';
    };

    const cookieName = configuration.cookieName;
    if (isDebug) console.debug('cookieName', cookieName);
    const formSessionId = getCookie(cookieName);
    if (isDebug) console.debug(cookieName + ' value', formSessionId);
    const applicantRelationshipId = configuration.applicantRelationshipId;
    selectApplicant(applicantRelationshipId, formSessionId);
  } else if (layoutMode === 'edit') {
    if (isDebug) console.debug('In edit mode');
  }
};

initFormSessionId();
