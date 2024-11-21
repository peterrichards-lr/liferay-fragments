if (document.body.classList.contains('has-edit-mode-menu') && configuration.displayDropZones)
{
	const outcomeDivs = fragmentElement.querySelectorAll('.outcome');
	for(var i = 0; i < outcomeDivs.length; i++) {
		const outcomeDiv = outcomeDivs[i];
		outcomeDiv.style.display = 'block';
	}
}

Liferay.on('allPortletsReady',() => {
  const outcomeValue = fragmentElement.querySelector('.config .outcome-value');
	const outcome = outcomeValue.textContent?.toLowerCase();
	const outcomeDivs = fragmentElement.querySelectorAll('.outcome');
	for(var i = 0; i < outcomeDivs.length; i++) {
		const outcomeDiv = outcomeDivs[i];
		const currentOutcome = outcomeDiv.getAttribute("data-outcome-value");
		if (currentOutcome === outcome) {
			outcomeDiv.style.display = 'block';
		}
	}
});