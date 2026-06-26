const initOtpInput = () => {
  const boxes = Array.from(fragmentElement.querySelectorAll('.otp-box'));
  const hiddenInput = fragmentElement.querySelector('input[type="hidden"]');

  if (boxes.length === 0 || !hiddenInput) return;

  const updateHiddenValue = () => {
    hiddenInput.value = boxes.map((box) => box.value).join('');
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  if (layoutMode === 'edit') {
    boxes.forEach((box) => (box.disabled = true));
    return;
  }

  // Handle Hydration
  if (hiddenInput.value) {
    const vals = hiddenInput.value.split('');
    boxes.forEach((box, i) => {
      if (vals[i]) box.value = vals[i];
    });
  }

  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 1) {
        e.target.value = val.charAt(0);
      }

      updateHiddenValue();

      if (val && i < boxes.length - 1) {
        boxes[i + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
      } else if (e.key === 'ArrowLeft' && i > 0) {
        boxes[i - 1].focus();
      } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {
        boxes[i + 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData('text');
      const parts = data.split('').slice(0, boxes.length);

      parts.forEach((char, j) => {
        boxes[j].value = char;
      });

      updateHiddenValue();

      // Focus the last filled box or the next empty one
      const nextIdx = Math.min(parts.length, boxes.length - 1);
      boxes[nextIdx].focus();
    });

    box.addEventListener('focus', () => box.select());
  });
};

initOtpInput();
