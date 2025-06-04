[#assign inputType="text" /]
[#if configuration.enableSpinner]
    [#assign inputType="number" /]
[/#if]
[#assign numberContainerClass="number" /]
[#assign labelClass="digit" /]
[#if !configuration.showLabels]
    [#assign numberContainerClass=numberContainerClass+" hide-label" /]
    [#assign labelClass=labelClass+" hide-label" /]
[/#if]
[#assign labels = configuration.labelList?split(";") /]
[#assign totalDigits = configuration.integerDigitCount + configuration.decimalDigitCount /]
<div class="segmented-numeric" data-localizable="${input.localizable?string('true', 'false')}"
     style="--segmented-numeric-integer-color: ${configuration.integerFGColor};--segmented-numeric-integer-background-color: ${configuration.integerBGColor};--segmented-numeric-decimal-color: ${configuration.decimalFGColor};;--segmented-numeric-decimal-background-color: ${configuration.decimalBGColor};--label-color: ${configuration.labelColor};--segmented-numeric-font-size: ${configuration.digitFontSize};;--label-font-size: ${configuration.labelFontSize};">
  <div class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0">
    <label class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]"
           for="${fragmentEntryLinkNamespace}-numeric-input" id="${fragmentEntryLinkNamespace}-numeric-input-label">
			<span class="[#if !input.showLabel || !input.label?has_content]sr-only [/#if]custom-control-label-text">
				${htmlUtil.escape(input.label)}

				<span id="${fragmentEntryLinkNamespace}-numeric-read-only"
              class="[#if !input.readOnly]d-none[/#if]">(${languageUtil.get(locale, "read-only")})</span>

				[#if input.required][@clay["icon"] className="reference-mark" symbol="asterisk" /][/#if]
			</span>
    </label>

  </div>
  <div class="${numberContainerClass}">
    <input
            type="hidden"
            id="${fragmentEntryLinkNamespace}-numeric-input"
            name="${input.name}"
            [#if input.value??]value="${input.value}"[/#if]
    />
      [#list 1..totalDigits as i]
          [#assign classList = "digit"/]
          [#if i<= configuration.integerDigitCount]
              [#assign classList=classList+" int" /]
          [#else]
              [#assign classList=classList+" dec" /]
          [/#if]
        <label class="${labelClass}">
          <input
                  aria-describedby="${fragmentEntryLinkNamespace}-numeric-input-help-text"
                  aria-labelledby="${fragmentEntryLinkNamespace}-numeric-input-label [#if input.errorMessage?has_content]${fragmentEntryLinkNamespace}-numeric-input-error-message[/#if]"
                  size="1"
                  maxlength="1"
                  class="${classList}"
                  type="${inputType}"
                  id="segmented-numeric-digit-${i}-input"
                  data-digit="${i}"
                  [#if configuration.enableSpinner]min="0" max="9"[/#if]
                  [#if input.attributes.disabled?? && input.attributes.disabled]disabled[/#if]
                  [#if input.readOnly]readonly[/#if]
                  ${input.required?then('required', '')}
          />
            [#if i-1<labels?size]
                ${labels[i-1]?trim}
            [/#if]
        </label>
      [/#list]

      [#if !input.localizable && input.attributes.unlocalizedFieldsMessage??]
        <div aria-label="${input.attributes.unlocalizedFieldsMessage}" class="d-none lfr-portal-tooltip mt-1 pt-2"
             data-title="${input.attributes.unlocalizedFieldsMessage}"
             id="${fragmentEntryLinkNamespace}-unlocalized-info" role="tooltip" tabindex="0">
            [@clay["icon"] className="ml-2 mt-0 text-secondary" symbol="question-circle-full" /]
        </div>
      [/#if]
    <div [#if configuration.showLabels]style="margin-top: ${configuration.labelFontSize};"[/#if]>
      <p class="font-weight-semi-bold mt-1 text-danger"
         style="display: [#if input.errorMessage?has_content]block[#else]none[/#if];"
         id=" ${fragmentEntryLinkNamespace}-numeric-input-error-message">
        <svg class="lexicon-icon lexicon-icon-info-circle" focusable="false" role="presentation">
          <use xlink:href="${siteSpritemap}#info-circle"/>
        </svg>

        <span class="error-message">
					${input.errorMessage}
				</span>
      </p>
    </div>

      [#if input.showHelpText && input.helpText?has_content]
        <p class="mb-0 mt-1 text-secondary"
           id="${fragmentEntryLinkNamespace}-numeric-input-help-text">${htmlUtil.escape(input.helpText)}</p>
      [/#if]
  </div>
</div>