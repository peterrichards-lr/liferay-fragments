const initSignaturePad = () => {
  const canvas = fragmentElement.querySelector('.signature-canvas');
  const hiddenInput = fragmentElement.querySelector('input[type="hidden"]');
  const clearButton = fragmentElement.querySelector('.clear-signature');

  if (!canvas || !hiddenInput) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;

  const setCanvasSize = () => {
    // Increase resolution for better quality
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // If we have an existing value, re-draw it
    if (hiddenInput.value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = hiddenInput.value;
    }
  };

  // Initial sizing
  setCanvasSize();
  window.addEventListener(
    'resize',
    Liferay.Fragment.Commons.debounce(setCanvasSize, 200)
  );

  if (canvas.dataset.readonly === 'true' || layoutMode === 'edit') {
    return;
  }

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = configuration.strokeColor || '#000000';
    ctx.lineWidth = configuration.penWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawing) return;
    drawing = false;
    hiddenInput.value = canvas.toDataURL();
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hiddenInput.value = '';
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
};

initSignaturePad();
