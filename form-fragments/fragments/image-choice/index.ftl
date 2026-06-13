[#assign readOnly = input.attributes.readOnly?? && input.attributes.readOnly /]
[#assign options = [] /] [#if configuration.optionsJSON?has_content] [#attempt]
[#assign options = configuration.optionsJSON?eval_json /] [#recover] [#assign
options = [] /] [/#attempt] [/#if]

<div
  class="image-choice-input"
  style="--grid-columns: ${configuration.gridColumns!3}"
>
  <div
    class="form-group [#if input.errorMessage?has_content]has-error[/#if] mb-0"
  >
    <label
      class="[#if !input.showLabel || !input.label?has_content]sr-only[/#if]"
      for="${fragmentEntryLinkNamespace}-image-choice"
      id="${fragmentEntryLinkNamespace}-image-choice-label"
    >
      ${htmlUtil.escape(input.label)} [#if readOnly](${languageUtil.get(locale,
      "read-only")})[#elseif input.required][@clay["icon"]
      className="reference-mark" symbol="asterisk" /][/#if]
    </label>

    <div class="image-grid" id="${fragmentEntryLinkNamespace}-image-choice">
      [#if options?has_content] [#list options as option]
      <label
        class="image-choice-item ${configuration.imageSize!}"
        for="${fragmentEntryLinkNamespace}-opt-${option_index}"
      >
        <input
          id="${fragmentEntryLinkNamespace}-opt-${option_index}"
          name="${input.name}"
          type="${configuration.selectionType!'radio'}"
          value="${option.value!}"
          [#if readOnly]disabled[/#if]
          [#if input.value?? && input.value?contains(option.value)]checked[/#if]
        />
        <div class="image-card">
          [#if option.imageUrl?has_content]
          <img src="${option.imageUrl}" alt="${option.label!}" />
          [/#if]
          <span class="image-label">${option.label!}</span>
        </div>
      </label>
      [/#list] [#else]
      <div class="alert alert-info">
        ${languageUtil.get(locale,
        "please-configure-image-options-in-json-format.")}
      </div>
      [/#if]
    </div>

    [#if input.errorMessage?has_content]
    <p
      class="font-weight-semi-bold mt-1 text-danger"
      id="${fragmentEntryLinkNamespace}-image-choice-error-message"
    >
      [@clay["icon"] symbol="info-circle" /]
      <span>${input.errorMessage}</span>
    </p>
    [/#if] [#if input.showHelpText && input.helpText?has_content]
    <p
      class="mb-0 mt-1 text-secondary"
      id="${fragmentEntryLinkNamespace}-image-choice-help-text"
    >
      ${htmlUtil.escape(input.helpText)}
    </p>
    [/#if]
  </div>
</div>
