<div class="component-tabs">
  <nav
    class="navbar navbar-collapse-relative navbar-expand-md navbar-underline navigation-bar navigation-bar-light"
  >
    <button
      aria-activedescendant
      aria-controls="navigationBarCollapse-${fragmentEntryLinkNamespace}"
      aria-expanded="false"
      aria-haspopup="listbox"
      aria-label="${languageUtil.format(locale, 'current-x', ['selection'])}:"
      class="collapsed navbar-toggler navbar-toggler-link"
      data-toggle="collapse"
      role="combobox"
    >
      <span class="navbar-text-truncate">Tab 1</span>
      <span class="icon-caret-bottom"></span>
    </button>

    <div
      class="collapse navbar-collapse"
      id="navigationBarCollapse-${fragmentEntryLinkNamespace}"
    >
      <ul class="navbar-nav" role="tablist">
        [#assign numTabs = configuration.numberOfTabs!4]
        [#if numTabs?is_string][#assign numTabs = numTabs?number][/#if]
        
        <li class="nav-item [#if numTabs < 1]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel1-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab1-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title1" data-lfr-editable-type="text" data-lfr-priority="1" tabindex="-1">Tab 1</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 2]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel2-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab2-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title2" data-lfr-editable-type="text" data-lfr-priority="2" tabindex="-1">Tab 2</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 3]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel3-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab3-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title3" data-lfr-editable-type="text" data-lfr-priority="3" tabindex="-1">Tab 3</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 4]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel4-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab4-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title4" data-lfr-editable-type="text" data-lfr-priority="4" tabindex="-1">Tab 4</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 5]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel5-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab5-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title5" data-lfr-editable-type="text" data-lfr-priority="5" tabindex="-1">Tab 5</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 6]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel6-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab6-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title6" data-lfr-editable-type="text" data-lfr-priority="6" tabindex="-1">Tab 6</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 7]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel7-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab7-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title7" data-lfr-editable-type="text" data-lfr-priority="7" tabindex="-1">Tab 7</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 8]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel8-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab8-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title8" data-lfr-editable-type="text" data-lfr-priority="8" tabindex="-1">Tab 8</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 9]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel9-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab9-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title9" data-lfr-editable-type="text" data-lfr-priority="9" tabindex="-1">Tab 9</span>
          </button>
        </li>
        <li class="nav-item [#if numTabs < 10]d-none[/#if]" role="presentation">
          <button aria-controls="tabPanel10-${fragmentEntryLinkNamespace}" aria-selected="false" class="nav-link" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tab10-${fragmentEntryLinkNamespace}" role="tab">
            <span class="navbar-text-truncate" data-lfr-editable-id="title10" data-lfr-editable-type="text" data-lfr-priority="10" tabindex="-1">Tab 10</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>

  <div class="tab-panel">
    <div aria-labelledby="tab1-${fragmentEntryLinkNamespace}" class="[#if numTabs < 1]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel1-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="1" data-lfr-priority="1"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab2-${fragmentEntryLinkNamespace}" class="[#if numTabs < 2]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel2-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="2" data-lfr-priority="2"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab3-${fragmentEntryLinkNamespace}" class="[#if numTabs < 3]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel3-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="3" data-lfr-priority="3"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab4-${fragmentEntryLinkNamespace}" class="[#if numTabs < 4]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel4-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="4" data-lfr-priority="4"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab5-${fragmentEntryLinkNamespace}" class="[#if numTabs < 5]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel5-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="5" data-lfr-priority="5"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab6-${fragmentEntryLinkNamespace}" class="[#if numTabs < 6]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel6-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="6" data-lfr-priority="6"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab7-${fragmentEntryLinkNamespace}" class="[#if numTabs < 7]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel7-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="7" data-lfr-priority="7"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab8-${fragmentEntryLinkNamespace}" class="[#if numTabs < 8]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel8-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="8" data-lfr-priority="8"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab9-${fragmentEntryLinkNamespace}" class="[#if numTabs < 9]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel9-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="9" data-lfr-priority="9"></lfr-drop-zone>
    </div>
    <div aria-labelledby="tab10-${fragmentEntryLinkNamespace}" class="[#if numTabs < 10]d-none[/#if] tab-panel-item" data-fragment-namespace="${fragmentEntryLinkNamespace}" id="tabPanel10-${fragmentEntryLinkNamespace}" role="tabpanel" tabindex="0">
      <lfr-drop-zone data-lfr-drop-zone-id="10" data-lfr-priority="10"></lfr-drop-zone>
    </div>
  </div>
</div>
