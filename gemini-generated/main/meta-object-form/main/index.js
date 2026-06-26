const initMetaObjectFormFragment = () => {
  const {
    debounce,
    getLocalizedValue,
    isValidIdentifier,
    resolveObjectPathByERC,
    Logger,
  } = Liferay.Fragment.Commons;

  const logger = Logger.create('Meta-Object Form');

  const createSearchableSelect = (container, options = {}) => {
    const {
      placeholder = 'Search...',
      defaultValue = '',
      onSelect = () => {},
      fetchFn = null,
      initialOptions = [],
    } = options;

    container.innerHTML = `
          <div class="searchable-select-container">
              <input type="text" class="form-control form-control-sm" placeholder="${placeholder}" value="${defaultValue}">
              <input type="hidden" value="${defaultValue}">
              <div class="searchable-select-results"></div>
          </div>
      `;

    const input = container.querySelector("input[type='text']");
    const hidden = container.querySelector("input[type='hidden']");
    const results = container.querySelector('.searchable-select-results');
    let currentOptions = initialOptions;

    const renderResults = (items) => {
      if (!items || items.length === 0) {
        results.innerHTML =
          '<div class="search-result-item no-results">No results found</div>';
      } else {
        results.innerHTML = items
          .map(
            (item) => `
                  <div class="search-result-item" data-value="${item.value}">${item.label}</div>
              `
          )
          .join('');
      }
      results.classList.add('show');
    };

    const handleSearch = debounce(async (term) => {
      if (fetchFn) {
        const items = await fetchFn(term);
        currentOptions = items;
        renderResults(items);
      } else {
        const filtered = initialOptions.filter((opt) =>
          opt.label.toLowerCase().includes(term.toLowerCase())
        );
        renderResults(filtered);
      }
    }, 300);

    input.addEventListener('input', (e) => {
      const term = e.target.value;
      if (term.length >= 0) {
        handleSearch(term);
      } else {
        results.classList.remove('show');
      }
    });

    input.addEventListener('focus', () => {
      if (currentOptions.length > 0 || input.value.length === 0) {
        renderResults(currentOptions);
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        results.classList.remove('show');
      }
    });

    results.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item && !item.classList.contains('no-results')) {
        const val = item.dataset.value;
        const label = item.textContent;
        input.value = label;
        hidden.value = val;
        results.classList.remove('show');
        onSelect(val, label);
      }
    });

    return {
      setValue: (val, label) => {
        input.value = label || '';
        hidden.value = val || '';
      },
    };
  };

  const mapFieldToInput = (field, value = '') => {
    const { businessType, name, required } = field;
    const label = getLocalizedValue(field.label);
    const commonAttrs = `name="${name}" id="${name}-${fragmentEntryLinkNamespace}" class="form-control" ${required ? 'required' : ''}`;

    if (businessType === 'Picklist' || businessType === 'Relationship') {
      const selectedId =
        value && typeof value === 'object'
          ? value.key || value.id || ''
          : value;
      const initialLabel = value ? value.label || value.name || value : '';

      return `
              <div class="form-group mb-4">
                  <label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label>
                  <div class="searchable-field-wrap" data-field-name="${name}" data-value="${selectedId || ''}" data-label="${initialLabel || ''}">
                      <div class="meta-status small text-muted">Initializing ${businessType.toLowerCase()}...</div>
                  </div>
              </div>
          `;
    }

    switch (businessType) {
      case 'Integer':
      case 'LongInteger':
      case 'Decimal':
      case 'PrecisionDecimal':
        return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="number" ${commonAttrs} value="${value}"></div>`;
      case 'Date': {
        const dateValue = value
          ? new Date(value).toISOString().split('T')[0]
          : '';
        return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="date" ${commonAttrs} value="${dateValue}"></div>`;
      }
      case 'DateTime': {
        const dateValue = value
          ? new Date(value).toISOString().slice(0, 16)
          : '';
        return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="datetime-local" ${commonAttrs} value="${dateValue}"></div>`;
      }
      case 'LongText':
      case 'RichText':
        return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><textarea ${commonAttrs} rows="4">${value}</textarea></div>`;
      case 'Boolean':
        return `<div class="form-group mb-4"><div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" name="${name}" id="${name}-${fragmentEntryLinkNamespace}" ${value ? 'checked' : ''}><label class="custom-control-label" for="${name}-${fragmentEntryLinkNamespace}">${label}</label></div></div>`;
      default:
        return `<div class="form-group mb-4"><label for="${name}-${fragmentEntryLinkNamespace}">${label}${required ? ' *' : ''}</label><input type="text" ${commonAttrs} value="${value}"></div>`;
    }
  };

  const fetchOptionsForField = async (field, term = '', state) => {
    const { businessType } = field;

    if (businessType === 'Picklist') {
      const erc = field.listTypeDefinitionExternalReferenceCode;
      const res = await Liferay.Util.fetch(
        `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries?search=${term}`
      );
      const data = await res.json();
      return (data.items || []).map((item) => ({
        label: getLocalizedValue(item.name),
        value: item.key,
      }));
    } else if (businessType === 'Relationship') {
      const erc = field.objectDefinitionExternalReferenceCode1;

      const { definition, apiPath } =
        await Liferay.Fragment.Commons.resolveObjectPathByERC(erc);

      const entriesRes = await Liferay.Util.fetch(
        `${apiPath}/?search=${term}&pageSize=20`
      );
      const data = await entriesRes.json();
      const titleField = definition ? definition.titleObjectFieldName : 'id';

      return (data.items || []).map((item) => ({
        label: item[titleField || 'id'] || item.id,
        value: item.id,
      }));
    }
    return [];
  };

  const loadRecord = async (recordId, recordERC, state) => {
    logger.debug('loadRecord called', { recordId, recordERC });
    const fieldsWrap = fragmentElement.querySelector('.form-fields-wrap');
    const form = fragmentElement.querySelector('form');
    const { enableAddNew } = configuration;

    // Ensure definition is loaded
    if (!state.definition) {
      const timer = setInterval(() => {
        if (state.definition) {
          clearInterval(timer);
          loadRecord(recordId, recordERC, state);
        }
      }, 100);
      return;
    }

    try {
      let record = null;
      let hasIdentifier = false;

      // Build fields list for request
      const requestedFieldNames = new Set(state.fields.map((f) => f.name));
      requestedFieldNames.add('id');
      requestedFieldNames.add('externalReferenceCode');
      const fieldsParam = `fields=${Array.from(requestedFieldNames).join(',')}`;

      // 1. Try ERC
      if (isValidIdentifier(recordERC)) {
        const url = `${state.apiPath}/by-external-reference-code/${recordERC}?${fieldsParam}`;
        logger.debug('Fetching record by ERC', { url });
        const response = await Liferay.Util.fetch(url);
        if (response.ok) {
          record = await response.json();
          hasIdentifier = true;
        }
      }

      // 2. Fallback to ID
      if (!record && isValidIdentifier(recordId)) {
        const url = `${state.apiPath}/${recordId}?${fieldsParam}`;
        logger.debug('Fetching record by ID', { url });
        const response = await Liferay.Util.fetch(url);
        if (response.ok) {
          record = await response.json();
          hasIdentifier = true;
        }
      }

      if (hasIdentifier && record) {
        state.currentRecordId = record.id;
        state.currentRecordERC = record.externalReferenceCode;
      } else {
        state.currentRecordId = null;
        state.currentRecordERC = null;
        record = {}; // Use empty object for "Add New" or "No Match"
      }

      const submitBtn = form.querySelector("button[type='submit']");
      const statusMsg = fragmentElement.querySelector('.form-status-msg');
      if (statusMsg) statusMsg.classList.add('d-none');

      if (!state.currentRecordId && !enableAddNew) {
        if (submitBtn) submitBtn.classList.add('d-none');
        if (!hasIdentifier) {
          fieldsWrap.innerHTML = `<div class="alert alert-info">${Liferay.Language.get('lfr.gemini-generated.please-select-a-record') || 'Please select a record to edit.'}</div>`;
        } else {
          fieldsWrap.innerHTML =
            '<div class="alert alert-danger">Record not found.</div>';
        }
      } else {
        if (submitBtn) submitBtn.classList.remove('d-none');

        fieldsWrap.innerHTML = state.fields
          .map((f) => mapFieldToInput(f, record[f.name] || ''))
          .join('');

        // Initialize searchable fields
        state.fields.forEach((f) => {
          if (
            f.businessType === 'Picklist' ||
            f.businessType === 'Relationship'
          ) {
            const wrap = fieldsWrap.querySelector(
              `.searchable-field-wrap[data-field-name="${f.name}"]`
            );
            const val = wrap.dataset.value;
            const label = wrap.dataset.label;

            createSearchableSelect(wrap, {
              placeholder: `Select ${getLocalizedValue(f.label)}...`,
              defaultValue: label,
              fetchFn: (term) => fetchOptionsForField(f, term, state),
              onSelect: (v) => {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = f.name;
                hidden.value = v;
                // Replace existing hidden input if any
                const old = wrap.querySelector(`input[name="${f.name}"]`);
                if (old) old.remove();
                wrap.appendChild(hidden);
              },
            }).setValue(val, label);

            // Initial hidden input for form submission
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = f.name;
            hidden.value = val;
            wrap.appendChild(hidden);
          }
        });
      }
    } catch (err) {
      fieldsWrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  };

  const initSelector = async (state) => {
    const { enableRecordSelection } = configuration;
    const container = fragmentElement.querySelector(
      `#selector-${fragmentEntryLinkNamespace}`
    );

    if (container && enableRecordSelection) {
      createSearchableSelect(container, {
        placeholder: 'Search records to edit...',
        fetchFn: async (term) => {
          const response = await Liferay.Util.fetch(
            `${state.apiPath}/?search=${term}&pageSize=20`
          );
          const data = await response.json();
          const titleField = state.definition.titleObjectFieldName || 'id';
          return (data.items || []).map((r) => ({
            label: r[titleField] || r.id,
            value: r.id,
          }));
        },
        onSelect: (id) => loadRecord(id, null, state),
      });
    }
  };

  const startInit = async (isEditMode) => {
    const {
      objectERC: configERC,
      fixedRecordIdentifier,
      fixedRecordIdentifierType,
      enableAddNew,
      enableRecordSelection,
      customizeColumns,
      columnsToDisplay,
      formTitle: configTitle,
    } = configuration;

    const state = {
      definition: null,
      apiPath: null,
      fields: [],
      currentRecordId: null,
      currentRecordERC: null,
      records: [],
      fieldOptions: {},
    };

    const fieldsWrap = fragmentElement.querySelector('.form-fields-wrap');
    const titleEl = fragmentElement.querySelector('.object-title');
    const form = fragmentElement.querySelector('form');
    const errorEl = fragmentElement.querySelector(
      `#error-${fragmentEntryLinkNamespace}`
    );
    const infoEl = fragmentElement.querySelector(
      `#info-${fragmentEntryLinkNamespace}`
    );

    const showError = (msg) => {
      if (isEditMode && errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('d-none');
        if (fieldsWrap) fieldsWrap.innerHTML = '';
      } else if (fieldsWrap) {
        fieldsWrap.innerHTML = `<div class="text-center p-5 text-danger">${msg}</div>`;
      }
    };

    if (errorEl) errorEl.classList.add('d-none');
    if (infoEl) infoEl.classList.add('d-none');

    // Resolve effective ERC (Prioritize mappable field)
    const mappableERCEl = fragmentElement.querySelector(
      "[data-lfr-editable-id='object-erc']"
    );
    let objectERC = configERC;
    if (mappableERCEl) {
      const mappedVal = mappableERCEl.innerText.trim();
      if (
        mappedVal &&
        mappedVal !== configERC &&
        mappedVal !== 'COMPANY_MILESTONE'
      ) {
        objectERC = mappedVal;
      }
    }

    // Register event listener via standardized Event Bus for hydration safety
    const unsubscribe = Liferay.Fragment.Commons.EventBus.subscribe(
      'object-select',
      (detail) => {
        logger.debug('Received object-select', detail);
        if (detail && detail.objectERC === objectERC) {
          const eventId = detail.recordId || detail.identifier || null;
          const eventERC = detail.recordERC || detail.erc || null;

          if (isValidIdentifier(eventId) || isValidIdentifier(eventERC)) {
            logger.debug('Loading record from EventBus', {
              eventId,
              eventERC,
            });
            loadRecord(eventId, eventERC, state);
          }
        }
      },
      { replay: true }
    );

    if (!isValidIdentifier(objectERC)) {
      titleEl.textContent = 'Meta-Object Form';
      if (isEditMode && infoEl) {
        infoEl.textContent =
          'Please provide an Object External Reference Code in the configuration.';
        infoEl.classList.remove('d-none');
      }
    } else {
      try {
        const { definition, apiPath } =
          await Liferay.Fragment.Commons.resolveObjectPathByERC(objectERC);
        if (!definition)
          throw new Error(`Object not found (ERC: ${objectERC}).`);

        state.definition = definition;
        state.apiPath = apiPath;

        // Smart Title Logic
        const objectLabel = getLocalizedValue(
          state.definition.label || state.definition.name
        );
        const currentTitle = titleEl.innerText.trim();
        const defaultFragmentName =
          fragmentElement.dataset.fragmentName || 'Meta-Object Form';

        // Precedence: Configuration (configTitle) > Evaluated Value (objectLabel)
        const preferredTitle = configTitle || objectLabel;

        if (
          currentTitle === 'Meta-Object Form' ||
          currentTitle === defaultFragmentName ||
          currentTitle === '' ||
          currentTitle === 'Update Entry' || // Previous default
          currentTitle === `${defaultFragmentName} (Preview)`
        ) {
          titleEl.innerText = preferredTitle + (isEditMode ? ' (Preview)' : '');
        }

        // Resolve fields to display/edit
        const allFields = state.definition.objectFields.filter(
          (f) =>
            !['id', 'externalReferenceCode', 'status'].includes(f.name) &&
            f.readOnly !== 'true' &&
            f.readOnly !== 'conditional'
        );

        if (customizeColumns && columnsToDisplay) {
          const desired = columnsToDisplay.split(',').map((c) => c.trim());
          const seen = new Set();
          state.fields = desired
            .map((name) =>
              allFields.find(
                (f) => f.name === name || getLocalizedValue(f.label) === name
              )
            )
            .filter((f) => {
              if (!f || seen.has(f.name)) return false;
              seen.add(f.name);
              return true;
            });
        } else {
          state.fields = allFields;
        }

        const params = new URLSearchParams(window.location.search);
        let startId = params.get('entryId') || params.get('id');
        let startERC = params.get('entryERC') || params.get('erc');

        if (isValidIdentifier(fixedRecordIdentifier)) {
          if (fixedRecordIdentifierType === 'erc')
            startERC = fixedRecordIdentifier;
          else startId = fixedRecordIdentifier;
        }

        // Standardize URL identifiers
        if (!isValidIdentifier(startId)) startId = null;
        if (!isValidIdentifier(startERC)) startERC = null;

        if (!startId && !startERC && !enableAddNew && !enableRecordSelection) {
          // Initial state: nothing to load, show info
          fieldsWrap.innerHTML = `<div class="alert alert-info">${Liferay.Language.get('lfr.gemini-generated.please-select-a-record') || 'Please select a record to edit.'}</div>`;
        } else {
          await loadRecord(startId, startERC, state);
          if (!isEditMode && enableRecordSelection) await initSelector(state);
        }

        if (!isEditMode) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            state.definition.objectFields.forEach((f) => {
              if (f.type === 'Boolean') payload[f.name] = formData.has(f.name);
            });

            const statusMsg = fragmentElement.querySelector('.form-status-msg');
            if (statusMsg) statusMsg.classList.add('d-none');

            try {
              const method = state.currentRecordId ? 'PATCH' : 'POST';
              const url = state.currentRecordId
                ? `${state.apiPath}/${state.currentRecordId}`
                : `${state.apiPath}/`;

              const saveRes = await Liferay.Util.fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (saveRes.ok) {
                if (statusMsg) {
                  statusMsg.textContent = state.currentRecordId
                    ? 'Entry updated successfully!'
                    : 'Entry saved successfully!';
                  statusMsg.className =
                    'form-status-msg mt-3 alert alert-success';
                  statusMsg.classList.remove('d-none');
                }
                if (!state.currentRecordId) form.reset();
              } else {
                const errData = await saveRes.json();
                throw new Error(errData.title || 'Failed to save entry.');
              }
            } catch (err) {
              if (statusMsg) {
                statusMsg.textContent = err.message;
                statusMsg.className = 'form-status-msg mt-3 alert alert-danger';
                statusMsg.classList.remove('d-none');
              }
            }
          });
        } else {
          form.onsubmit = (e) => e.preventDefault();
        }
      } catch (err) {
        showError(err.message);
      }
    }
  };

  if (layoutMode === 'view') {
    startInit(false);
  } else {
    startInit(true);
  }
};

initMetaObjectFormFragment();
