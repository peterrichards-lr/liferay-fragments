[#attempt] [#assign displayFragmentName = fragmentName /] [#recover] [#assign
displayFragmentName = "" /] [/#attempt] [#if !displayFragmentName?has_content]
[#assign displayFragmentName = "Meta-Object Form" /] [/#if] [#assign
showFragmentHeader = configuration.showFragmentHeader!true /] [#if layoutMode ==
'edit']
<div class="meta-form-editor-header ${showFragmentHeader?then('show', '')}">
  ${displayFragmentName}
</div>
[/#if]

<div
  class="meta-form-container meta-form-${fragmentEntryLinkNamespace}"
  data-layout-mode="${layoutMode}"
  data-fragment-name="${displayFragmentName}"
  role="region"
  aria-labelledby="form-title-${fragmentEntryLinkNamespace}"
>
  <div
    class="alert alert-danger d-none"
    id="error-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>
  <div
    class="alert alert-info d-none"
    id="info-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>

  <div class="meta-form-header mb-4">
    <h2
      class="object-title mb-0"
      data-lfr-editable-id="form-title"
      data-lfr-editable-type="text"
      id="form-title-${fragmentEntryLinkNamespace}"
    >
      Meta-Object Form
    </h2>
  </div>

  [#if configuration.enableRecordSelection && layoutMode == 'view']
  <div
    class="record-selector-wrap mb-4"
    id="selector-${fragmentEntryLinkNamespace}"
  >
    <div class="meta-status small text-muted" aria-live="polite">
      Loading records...
    </div>
  </div>
  [/#if]

  <form id="form-${fragmentEntryLinkNamespace}">
    <div class="form-fields-wrap">
      <div class="text-center p-5">
        <div class="meta-status" aria-live="polite">
          Initializing form fields...
        </div>
      </div>
    </div>

    <div
      class="form-status-msg d-none mt-3"
      aria-live="assertive"
      role="alert"
    ></div>

    <div class="form-actions mt-4">
      <button
        type="submit"
        class="btn btn-primary"
        style="background-color: ${configuration.buttonColor!}; border-color: ${configuration.buttonColor!};"
      >
        <span data-lfr-editable-id="submit-label" data-lfr-editable-type="text"
          >Submit</span
        >
      </button>
    </div>
  </form>

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
  </div>
</div>
