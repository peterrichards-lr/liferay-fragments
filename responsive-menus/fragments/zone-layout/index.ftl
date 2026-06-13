[#-- prettier-ignore --] [#assign isFlex =
configuration.contentDisplay?contains('flex') isRow =
configuration.contentDisplay?contains('row') displayValue = isFlex?then('flex',
'block') flexDirection = isFlex?then(isRow?then('row', 'column'), '') lockStyles
= !configuration.allowMenuOverride cssImportant = lockStyles?then(' !important',
'') zoneLayoutNamespace = "zone-layout-${fragmentEntryLinkNamespace}"
zoneLayoutClassList = [ "zone-layout", "zone-layout-fragment",
zoneLayoutNamespace, (lockStyles?then('', 'allow-override')) ]?filter(x ->
x?has_content), zoneLayoutClass = zoneLayoutClassList?join(' ')
zoneLayoutHeaderClass = "zone-layout-editor-padding" +
(configuration.zoneLayoutHeader?then(" show", "")) /]

<style>
  .${zoneLayoutNamespace}[data-layout-mode="edit"] :is(lfr-drop-zone .page-editor > div, lfr-drop-zone .lfr-tooltip-scope > div),
  .${zoneLayoutNamespace}[data-layout-mode="view"] :is(lfr-drop-zone .lfr-tooltip-scope > div),
  .${zoneLayoutNamespace}[data-layout-mode="view"] > div {
    display: ${displayValue}${cssImportant};
    flex-direction: ${flexDirection?has_content?then(flexDirection, 'unset')}${cssImportant};
    flex-wrap: ${isFlex?then(configuration.flexWrap, 'unset')}${cssImportant};
    align-items: ${isFlex?then(configuration.alignItems, 'unset')}${cssImportant};
    justify-content: ${isFlex?then(configuration.justifyContent, 'unset')}${cssImportant};
    gap: ${isFlex?then(configuration.flexGap, 'unset')}${cssImportant};
  }

  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .${zoneLayoutNamespace}[data-layout-mode="edit"]:not(.allow-override) :is(lfr-drop-zone .page-editor > div, lfr-drop-zone .lfr-tooltip-scope > div),
    .${zoneLayoutNamespace}[data-layout-mode="view"]:not(.allow-override) :is(lfr-drop-zone .lfr-tooltip-scope > div),
    .${zoneLayoutNamespace}[data-layout-mode="view"]:not(.allow-override) > div {
      flex-wrap: ${isFlex?then(configuration.flexWrap, 'unset')}
      align-items: ${isFlex?then(configuration.justifyContent, 'unset')}
      justify-content: ${isFlex?then(configuration.alignItems, 'unset')}
    }
  }
</style>

<div class="${zoneLayoutHeaderClass}">Zone Layout</div>

<div
  class="${zoneLayoutClass}"
  data-lock="${lockStyles?c}"
  data-display="${displayValue}"
  data-direction="${flexDirection}"
  data-layout-mode="${layoutMode}"
>
  <lfr-drop-zone></lfr-drop-zone>
</div>
