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

<style scoped>
  :root {
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
  }

  body:has(div.page-editor__layout-breadcrumbs:not(.d-none)) {
    --page-editor-breadcrumb-height: 29px;
  }

  .lfr-layout-structure-item-responsive-side-menu {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: auto;
  }

  .lfr-layout-structure-item-responsive-side-menu > div {
    height: 100%;
  }

  body.has-control-menu:not(.has-edit-mode-menu) .lfr-layout-structure-item-responsive-side-menu {
    top: var(--control-menu-container-height, 0);
    height: calc(100vh - var(--control-menu-container-height, 0));
  }

  body.has-control-menu.has-edit-mode-menu .lfr-layout-structure-item-responsive-side-menu {
    height: calc(100vh - var(--control-menu-container-height, 0) - var(--toolbar-height, 64px) - var(--page-editor-breadcrumb-height, 29px));
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .lfr-layout-structure-item-responsive-side-menu {
    position: fixed;
  }

  body.has-control-menu .master-page .lfr-layout-structure-item-responsive-side-menu,
  body.has-control-menu .page-editor .lfr-layout-structure-item-responsive-side-menu {
    position: relative;
    top: 0;
  }

  [/#if]

  body.has-control-menu .master-page .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)),
  body.has-control-menu .page-editor .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)) {
    flex-grow: 1;
  }

  .hamburger-zone-inner .${configuration.dropzoneGrower} {
    flex-grow: 1;
  }

  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state {
    min-width: 100px;
    padding: calc((-7 * var(--responsive-menu-zone-count, 1) + 26) * 1vh) 12% !important;
  }

  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state:first-child:before {
    color: #6b6c7e;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 1rem;
  }

  body.has-edit-mode-menu .dropzone-upper .page-editor__no-fragments-state:first-child:before {
    content: "Upper Zone";
  }

  body.has-edit-mode-menu .dropzone-menu .page-editor__no-fragments-state:first-child:before {
    content: "Menu Zone";
  }

  body.has-edit-mode-menu .dropzone-lower .page-editor__no-fragments-state:first-child:before {
    content: "Lower Zone";
  }

  body.has-edit-mode-menu .page-editor div.page-editor__container > div[data-name="Drop Zone"],
  body .page-editor div.page-editor__container > div[data-name="Main"] {
    flex-grow: 1;
  }

  body.has-edit-mode-menu .page-editor div.page-editor__container > div:has(div[data-name="Drop Zone"]),
  body .page-editor div.page-editor__container > div:has(div[data-name="Main"]) {
    flex-grow: 1;
  }

  body.has-edit-mode-menu div.master-page div:has(#page-editor) {
    flex-grow: 1;
  }

  [#if configuration.menuStyle?contains('menu-left')]
  .lfr-layout-structure-item-responsive-side-menu {
    left: 0;
  }

  [#else].lfr-layout-structure-item-responsive-side-menu {
    right: 0;
  }

  [/#if]
  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .lfr-layout-structure-item-responsive-side-menu {
      position: fixed;
      z-index: 1;
    }

  [#if configuration.menuStyle?contains('menu-left')]
    #main-content {
      margin-left: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px);
    }

    [#else]#main-content {
      margin-right: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px);
    }

  [/#if]
  }

  [/#if]
  [#if configuration.enableLandscapePhoneBreakpoint]
  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .lfr-layout-structure-item-responsive-side-menu {
      position: fixed;
      z-index: 1;
      height: auto;
    }

    .lfr-layout-structure-item-responsive-side-menu.top {
      top: 0 !important;
      transition: all 0.5s ease;
    }

    body.has-control-menu .lfr-layout-structure-item-responsive-side-menu {
      height: auto;
    }

    .master-page .page-editor {
      margin-top: var(--responsive-menu-logo-max-height, 35px);
    }

    #main-content.increase-hamburger {
      margin-top: var(--responsive-menu-logo-max-height, 35px);
    }

  [#if configuration.menuStyle?contains('menu-left')]
    #main-content {
      margin-left: inherit;
    }

  [#else]
    #main-content {
      margin-right: inherit;
    }

  [/#if]
  }

  [/#if]

  .fragment-root {
    height: 100%;
  }

  .fragment-root .fragment-menu-icon {
    display: none;
  }

  .fragment-root .dropzone-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
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
    flex-direction: column;
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone-menu .fragment-menu .navbar-nav {
    justify-content: end;
  }

  [/#if]
  .fragment-root .dropzone-menu .fragment-menu .nav-item .layout-logo {
    max-height: var(--responsive-menu-item-logo-max-height, 1rem);
    max-width: var(--responsive-menu-item-logo-max-width, 2rem);
  }

  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item a {
    width: 100%;
    text-align: ${menuTextAlign};
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone-wrapper {
    align-items: end;
  }

  [/#if]
  .fragment-root .hamburger-zone-wrapper {
    height: 100%;
  }

  .fragment-root .hamburger-zone-inner {
    background-color: var(--responsive-menu-breakpoint-desktop-menu-background-color, transparent);
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: ease all 0.5s;
    max-width: 100%;
    gap: var(--responsive-menu-zone-gap, 0.5rem);
  }

  .fragment-root .dropzone .zone-layout > div {
    gap: var(--responsive-menu-zone-gap, 0.5rem);
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
    border-bottom: 1px solid${configuration.menuItemSeparatorColor};
  }

  .fragment-root .dropzone-menu .fragment-menu.separator .lfr-nav-item:last-child {
    border-bottom: none;
  }

  [/#if]

  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .fragment-root .hamburger-zone-inner {
      background-color: var(--responsive-menu-breakpoint-tablet-menu-background-color, transparent);
      max-width: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px);
      overflow: hidden;
      transition: all 0.5s ease;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      color: transparent;
      opacity: 1;
      transition: all 0.5s ease;
    }

    .fragment-root .dropzone .zone-layout > div {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
    }

    .fragment-root .hamburger-zone-inner .dropzone-lower,
    .fragment-root .hamburger-zone-inner .dropzone-upper {
      visibility: hidden;
      opacity: 0;
      transition: all 0.5s ease;
    }

    .fragment-root:hover .hamburger-zone-inner .dropzone-lower,
    .fragment-root:hover .hamburger-zone-inner .dropzone-upper {
      visibility: visible;
      overflow: visible;
      opacity: 1;
      transition: all0 .5s ease;
    }

    .fragment-root:hover .hamburger-zone-inner {
      max-width: 100%;
      overflow: hidden;
    }

    .fragment-root:hover .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      text-overflow: inherit;
      color: inherit;
      opacity: 1;
      transition: all 0.5s ease;
    }
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

  [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .dropzone-wrapper {
      justify-content: end;
    }

  [/#if]
    .fragment-root .hamburger-zone-wrapper {
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      width: 100vw;
      max-width: 100%;
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.5s ease-out;
    }

    .fragment-root .hamburger-zone-wrapper.open {
      grid-template-rows: 1fr;
    }

    .fragment-root .hamburger-zone-inner {
      max-width: none;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      text-overflow: inherit;
      color: inherit;
    }

    .fragment-root .fragment-menu .lfr-nav-item {
      flex-direction: column;
      width: 100vw;
      align-items: start;
      justify-content: end;
    }

    .fragment-root .fragment-menu .lfr-nav-item {
      align-items: end;
    }

    .fragment-root .dropzone .zone-layout > div {
      display: flex;
      flex-direction: column;
      align-items: start;
      justify-content: end;
    }

    .fragment-root .dropzone .zone-layout > div > * {
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

  [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .hamburger {
      justify-content: end;
    }

  [/#if]
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

    .fragment-root .hamburger-zone-inner .dropzone-lower,
    .fragment-root .hamburger-zone-inner .dropzone-upper {
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
      visibility: hidden;
      opacity: 0;
      transition: all 0.5s ease;
    }

  [#if configuration.menuStyle?contains('menu-left')]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      right: 0;

    }

  [#else]
    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      left: 0;
    }

  [/#if]

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
</style>

[@renderDropzones zones=zones /]