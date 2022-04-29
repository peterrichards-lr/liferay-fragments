if (!fragmentNamespace) // If it is not set then we are in fragment editor
	return;

if (document.body.classList.contains('has-edit-mode-menu')) { // If present then we are in content page editor
	const loading = fragmentElement.querySelector("div.loading");
	loading.style.display = "none";
	return;
}

Liferay.on('allPortletsReady', () => {
	const frame = fragmentElement.querySelector("iframe");
	if (frame) {
		frame.addEventListener("load", (evt) => {
			const iframeDocument = evt.target.contentDocument;
			const iframeHead = iframeDocument.head;
			const iframeBody = iframeDocument.body;
			iframeBody.classList.remove("product-menu-open");
			iframeBody.classList.remove("open");
			iframeBody.classList.remove("controls-visible");
			var css = "div.cadmin {	display: none; } div.product-menu {	display: none; }";
			var style = iframeDocument.createElement('style');
			iframeHead.appendChild(style);
			style.type = 'text/css';
			if (style.styleSheet){
				style.styleSheet.cssText = css;
			} else {
				style.appendChild(document.createTextNode(css));
			}
			
			const loading = fragmentElement.querySelector("div.loading");
			loading.style.display = "none";
		});
	}
});
