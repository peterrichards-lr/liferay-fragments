<div class="service-card" data-layout-mode="${layoutMode}"
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

    <div class="meta-editor-mappable-fields">
    <div class="mappable-field-item">
      <label>Icon Identifier</label>
      <div class="config-icon" data-lfr-editable-id="icon" data-lfr-editable-type="text">
        ${configuration.icon!}
      </div>
    </div>
    <div class="mappable-field-item">
      <label>Title (Metadata)</label>
      <div class="config-title" data-lfr-editable-id="title" data-lfr-editable-type="text">
        ${configuration.title!}
      </div>
    </div>
    </div>
    </div>