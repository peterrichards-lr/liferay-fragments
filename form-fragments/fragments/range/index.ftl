[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly]

<div class="range-input" [#if configuration.addId]id="${configuration.idValue!}"[/#if]>
	<div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
		<label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]" for="${fragmentEntryLinkNamespace}-range-input" id="${fragmentEntryLinkNamespace}-range-input-label">
			${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale, "read-only")})[#elseif input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
			[#if configuration.displayValue]
			<br/><span class="value-prefix">${configuration.valuePrefix!}</span><span class="value"></span><span class="value-suffix">${configuration.valueSuffix!}</span>
			[/#if]
		</label>

		<input aria-describedby="${fragmentEntryLinkNamespace}-range-input-help-text" aria-labelledby="${fragmentEntryLinkNamespace}-range-input-label [#if input.errorMessage?has_content]${fragmentEntryLinkNamespace}-range-input-error-message[/#if]" class="form-control" data-validation-message-text="${languageUtil.get(locale, "enter-a-valid-value.-the-value-has-too-many-decimals")}" id="${fragmentEntryLinkNamespace}-range-input" [#if (configuration.customRange && configuration.max??)]max="${configuration.max!}"[#elseif input.attributes.max??]max="${input.attributes.max}"[/#if] [#if (configuration.customRange && configuration.min??)]min="${configuration.min!}"[#elseif input.attributes.min??]min="${input.attributes.min}"[/#if] name="${input.name}" [#if readOnly]readonly[/#if] ${input.required?then('required', '')} [#if (configuration.customRange && configuration.step??)]step="${configuration.step!}"[#elseif input.attributes.dataType?? && input.attributes.dataType="decimal" && input.attributes.step??]step="${input.attributes.step}"[/#if] placeholder="${configuration.placeholder!}" type="range" [#if input.value??]value="${input.value}"[/#if] />

		[#if input.errorMessage?has_content]
			<p class="font-weight-semi-bold mt-1 text-danger" id="${fragmentEntryLinkNamespace}-range-input-error-message">
				<svg class="lexicon-icon lexicon-icon-info-circle" focusable="false" role="presentation">
					<use xlink:href="${siteSpritemap}#info-circle" />
				</svg>

				<span>
					${input.errorMessage}
				</span>
			</p>
		[/#if]

		[#if input.showHelpText && input.helpText?has_content]
			<p class="mb-0 mt-1 text-secondary" id="${fragmentEntryLinkNamespace}-range-input-help-text">${htmlUtil.escape(input.helpText)}</p>
		[/#if]
	</div>
</div>