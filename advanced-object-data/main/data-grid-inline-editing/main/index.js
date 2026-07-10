function initDataGrid() {
  const container = fragmentElement.querySelector('.grid-container');
  if (!container || layoutMode === 'edit') {
    return;
  }

  const erc = configuration.objectErc || 'MAP_PIN';
  const colsString = configuration.columns || 'id,title,description';
  const enableEditing = configuration.enableEditing;

  const loadTabulator = () => {
    return new Promise((resolve, reject) => {
      if (window.Tabulator) {
        resolve(window.Tabulator);
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src =
        'https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js';
      script.onload = () => resolve(window.Tabulator);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  async function fetchData() {
    try {
      // Using Liferay.Util.fetch which includes CSRF token and auth headers
      const url = `/o/c/${erc.toLowerCase()}s`; // Usually plural in generic REST
      const fallbackUrl = `/o/c/${erc.toLowerCase()}`;
      let res = await Liferay.Util.fetch(fallbackUrl);
      if (res.status === 404) {
        res = await Liferay.Util.fetch(url);
      }
      if (!res.ok) throw new Error('Fetch failed with status: ' + res.status);
      const data = await res.json();
      return data.items || [];
    } catch (err) {
      console.error('Data Grid: Failed to fetch object data', err);
      return [];
    }
  }

  async function updateData(rowId, field, value) {
    try {
      const payload = { [field]: value };
      const url = `/o/c/${erc.toLowerCase()}/${rowId}`;
      const res = await Liferay.Util.fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        // Fallback to plural path
        const pluralUrl = `/o/c/${erc.toLowerCase()}s/${rowId}`;
        const res2 = await Liferay.Util.fetch(pluralUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res2.ok) throw new Error('Update failed on plural endpoint');
        return;
      }

      if (!res.ok) throw new Error('Update failed');
    } catch (err) {
      console.error('Data Grid: Failed to patch object data', err);
      throw err;
    }
  }

  async function renderGrid() {
    try {
      const Tabulator = await loadTabulator();
      const items = await fetchData();

      const columns = colsString
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          return {
            title: c.charAt(0).toUpperCase() + c.slice(1),
            field: c,
            editor: enableEditing && c !== 'id' ? 'input' : false,
          };
        });

      const table = new Tabulator(container, {
        data: items,
        layout: 'fitColumns',
        columns: columns,
      });

      if (enableEditing) {
        table.on('cellEdited', function (cell) {
          const row = cell.getRow().getData();
          const field = cell.getField();
          const value = cell.getValue();
          const originalValue = cell.getOldValue();

          if (value !== originalValue) {
            updateData(row.id, field, value).catch(() => {
              cell.restoreOldValue();
              alert('Failed to save data. Changes reverted.');
            });
          }
        });
      }
    } catch (e) {
      console.error('Data Grid initialization failed', e);
    }
  }

  renderGrid();
}

initDataGrid();
