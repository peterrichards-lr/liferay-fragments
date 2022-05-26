const profileDetail = fragmentElement.querySelector("div.profile-detail");

if (profileDetail) {
	const shareButtons = profileDetail.querySelectorAll("button.copy-to-clipboard");
	shareButtons.forEach((shareButton) => {
		shareButton.addEventListener('click', () => {
			copyTextElement = shareButton.parentElement.parentElement.children[1];
			
			if (copyTextElement) {
				const text = copyTextElement.textContent.trim();
				navigator.clipboard.writeText(text);
				console.log("Copied the text: " + text);
			}
		});
	})
}