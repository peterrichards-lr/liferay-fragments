[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]

<div class="password-strength-fragment">
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-password" id="${fragmentEntryLinkNamespace}-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
		</label>

		<div class="input-group">
			<input 
                id="${fragmentEntryLinkNamespace}-password" 
                class="form-control password-input" 
                type="password" 
                name="${input.name}"
                placeholder="${configuration.placeholder!}"
                [#if readOnly]readonly[/#if]
                autocomplete="new-password"
                [#if input.value??]value="${input.value}"[/#if] 
                ${input.required?then('required', '')}
            />
            [#if configuration.enableToggleVisibility!true]
                <div class="input-group-append">
                    <button class="btn btn-outline-secondary toggle-visibility" type="button" aria-label="Toggle password visibility">
                        [@clay["icon"] className="view-icon" symbol="view" /]
                        [@clay["icon"] className="hide-icon d-none" symbol="hidden" /]
                    </button>
                </div>
            [/#if]
		</div>

        [#if configuration.showStrengthMeter!true]
            <div class="strength-meter mt-2">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar strength-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="strength-text text-secondary mt-1 d-block">${languageUtil.get(locale, "password-strength")}: <span class="strength-label"></span></small>
            </div>
        [/#if]

        <ul class="password-requirements list-unstyled mt-2 small">
            [#if configuration.minLength??]
                <li class="requirement" data-type="length" data-min="${configuration.minLength}">
                    <span class="status-icon mr-1">[@clay["icon"] symbol="circle" /]</span>
                    ${languageUtil.format(locale, "at-least-x-characters", configuration.minLength)}
                </li>
            [/#if]
            [#if configuration.requireUppercase!true]
                <li class="requirement" data-type="uppercase">
                    <span class="status-icon mr-1">[@clay["icon"] symbol="circle" /]</span>
                    ${languageUtil.get(locale, "one-uppercase-character")}
                </li>
            [/#if]
            [#if configuration.requireNumber!true]
                <li class="requirement" data-type="number">
                    <span class="status-icon mr-1">[@clay["icon"] symbol="circle" /]</span>
                    ${languageUtil.get(locale, "one-number")}
                </li>
            [/#if]
            [#if configuration.requireSpecial!true]
                <li class="requirement" data-type="special">
                    <span class="status-icon mr-1">[@clay["icon"] symbol="circle" /]</span>
                    ${languageUtil.get(locale, "one-special-character")}
                </li>
            [/#if]
        </ul>

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
