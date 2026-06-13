[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]
[#assign boxCount = (configuration.numberOfBoxes!6)?number /]

<div class="otp-input-fragment" style="--box-size: ${configuration.boxSize!'3rem'}">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" id="${fragmentEntryLinkNamespace}-otp-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="otp-container d-flex gap-2" role="group" aria-labelledby="${fragmentEntryLinkNamespace}-otp-label">
            [#list 1..boxCount as i]
                <input 
                    class="form-control otp-box text-center" 
                    type="${configuration.otpType!'number'}" 
                    maxlength="1" 
                    autocomplete="one-time-code"
                    [#if readOnly]readonly[/#if]
                    [#if i == 1 && configuration.autoFocus!true]autofocus[/#if]
                    data-index="${i}"
                />
            [/#list]
		</div>

        <input 
            id="${fragmentEntryLinkNamespace}-hidden-otp" 
            name="${input.name}" 
            type="hidden" 
            [#if input.value??]value="${input.value}"[/#if] 
            ${input.required?then('required', '')}
        />

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger" id="${fragmentEntryLinkNamespace}-otp-error-message">
				[@clay["icon"] symbol="info-circle" /]
				<span>${input.errorMessage}</span>
			</p>
		[/#if]

		[#if input.showHelpText && input.helpText?has_content]
			<p class="mb-0 mt-1 text-secondary" id="${fragmentEntryLinkNamespace}-otp-help-text">${htmlUtil.escape(input.helpText)}</p>
		[/#if]
	</div>
</div>
