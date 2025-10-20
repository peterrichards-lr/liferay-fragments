[#assign
logoClass = configuration.logoAdaption + (configuration.alwaysDisplayLogo?then(" logo-always", ""))
isFlex = configuration.contentDisplay?contains('flex')
isRow = configuration.contentDisplay?contains('row')
displayValue = isFlex?then('flex', 'block')
flexDirection = isFlex?then(isRow?then('row', 'column'), '')
lockStyles = !configuration.allowMenuOverride
logoZoneHeaderClass = "logo-zone-editor-padding" + (configuration.logoZoneHeader?then(" show", ""))
/]

<div class="${logoZoneHeaderClass}">Logo Zone</div>

<div class="logo-zone logo-zone-fragment ${logoClass}"
  data-lock="${lockStyles?c}"
  data-display="${displayValue}"
  data-direction="${flexDirection}"
  style="
    --lz-display: ${displayValue};
    --lz-flex-direction: ${flexDirection?has_content?then(flexDirection, 'initial')};
    --lz-flex-wrap: ${isFlex?then(configuration.flexWrap, 'initial')};
    --lz-align-items: ${isFlex?then(configuration.alignItems, 'initial')};
    --lz-justify-content: ${isFlex?then(configuration.justifyContent, 'initial')};
    --lz-gap: ${isFlex?then(configuration.flexGap, '0')};"
>
  <lfr-drop-zone></lfr-drop-zone>
</div>