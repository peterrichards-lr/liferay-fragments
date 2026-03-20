[#attempt] [#assign displayFragmentName = fragmentName /] [#recover] [#assign
displayFragmentName = "" /] [/#attempt] [#if !displayFragmentName?has_content]
[#assign displayFragmentName = "Meta-Object Table" /] [/#if] [#assign
showFragmentHeader = configuration.showFragmentHeader!true /] [#if layoutMode ==
'edit']
<div class="meta-table-editor-header ${showFragmentHeader?then('show', '')}">
  ${displayFragmentName}
</div>
[/#if]

<div
  class="meta-table-container meta-table-${fragmentEntryLinkNamespace}"
  data-layout-mode="${layoutMode}"
  data-fragment-name="${displayFragmentName}"
  data-striped-row-type="${configuration.stripedRowType!'even'}"
  style="
    --header-text-color: ${configuration.headerTextColor!};
    --header-bg-color: ${configuration.headerBgColor!};
    --body-text-color: ${configuration.bodyTextColor!};
    --action-icon-color: ${configuration.actionIconColor!};
    --striped-bg-color: ${configuration.stripedBgColor!};
  "
>
  <div
    class="alert alert-info d-none mb-3"
    id="info-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>
  <div
    class="alert alert-danger d-none mb-3"
    id="error-${fragmentEntryLinkNamespace}"
    role="alert"
  ></div>

  <div
    class="meta-table-header d-flex justify-content-between align-items-center mb-4"
  >
    <h2
      class="object-title mb-0"
      data-lfr-editable-id="table-title"
      data-lfr-editable-type="text"
      id="table-title-${fragmentEntryLinkNamespace}"
    >
      Meta-Object Table
    </h2>
    <div class="table-actions d-flex gap-2">
      [#if configuration.enableAdd!false]
      <button
        class="btn btn-primary btn-sm"
        id="add-${fragmentEntryLinkNamespace}"
        aria-haspopup="dialog"
      >
        [@clay["icon"] symbol="plus" /] Add Entry
      </button>
      [/#if]
      <button
        class="btn btn-secondary btn-sm d-none"
        id="export-${fragmentEntryLinkNamespace}"
      >
        [@clay["icon"] symbol="download" /] Export CSV
      </button>
    </div>
  </div>

  <div class="table-responsive">
    <table
      class="table table-autofit show-quick-actions-on-hover table-hover table-list [#if configuration.enableStriped!false]table-striped[/#if]"
      id="table-${fragmentEntryLinkNamespace}"
      aria-labelledby="table-title-${fragmentEntryLinkNamespace}"
    >
      <thead>
        <tr id="thead-${fragmentEntryLinkNamespace}">
          <!-- Headers injected here with scope="col" -->
        </tr>
      </thead>
      <tbody id="tbody-${fragmentEntryLinkNamespace}">
        <tr>
          <td colspan="100" class="text-center p-5">
            <div class="meta-status" aria-live="polite">
              Loading object metadata and data...
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    class="meta-table-footer mt-4 d-flex justify-content-between align-items-center"
  >
    <div class="pagination-info text-muted small" aria-live="polite"></div>
    <nav
      aria-label="Table Pagination"
      id="pagination-${fragmentEntryLinkNamespace}"
      class="d-none"
    >
      <ul class="pagination mb-0">
        <li class="page-item disabled">
          <a class="page-link" href="#" aria-label="Go to previous page"
            >Previous</a
          >
        </li>
        <li class="page-item active">
          <a class="page-link" href="#" aria-current="page">1</a>
        </li>
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Go to next page">Next</a>
        </li>
      </ul>
    </nav>
  </div>

  <!-- Add Modal Structure -->
  [#if (configuration.enableAdd!false) && (configuration.addMode!"") == 'modal']
  <div
    class="meta-modal-overlay [#if layoutMode == 'view']d-none[/#if]"
    id="overlay-add-${fragmentEntryLinkNamespace}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-add-title-${fragmentEntryLinkNamespace}"
  >
    [#if layoutMode == 'edit']
    <div
      class="meta-dropzone-editor-label ${(configuration.addShowHeader!true)?then('show', '')}"
    >
      Add
    </div>
    [/#if]
    <div
      class="meta-modal-container modal-${configuration.addModalSize!'lg'}"
      id="modal-add-${fragmentEntryLinkNamespace}"
      data-show-title="${(configuration.addShowTitle!true)?c}"
    >
      <div class="meta-modal-header">
        <h3
          class="modal-title mb-0"
          data-lfr-editable-id="modal-add-title"
          data-lfr-editable-type="text"
          id="modal-add-title-${fragmentEntryLinkNamespace}"
        >
          Add New Record
        </h3>
        <button
          class="close-modal-btn"
          id="close-add-${fragmentEntryLinkNamespace}"
          aria-label="Close Modal"
        >
          [@clay["icon"] symbol="times" /]
        </button>
      </div>
      <div class="meta-modal-body">
        <lfr-drop-zone
          id="dropzone-add-${fragmentEntryLinkNamespace}"
        ></lfr-drop-zone>
      </div>
    </div>
  </div>
  [/#if]

  <!-- View Modal Structure -->
  [#if (configuration.enableView!false) && (configuration.viewMode!"") ==
  'modal']
  <div
    class="meta-modal-overlay [#if layoutMode == 'view']d-none[/#if]"
    id="overlay-view-${fragmentEntryLinkNamespace}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-view-title-${fragmentEntryLinkNamespace}"
  >
    [#if layoutMode == 'edit']
    <div
      class="meta-dropzone-editor-label ${(configuration.viewShowHeader!true)?then('show', '')}"
    >
      View
    </div>
    [/#if]
    <div
      class="meta-modal-container modal-${configuration.viewModalSize!'md'}"
      id="modal-view-${fragmentEntryLinkNamespace}"
      data-show-title="${(configuration.viewShowTitle!true)?c}"
    >
      <div class="meta-modal-header">
        <h3
          class="modal-title mb-0"
          data-lfr-editable-id="modal-view-title"
          data-lfr-editable-type="text"
          id="modal-view-title-${fragmentEntryLinkNamespace}"
        >
          View Record
        </h3>
        <button
          class="close-modal-btn"
          id="close-view-${fragmentEntryLinkNamespace}"
          aria-label="Close Modal"
        >
          [@clay["icon"] symbol="times" /]
        </button>
      </div>
      <div class="meta-modal-body">
        <lfr-drop-zone
          id="dropzone-view-${fragmentEntryLinkNamespace}"
        ></lfr-drop-zone>
      </div>
    </div>
  </div>
  [/#if]

  <!-- Edit Modal Structure -->
  [#if (configuration.enableEdit!false) && (configuration.editMode!"") ==
  'modal']
  <div
    class="meta-modal-overlay [#if layoutMode == 'view']d-none[/#if]"
    id="overlay-edit-${fragmentEntryLinkNamespace}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-edit-title-${fragmentEntryLinkNamespace}"
  >
    [#if layoutMode == 'edit']
    <div
      class="meta-dropzone-editor-label ${(configuration.editShowHeader!true)?then('show', '')}"
    >
      Edit
    </div>
    [/#if]
    <div
      class="meta-modal-container modal-${configuration.editModalSize!'lg'}"
      id="modal-edit-${fragmentEntryLinkNamespace}"
      data-show-title="${(configuration.editShowTitle!true)?c}"
    >
      <div class="meta-modal-header">
        <h3
          class="modal-title mb-0"
          data-lfr-editable-id="modal-edit-title"
          data-lfr-editable-type="text"
          id="modal-edit-title-${fragmentEntryLinkNamespace}"
        >
          Edit Record
        </h3>
        <button
          class="close-modal-btn"
          id="close-edit-${fragmentEntryLinkNamespace}"
          aria-label="Close Modal"
        >
          [@clay["icon"] symbol="times" /]
        </button>
      </div>
      <div class="meta-modal-body">
        <lfr-drop-zone
          id="dropzone-edit-${fragmentEntryLinkNamespace}"
        ></lfr-drop-zone>
      </div>
    </div>
  </div>
  [/#if]

  <div class="meta-editor-mappable-fields">
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
