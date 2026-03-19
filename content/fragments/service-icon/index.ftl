<div class="service-icon" data-layout-mode="${layoutMode}"
	style="--size: ${configuration.size}; --icon-color: ${configuration.iconColor}; --background-color: ${configuration.backgroundColor};">
	<span aria-hidden="true" class="loading-animation-squares loading-animation-primary loading-animation-md"></span>
	<div class="service-icon___content d-none flex-column align-items-center justify-content-start">
		<div class="circle">
			<span class="svg-icon"></span>
		</div>
		<p class="text" data-lfr-editable-id="text" data-lfr-editable-type="text">
			This is a test
		</p>
	</div>

	<div class="meta-editor-mappable-fields">
		<div class="mappable-field-item">
			<label>Icon Identifier</label>
			<div class="config-icon" data-lfr-editable-id="icon" data-lfr-editable-type="text">
				${configuration.defaultIcon!}
			</div>
		</div>
		<div class="mappable-field-item">
			<label>Title (Metadata)</label>
			<div class="config-title" data-lfr-editable-id="title" data-lfr-editable-type="text">
				${configuration.title!}
			</div>
		</div>
	</div>
</div>