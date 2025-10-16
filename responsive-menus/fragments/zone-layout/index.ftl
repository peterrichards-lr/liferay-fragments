[#assign
isFlex = configuration.contentDisplay?contains('flex')
isRow = configuration.contentDisplay?contains('row')
displayValue = isFlex?then('flex', 'block')
flexDirection = isFlex?then(isRow?then('row', 'column'), '')
cssImportant = configuration.allowMenuOverride?then('', ' !important')
zoneLayoutNamespace = "zone-layout-${fragmentEntryLinkNamespace}",
zoneLayoutClassList = [
zoneLayoutNamespace,
"zone-layout",
(configuration.zoneLayoutHeader?then('allow-override',''))
]?filter(x -> x?has_content),
zoneLayoutClass = zoneLayoutClassList?join(' ')
zoneLayoutHeaderClass = "zone-layout-editor-padding" + (configuration.zoneLayoutHeader?then(" show", ""))
/]

<style>
  body.has-edit-mode-menu .page-editor .zone-layout-editor-padding.show {
    height: 26px;
    min-height: 26px;
    box-sizing: border-box;
    background-color: rgb(247, 248, 249);
    text-align: right;
    font-size: 12px;
    line-height: 26px;
    border-radius: 2px 2px 0 0;
    padding: 0 8px;
    font-weight: 600;
  }

  .zone-layout-editor-padding {
    height: 0;
    overflow: hidden;
  }

  body.has-edit-mode-menu .${zoneLayoutNamespace} lfr-drop-zone .page-editor > div,
  body.has-edit-mode-menu .${zoneLayoutNamespace} lfr-drop-zone .lfr-tooltip-scope > div,
  body:not(.has-edit-mode-menu) .${zoneLayoutNamespace} lfr-drop-zone .lfr-tooltip-scope > div,
  body:not(.has-edit-mode-menu) .${zoneLayoutNamespace} > div {
    display: ${displayValue}${cssImportant};
    flex-direction: ${flexDirection?has_content?then(flexDirection, 'unset')}${cssImportant};
    flex-wrap: ${isFlex?then(configuration.flexWrap, 'unset')}${cssImportant};
    align-items: ${isFlex?then(configuration.alignItems, 'unset')}${cssImportant};
    justify-content: ${isFlex?then(configuration.justifyContent, 'unset')}${cssImportant};
    gap: ${isFlex?then(configuration.flexGap, 'unset')}${cssImportant};
  }

  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    body.has-edit-mode-menu .${zoneLayoutNamespace}:not(.allow-override) lfr-drop-zone .page-editor > div,
    body.has-edit-mode-menu .${zoneLayoutNamespace}:not(.allow-override) lfr-drop-zone .lfr-tooltip-scope > div,
    body:not(.has-edit-mode-menu) .${zoneLayoutNamespace}:not(.allow-override) lfr-drop-zone .lfr-tooltip-scope > div,
    body:not(.has-edit-mode-menu) .${zoneLayoutNamespace}:not(.allow-override) > div {
      align-items: ${isFlex?then(configuration.justifyContent, 'unset')}${cssImportant};
      justify-content: ${isFlex?then(configuration.alignItems, 'unset')}${cssImportant};
    }
  }

  body.has-edit-mode-menu .${zoneLayoutNamespace} .page-editor__no-fragments-state {
    min-width: 150px;
  }

  body.has-edit-mode-menu .${zoneLayoutNamespace} .page-editor__no-fragments-state:first-child:before {
    content: unset;
  }

  .${zoneLayoutNamespace} :where(a, button, [tabindex]):focus-visible {
    outline: 2px solid currentColor${cssImportant};
    outline-offset: 2px${cssImportant};
    border-radius: .25rem${cssImportant};
  }

  [#if isFlex]
  .is-menu-view .${zoneLayoutNamespace}.zone-layout {
    flex-direction: column${cssImportant};
    align-items: stretch${cssImportant};
    justify-content: flex-start${cssImportant};
  }
  [/#if]
</style>

<div class="${zoneLayoutClass}">
  <div class="${zoneLayoutHeaderClass}" aria-hidden="true">Zone Layout</div>
  <lfr-drop-zone></lfr-drop-zone>
</div>