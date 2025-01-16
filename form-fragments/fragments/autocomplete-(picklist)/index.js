const erc = configuration.picklistErc;
const matchType = configuration.matchType;
const startTag = configuration.startTag;
const endTag = configuration.endTag;
if (layoutMode !== 'preview' && layoutMode !== 'edit' && erc) {
  var currentFocus;

  const getPickList = async (erc, searchTerm) => {
    return new Promise((resolve, reject) => {
      const url = `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries?fields=name_i18n&pageSize=0&search=${searchTerm}`;
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
          const languageCode = Liferay.ThemeDisplay.getLanguageId().replace(
            '_',
            '-'
          );
          const defaultLanguageCode =
            Liferay.ThemeDisplay.getDefaultLanguageId().replace('_', '-');
          var { items } = data;
          items = items.map((i) => {
            return Object.hasOwn(i.name_i18n, languageCode)
              ? i.name_i18n[languageCode]
              : i.name_i18n[defaultLanguageCode];
          });
          resolve(items);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const closeAllLists = (inputNode, elmnt) => {
    const x = document.getElementsByClassName('autocomplete-items');
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
      const values = await getPickList(erc, val);
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
