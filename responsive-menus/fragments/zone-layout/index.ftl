[#assign
isFlex = configuration.contentDisplay?contains('flex')
isRow = configuration.contentDisplay?contains('row')
displayValue = isFlex?then('flex', 'block')
flexDirection = isFlex?then(isRow?then('row', 'column'), '')
cssImportant = configuration.allowMenuOverride?then('', ' !important')
zoneLayoutHeaderClass = "zone-layout-editor-padding" + (configuration.zoneLayoutHeader?then(" show", ""))
/]

<style scoped>
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

  body.has-edit-mode-menu .zone-layout lfr-drop-zone .page-editor > div,
  .zone-layout > div {
    display: ${displayValue}${cssImportant};
    flex-direction: ${flexDirection?has_content?then(flexDirection, 'unset')}${cssImportant};
    flex-wrap: ${isFlex?then(configuration.flexWrap, 'unset')}${cssImportant};
    align-items: ${isFlex?then(configuration.alignItems, 'unset')}${cssImportant};
    justify-content: ${isFlex?then(configuration.justifyContent, 'unset')}${cssImportant};
    gap: ${isFlex?then(configuration.flexGap, 'unset')}${cssImportant};
  }

  body.has-edit-mode-menu .zone-layout .page-editor__no-fragments-state {
    min-width: 100px;
  }

  body.has-edit-mode-menu .zone-layout .page-editor__no-fragments-state:first-child:before {
    content: unset;
  }
</style>

<div class="zone-layout">
  <div class="${zoneLayoutHeaderClass}">Zone Layout</div>
  <lfr-drop-zone></lfr-drop-zone>
</div>
