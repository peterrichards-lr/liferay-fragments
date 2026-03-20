[#assign ns = fragmentEntryLinkNamespace /]
<div class="date-display">
  [#if themeDisplay.isStateMaximized() == false &&
  (request.getAttribute("LIFERAY_SHARED_VISUAL_STATE_PAGE_EDITOR")?? ||
  request.getAttribute("LIFERAY_SHARED_VISUAL_STATE_FRAGMENT_EDITOR")??)]
  <div class="alert alert-warning">
    <strong>DEPRECATED:</strong> This fragment is deprecated. Please use native
    Liferay DXP date formatting instead.
  </div>
  [/#if]
  <div class="date-display-content">
    [#if configuration.showIcon]
    <span class="date-display-content__icon"
      >[@clay["icon"] symbol="calendar" /]</span
    >
    [/#if]
    <div class="date-display-content__date" id="${ns}_startDate">
      <span class="date-display-content__month" id="${ns}_startMonth"></span>
    </div>
    <div class="date-display-content__separator" id="${ns}_separator"></div>
    <div class="date-display-content__date" id="${ns}_endDate">
      <span class="date-display-content__month" id="${ns}_endMonth"></span>
    </div>
  </div>
</div>
