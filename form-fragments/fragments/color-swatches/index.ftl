[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]
[#assign swatches = (configuration.swatchesJSON!"")?split(",") /]

<div class="color-swatches-input">
  <div
    class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0"
  >
    <label
      class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]"
      for="${fragmentEntryLinkNamespace}-color-swatches"
      id="${fragmentEntryLinkNamespace}-color-swatches-label"
    >
      ${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale,
      "read-only")})[#elseif input.required][@clay["icon"]
      className="reference-mark" symbol="asterisk" /][/#if]
    </label>

    [#if configuration.showValue]
    <div class="current-value-display mb-2">
      <span class="text-secondary"
        >${languageUtil.get(locale, "selected-color")}:</span
      >
      <span class="selected-color-name font-weight-bold">${input.value!}</span>
    </div>
    [/#if]

    <div
      class="swatch-grid ${configuration.swatchShape!'circle'}"
      id="${fragmentEntryLinkNamespace}-color-swatches"
    >
      [#list swatches as swatch] [#assign color = swatch?trim /]
      <label
        class="swatch-item ${configuration.swatchSize!}"
        for="${fragmentEntryLinkNamespace}-swatch-${swatch_index}"
        title="${color}"
      >
        <input
          id="${fragmentEntryLinkNamespace}-swatch-${swatch_index}"
          name="${input.name}"
          type="radio"
          value="${color}"
          [#if readOnly]disabled[/#if]
          [#if input.value?? && input.value == color]checked[/#if]
        />
        <div class="swatch-visual" style="background-color: ${color};">
          [@clay["icon"] className="check-icon" symbol="check" /]
        </div>
      </label>
      [/#list]
    </div>

    [#if input.errorMessage?has_content]
    <p
      class="font-weight-semi-bold mt-1 text-danger"
      id="${fragmentEntryLinkNamespace}-color-swatches-error-message"
    >
      [@clay["icon"] symbol="info-circle" /]
      <span>${input.errorMessage}</span>
    </p>
    [/#if] [#if input.showHelpText && input.helpText?has_content]
    <p
      class="mb-0 mt-1 text-secondary"
      id="${fragmentEntryLinkNamespace}-color-swatches-help-text"
    >
      ${htmlUtil.escape(input.helpText)}
    </p>
    [/#if]
  </div>
</div>
