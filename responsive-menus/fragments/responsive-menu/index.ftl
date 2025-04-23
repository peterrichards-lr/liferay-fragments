[#--noinspection CssUnusedSymbol,CssUnresolvedCustomProperty,CssInvalidPropertyValue--]
[#assign
menuClassesList = [
"fragment-menu-${fragmentEntryLinkNamespace}",
"fragment-menu",
configuration.menuStyle,
(configuration.separator?then('separator',''))
]?filter(x -> x?has_content),
menuClasses = menuClassesList?join(' '),

menuHeaderClass = 'fragment-menu-editor-padding' + (configuration.menuHeader?then(' show','')),

dropzoneConfig = configuration.dropzoneConfig,

isInline = configuration.menuStyle?contains('inline'),
isSticky = configuration.menuStyle?contains('sticky'),

menuId = 'nav-' + fragmentEntryLinkNamespace,

langDir = (locale?starts_with("ar") || locale?starts_with("he"))?then("rtl","ltr"),
htmlLang = locale?replace("_", "-")
/]

[#if configuration.menuStyle?contains('menu-inline')]
    [#assign dropzoneConfig = 'menu-only' /]
[/#if]

[#assign zoneMap = {
'menu-only': ['menu'],
'menu-left-zone': ['left','menu'],
'menu-right-zone': ['menu','right'],
'menu-both-zones': ['left','menu','right']
},
zones = zoneMap[dropzoneConfig]!['menu'],
dropzoneCount = zones?size
/]

[#macro ScrollToTopButton icon title]
  <button class="fragment-scroll-to-top" title="${title}" aria-label="${title}">
      [@clay["icon"] symbol="${icon}" /]
  </button>
[/#macro]

[#macro renderHamburgerIcon]
  <div class="hamburger">
    <a href="javascript:void(0);" class="fragment-menu-icon" aria-label="Toggle menu" role="button">
      <span></span>
      <span></span>
      <span></span>
    </a>
  </div>
[/#macro]

[#macro renderDropzone zone]
  <div class="dropzone dropzone-${zone}" role="region" aria-label="${zone?cap_first} zone">
      [#if zone == 'menu']
        <nav class="${menuClasses}" role="menu" aria-orientation="vertical">
          <lfr-drop-zone></lfr-drop-zone>
        </nav>
      [#else]
        <section role="region" aria-label="${zone?cap_first} drop zone">
          <lfr-drop-zone></lfr-drop-zone>
        </section>
      [/#if]
  </div>
[/#macro]

[#macro renderDropzones zones]
  <div id="${menuId}" class="fragment-root-${fragmentEntryLinkNamespace} fragment-root" role="navigation"
       aria-label="Responsive Menu" lang="${htmlLang}" dir="${langDir}">
    <div class="dropzone-wrapper dropzone-wrapper-${configuration.dropzoneConfig}">
      <div class="${menuHeaderClass}">Responsive Menu</div>
        [@renderHamburgerIcon /]
      <div class="hamburger-zone-wrapper">
        <div class="hamburger-zone-inner">
            [#list zones as zone]
                [@renderDropzone zone /]
            [/#list]
        </div>
      </div>
    </div>
      [#if configuration.scrollBackToTop && !isSticky]
          [@ScrollToTopButton icon=configuration.scrollBackToTopIcon title="Scroll to top" /]
      [/#if]
  </div>
[/#macro]

<style scoped>
  :root {
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

  [#if configuration.limitMenuWidth]
  :root {
    --responsive-menu-max-width: ${configuration.maximumMenuWidth};
  }

  [/#if]

  .fragment-menu {
    max-width: var(--responsive-menu-max-width, none);
  }

  [#if configuration.menuItemOverflow == 'clip']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
    text-overflow: clip;
  }

  [#elseif configuration.menuItemOverflow == 'wrap']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
    white-space: normal;
  }

  [#elseif configuration.menuItemOverflow == 'min-width']
  .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
    text-overflow: unset;
    white-space: normal;
    overflow: visible;
  }

  [/#if]

  [#if isSticky]
  .lfr-layout-structure-item-responsive-menu {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  body.has-control-menu .lfr-layout-structure-item-responsive-menu {
    top: var(--control-menu-container-height, 0);
  }

  [#if configuration.enableLandscapePhoneBreakpoint]
  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    body.has-control-menu .lfr-layout-structure-item-responsive-menu.top {
      top: 0;
      transition: all 0.5s ease;
    }
  }

  [/#if]
  [/#if]

  body.has-edit-mode-menu .page-editor .fragment-menu-editor-padding.show {
    height: 26px;
    min-height: 26px;
    box-sizing: border-box;
    background-color: rgb(247, 248, 249);
    text-align: right;
    font-size: 12px;
    line-height: 26px;
    border-radius: 2px 2px 0 0;
    padding: 0 8px 0 8px;
    font-weight: 600;
  }

  [#if isSticky]
  body.has-edit-mode-menu div.lfr-layout-structure-item-responsive-menu {
    top: 0;
  }

  [/#if]

  .fragment-menu-editor-padding {
    height: 0;
    overflow: hidden;
  }

  .fragment-root .fragment-menu-icon {
    display: none;
  }

  .fragment-root .dropzone-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .fragment-root .dropzone-wrapper .dropzone .input-group {
    flex-wrap: nowrap !important;
  }

  .fragment-root .dropzone-wrapper .dropzone .input-group-item {
    width: unset;
  }

  .fragment-root .dropzone-lower,
  .fragment-root .dropzone-upper {
    visibility: visible;
    overflow: visible;
    opacity: 1;
    transition: all 0.5s ease;
  }

  .fragment-root .dropzone-lower .portlet-header,
  .fragment-root .dropzone-upper .portlet-header {
    display: none;
  }

  .fragment-root .dropzone-menu .fragment-menu .navbar-nav {
    list-style-type: none;
    margin: 0;
    padding: 0;
    flex-direction: row;
  }

  .fragment-root .dropzone-menu .fragment-menu .nav-item .layout-logo {
    max-height: var(--responsive-menu-item-logo-max-height, 1rem);
    max-width: var(--responsive-menu-item-logo-max-width, 2rem);
  }

  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item a {
    width: 100%;
  }

  .fragment-root .hamburger-zone-inner {
    background-color: var(--responsive-menu-breakpoint-desktop-menu-background-color, transparent);
    display: flex;
    flex-direction: row;
    transition: ease all 0.5s;
    max-width: 100%;
    align-items: ${configuration.dropzoneAlignItems};
    gap: ${configuration.dropzoneGap};
  }

  .fragment-root .dropzone .zone-layout > div {
    gap: var(--responsive-menu-zone-gap, 0.5rem);
  }

  .fragment-root .hamburger-zone-inner .${configuration.dropzoneGrower} {
    flex-grow: 1;
  }

  [#if configuration.overrideMenuColors]
  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item a {
    color: ${configuration.menuItemColor} !important;
    background-color: ${configuration.menuItemBgColor} !important;
  }

  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item a:hover {
    color: ${configuration.menuItemHoverColor} !important;
    background-color: ${configuration.menuItemHoverBgColor} !important;
  }

  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item.selected a {
    color: ${configuration.menuItemSelectedColor} !important;
    background-color: ${configuration.menuItemSelectedBgColor} !important;
  }

  [/#if]
  [#if configuration.separator]
  .fragment-root .dropzone-menu .fragment-menu.separator .lfr-nav-item {
    border-right: 1px solid${configuration.menuItemSeparatorColor};
  }

  .fragment-root .dropzone-menu .fragment-menu.separator .lfr-nav-item:last-child {
    border-right: none;
  }

  [/#if]
  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .fragment-root .hamburger-zone-inner {
      background-color: var(--responsive-menu-breakpoint-tablet-menu-background-color, transparent);
      transition: all 0.5s ease;
    }

  [#if configuration.menuStyle?contains('menu-top')]
    .fragment-root .hamburger-zone-inner {
      height: auto;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .fragment-root .dropzone .zone-layout > div {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .fragment-root .hamburger-zone-inner .dropzone-left,
    .fragment-root .hamburger-zone-inner .dropzone-menu,
    .fragment-root .hamburger-zone-inner .dropzone-right {
      flex-basis: 0;
      flex-grow: 1;
      max-width: 100%;
      min-width: calc((100% - var(--responsive-menu-zone-gap, 0px) * var(--responsive-menu-zone-count, 1)) / var(--responsive-menu-zone-count, 1));
    }

  [/#if]
  }

  [/#if]
  [#if configuration.enableLandscapePhoneBreakpoint]
  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .fragment-root {
      height: auto;
    }

    .fragment-root .dropzone-wrapper {
      height: auto;
    }

    .fragment-root .hamburger-zone-wrapper {
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.5s ease-out;
      z-index: 2;
    }

    .fragment-root .hamburger-zone-wrapper.open {
      grid-template-rows: 1fr;
    }

    .fragment-root .hamburger-zone-inner {
      flex-direction: column;
      max-width: none;
      overflow: hidden;
      transition: all 0.5s ease;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item.dropdown {
      padding-bottom: 0;
      flex-direction: column;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item.dropdown .dropdown-menu {
      margin: 0;
      color: var(--link-color);
      box-shadow: unset;
      position: relative;
      z-index: auto;
      min-width: 100%;
      opacity: 0;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item.dropdown.open .dropdown-menu {
      opacity: 1;
      transition: all 0.5s ease;
    }

  [#if isInline]
    .fragment-root .dropzone-menu {
      width: 100%
    }

    .fragment-root .dropzone-menu .fragment-menu .navbar-nav {
      flex-direction: column;
      width: 100%;
      align-items: start;
      justify-content: end;
    }

  [#else]
    .fragment-root .dropzone-menu .fragment-menu .navbar-nav {
      flex-direction: column;
      width: 100vw;
      align-items: start;
      justify-content: end;
    }

  [/#if]

    .fragment-root .dropzone .zone-layout > div {
      display: flex;
      flex-direction: column;
    }

    .fragment-root .dropzone .zone-layout.allow-override > div {
      align-items: start;
      justify-content: end;
    }

    .fragment-root .dropzone .zone-layout.allow-override > div > * {
      width: 100vw;
    }

    .fragment-root .hamburger {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: start;
      transition: all 0.5s ease;
      width: 100%;
    }

    .fragment-root .hamburger.increase {
      height: var(--responsive-menu-logo-max-height, 35px);
    }

    .fragment-root .hamburger.open {
      background-color: ${configuration.menuHamburgerBgColor};
    }

    .fragment-root .hamburger a {
      display: inline-block;
    }

    .fragment-root .hamburger .fragment-menu-icon {
      background-color: ${configuration.menuHamburgerBgColor};
      border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
      border-radius: ${configuration.menuHamburgerBorderRadius};
    }

    .fragment-root .hamburger .fragment-menu-icon span {
      display: block;
      width: 25px;
      height: 5px;
      margin: 5px;
      background-color: ${configuration.menuHamburgerColor};
    }

    .fragment-root .hamburger-zone-inner .${configuration.dropzoneGrower} {
      flex-grow: 0;
    }

    .fragment-root .hamburger-zone-inner .dropzone-left,
    .fragment-root .hamburger-zone-inner .dropzone-right {
      visibility: visible;
      overflow: visible;
      opacity: 1;
      transition: all 0.5s ease;
      min-width: 100%;
    }

    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      position: absolute;
      top: 0;
      right: 0;
      visibility: hidden;
      opacity: 0;
      transition: all 0.5s ease;
    }

    .fragment-root .dropzone .logo-zone.reduce-logo img {
      max-height: 35px;
    }

    .fragment-root .hamburger.logo-always {
      background-color: ${configuration.menuHamburgerBgColor};
    }

    .fragment-root .dropzone .logo-zone.open,
    .fragment-root .dropzone .logo-zone.logo-always {
      visibility: visible;
      opacity: 1;
    }
  }

  [/#if]

  [#if configuration.enablePortraitPhoneBreakpoint]
  @media only screen and (max-width: ${configuration.portraitPhoneBreakpoint}) {
    .fragment-root .hamburger-zone-wrapper {
      background-color: var(--responsive-menu-breakpoint-phone-portrait-menu-background-color, transparent);
    }
  }

  [/#if]

  [#if configuration.scrollBackToTop && !isSticky]
  .fragment-scroll-to-top {
    display: none;
    position: fixed;
    bottom: 20px;
    right: 30px;
    z-index: 99;
    border: none;
    outline: none;
    background-color: ${configuration.scrollBackToTopBgColor};
    color: ${configuration.scrollBackToTopColor};
    cursor: pointer;
    padding: 15px;
    border-radius: 10px;
  }

  .fragment-scroll-to-top:hover {
    background-color: ${configuration.scrollBackToTopHoverBgColor};
    color: ${configuration.scrollBackToTopHoverColor};
  }

  [/#if]

  body.has-edit-mode-menu .dropzone:has(.page-editor__no-fragments-state) {
    flex-grow: 1;
  }

  body.has-control-menu .master-page .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)),
  body.has-control-menu .page-editor .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)) {
    flex-grow: 1;
  }

  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state {
    padding: 1vh 12% !important;
  }


  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state:first-child:before {
    color: #6b6c7e;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 1rem;
  }

  body.has-edit-mode-menu .dropzone-left .page-editor__no-fragments-state:first-child:before {
    content: "Left Zone";
  }

  body.has-edit-mode-menu .dropzone-menu .page-editor__no-fragments-state:first-child:before {
    content: "Menu Zone";
  }

  body.has-edit-mode-menu .dropzone-right .page-editor__no-fragments-state:first-child:before {
    content: "Right Zone";
  }
</style>

[@renderDropzones zones=zones /]