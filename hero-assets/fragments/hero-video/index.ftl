[#assign useStandardControl = configuration.controls && !configuration.useCustomControls /]
<div
  class="row banner-colour-dark banner-content-alignment-centre overlayContainer"
  style="--margin-top: ${configuration.marginTop!}; --margin-bottom: ${configuration.marginBottom!}; --margin-left: ${configuration.marginLeft!}; --margin-right: ${configuration.marginRight!}; --video-height: ${configuration.height!}; --video-width: ${configuration.width!}; --control-colour: ${configuration.controlColor!};"
>
  <div class="overlayContent">
    <span data-lfr-editable-id="overlay-text" data-lfr-editable-type="text">
      A World-Class University
    </span>
  </div>
  <div
    id="vidbutton-${fragmentEntryLinkNamespace}"
    class="vidbutton"
    role="button"
    aria-label="Pause"
    aria-pressed="false"
    tabindex="0"
  >
    <svg
      class="lexicon-icon lexicon-icon-sites"
      role="presentation"
      viewBox="0 0 512 512"
    >
      <use xlink:href="/o/dialect-theme/images/clay/icons.svg#pause"></use>
    </svg>
  </div>
  <div class="containerBackground"></div>
  <video id="myvid-${fragmentEntryLinkNamespace}" class="myvid" ${useStandardControl?then('controls','')} ${configuration.autoplay?then('autoplay','')} ${configuration.muted?then('muted','')} ${configuration.loop?then('loop','')} preload="${configuration.preload!}"></video>
</div>
