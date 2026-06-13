[#-- prettier-ignore --] [#assign elementId =
fragmentElementId?has_content?then(fragmentElementId[9..], ""), buttonClasses =
[ "btn", "btn-${configuration.buttonSize!'nm'}",
"btn-${configuration.buttonType!'primary'}", "icon-button",
configuration.buttonCustomClasses!"" ]?filter(x -> x?has_content)?join(' ') /]

<div class="misc-icon-button">
  <a
    class="${buttonClasses}"
    id="${elementId}"
    href="${configuration.buttonLink!''}"
  >
    [#if configuration.iconName?has_content] [@clay["icon"]
    symbol="${configuration.iconName}" /] [/#if]
    <span data-lfr-editable-id="button-text" data-lfr-editable-type="text"
      >Button</span
    >
  </a>
</div>
