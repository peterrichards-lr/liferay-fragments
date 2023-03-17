const inputEl = fragmentElement.querySelector(`#${fragmentNamespace}-text-input`);
const inputConfirmationEl = fragmentElement.querySelector(`#${fragmentNamespace}-text-confirmation-input`);

if (inputEl && inputConfirmationEl) {
	if (layoutMode === 'edit') {
		inputEl.setAttribute('disabled', true);
		inputConfirmationEl.setAttribute('disabled', true);
	} else {
		const feedbackGroup = fragmentElement.querySelector('.form-feedback-group');
		if (feedbackGroup) {
			const clearError = (e) => {
				if (feedbackGroup.classList.contains('form-feedback-group-visibility'))
					feedbackGroup.style.visibility = 'hidden';
				else
					feedbackGroup.style.display = 'none';
			};
			inputEl.addEventListener('blur', clearError);
			inputConfirmationEl.addEventListener('blur', clearError);
		}
	}
}