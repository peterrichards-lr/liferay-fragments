[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="currency-input-fragment">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-visible-input" id="${fragmentEntryLinkNamespace}-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="input-group">
            [#if configuration.currencySymbol?has_content]
                <div class="input-group-prepend">
                    <span class="input-group-text">${configuration.currencySymbol}</span>
                </div>
            [/#if]
			<input 
                id="${fragmentEntryLinkNamespace}-visible-input" 
                class="form-control visible-currency-input" 
                type="text" 
                placeholder="${configuration.placeholder!}"
                [#if readOnly]readonly[/#if]
                autocomplete="off"
                [#if input.value??]value="${input.value}"[/#if] 
            />
		</div>

        <input 
            id="${fragmentEntryLinkNamespace}-hidden-input" 
            name="${input.name}" 
            type="hidden" 
            [#if input.value??]value="${input.value}"[/#if] 
            ${input.required?then('required', '')}
        />

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
