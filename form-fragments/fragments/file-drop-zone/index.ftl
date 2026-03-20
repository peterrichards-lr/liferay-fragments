[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="file-drop-zone-fragment">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-file-input" id="${fragmentEntryLinkNamespace}-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="drop-zone-container">
            <div class="drop-zone [#if readOnly]readonly[/#if]" id="${fragmentEntryLinkNamespace}-drop-zone">
                <div class="drop-zone-content">
                    [@clay["icon"] className="drop-zone-icon" symbol="${configuration.dropZoneIcon!'upload'}" /]
                    <span class="drop-zone-text d-block mt-2">${configuration.dropZoneText!'Drag & Drop or Click to Upload'}</span>
                    <span class="file-info text-primary font-weight-bold d-none mt-2"></span>
                </div>
                <input 
                    id="${fragmentEntryLinkNamespace}-file-input" 
                    name="${input.name}" 
                    type="file" 
                    class="d-none file-input"
                    [#if readOnly]disabled[/#if]
                    ${input.required?then('required', '')}
                    [#if input.attributes.allowedFileExtensions?has_content]accept="${input.attributes.allowedFileExtensions}"[/#if]
                />
            </div>

            [#if !readOnly && configuration.showDocumentLibraryPicker!true && input.attributes.selectFromDocumentLibraryURL?has_content]
                <button 
                    class="btn btn-sm btn-link mt-2 dl-picker-btn" 
                    type="button" 
                    data-url="${input.attributes.selectFromDocumentLibraryURL}"
                >
                    [@clay["icon"] className="mr-1" symbol="folder" /]
                    ${languageUtil.get(locale, "select-from-document-library")}
                </button>
            [/#if]
		</div>

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger" id="${fragmentEntryLinkNamespace}-error-message">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]

		[#if input.showHelpText && input.helpText?has_content]
			<p class="mb-0 mt-1 text-secondary" id="${fragmentEntryLinkNamespace}-help-text">${htmlUtil.escape(input.helpText)}</p>
		[/#if]
	</div>
</div>
