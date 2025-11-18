[#assign
  menuClassesList = [
    "fragment-menu-${fragmentEntryLinkNamespace}",
    "fragment-menu",
    configuration.menuStyle,
    (configuration.separator?then('separator',''))
  ]?filter(x -> x?has_content),
  menuClasses   = menuClassesList?join(' '),
  dropzoneConfig = configuration.dropzoneConfig,
  menuHeaderClass = 'fragment-menu-editor-padding' + (configuration.menuHeader?then(' show','')),
  menuTextAlign = configuration.menuStyle?contains('menu-right')?then("right","left"),
  menuId        = 'nav-' + fragmentEntryLinkNamespace,
  langDir       = (locale?starts_with("ar") || locale?starts_with("he"))?then("rtl","ltr"),
  htmlLang      = locale?replace("_","-")
/]

[#assign
  zoneMap = {
    'menu-only':       ['menu'],
    'menu-upper-zone': ['upper','menu'],
    'menu-lower-zone': ['menu','lower'],
    'menu-both-zones': ['upper','menu','lower']
  },
  zones        = zoneMap[dropzoneConfig]!['menu'],
  dropzoneCount = zones?size
/]

[#macro renderHamburgerIcon]
  <div class="hamburger">
    <button
      class="fragment-menu-icon"
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
  )/]
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
  <div
    id="${menuId}"
    class="fragment-root-${fragmentEntryLinkNamespace} fragment-root"
    role="navigation"
    aria-label="Responsive Menu"
    lang="${htmlLang}"
    dir="${langDir}">
    <div class="${menuHeaderClass}">Responsive Menu</div>
    <div class="dropzone-wrapper dropzone-wrapper-${configuration.dropzoneConfig}">
      [@renderHamburgerIcon/]
      <div class="hamburger-zone-wrapper">
        <div class="hamburger-zone-inner">
          [#list zones as zone]
            [@renderDropzone zone/]
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
    --responsive-menu-hamburger-size: 2.75rem;
    --responsive-menu-hamburger-min-size: 44px;
    --responsive-menu-hamburger-border-width: ${configuration.menuHamburgerBorderWidth};
  }

  html { scrollbar-gutter: stable both-edges; }

  html.menu-scroll-locked,
  body.menu-scroll-locked {
    overflow: hidden;
    height: 100dvh;
    overscroll-behavior: contain;
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

  .fragment-root[data-closing="true"] .dropzone-menu :is(>.fragment-menu, &.fragment-menu) {
    opacity: 0.001;
  }

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
      .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
        text-overflow: unset;
        white-space: normal;
        overflow: visible;
      }
    [/#if]
  [#else]
    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      text-overflow: unset;
      white-space: nowrap;
      overflow: visible;
    }
  [/#if]

  body:has(div.page-editor__layout-breadcrumbs:not(.d-none)) {
    --page-editor-breadcrumb-height: 29px;
  }

  .lfr-layout-structure-item-responsive-side-menu {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    height: 100dvh;
    z-index: auto;
  }
  .lfr-layout-structure-item-responsive-side-menu > div { height: 100%; }

  body.has-control-menu:not(.has-edit-mode-menu) .lfr-layout-structure-item-responsive-side-menu {
    top: var(--control-menu-container-height, 0);
    height: calc(100dvh - var(--control-menu-container-height, 0));
  }
  body.has-control-menu.has-edit-mode-menu .lfr-layout-structure-item-responsive-side-menu {
    height: calc(100dvh - var(--control-menu-container-height, 0) - var(--toolbar-height, 64px) - var(--page-editor-breadcrumb-height, 29px));
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .lfr-layout-structure-item-responsive-side-menu { position: fixed; }
  body.has-control-menu .master-page .lfr-layout-structure-item-responsive-side-menu,
  body.has-control-menu .page-editor   .lfr-layout-structure-item-responsive-side-menu { position: relative; top: 0; }
  [/#if]

  body.has-control-menu .master-page .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)),
  body.has-control-menu .page-editor  .hamburger-zone-inner .${configuration.dropzoneGrower}:not(:has(.page-editor__no-fragments-state)) { flex-grow: 1; }
  .hamburger-zone-inner .${configuration.dropzoneGrower} { flex-grow: 1; }

  .fragment-root .dropzone-menu > lfr-drop-zone {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  body.has-control-menu .${configuration.dropzoneGrower} > lfr-drop-zone > .lfr-tooltip-scope,
  body.has-control-menu .${configuration.dropzoneGrower} > lfr-drop-zone > .lfr-tooltip-scope > .page-editor,
  body.has-control-menu .${configuration.dropzoneGrower} > lfr-drop-zone > .lfr-tooltip-scope > .page-editor > .page-editor__root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  body.has-control-menu .${configuration.dropzoneGrower} .page-editor__no-fragments-state {
    flex: 1;
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
  body.has-edit-mode-menu .dropzone-upper .page-editor__no-fragments-state:first-child:before { content: "Upper Zone"; }
  body.has-edit-mode-menu .dropzone-menu  .page-editor__no-fragments-state:first-child:before { content: "Menu Zone"; }
  body.has-edit-mode-menu .dropzone-lower .page-editor__no-fragments-state:first-child:before { content: "Lower Zone"; }

  body.has-edit-mode-menu .page-editor div.page-editor__container > div[data-name="Drop Zone"],
  body .page-editor      div.page-editor__container > div[data-name="Main"] { flex-grow: 1; }
  body.has-edit-mode-menu .page-editor div.page-editor__container > div:has(div[data-name="Drop Zone"]),
  body .page-editor      div.page-editor__container > div:has(div[data-name="Main"]) { flex-grow: 1; }
  body.has-edit-mode-menu div.master-page div:has(#page-editor) { flex-grow: 1; }

  [#if configuration.menuStyle?contains('menu-left')]
    .lfr-layout-structure-item-responsive-side-menu { left: 0; }
  [#else]
    .lfr-layout-structure-item-responsive-side-menu { right: 0; }
  [/#if]

  .fragment-root { height: 100%; position: relative; overflow: visible; isolation: isolate; }
  .fragment-root .fragment-menu-icon { display: none; pointer-events: auto; }

  .fragment-root .dropzone-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; overflow: visible; }
  .fragment-root .hamburger-zone-wrapper { height: 100%; position: relative; overflow: visible; }
  .fragment-root .hamburger-zone-inner { background-color: var(--responsive-menu-breakpoint-desktop-menu-background-color, transparent); display: flex; flex-direction: column; height: 100%; max-width: 100%; gap: var(--responsive-menu-zone-gap, .5rem); overflow: visible; }

  .fragment-root .dropzone .zone-layout > div { gap: var(--responsive-menu-zone-gap, .5rem); }
  .fragment-root .dropzone-wrapper .dropzone .input-group       { flex-wrap: nowrap !important; }
  .fragment-root .dropzone-wrapper .dropzone .input-group-inset { width: unset; }

  .fragment-root .dropzone-lower,
  .fragment-root .dropzone-upper { visibility: visible; overflow: visible; opacity: 1; }
  .fragment-root .dropzone-lower .portlet-header,
  .fragment-root .dropzone-upper .portlet-header { display: none; }

  .fragment-root .dropzone-menu.fragment-menu .navbar-nav {
    list-style-type: none;
    margin: 0;
    padding: 0;
    flex-direction: column;
  }
  [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .dropzone-menu.fragment-menu .navbar-nav { justify-content: end; }
  [/#if]
  .fragment-root .dropzone-menu.fragment-menu .nav-item .layout-logo {
    max-height: var(--responsive-menu-item-logo-max-height, 1rem);
    max-width:  var(--responsive-menu-item-logo-max-width, 2rem);
  }
  .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a { width: 100%; text-align: ${menuTextAlign}; }

  [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root .dropzone-wrapper { align-items: end; }
  [/#if]

  [#if configuration.separator]
  .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item { border-bottom: 1px solid ${configuration.menuItemSeparatorColor}; }
  .fragment-root .dropzone-menu.fragment-menu.separator .lfr-nav-item:last-child { border-bottom: none; }
  [/#if]

  .fragment-root .hamburger-zone-inner .${configuration.dropzoneGrower} { flex-grow: 1; }

  .fragment-root .dropzone .logo-zone.logo-always {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }
  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone .logo-zone.logo-always { inset-inline-start: 0; inset-inline-end: auto; }
  [/#if]

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root:has(.logo-zone.logo-always) .hamburger-zone-inner {
    overflow: visible !important;
  }
  [#else]
  .fragment-root:has(.logo-zone.logo-always) .hamburger-zone-inner {
    overflow: hidden !important;
  }
  [/#if]
  
  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .lfr-layout-structure-item-responsive-side-menu { position: fixed; z-index: 1; }
    .fragment-root .dropzone-wrapper { width: 100%; }

    .fragment-root .hamburger-zone-wrapper {
      background-color: var(--responsive-menu-breakpoint-tablet-menu-background-color, transparent);
      width: 100%;
      max-width: 100%;
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--side-menu-open-duration) ease-out;
      z-index: 980;
      height: 0;
    }
    .fragment-root .hamburger-zone-wrapper.open {
      grid-template-rows: 1fr;
      height: 100%;
      position: fixed;
      inset-inline-start: 0;
      inset-inline-end: 0;
      inset-block-start: calc(var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px));
      max-height: calc(100dvh - (var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px)));
      overflow: auto;
      z-index: 980;
    }
    .fragment-root.control-menu-offscreen .hamburger-zone-wrapper.open {
      inset-block-start: var(--responsive-menu-hamburger-min-size, 44px);
    }
    .fragment-root.control-menu-offscreen .fragment-menu-icon {
      inset-block-start: 0;
    }

    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper {
      height: 100%;
      grid-template-rows: 1fr;
      width: calc(var(--responsive-menu-item-logo-max-width, 2rem) + 4px);
    }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner {
      height: 100%;
      overflow: hidden;
    }
    .fragment-root .hamburger-zone-inner { position: relative; max-width: none; overflow: hidden; }

    .fragment-root .fragment-menu-icon {
      position: fixed;
      inset-block-start: var(--control-menu-container-height, 0);
      [#if configuration.menuStyle?contains('menu-right')]
      inset-inline-end: 8px;
      inset-inline-start: auto;
      [#else]
      inset-inline-start: 8px;
      inset-inline-end: auto;
      [/#if]
      z-index: 981;
      --_h-size: var(--responsive-menu-hamburger-size, 2.75rem);
      --_h-min: var(--responsive-menu-hamburger-min-size, 44px);
      --_h-effective: max(var(--_h-size), var(--_h-min));
      --hamburger-bar-width: calc(var(--_h-effective) * 0.6);
      --hamburger-bar-height: calc(var(--_h-effective) * 0.12);
      --hamburger-bar-gap: calc(var(--_h-effective) * 0.18);

      display: inline-flex;
      box-sizing: border-box;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--hamburger-bar-gap);

      width: var(--_h-effective);
      height: var(--_h-effective);
      padding: calc(var(--_h-effective) * 0.18 - (var(--responsive-menu-hamburger-border-width, 0px) / 2));
      min-width: var(--_h-min);
      min-height: var(--_h-min);

      margin: 0;
      cursor: pointer;
      background-color: ${configuration.menuHamburgerBgColor};
      border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
      border-radius: ${configuration.menuHamburgerBorderRadius};
    }
    .fragment-root .fragment-menu-icon .bar {
      display: block;
      width: var(--hamburger-bar-width);
      height: var(--hamburger-bar-height);
      border-radius: calc(var(--hamburger-bar-height) / 2);
      background-color: ${configuration.menuHamburgerColor};
    }
    .fragment-root .fragment-menu-icon:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    
    .fragment-root .dropzone-menu.fragment-menu {
      flex-direction: column;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-.25rem);
      transition: opacity .2s ease, transform .2s ease;
      width: 100%;
      position: static;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu.fragment-menu {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-lower {
      pointer-events: none;
      opacity: 0;
      transform: translateY(-.25rem);
      transition: opacity .2s ease, transform .2s ease;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-lower {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; }

    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .fragment-menu-icon { display: none; }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .dropzone-menu.fragment-menu {
      display: block;
      pointer-events: auto;
      opacity: 1;
      transform: none;
      transition: none;
      width: auto;
    }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .dropzone-menu.fragment-menu .navbar-nav {
      display: flex;
      flex-direction: column;
      gap: var(--responsive-menu-zone-gap, .5rem);
      width: auto;
      [#if configuration.menuStyle?contains('menu-right')]
      align-items: end;
      [#else]
      align-items: start;
      [/#if]
    }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .dropzone-menu.fragment-menu .lfr-nav-item a { width: auto; }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate { color: transparent; }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate { color: inherit; }

    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner .dropzone-upper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner .dropzone-lower {
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      height: auto;
      transform: none;
    }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover .dropzone-upper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover .dropzone-lower,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open  .dropzone-upper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open  .dropzone-lower {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }

    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open { width: 100%; }

    [#if configuration.overrideMenuColors]
      .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a { color: ${configuration.menuItemColor} !important; background-color: ${configuration.menuItemBgColor} !important; }
      .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item a:hover { color: ${configuration.menuItemHoverColor} !important; background-color: ${configuration.menuItemHoverBgColor} !important; }
      .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item.selected a { color: ${configuration.menuItemSelectedColor} !important; background-color: ${configuration.menuItemSelectedBgColor} !important; }
    [/#if]

    [#if configuration.menuStyle?contains('menu-right')]
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner {
      transform: translateX(calc(100% - var(--responsive-menu-item-logo-max-width, 2rem) + 4px));
    }
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover .hamburger-zone-inner,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open   .hamburger-zone-inner { transform: none; }
    [/#if]

    .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height); }
    body:has(.logo-zone.logo-always) #main-content.increase-hamburger { margin-top: var(--responsive-menu-logo-max-height); }
  }
  [/#if]

  [#if configuration.enableLandscapePhoneBreakpoint]
  @media only screen and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .fragment-root { height: auto; }
    .fragment-root .dropzone-wrapper { height: auto; width: 0; }
    .lfr-layout-structure-item-responsive-side-menu {
      position: static;
      top: auto;
      height: auto;
      z-index: auto;
    }

    .fragment-root .fragment-menu-icon,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .fragment-menu-icon {
      position: fixed;
      inset-block-start: var(--control-menu-container-height, 0);
      [#if configuration.menuStyle?contains('menu-right')]
      inset-inline-end: 8px;
      inset-inline-start: auto;
      [#else]
      inset-inline-start: 8px;
      inset-inline-end: auto;
      [/#if]
      z-index: 981;
      --_h-size: var(--responsive-menu-hamburger-size, 2.75rem);
      --_h-min: var(--responsive-menu-hamburger-min-size, 44px);
      --_h-effective: max(var(--_h-size), var(--_h-min));
      --hamburger-bar-width: calc(var(--_h-effective) * 0.6);
      --hamburger-bar-height: calc(var(--_h-effective) * 0.12);
      --hamburger-bar-gap: calc(var(--_h-effective) * 0.18);

      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--hamburger-bar-gap);

      width: var(--_h-effective);
      height: var(--_h-effective);
      min-width: var(--_h-min);
      min-height: var(--_h-min);
      padding: calc(var(--_h-effective) * 0.18);
      box-sizing: border-box;

      cursor: pointer;
      background-color: ${configuration.menuHamburgerBgColor};
      border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
      border-radius: ${configuration.menuHamburgerBorderRadius};
    }
    .fragment-root.control-menu-offscreen .fragment-menu-icon {
      inset-block-start: 0;
    }

    body:has(.logo-zone.logo-always) .fragment-root .hamburger,
    .fragment-root .dropzone-wrapper:has(.hamburger-zone-wrapper.open) .hamburger {
      position: fixed;
      inset-block-start: var(--control-menu-container-height, 0);
      inset-inline-start: 0;
      width: 100dvw;
      height: var(--responsive-menu-hamburger-min-size, 44px);
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      z-index: 979;
      display: flex;
      align-items: center;
    }

    .fragment-root.control-menu-offscreen .fragment-menu-icon,
    .fragment-root.control-menu-offscreen:has(.dropzone-menu.fragment-menu .text-truncate img) .fragment-menu-icon {
      inset-block-start: 0;
    }

    body:has(.logo-zone.logo-always) .fragment-root.control-menu-offscreen .hamburger,
    .fragment-root.control-menu-offscreen .dropzone-wrapper:has(.hamburger-zone-wrapper.open) .hamburger {
      inset-block-start: 0;
    }

    .fragment-root .fragment-menu-icon:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    .fragment-root .fragment-menu-icon .bar {
      display: block;
      width: var(--hamburger-bar-width);
      height: var(--hamburger-bar-height);
      border-radius: calc(var(--hamburger-bar-height) / 2);
      background-color: ${configuration.menuHamburgerColor};
    }

    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper,
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper:hover,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover {
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      width: 100dvw;
      max-width: 100%;
      display: grid;
      grid-template-rows: 0fr !important;
      transition: grid-template-rows var(--side-menu-open-duration) ease-out;
      z-index: 980;
      height: auto;
    }
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open,
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open:hover,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open:hover {
      grid-template-rows: 1fr !important;
      width: 100dvw;
      position: fixed;
      inset-inline-start: 0;
      inset-inline-end: 0;
      inset-block-start: calc(var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px));
      max-height: calc(100dvh - (var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px)));
      overflow: auto;
      z-index: 980;
    }
    .fragment-root.control-menu-offscreen:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open,
    .fragment-root.control-menu-offscreen:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open {
      inset-block-start: var(--responsive-menu-hamburger-min-size, 44px);
    }

    .fragment-root .hamburger-zone-inner { max-width: none; overflow: hidden; }

    .fragment-root .dropzone-menu.fragment-menu {
      display: block;
      flex-direction: column;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-.25rem);
      transition: opacity .2s ease, transform .2s ease;
      width: 100%;
      position: static;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu.fragment-menu {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-lower {
      pointer-events: none;
      opacity: 0;
      transform: translateY(.25rem);
      transition: opacity .2s ease, transform .2s ease;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-lower {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .fragment-menu .lfr-nav-item { flex-direction: column; width: 100%; justify-content: end; }
    [#if configuration.menuStyle?contains('menu-right')]
      .fragment-root .fragment-menu .lfr-nav-item { align-items: end; }
    [#else]
      .fragment-root .fragment-menu .lfr-nav-item { align-items: start; }
    [/#if]

    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; align-items: start; justify-content: end; }
    .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100%; }

    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner .dropzone-upper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-inner .dropzone-lower { display: block; }
    .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate { color: inherit; }

    body > .logo-zone.logo-zone-fragment.reduce-logo.logo-always.floating-logo img,
    .fragment-root .dropzone .logo-zone.reduce-logo img {
      height: auto;
      object-fit: contain;
      max-height: min(
        var(--_h-effective, 2.75rem),
        var(--logo-max-height, 60px)
      );
      max-width: var(--logo-max-width, 120px);
    }

    .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height); }
    body:has(.logo-zone.logo-always) #main-content.increase-hamburger { margin-top: var(--responsive-menu-logo-max-height); }
  }
  [/#if]

  [#if configuration.enablePortraitPhoneBreakpoint]
  @media only screen and (max-width: ${configuration.portraitPhoneBreakpoint}) {
    .fragment-root { height: auto; }
    .fragment-root .dropzone-wrapper { height: auto; width: 0; }
    .lfr-layout-structure-item-responsive-side-menu {
      position: static;
      top: auto;
      height: auto;
      z-index: auto;
    }

    .fragment-root .fragment-menu-icon,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .fragment-menu-icon {
      position: fixed;
      inset-block-start: var(--control-menu-container-height, 0);
      [#if configuration.menuStyle?contains('menu-right')]
      inset-inline-end: 8px;
      inset-inline-start: auto;
      [#else]
      inset-inline-start: 8px;
      inset-inline-end: auto;
      [/#if]
      z-index: 981;
      --_h-size: var(--responsive-menu-hamburger-size, 2.75rem);
      --_h-min: var(--responsive-menu-hamburger-min-size, 44px);
      --_h-effective: max(var(--_h-size), var(--_h-min));
      --hamburger-bar-width: calc(var(--_h-effective) * 0.6);
      --hamburger-bar-height: calc(var(--_h-effective) * 0.12);
      --hamburger-bar-gap: calc(var(--_h-effective) * 0.18);

      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--hamburger-bar-gap);

      width: var(--_h-effective);
      height: var(--_h-effective);
      min-width: var(--_h-min);
      min-height: var(--_h-min);
      padding: calc(var(--_h-effective) * 0.18);
      box-sizing: border-box;

      cursor: pointer;
      background-color: ${configuration.menuHamburgerBgColor};
      border: ${configuration.menuHamburgerBorderWidth} ${configuration.menuHamburgerBorderStyle} ${configuration.menuHamburgerBorderColor};
      border-radius: ${configuration.menuHamburgerBorderRadius};
    }
    .fragment-root.control-menu-offscreen .fragment-menu-icon {
      inset-block-start: 0;
    }

    body:has(.logo-zone.logo-always) .fragment-root .hamburger,
    .fragment-root .dropzone-wrapper:has(.hamburger-zone-wrapper.open) .hamburger {
      position: fixed;
      inset-block-start: var(--control-menu-container-height, 0);
      inset-inline-start: 0;
      width: 100dvw;
      height: var(--responsive-menu-hamburger-min-size, 44px);
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      z-index: 979;
      display: flex;
      align-items: center;
    }

    .fragment-root.control-menu-offscreen .fragment-menu-icon,
    .fragment-root.control-menu-offscreen:has(.dropzone-menu.fragment-menu .text-truncate img) .fragment-menu-icon {
      inset-block-start: 0;
    }

    body:has(.logo-zone.logo-always) .fragment-root.control-menu-offscreen .hamburger,
    .fragment-root.control-menu-offscreen .dropzone-wrapper:has(.hamburger-zone-wrapper.open) .hamburger {
      inset-block-start: 0;
    }

    .fragment-root .fragment-menu-icon:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    .fragment-root .fragment-menu-icon .bar {
      display: block;
      width: var(--hamburger-bar-width);
      height: var(--hamburger-bar-height);
      border-radius: calc(var(--hamburger-bar-height) / 2);
      background-color: ${configuration.menuHamburgerColor};
    }

    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper,
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper:hover,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper:hover {
      background-color: var(--responsive-menu-breakpoint-phone-landscape-menu-background-color, transparent);
      width: 100dvw;
      max-width: 100%;
      display: grid;
      grid-template-rows: 0fr !important;
      transition: grid-template-rows var(--side-menu-open-duration) ease-out;
      z-index: 980;
      height: auto;
    }
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open,
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open:hover,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open:hover {
      grid-template-rows: 1fr !important;
      width: 100dvw;
      position: fixed;
      inset-inline-start: 0;
      inset-inline-end: 0;
      inset-block-start: calc(var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px));
      max-height: calc(100dvh - (var(--control-menu-container-height, 0) + var(--responsive-menu-hamburger-min-size, 44px)));
      overflow: auto;
      z-index: 980;
    }
    .fragment-root.control-menu-offscreen:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper.open,
    .fragment-root.control-menu-offscreen:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper.open {
      inset-block-start: var(--responsive-menu-hamburger-min-size, 44px);
    }

    .fragment-root .hamburger-zone-inner { max-width: none; overflow: hidden; }

    .fragment-root .dropzone-menu.fragment-menu {
      display: block;
      flex-direction: column;
      pointer-events: none;
      opacity: 0;
      transform: translateY(.25rem);
      transition: opacity .2s ease, transform .2s ease;
      width: 100%;
      position: static;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu.fragment-menu {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper:not(.open) .dropzone-lower {
      pointer-events: none;
      opacity: 0;
      transform: translateY(.25rem);
      transition: opacity .2s ease, transform .2s ease;
    }
    .fragment-root .hamburger-zone-wrapper.open .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-menu,
    .fragment-root .hamburger-zone-wrapper.open .dropzone-lower {
      pointer-events: auto;
      opacity: 1;
      transform: none;
    }

    .fragment-root .fragment-menu .lfr-nav-item { flex-direction: column; width: 100%; justify-content: end; }
    [#if configuration.menuStyle?contains('menu-right')]
      .fragment-root .fragment-menu .lfr-nav-item { align-items: end; }
    [#else]
      .fragment-root .fragment-menu .lfr-nav-item { align-items: start; }
    [/#if]

    .fragment-root .dropzone .zone-layout.allow-override > div { display: flex; flex-direction: column; align-items: start; justify-content: end; }
    .fragment-root .dropzone .zone-layout.allow-override > div > * { width: 100%; }

    .fragment-root .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .dropzone-menu.fragment-menu .lfr-nav-item .text-truncate { color: inherit; }

    body > .logo-zone.logo-zone-fragment.reduce-logo.logo-always.floating-logo img,
    .fragment-root .dropzone .logo-zone.reduce-logo img {
      height: auto;
      object-fit: contain;
      max-height: min(
        var(--_h-effective, 2.75rem),
        var(--logo-max-height, 60px)
      );
      max-width: var(--logo-max-width, 120px);
    }

    .fragment-root .hamburger.increase { height: var(--responsive-menu-logo-max-height); }
    body:has(.logo-zone.logo-always) #main-content.increase-hamburger { margin-top: var(--responsive-menu-logo-max-height); }
  }
  [/#if]

  @media (prefers-reduced-motion: reduce) {
    .fragment-root { --side-menu-open-duration: 0s; }
  }

  @media (prefers-reduced-motion: reduce) and (max-width: ${configuration.landscapePhoneBreakpoint}) {
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      transition: none;
    }
    .fragment-root .dropzone-menu.fragment-menu,
    .fragment-root .hamburger-zone-wrapper .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper .dropzone-lower {
      transition: none;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) and (max-width: ${configuration.portraitPhoneBreakpoint}) {
    .fragment-root:not(:has(.dropzone-menu.fragment-menu .text-truncate img)) .hamburger-zone-wrapper,
    .fragment-root:has(.dropzone-menu.fragment-menu .text-truncate img) .hamburger-zone-wrapper,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      transition: none;
    }
    .fragment-root .dropzone-menu.fragment-menu,
    .fragment-root .hamburger-zone-wrapper .dropzone-upper,
    .fragment-root .hamburger-zone-wrapper .dropzone-lower {
      transition: none;
      transform: none;
    }
  }

  .reduce-motion * {
    transition: none !important;
    animation: none !important;
  }
</style>

[@renderDropzones zones=zones /]