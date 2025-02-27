
if (layoutMode === 'view') {	
	const iniFrame = () => window.location !== window.parent.location;
	const hasControlMenu = () => document.body.classList.contains('has-control-menu');
	const executeMode = configuration.executeMode;
	
	const execute =
		hasControlMenu() && (
			(executeMode === 'page' ||
				executeMode === 'both') ||
			executeMode === 'iframe' && iniFrame());

	if (execute) {
		const WebServerDisplayNodeContainer = document.body.querySelector('#WebServerDisplayNodeContainer');
		if (WebServerDisplayNodeContainer) WebServerDisplayNodeContainer.style.display = 'none';
		const controlMenus = document.body.querySelectorAll('nav.cadmin');
		if (controlMenus) {
			for (let i = 0; i < controlMenus.length; i++) {
				let controlMenu = controlMenus[i];
				if (controlMenu) controlMenu.style.display = 'none';
			}
		}
		const wrapper = document.body.querySelector('#wrapper');
		if (wrapper) wrapper.style.padding = 'unset';
	}
}

fragmentElement.style.display = 'none';