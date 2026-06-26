[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="address-autocomplete-fragment">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-address-input" id="${fragmentEntryLinkNamespace}-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="autocomplete-wrapper" role="combobox" aria-haspopup="listbox" aria-expanded="false">
			<input 
                id="${fragmentEntryLinkNamespace}-address-input" 
                class="form-control address-input" 
                type="text" 
                name="${input.name}"
                placeholder="${configuration.placeholder!}"
                [#if readOnly]readonly[/#if]
                autocomplete="off"
                [#if input.value??]value="${input.value}"[/#if] 
                ${input.required?then('required', '')}
            />
            <ul class="autocomplete-results list-unstyled d-none" id="${fragmentEntryLinkNamespace}-results" role="listbox"></ul>
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
