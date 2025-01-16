const objectPath = configuration.objectPath;
const objectField = configuration.objectField;
const isLocalized = configuration.isLocalized;
const matchType = configuration.matchType;
const startTag = configuration.startTag;
const endTag = configuration.endTag;
if (
  layoutMode !== 'preview' &&
  layoutMode !== 'edit' &&
  objectPath &&
  objectField
) {
  var currentFocus;

  const getObjectValues = async (
    objectPath,
    objectField,
    searchTerm,
    isLocalized
  ) => {
    return new Promise((resolve, reject) => {
      const url = `/o/c/${objectPath}/?fields=${
        isLocalized ? `${objectField}_i18n` : objectField
      }&pageSize=0&search=${searchTerm}`;
      const options = {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf8',
        },
        method: 'GET',
      };

      Liferay.Util.fetch(url, options)
        .then((response) => {
          const { status } = response;
          if (status == 204) {
            resolve();
          } else if (response.ok) {
            return response.json();
          } else {
            throw {
              name: 'HttpError',
              message: `Request returned ${response.status}`,
              status: response.status,
              response: response,
            };
          }
        })
        .then((data) => {
          var { items } = data;
          if (isLocalized) {
            const languageCode = Liferay.ThemeDisplay.getLanguageId();
            const defaultLanguageCode =
              Liferay.ThemeDisplay.getDefaultLanguageId();
            items = items.map((i) => {
              const prop = i[`${objectField}_i18n`];
              return Object.hasOwn(prop, languageCode)
                ? prop[languageCode]
                : prop[defaultLanguageCode];
            });
          } else {
            items = items.map((i) => i[objectField]);
          }
          resolve(items);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const closeAllLists = (inputNode, elmnt) => {
    var x = document.getElementsByClassName('autocomplete-items');
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inputNode) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  };

  const addActive = (x) => {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    x[currentFocus].classList.add('autocomplete-active');
  };

  const removeActive = (x) => {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove('autocomplete-active');
    }
  };

  const buildContainsMatchString = (
    haystack,
    needle,
    startTag = '<strong>',
    endTag = '</strong>'
  ) => {
    const index = haystack.toUpperCase().indexOf(needle.toUpperCase());
    if (index >= 0) {
      const midIndex = index + needle.length;
      return (
        haystack.substr(0, index) +
        startTag +
        haystack.substr(index, midIndex) +
        endTag +
        haystack.substr(midIndex)
      );
    }
    return;
  };

  const buildStartsWithMatchString = (
    haystack,
    needle,
    startTag = '<strong>',
    endTag = '</strong>'
  ) => {
    if (
      haystack.substr(0, needle.length).toUpperCase() == needle.toUpperCase()
    ) {
      return (
        startTag +
        haystack.substr(0, needle.length) +
        endTag +
        haystack.substr(needle.length)
      );
    }
    return;
  };

  const createItemsDiv = (arr, inputNode, parentNode) => {
    if (!arr || !parentNode) return false;
    var a,
      b,
      i,
      val = inputNode.value;
    closeAllLists(inputNode);
    if (!val) {
      return false;
    }
    currentFocus = -1;
    a = document.createElement('DIV');
    a.setAttribute('id', inputNode.id + 'autocomplete-list');
    a.setAttribute('class', 'autocomplete-items');
    parentNode.appendChild(a);
    for (i = 0; i < arr.length; i++) {
      const matchString =
        matchType === 'contains'
          ? buildContainsMatchString(arr[i], val, startTag, endTag)
          : buildStartsWithMatchString(arr[i], val, startTag, endTag);
      if (matchString) {
        b = document.createElement('DIV');
        b.innerHTML = matchString;
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        b.addEventListener('click', function (e) {
          inputNode.value = e.target.getElementsByTagName('input')[0].value;
          closeAllLists(inputNode);
        });
        a.appendChild(b);
      }
    }
  };

  try {
    const parentNode = fragmentElement.querySelector('.autocomplete');
    const inputNode = fragmentElement.querySelector('input');

    inputNode.addEventListener('input', async (e) => {
      const val = e.target.value;
      const values = await getObjectValues(
        objectPath,
        objectField,
        val,
        isLocalized
      );
      createItemsDiv(values, e.target, parentNode);
    });

    inputNode.addEventListener('keydown', (e) => {
      var x = document.getElementById(e.target.id + 'autocomplete-list');
      if (x) x = x.getElementsByTagName('div');
      if (e.keyCode == 40) {
        currentFocus++;
        addActive(x);
      } else if (e.keyCode == 38) {
        currentFocus--;
        addActive(x);
      } else if (e.keyCode == 13) {
        e.preventDefault();
        if (currentFocus > -1) {
          if (x) x[currentFocus].click();
        }
      }
    });

    document.addEventListener('click', function (e) {
      closeAllLists(inputNode, e.target);
    });
  } catch (error) {
    if (error.name === 'HttpError') {
      console.error('error', error);
      console.log('error.responseBody', await error.response.json());
    } else {
      console.error('error', error);
    }
    Liferay.Util.openToast({
      message: 'An error occured.',
      type: 'danger',
    });
  }
}
