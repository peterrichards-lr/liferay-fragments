if (!fragmentNamespace) {
	return;
}

if (document.body.classList.contains('has-edit-mode-menu')) {

	// If present then we are in content page editor

	return;
}

AUI().ready(() => {
	const params = new URLSearchParams(window.location.search);
	const triggerRay = params.has("ask_ray");
	if (triggerRay) {
		const askRayPortlet = document.querySelector('.lfr-layout-structure-item-reactai');
		if (askRayPortlet) {
			const askRayButton = document.querySelector("button.ray-button", askRayPortlet);
			askRayButton.click();
		}
	}		
	LiveChatWidget.call("hide");
});