[#assign
  menuClassesList = [
    "fragment-menu-${fragmentEntryLinkNamespace}",
    "fragment-menu",
    configuration.menuStyle,
    (configuration.separator?then('separator', ''))
  ]?filter(x -> x?has_content),
  menuClasses = menuClassesList?join(' '),

  menuHeaderClass = 'fragment-menu-editor-padding' + (configuration.menuHeader?then(' show', '')),

  dropzoneConfig = configuration.dropzoneConfig,

  isInline = configuration.menuStyle?contains('inline'),
  isSticky = configuration.menuStyle?contains('sticky'),

  menuId = 'nav-' + fragmentEntryLinkNamespace,

  langDir = (locale?starts_with("ar") || locale?starts_with("he"))?then("rtl", "ltr"),
  htmlLang = locale?replace("_", "-")
/]

[#if configuration.menuStyle?contains('menu-inline')]
  [#assign dropzoneConfig = 'menu-only' /]
[/#if]

[#assign
  zoneMap = {
    'menu-only': ['menu'],
    'menu-left-zone': ['left', 'menu'],
    'menu-right-zone': ['menu', 'right'],
    'menu-both-zones': ['left', 'menu', 'right']
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
    <button
      class="fragment-menu-icon"
      type="button"
      aria-label="Open menu"
      aria-controls="fragmentMenuList-${fragmentEntryLinkNamespace}"
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
    "fragmentMenuList-${fragmentEntryLinkNamespace}",
    "dropzone-${zone}-${fragmentEntryLinkNamespace}"
  ) /]
  [#if zone == 'menu']
    <nav id="${zoneId}" class="${menuClasses} dropzone dropzone-menu" aria-label="Primary">
      <lfr-drop-zone></lfr-drop-zone>
    </nav>
  [#else]
    <section id="${zoneId}" class="dropzone dropzone-${zone}" aria-label="${zone?cap_first} zone">
      <lfr-drop-zone></lfr-drop-zone>
    </section>
  [/#if]
[/#macro]

[#macro renderDropzones zones]
  <div
    id="${menuId}"
    class="fragment-root-${fragmentEntryLinkNamespace} fragment-root"
    role="navigation"
    aria-label="Responsive Menu"
    lang="${htmlLang}"
    dir="${langDir}">
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
    [#if configuration.scrollBackToTop && !isSticky]
      [@ScrollToTopButton icon=configuration.scrollBackToTopIcon title="Scroll to top" /]
    [/#if]
  </div>
[/#macro]

<style>
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

  .visually-hidden {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    border: 0;
    white-space: nowrap;
  }

  .fragment-root .fragment-menu-icon { min-width: 44px; min-height: 44px; }
  .fragment-root .fragment-menu-icon:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

  [#if configuration.limitMenuWidth]
    :root { --responsive-menu-max-width: ${configuration.maximumMenuWidth}; }
  [/#if]

  .fragment-menu { max-width: var(--responsive-menu-max-width, none); }
  .fragment-root .fragment-menu-icon { display: none; }

  .fragment-root .dropzone-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .fragment-root .dropzone-wrapper .dropzone .input-group { flex-wrap: nowrap !important; }
  .fragment-root .dropzone-wrapper .dropzone .input-group-item { width: unset; }

  .fragment-root .dropzone-lower,
  .fragment-root .dropzone-upper {
    visibility: visible;
    overflow: visible;
    opacity: 1;
    transition: all .5s ease;
  }

  .fragment-root .dropzone-lower .portlet-header,
  .fragment-root .dropzone-upper .portlet-header { display: none; }

  .fragment-root .dropzone-menu.fragment-menu .navbar-nav {
    list-style: none;
    margin: 0;
    padding: 0;
    flex-direction: row;
  }

  .fragment-root .dropzone-menu.fragment-menu .nav-item .layout-logo {
    max-height: var(--responsive-menu-item-logo-max-height, 1rem);
    max-width: var(--responsive-menu-item-logo-max-width, 2rem);
  }

  .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a { width: 100%; }

  .fragment-root .hamburger-zone-inner {
    background-color: var(--responsive-menu-breakpoint-desktop-menu-background-color, transparent);
    display: flex;
    flex-direction: row;
    transition: ease all .5s;
    max-width: 100%;
    flex-wrap: nowrap;
    align-items: ${configuration.dropzoneAlignItems};
    gap: ${configuration.dropzoneGap};
  }

  .fragment-root .dropzone .zone-layout > div { gap: var(--responsive-menu-zone-gap, .5rem); }

  .fragment-root .hamburger-zone-inner .dropzone { flex-grow: 0; flex-shrink: 1; }
  .fragment-root .hamburger-zone-inner .${configuration.dropzoneGrower} { flex-grow: 1; flex-shrink: 0; }

  [#if configuration.overrideMenuColors]
    .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a {
      color: ${configuration.menuItemColor} !important;
      background-color: ${configuration.menuItemBgColor} !important;
    }
    .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a:hover {
      color: ${configuration.menuItemHoverColor} !important;
      background-color: ${configuration.menuItemHoverBgColor} !important;
    }
    .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item.selected a {
      color: ${configuration.menuItemSelectedColor} !important;
      background-color: ${configuration.menuItemSelectedBgColor} !important;
    }
  [/#if]

  [#if configuration.separator]
    .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item {
      border-right: 1px solid ${configuration.menuItemSeparatorColor};
    }
    .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item:last-child { border-right: none; }
  [/#if]

  [#if configuration.menuItemOverflow == 'clip']
    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { text-overflow: clip; }
  [#elseif configuration.menuItemOverflow == 'wrap']
    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate { white-space: normal; }
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
      @media (max-width: ${configuration.landscapePhoneBreakpoint}) {
        body.has-control-menu .lfr-layout-structure-item-responsive-menu.top {
          top: 0;
          transition: all .5s ease;
        }
      }
    [/#if]
  [/#if]

  .fragment-menu-editor-padding { height: 0; overflow: hidden; }

  body.has-edit-mode-menu .page-editor .fragment-menu-editor-padding.show {
    height: 26px;
    min-height: 26px;
    box-sizing: border-box;
    background: #f7f8f9;
    text-align: right;
    font-size: 12px;
    line-height: 26px;
    border-radius: 2px 2px 0 0;
    padding: 0 8px;
    font-weight: 600;
  }

  .fragment-root .dropzone .logo-zone.reduce-logo,
  .fragment-root .dropzone .logo-zone.increase-hamburger {
    position: static;
    inset: auto;
    visibility: visible;
    opacity: 1;
    z-index: auto;
    transition: none;
  }

  .is-menu-view .logo-zone[data-always-display="false"] { display: block; }

  [#if configuration.enableTabletBreakpoint]
    @media (max-width: ${configuration.tabletBreakpoint}) {
      .fragment-root .fragment-menu-icon { display: none; }

      .fragment-root .hamburger-zone-inner {
        background-color: var(--responsive-menu-breakpoint-tablet-menu-background-color, transparent);
        justify-content: space-between;
      }

      .fragment-root .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: none;
        flex-direction: column;
        pointer-events: none;
        opacity: 0;
        transform: translateY(-.5rem);
        transition: opacity .2s ease, transform .2s ease;
        width: 100%;
        position: static;
      }

      .hamburger-zone-wrapper.open .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: block;
        pointer-events: auto;
        opacity: 1;
        transform: none;
      }

      .fragment-root-${fragmentEntryLinkNamespace} .dropzone .zone-layout.allow-override > div {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: end;
        flex-wrap: wrap;
        gap: var(--responsive-menu-zone-gap, .5rem);
        width: 100%;
        max-width: var(--responsive-menu-max-width, 100%);
        margin-inline: 0;
      }

      .fragment-root-${fragmentEntryLinkNamespace} .dropzone .zone-layout.allow-override > div > * { max-width: 100%; }
    }
  [/#if]

  [#if configuration.enableLandscapePhoneBreakpoint]
    @media (max-width: ${configuration.landscapePhoneBreakpoint}) {
      .fragment-root .dropzone .logo-zone.reduce-logo,
      .fragment-root .dropzone .logo-zone.increase-hamburger {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        z-index: 1002;
        visibility: hidden;
        opacity: 0;
        transition: all 0.5s ease;
      }

      .fragment-root .dropzone .logo-zone.open,
      .fragment-root .dropzone .logo-zone.logo-always {
        visibility: visible;
        opacity: 1;
      }

      .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }

      .is-menu-view .logo-zone[data-always-display="false"] { display: none; }

      .fragment-root.menu-right .dropzone .logo-zone.reduce-logo,
      .fragment-root.menu-right .dropzone .logo-zone.increase-hamburger {
        inset-inline-start: 0;
        inset-inline-end: auto;
      }

      .fragment-root { height: auto; }
      .fragment-root .dropzone-wrapper { position: relative; height: auto; }

      .fragment-root .fragment-menu-icon { display: inline-flex; flex-direction: column; cursor: pointer; }

      .fragment-root .hamburger-zone-wrapper {
        background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
        z-index: 2;
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows .5s ease-out;
      }

      .fragment-root .hamburger-zone-wrapper.open { grid-template-rows: 1fr; }

      .fragment-root .hamburger-zone-inner {
        flex-direction: column;
        align-items: flex-start;
        flex-wrap: nowrap;
        max-width: none;
        overflow: hidden;
        transition: all .5s ease;
      }

      .fragment-root .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: none;
        flex-direction: column;
        pointer-events: none;
        opacity: 0;
        transform: translateY(-.25rem);
        transition: opacity .2s ease, transform .2s ease;
        position: static;
        width: 100%;
      }

      .hamburger-zone-wrapper.open .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: block;
        pointer-events: auto;
        opacity: 1;
        transform: none;
      }

      .fragment-root .dropzone-menu.fragment-menu .navbar-nav {
        flex-direction: column;
        width: 100%;
        align-items: start;
        justify-content: end;
      }

      [#if !isInline]
        .fragment-root .dropzone-menu.fragment-menu .navbar-nav { width: 100vw; }
      [/#if]

      .fragment-root .dropzone .zone-layout > div { display: flex; flex-direction: column; }
      .fragment-root .dropzone .zone-layout.allow-override > div { align-items: start; justify-content: end; }
      .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100vw; }

      .fragment-root .hamburger {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;
        transition: all .5s ease;
        width: 100%;
      }

      .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height, 35px); }
      .fragment-root .hamburger.open { background-color: ${configuration.menuHamburgerBgColor}; }
      .fragment-root .hamburger a { display: inline-block; }

      .fragment-root .hamburger .fragment-menu-icon {
        background-color: ${configuration.menuHamburgerBgColor};
        border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
        border-radius: ${configuration.menuHamburgerBorderRadius};
      }

      .fragment-root .hamburger .fragment-menu-icon .bar {
        display: block;
        width: 25px;
        height: 5px;
        margin: 2.5px;
        background-color: ${configuration.menuHamburgerColor};
      }

      .fragment-root .hamburger-zone-inner .dropzone-left,
      .fragment-root .hamburger-zone-inner .dropzone-right {
        visibility: visible;
        overflow: visible;
        opacity: 1;
        transition: all .5s ease;
        min-width: 100%;
      }

      .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }
    }
  [/#if]

  [#if configuration.enablePortraitPhoneBreakpoint]
    @media (max-width: ${configuration.portraitPhoneBreakpoint}) {
      .fragment-root .dropzone .logo-zone.reduce-logo,
      .fragment-root .dropzone .logo-zone.increase-hamburger {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        z-index: 1002;
        visibility: hidden;
        opacity: 0;
        transition: all 0.5s ease;
      }

      .fragment-root .dropzone .logo-zone.open,
      .fragment-root .dropzone .logo-zone.logo-always {
        visibility: visible;
        opacity: 1;
      }

      .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }

      .is-menu-view .logo-zone[data-always-display="false"] { display: none; }

      .fragment-root.menu-right .dropzone .logo-zone.reduce-logo,
      .fragment-root.menu-right .dropzone .logo-zone.increase-hamburger {
        inset-inline-start: 0;
        inset-inline-end: auto;
      }

      .fragment-root { height: auto; }
      .fragment-root .dropzone-wrapper { position: relative; height: auto; }

      .fragment-root .fragment-menu-icon { display: inline-flex; flex-direction: column; cursor: pointer; }

      .fragment-root .hamburger-zone-wrapper {
        background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
        z-index: 2;
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows .5s ease-out;
      }

      .fragment-root .hamburger-zone-wrapper.open { grid-template-rows: 1fr; }

      .fragment-root .hamburger-zone-inner {
        flex-direction: column;
        align-items: flex-start;
        flex-wrap: nowrap;
        max-width: none;
        overflow: hidden;
        transition: all .5s ease;
      }

      .fragment-root .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: none;
        flex-direction: column;
        pointer-events: none;
        opacity: 0;
        transform: translateY(-.25rem);
        transition: opacity .2s ease, transform .2s ease;
        position: static;
        width: 100%;
      }

      .hamburger-zone-wrapper.open .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
        display: block;
        pointer-events: auto;
        opacity: 1;
        transform: none;
      }

      .fragment-root .dropzone-menu.fragment-menu .navbar-nav {
        flex-direction: column;
        width: 100%;
        align-items: start;
        justify-content: end;
      }

      [#if !isInline]
        .fragment-root .dropzone-menu.fragment-menu .navbar-nav { width: 100vw; }
      [/#if]

      .fragment-root .dropzone .zone-layout > div { display: flex; flex-direction: column; }
      .fragment-root .dropzone .zone-layout.allow-override > div { align-items: start; justify-content: end; }
      .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100vw; }

      .fragment-root .hamburger {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;
        transition: all .5s ease;
        width: 100%;
      }

      .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height, 35px); }
      .fragment-root .hamburger.open { background-color: ${configuration.menuHamburgerBgColor}; }
      .fragment-root .hamburger a { display: inline-block; }

      .fragment-root .hamburger .fragment-menu-icon {
        background-color: ${configuration.menuHamburgerBgColor};
        border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
        border-radius: ${configuration.menuHamburgerBorderRadius};
      }

      .fragment-root .hamburger .fragment-menu-icon .bar {
        display: block;
        width: 25px;
        height: 5px;
        margin: 2.5px;
        background-color: ${configuration.menuHamburgerColor};
      }

      .fragment-root .hamburger-zone-inner .dropzone-left,
      .fragment-root .hamburger-zone-inner .dropzone-right {
        visibility: visible;
        overflow: visible;
        opacity: 1;
        transition: all .5s ease;
        min-width: 100%;
      }

      .fragment-root .dropzone .logo-zone.reduce-logo img { max-height: 35px; }
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

  body.has-edit-mode-menu .dropzone:has(.page-editor__no-fragments-state) { flex-grow: 1; }
  body.has-control-menu .master-page .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)),
  body.has-control-menu .page-editor .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)) { flex-grow: 1; }

  @media (prefers-reduced-motion: reduce) { .fragment-root .fragment-menu { transition: none !important; } }

  .reduce-motion * { transition: none !important; animation: none !important; }
</style>

[@renderDropzones zones=zones /]