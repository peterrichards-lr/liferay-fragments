if (
  !fragmentNamespace ||
  document.body.classList.contains('has-edit-mode-menu')
)
  return;

if (fragmentElement) {
  const formEl = fragmentElement.closest('form');
  const confirmationFragments = formEl.querySelectorAll(
    '.text-confirmation-input'
  );
  if (confirmationFragments) {
    const buttonEl = fragmentElement.querySelector('button');
    if (buttonEl) {
      const validate = (event) => {
        [...confirmationFragments].forEach((confirmationFragment) => {
          const fragmentContainerEl = confirmationFragment.parentElement;
          const textEl =
            confirmationFragment.querySelector('input.form-control');
          if (!textEl) {
            console.error(
              'Unable to find input tag for ' + fragmentContainerEl.id
            );
            return;
          }
          const textConfirmEl = confirmationFragment.querySelector(
            'input.form-control.text-confirmation'
          );
          if (!textConfirmEl) {
            console.error(
              'Unable to find confirmation input tag for ' +
                fragmentContainerEl.id
            );
            return;
          }
          if (!textConfirmEl.hasAttribute('data-error')) {
            const errorMessageGroupEL = confirmationFragment.querySelector(
              '.form-feedback-group'
            );
            if (!errorMessageGroupEL) {
              console.error(
                'Unable to find feedback group for ' + fragmentContainerEl.id
              );
              return;
            }
            if (textEl.value !== textConfirmEl.value) {
              if (
                errorMessageGroupEL.classList.contains(
                  'form-feedback-group-visibility'
                )
              )
                errorMessageGroupEL.style.visibility = 'visible';
              else errorMessageGroupEL.style.display = 'block';
              event.preventDefault();
            } else {
              if (
                errorMessageGroupEL.classList.contains(
                  'form-feedback-group-visibility'
                )
              )
                errorMessageGroupEL.style.visibility = 'hidden';
              else errorMessageGroupEL.style.display = 'none';
            }
          } else {
						if (textEl.value !== textConfirmEl.value) {
							const errorMessage = textConfirmEl.getAttribute('data-error');
							textConfirmEl.setCustomValidity(errorMessage);
					  } else {
							textConfirmEl.setCustomValidity("");
						}
					}
        });
      };
      buttonEl.addEventListener('click', validate);
    }
  }
}