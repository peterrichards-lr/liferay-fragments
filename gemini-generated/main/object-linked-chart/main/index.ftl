[#attempt] [#assign displayFragmentName = fragmentName /] [#recover] [#assign
displayFragmentName = "" /] [/#attempt] [#if !displayFragmentName?has_content]
[#assign displayFragmentName = "Object-Linked Chart" /] [/#if] [#assign
showFragmentHeader = configuration.showFragmentHeader!true /] [#if layoutMode ==
'edit']
<div class="meta-chart-editor-header ${showFragmentHeader?then('show', '')}">
  ${displayFragmentName}
</div>
[/#if]

<div
  class="meta-chart-container chart-${fragmentEntryLinkNamespace}"
  data-layout-mode="${layoutMode}"
  data-fragment-name="${displayFragmentName}"
>
  <div
    class="alert alert-danger d-none mb-3"
    id="error-${fragmentEntryLinkNamespace}"
  ></div>
  <div
    class="alert alert-info d-none mb-3"
    id="info-${fragmentEntryLinkNamespace}"
  ></div>

  <div class="chart-header mb-4">
    <h2
      class="chart-title mb-0"
      data-lfr-editable-id="chart-title"
      data-lfr-editable-type="text"
    >
      Object Data Chart
    </h2>
  </div>

  <div
    class="chart-wrapper"
    style="position: relative; height: 400px; width: 100%"
  >
    <canvas id="chart-${fragmentEntryLinkNamespace}"></canvas>
  </div>

  <div class="meta-editor-mappable-fields mt-4">
    <div class="mappable-field-item">
      <label>Object ERC</label>
      <div
        class="small text-muted"
        data-lfr-editable-id="object-erc"
        data-lfr-editable-type="text"
      >
        ${configuration.objectERC!}
      </div>
    </div>
    <div class="mappable-field-item">
      <label>X-Axis Label</label>
      <div
        class="axis-label small text-muted"
        data-lfr-editable-id="x-axis-label"
        data-lfr-editable-type="text"
      >
        ${configuration.xAxisLabel!}
      </div>
    </div>
    <div class="mappable-field-item">
      <label>Y-Axis Label</label>
      <div
        class="axis-label small text-muted"
        data-lfr-editable-id="y-axis-label"
        data-lfr-editable-type="text"
      >
        ${configuration.yAxisLabel!}
      </div>
    </div>
    [#if configuration.enableSecondaryYAxis]
    <div class="mappable-field-item">
      <label>Secondary Y-Axis Label</label>
      <div
        class="axis-label small text-muted"
        data-lfr-editable-id="y-axis-label-2"
        data-lfr-editable-type="text"
      >
        ${configuration.secondaryYAxisLabel!}
      </div>
    </div>
    [/#if]
  </div>
</div>
