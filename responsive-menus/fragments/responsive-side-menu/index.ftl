[#--noinspection CssUnusedSymbol,CssUnresolvedCustomProperty,CssInvalidPropertyValue--]
[#assign
menuClassesList = [
"fragment-menu-${fragmentEntryLinkNamespace}",
"fragment-menu",
configuration.menuStyle,
(configuration.separator?then('separator',''))
]?filter(x -> x?has_content),
menuClasses = menuClassesList?join(' '),

dropzoneConfig = configuration.dropzoneConfig,

menuHeaderClass = 'fragment-menu-editor-padding' + (configuration.menuHeader?then(' show','')),

menuTextAlign=configuration.menuStyle?contains('menu-right')?then("right", "left"),

menuId = 'nav-' + fragmentEntryLinkNamespace,

langDir = (locale?starts_with("ar") || locale?starts_with("he"))?then("rtl","ltr"),
htmlLang = locale?replace("_", "-")
/]

[#assign zoneMap = {
'menu-only': ['menu'],
'menu-upper-zone': ['upper','menu'],
'menu-lower-zone': ['menu','lower'],
'menu-both-zones': ['upper','menu','lower']
},
zones = zoneMap[dropzoneConfig]!['menu'],
dropzoneCount = zones?size
/]

[#macro renderHamburgerIcon]
  <div class="hamburger">
    <button class="fragment-menu-icon"
            type="button"
            aria-label="Open menu"
            aria-controls="fragmentSideMenuList-${fragmentEntryLinkNamespace}"
            aria-expanded="false">
      <span class="visually-hidden">Menu</span>
      <span class="bar" aria-hidden="true"></span>
      <span class="bar" aria-hidden="true"></span>
      <span class="bar" aria-hidden="true"></span>
    </button>
  </div>
[/#macro]

[#macro renderDropzone zone]
  [#local zoneId = (zone == 'menu')?then(
    "fragmentSideMenuList-${fragmentEntryLinkNamespace}",
    "dropzone-${zone}-${fragmentEntryLinkNamespace}"
  ) /]
  [#if zone == 'menu']
    <nav id="${zoneId}" class="${menuClasses} dropzone dropzone-${zone}" aria-label="Side menu">
      <lfr-drop-zone></lfr-drop-zone>
    </nav>
  [#else]
    <section id="${zoneId}" class="dropzone dropzone-${zone}" aria-label="${zone?cap_first} zone">
      <lfr-drop-zone></lfr-drop-zone>
    </section>
  [/#if]
[/#macro]

[#macro renderDropzones zones]
  <div id="${menuId}" class="fragment-root-${fragmentEntryLinkNamespace} fragment-root" role="navigation"
       aria-label="Responsive Menu" lang="${htmlLang}" dir="${langDir}">
    <div class="${menuHeaderClass}">Responsive Menu</div>
    <div class="dropzone-wrapper dropzone-wrapper-${configuration.dropzoneConfig}">
        [@renderHamburgerIcon /]
      <div class="hamburger-zone-wrapper">
        <div class="hamburger-zone-inner">
            [#list zones as zone]
                [@renderDropzone zone /]
            [/#list]
        </div>
      </div>
    </div>
  </div>
[/#macro]

<style>
  :root {
     --side-menu-open-duration: .5s;
    --page-editor-breadcrumb-height: 0px;
    --responsive-menu-zone-count: ${dropzoneCount};
    --responsive-menu-zone-gap: ${configuration.dropzoneGap};
    --responsive-menu-zone-flex-grow: ${configuration.dropzoneGrower};
    --responsive-menu-item-logo-max-width: ${configuration.menuItemLogoMaxWidth};
    --responsive-menu-item-logo-max-height: ${configuration.menuItemLogoMaxHeight};
    --responsive-menu-breakpoint-desktop-menu-background-color: ${configuration.desktopMenuBgColor};
    --responsive-menu-breakpoint-tablet-enabled: ${configuration.enableTabletBreakpoint?c};
    --responsive-menu-breakpoint-tablet-width: ${configuration.tabletBreakpoint};
    --responsive-menu-breakpoint-tablet-menu-background-color: ${configuration.tabletMenuBgColor};
    --responsive-menu-breakpoint-phone-landscape-enabled: ${configuration.enableLandscapePhoneBreakpoint?c};
    --responsive-menu-breakpoint-phone-landscape-width: ${configuration.landscapePhoneBreakpoint};
    --responsive-menu-breakpoint-phone-landscape-menu-background-color: ${configuration.landscapePhoneMenuBgColor};
    --responsive-menu-breakpoint-phone-portrait-enabled: ${configuration.enablePortraitPhoneBreakpoint?c};
    --responsive-menu-breakpoint-phone-portrait-width: ${configuration.portraitPhoneBreakpoint};
    --responsive-menu-breakpoint-phone-portrait-menu-background-color: ${configuration.portraitPhoneMenuBgColor};
    --responsive-menu-limit-width: ${configuration.limitMenuWidth?c};
  }

  .visually-hidden{
    position:absolute !important;
    width:1px;
    height:1px;
    padding:0;
    margin:-1px;
    overflow:hidden;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    border:0;
    white-space:nowrap;
  }

  .fragment-menu-editor-padding { height:0; overflow:hidden; }
  body.has-edit-mode-menu .page-editor .fragment-menu-editor-padding.show {
    height:26px; min-height:26px; box-sizing:border-box; background:#f7f8f9; text-align:right;
    font-size:12px; line-height:26px; border-radius:2px 2px 0 0; padding:0 8px; font-weight:600;
  }

  [#if configuration.limitMenuWidth]
  :root { --responsive-menu-width: ${configuration.menuWidth}; }
  [/#if]

  .hamburger-zone-wrapper { max-width: var(--responsive-menu-min-width, none); }

  [#if configuration.limitMenuWidth]
  [#if configuration.menuItemOverflow == 'clip']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { text-overflow: clip; }
  [#elseif configuration.menuItemOverflow == 'wrap']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { white-space: normal; }
  [#elseif configuration.menuItemOverflow == 'none']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { text-overflow: unset; white-space: normal; overflow: visible; }
  [/#if]
  [#else]
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { text-overflow: unset; white-space: nowrap; overflow: visible; }
  [/#if]

  body:has(div.page-editor__layout-breadcrumbs:not(.d-none)) { --page-editor-breadcrumb-height: 29px; }

  .lfr-layout-structure-item-responsive-side-menu { position: -webkit-sticky; position: sticky; top: 0; height: 100vh; z-index: auto; }
  .lfr-layout-structure-item-responsive-side-menu > div { height: 100%; }
  body.has-control-menu:not(.has-edit-mode-menu) .lfr-layout-structure-item-responsive-side-menu { top: var(--control-menu-container-height, 0); height: calc(100vh - var(--control-menu-container-height, 0)); }
  body.has-control-menu.has-edit-mode-menu .lfr-layout-structure-item-responsive-side-menu { height: calc(100vh - var(--control-menu-container-height, 0) - var(--toolbar-height, 64px) - var(--page-editor-breadcrumb-height, 29px)); }

  [#if configuration.menuStyle?contains('menu-right')]
  .lfr-layout-structure-item-responsive-side-menu { position: fixed; }
  body.has-control-menu .master-page .lfr-layout-structure-item-responsive-side-menu,
  body.has-control-menu .page-editor .lfr-layout-structure-item-responsive-side-menu { position: relative; top: 0; }
  [/#if]

  body.has-control-menu .master-page .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)),
  body.has-control-menu .page-editor .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)) { flex-grow: 1; }
  .hamburger-zone-inner .${configuration.dropzoneGrower} { flex-grow: 1; }

  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state { min-width: 100px; padding: calc((-7 * var(--responsive-menu-zone-count, 1) + 26) * 1vh) 12% !important; }
  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state:first-child:before { color:#6b6c7e; font-size:14px; font-weight:bold; text-align:center; margin:0 0 1rem; }
  body.has-edit-mode-menu .dropzone-upper .page-editor__no-fragments-state:first-child:before { content:"Upper Zone"; }
  body.has-edit-mode-menu .dropzone-menu .page-editor__no-fragments-state:first-child:before { content:"Menu Zone"; }
  body.has-edit-mode-menu .dropzone-lower .page-editor__no-fragments-state:first-child:before { content:"Lower Zone"; }
  body.has-edit-mode-menu .page-editor div.page-editor__container > div[data-name="Drop Zone"],
  body .page-editor div.page-editor__container > div[data-name="Main"] { flex-grow: 1; }
  body.has-edit-mode-menu .page-editor div.page-editor__container > div:has(div[data-name="Drop Zone"]),
  body .page-editor div.page-editor__container > div:has(div[data-name="Main"]) { flex-grow: 1; }
  body.has-edit-mode-menu div.master-page div:has(#page-editor) { flex-grow: 1; }

  [#if configuration.menuStyle?contains('menu-left')]
  .lfr-layout-structure-item-responsive-side-menu { left: 0; }
  [#else].lfr-layout-structure-item-responsive-side-menu { right: 0; }
  [/#if]

  .fragment-root { height: 100%; }
  .fragment-root .fragment-menu-icon { display: none; }

  .fragment-root .dropzone-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
  .fragment-root .hamburger-zone-wrapper { height: 100%; }
  .fragment-root .hamburger-zone-inner { background-color: var(--responsive-menu-breakpoint-desktop-menu-background-color, transparent); display: flex; flex-direction: column; height: 100%; max-width: 100%; gap: var(--responsive-menu-zone-gap, .5rem); }

  .fragment-root .dropzone .zone-layout > div { gap: var(--responsive-menu-zone-gap, .5rem); }
  .fragment-root .dropzone-wrapper .dropzone .input-group { flex-wrap: nowrap !important; }
  .fragment-root .dropzone-wrapper .dropzone .input-group-inset { width: unset; }

  .fragment-root .dropzone-lower, .fragment-root .dropzone-upper { visibility: visible; overflow: visible; opacity: 1; }
  .fragment-root .dropzone-lower .portlet-header, .fragment-root .dropzone-upper .portlet-header { display: none; }

  .fragment-root .dropzone-menu.fragment-menu .navbar-nav { list-style-type: none; margin: 0; padding: 0; flex-direction: column; }
  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone-menu.fragment-menu .navbar-nav { justify-content: end; }
  [/#if]
  .fragment-root .dropzone-menu.fragment-menu .nav-item .layout-logo { max-height: var(--responsive-menu-item-logo-max-height, 1rem); max-width: var(--responsive-menu-item-logo-max-width, 2rem); }
  .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a { width: 100%; text-align: ${menuTextAlign}; }

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone-wrapper { align-items: end; }
  [/#if]

  [#if configuration.separator]
  .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item { border-bottom: 1px solid${configuration.menuItemSeparatorColor}; }
  .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item:last-child { border-bottom: none; }
  [/#if]

  .fragment-root .hamburger-zone-inner .${configuration.dropzoneGrower} { flex-grow: 1; }

  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .lfr-layout-structure-item-responsive-side-menu { position: fixed; z-index: 1; }
    [#if configuration.menuStyle?contains('menu-left')]
    #main-content { margin-left: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px) !important; }
    [#else]
    #main-content { margin-right: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px) !important; }
    [/#if]
    .fragment-root .hamburger-zone-inner { position: relative; background-color: var(--responsive-menu-breakpoint-tablet-menu-background-color, transparent); overflow: hidden; }
    [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .hamburger-zone-inner { transform: translateX(calc(100% - var(--responsive-menu-item-logo-max-width, 2rem) + 4px)); }
    [/#if]
    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { color: inherit; opacity: 1; transition: opacity .5s ease; }
    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; flex-wrap: nowrap; }
    .fragment-root .hamburger-zone-inner .dropzone-lower, .fragment-root .hamburger-zone-inner .dropzone-upper { visibility: hidden; opacity: 0; transition: opacity .5s ease; }
    .fragment-root:hover .hamburger-zone-inner .dropzone-lower, .fragment-root:hover .hamburger-zone-inner .dropzone-upper { visibility: visible; overflow: visible; opacity: 1; transition: opacity .5s ease; }
    .fragment-root .hamburger-zone-wrapper { width: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px) !important; }
    [#if configuration.limitMenuWidth]
    .fragment-root:hover .hamburger-zone-wrapper { width: var(--responsive-menu-width, 5rem) !important; }
    [#else]
    .fragment-root:hover .hamburger-zone-wrapper { width: 100% !important; }
    [/#if]
    .fragment-root:hover .hamburger-zone-inner { transform: unset; overflow: hidden; }
    .fragment-root:hover .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { color: inherit; opacity: 1; transition: opacity .5s ease; }
    
    /*
    .fragment-root .fragment-menu-icon { display: inline-flex; flex-direction: column; cursor: pointer; background-color: ${configuration.menuHamburgerBgColor}; border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor}; border-radius: ${configuration.menuHamburgerBorderRadius}; }
    .fragment-root .fragment-menu-icon span { display: block; width: 25px; height: 5px; margin: 2.5px; background-color: ${configuration.menuHamburgerColor}; }
    */
  }
  [/#if]

  [#if configuration.enableLandscapePhoneBreakpoint]
  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .fragment-root .dropzone-wrapper,
    .fragment-root .hamburger-zone-wrapper,
    .fragment-root .hamburger-zone-inner,
    .fragment-root .hamburger {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
    }

    .lfr-layout-structure-item-responsive-side-menu { position: fixed; z-index: 1; height: auto; }
    .lfr-layout-structure-item-responsive-side-menu.top { top: 0 !important; transition: top .5s ease; }
    body.has-control-menu .lfr-layout-structure-item-responsive-side-menu { height: auto; }
    .master-page .page-editor { margin-top: var(--responsive-menu-logo-max-height, 35px); }
    #main-content.increase-hamburger { margin-top: var(--responsive-menu-logo-max-height, 35px); }
    [#if configuration.menuStyle?contains('menu-left')]
    #main-content { margin-left: inherit; }
    [#else]
    #main-content { margin-right: inherit; }
    [/#if]

    .fragment-root { height: auto; }
    .fragment-root .dropzone-wrapper { height: auto; }

    [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .dropzone-wrapper { justify-content: end; }
    [/#if]

    .fragment-root .hamburger { display: flex; flex-direction: row; align-items: center; justify-content: start; transition: all .5s ease; width: 100%; }
    [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .hamburger { justify-content: end; }
    [/#if]
    .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height, 35px); }
    .fragment-root .hamburger a { display: inline-block; }
    .fragment-root .hamburger.open { background-color: ${configuration.menuHamburgerBgColor}; }
 
    .fragment-root .fragment-menu-icon { display: inline-flex; flex-direction: column; cursor: pointer; background-color: ${configuration.menuHamburgerBgColor}; border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor}; border-radius: ${configuration.menuHamburgerBorderRadius}; }
    .fragment-root .fragment-menu-icon span { display: block; width: 25px; height: 5px; margin: 2.5px; background-color: ${configuration.menuHamburgerColor}; }

    .fragment-root .hamburger-zone-wrapper { background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent); width: 100vw !important; max-width: 100%; display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--side-menu-open-duration) ease-out; z-index: 1000; }
    .fragment-root .hamburger-zone-wrapper.open { grid-template-rows: 1fr; width: 100vw !important; }

    .fragment-root .hamburger-zone-inner { right: unset; transform: unset; max-width: none; overflow: hidden; transition: all .5s ease; }

    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-lower { pointer-events: none; opacity: 0; transform: translateY(-.25rem); transition: opacity .2s ease, transform .2s ease; }

    .fragment-root .hamburger-zone-wrapper.open .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-lower { pointer-events: auto; opacity: 1; transform: none; }

    .fragment-root .fragment-menu .lfr-nav-item { flex-direction: column; width: 100vw; align-items: start; justify-content: end; }
    .fragment-root .fragment-menu .lfr-nav-item { align-items: end; }

    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; align-items: start; justify-content: end; }
    .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100vw; }

    .fragment-root .hamburger-zone-inner .dropzone-lower, .fragment-root .hamburger-zone-inner .dropzone-upper { visibility: visible; overflow: visible; opacity: 1; transition: all .5s ease; min-width: 100%; }

    .fragment-root .hamburger-zone-wrapper { z-index: 1000; }

    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      position: fixed;
      top: var(--control-menu-container-height, 0);
      transition: opacity .5s ease var(--side-menu-open-duration);
      visibility: hidden;
      opacity: 0;
      z-index: 1002;
      pointer-events: none;
    }

    .lfr-layout-structure-item-responsive-side-menu.top
      .fragment-root .dropzone .logo-zone.reduce-logo,
    .lfr-layout-structure-item-responsive-side-menu.top
      .fragment-root .dropzone .logo-zone.increase-hamburger {
      top: 0;
    }

    [#if configuration.menuStyle?contains('menu-left')]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger { right: 0; left: auto; }
    [#else]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger { left: 0; right: auto; }
    [/#if]

    .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }
    
    .fragment-root .hamburger-zone-wrapper.open .dropzone .logo-zone.reduce-logo,
    .fragment-root .hamburger-zone-wrapper.open .dropzone .logo-zone.increase-hamburger {
      opacity: 1;
      animation: logoReady 1ms linear var(--side-menu-open-duration) forwards;
    }

    @keyframes logoReady { to { visibility: visible; pointer-events: auto; } }
  }
  [/#if]

  [#if configuration.enablePortraitPhoneBreakpoint]
  @media only screen and (max-width: ${configuration.portraitPhoneBreakpoint}) {
    .fragment-root .dropzone-wrapper,
    .fragment-root .hamburger-zone-wrapper,
    .fragment-root .hamburger-zone-inner,
    .fragment-root .hamburger {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
    }

    .fragment-root { height: auto; }
    .fragment-root .dropzone-wrapper { height: auto; }

    .fragment-root .fragment-menu-icon { display: inline-flex; flex-direction: column; cursor: pointer; background-color: ${configuration.menuHamburgerBgColor}; border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor}; border-radius: ${configuration.menuHamburgerBorderRadius}; }
    .fragment-root .fragment-menu-icon span { display: block; width: 25px; height: 5px; margin: 2.5px; background-color: ${configuration.menuHamburgerColor}; }

    .fragment-root .hamburger-zone-wrapper { background-color: var(--responsive-menu-breakpoint-phone-portrait-menu-background-color, transparent); width: 100vw !important; max-width: 100%; display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--side-menu-open-duration) ease-out; z-index: 1000; }
    .fragment-root .hamburger-zone-wrapper.open { grid-template-rows: 1fr; width: 100vw !important; }

    .fragment-root .hamburger-zone-inner { max-width: none; overflow: hidden; }

    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-lower { pointer-events: none; opacity: 0; transform: translateY(.25rem); transition: opacity .2s ease, transform .2s ease; }

    .fragment-root .hamburger-zone-wrapper.open .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-lower { pointer-events: auto; opacity: 1; transform: none; }

    .fragment-root .fragment-menu .lfr-nav-item { flex-direction: column; width: 100vw; align-items: start; justify-content: end; }
    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; align-items: start; justify-content: end; }
    .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100vw; }

    .fragment-root .hamburger-zone-wrapper { z-index: 1000; }

    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      position: fixed;
      top: var(--control-menu-container-height, 0);
      transition: opacity .5s ease var(--side-menu-open-duration);
      visibility: hidden;
      opacity: 0;
      z-index: 1002;
      pointer-events: none;
    }

    .lfr-layout-structure-item-responsive-side-menu.top
      .fragment-root .dropzone .logo-zone.reduce-logo,
    .lfr-layout-structure-item-responsive-side-menu.top
      .fragment-root .dropzone .logo-zone.increase-hamburger {
      top: 0;
    }

    [#if configuration.menuStyle?contains('menu-left')]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger { right: 0; left: auto; }
    [#else]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger { left: 0; right: auto; }
    [/#if]

    .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }

    .fragment-root .hamburger-zone-wrapper.open .dropzone .logo-zone.reduce-logo,
    .fragment-root .hamburger-zone-wrapper.open .dropzone .logo-zone.increase-hamburger {
      opacity: 1;
      animation: logoReady 1ms linear var(--side-menu-open-duration) forwards;
    }

    @keyframes logoReady { to { visibility: visible; pointer-events: auto; } }
  }
  [/#if]
</style>

[@renderDropzones zones=zones /]