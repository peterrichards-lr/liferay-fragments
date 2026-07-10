function initScratchOffFragment() {
  const container = fragmentElement.querySelector('.scratch-card-container');
  const canvas = fragmentElement.querySelector('.scratch-canvas');

  if (!container || !canvas || layoutMode === 'edit') {
    return;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let isDrawing = false;
  let isCleared = false;
  let brushSize = configuration.brushSize || 40;
  let clearThreshold = configuration.clearThreshold || 50;

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    fillCanvas();
  }

  function fillCanvas() {
    if (configuration.overlayImage) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = configuration.overlayImage;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = configuration.overlayColor || '#cccccc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function scratch(e) {
    if (!isDrawing || isCleared) return;
    if (e.cancelable) e.preventDefault();

    const pos = getPointerPos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  }

  function handleDown(e) {
    isDrawing = true;
    scratch(e);
  }

  function handleUp() {
    isDrawing = false;
    checkClearance();
  }

  function checkClearance() {
    if (isCleared) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let transparentPixels = 0;
    const stride = 4 * 10;
    for (let i = 3; i < pixels.length; i += stride) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const sampledTotal = pixels.length / stride;
    const percentage = (transparentPixels / sampledTotal) * 100;

    if (percentage > clearThreshold) {
      isCleared = true;
      canvas.classList.add('cleared');
    }
  }

  setTimeout(() => {
    resizeCanvas();

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', handleUp);

    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', scratch, { passive: false });
    window.addEventListener('touchend', handleUp);

    window.addEventListener('resize', () => {
      if (!isCleared) resizeCanvas();
    });
  }, 100);
}

initScratchOffFragment();
