[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="signature-pad-fragment" style="--pad-height: ${configuration.padHeight!'200px'}">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-signature-canvas" id="${fragmentEntryLinkNamespace}-signature-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="canvas-container">
			<canvas 
                id="${fragmentEntryLinkNamespace}-signature-canvas" 
                class="signature-canvas"
                [#if readOnly]data-readonly="true"[/#if]
            ></canvas>
            
            [#if !readOnly]
                <button type="button" class="btn btn-sm btn-outline-secondary clear-signature mt-2">
                    ${configuration.clearButtonText!'Clear'}
                </button>
            [/#if]
		</div>

        <input 
            id="${fragmentEntryLinkNamespace}-signature-data" 
            name="${input.name}" 
            type="hidden" 
            [#if input.value??]value="${input.value}"[/#if] 
            ${input.required?then('required', '')}
        />

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger" id="${fragmentEntryLinkNamespace}-signature-error-message">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]

		[#if input.showHelpText && input.helpText?has_content]
			<p class="mb-0 mt-1 text-secondary" id="${fragmentEntryLinkNamespace}-signature-help-text">${htmlUtil.escape(input.helpText)}</p>
		[/#if]
	</div>
</div>
