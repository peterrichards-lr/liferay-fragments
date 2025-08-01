<div class="service-card"
  style="--size: ${configuration.size}; --icon-color: ${configuration.iconColor}; --background-color: ${configuration.backgroundColor};">
  <span aria-hidden="true" class="loading-animation-squares loading-animation-primary loading-animation-md"></span>
  <div class="service-card___content d-none flex-row align-items-center justify-content-start">
    [#if configuration.showIcon]
    <div class="circle">
      <span class="svg-icon"></span>
    </div>
    [/#if]
    <div class="d-flex flex-column flex-grow-1">
      <div class="component-heading h5 mb-0 text-break" style="font-weight: 600;" data-lfr-editable-id="service-title"
        data-lfr-editable-type="text">Title</div>
      <div class="clearfix component-paragraph text-paragraph-sm text-break" data-lfr-editable-id="service-description"
        data-lfr-editable-type="rich-text">Description</div>
    </div>
    <div>
      [@clay["icon"] symbol="angle-right" /]
    </div>
  </div>
  <span class="config-icon" style="display: none;" data-lfr-editable-id="icon"
    data-lfr-editable-type="text">&nbsp;</span>
  <span class="config-title" style="display: none;" data-lfr-editable-id="title"
    data-lfr-editable-type="text">&nbsp;</span>
</div>