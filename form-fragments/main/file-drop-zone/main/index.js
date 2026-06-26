const initFileDropZone = () => {
  const dropZone = fragmentElement.querySelector('.drop-zone');
  const fileInput = fragmentElement.querySelector('.file-input');
  const fileInfo = fragmentElement.querySelector('.file-info');
  const dropZoneText = fragmentElement.querySelector('.drop-zone-text');
  const dlBtn = fragmentElement.querySelector('.dl-picker-btn');

  if (!dropZone || !fileInput) return;

  const updateFileInfo = (files) => {
    if (files && files.length > 0) {
      fileInfo.textContent = files[0].name;
      fileInfo.classList.remove('d-none');
      if (dropZoneText) dropZoneText.classList.add('d-none');
    } else {
      fileInfo.classList.add('d-none');
      if (dropZoneText) dropZoneText.classList.remove('d-none');
    }

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  if (layoutMode === 'edit') {
    fileInput.disabled = true;
    if (dlBtn) dlBtn.disabled = true;
    return;
  }

  // Click to trigger
  dropZone.addEventListener('click', () => fileInput.click());

  // Drag and Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      () => dropZone.classList.add('drag-over'),
      false
    );
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      () => dropZone.classList.remove('drag-over'),
      false
    );
  });

  dropZone.addEventListener(
    'drop',
    (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      fileInput.files = files;
      updateFileInfo(files);
    },
    false
  );

  fileInput.addEventListener('change', (e) => {
    updateFileInfo(e.target.files);
  });

  // Document Library Picker
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      Liferay.Util.openSelectionModal({
        onSelect: (item) => {
          // Note: Selection logic for DL in Form Fragments usually involves
          // storing the item ID or URL.
          console.log('Selected from DL:', item);
          fileInfo.textContent = item.title;
          fileInfo.classList.remove('d-none');
          if (dropZoneText) dropZoneText.classList.add('d-none');

          // Custom event for form mapping
          const event = new CustomEvent('itemSelected', { detail: item });
          fileInput.dispatchEvent(event);
        },
        url: dlBtn.dataset.url,
      });
    });
  }
};

initFileDropZone();
