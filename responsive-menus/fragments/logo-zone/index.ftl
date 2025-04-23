[#assign
logoClass = configuration.logoAdaption + (configuration.alwaysDisplayLogo?then(" logo-always", ""))
isFlex = configuration.contentDisplay?contains('flex')
isRow = configuration.contentDisplay?contains('row')
displayValue = isFlex?then('flex', 'block')
flexDirection = isFlex?then(isRow?then('row', 'column'), '')
cssImportant = configuration.allowMenuOverride?then('', ' !important')
logoZoneHeaderClass = "logo-zone-editor-padding" + (configuration.logoZoneHeader?then(" show", ""))
/]

<style scoped>
  body.has-edit-mode-menu .logo-zone lfr-drop-zone .page-editor > div,
  .logo-zone .site-logo .logo-link {
    display: ${displayValue}${cssImportant};
    flex-direction: ${flexDirection?has_content?then(flexDirection, 'unset')}${cssImportant};
    flex-wrap: ${isFlex?then(configuration.flexWrap, 'unset')}${cssImportant};
    align-items: ${isFlex?then(configuration.alignItems, 'unset')}${cssImportant};
    justify-content: ${isFlex?then(configuration.justifyContent, 'unset')}${cssImportant};
    gap: ${isFlex?then(configuration.flexGap, 'unset')}${cssImportant};
  }

  body.has-edit-mode-menu .logo-zone .page-editor__no-fragments-state {
    min-width: 100px;
  }

  body.has-edit-mode-menu .logo-zone .page-editor__no-fragments-state:first-child:before {
    content: unset;
  }

  body.has-edit-mode-menu .page-editor .logo-zone-editor-padding.show {
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

  .logo-zone-editor-padding {
    height: 0;
    overflow: hidden;
  }
</style>

<div class="logo-zone ${logoClass}">
  <div class="${logoZoneHeaderClass}">Logo Zone</div>
  <lfr-drop-zone></lfr-drop-zone>
</div>