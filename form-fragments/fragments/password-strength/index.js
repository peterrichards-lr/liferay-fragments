const initPasswordStrength = () => {
  const inputEl = fragmentElement.querySelector('.password-input');
  const toggleBtn = fragmentElement.querySelector('.toggle-visibility');
  const strengthBar = fragmentElement.querySelector('.strength-bar');
  const strengthLabel = fragmentElement.querySelector('.strength-label');
  const requirements = Array.from(
    fragmentElement.querySelectorAll('.requirement')
  );

  if (!inputEl) return;

  const checkRequirements = (val) => {
    let score = 0;
    requirements.forEach((req) => {
      const type = req.dataset.type;
      let met = false;

      if (type === 'length') {
        met = val.length >= parseInt(req.dataset.min, 10);
      } else if (type === 'uppercase') {
        met = /[A-Z]/.test(val);
      } else if (type === 'number') {
        met = /[0-9]/.test(val);
      } else if (type === 'special') {
        met = /[^A-Za-z0-9]/.test(val);
      }

      if (met) {
        req.classList.add('met');
        req.classList.remove('unmet');
        score++;
      } else {
        req.classList.add('unmet');
        req.classList.remove('met');
      }
    });

    return (score / requirements.length) * 100;
  };

  const updateStrengthBar = (percent) => {
    if (!strengthBar) return;

    strengthBar.style.width = percent + '%';

    let color = '#da1414'; // Danger
    let label = 'Weak';

    if (percent > 80) {
      color = '#28a745'; // Success
      label = 'Strong';
    } else if (percent > 40) {
      color = '#ffc107'; // Warning
      label = 'Medium';
    }

    strengthBar.style.backgroundColor = color;
    if (strengthLabel) strengthLabel.textContent = label;
  };

  if (layoutMode === 'edit') {
    inputEl.disabled = true;
    if (toggleBtn) toggleBtn.disabled = true;
    return;
  }

  inputEl.addEventListener('input', (e) => {
    const val = e.target.value;
    const percent = checkRequirements(val);
    updateStrengthBar(percent);

    const event = new Event('change', { bubbles: true });
    fragmentElement.dispatchEvent(event);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = inputEl.type === 'password';
      inputEl.type = isPassword ? 'text' : 'password';

      const viewIcon = toggleBtn.querySelector('.view-icon');
      const hideIcon = toggleBtn.querySelector('.hide-icon');

      if (isPassword) {
        viewIcon.classList.add('d-none');
        hideIcon.classList.remove('d-none');
      } else {
        viewIcon.classList.remove('d-none');
        hideIcon.classList.add('d-none');
      }
    });
  }
};

initPasswordStrength();
