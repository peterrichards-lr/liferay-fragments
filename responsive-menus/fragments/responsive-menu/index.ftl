[#--noinspection CssUnusedSymbol,CssUnresolvedCustomProperty,CssInvalidPropertyValue--]
[#assign menuClasses="fragment-menu-" + fragmentEntryLinkNamespace + " fragment-menu " + configuration.menuStyle /]
[#if configuration.separator]
    [#assign menuClasses +=" separator" /]
[/#if]
[#assign menuHeaderClass="fragment-menu-editor-padding" /]
[#if configuration.menuHeader]
    [#assign menuHeaderClass +=" show" /]
[/#if]
[#assign dropzoneConfig = configuration.dropzoneConfig /]
[#assign dropzoneCount = 1 /]
[#if configuration.dropzoneConfig?contains('left') || configuration.dropzoneConfig?contains('right')]
    [#assign dropzoneCount += 1 /]
[#elseif configuration.dropzoneConfig?contains('both')]
    [#assign dropzoneCount += 2 /]
[/#if]
[#if configuration.menuStyle?contains('menu-inline')]
    [#assign dropzoneConfig = 'menu-only' /]
    [#assign dropzoneCount = 1 /]
[/#if]
[#assign isInline = configuration.menuStyle?contains('inline') /]
[#assign isSticky = configuration.menuStyle?contains('sticky') /]
[#if isSticky]
  <style>
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
        transition: all .5s ease;
      }
    }

    [/#if]
  </style>
[/#if]
<style scoped>
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

  .fragment-root .dropzone-lower,
  .fragment-root .dropzone-upper {
    visibility: visible;
    overflow: visible;
    opacity: 1;
    transition: all .5s ease;
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
    max-height: ${configuration.menuItemLogoMaxHeight};
    max-width: ${configuration.menuItemLogoMaxWidth};
  }

  .fragment-root .dropzone-menu .fragment-menu .lfr-nav-item a {
    width: 100%;
  }

  .fragment-root .hamburger-zone-inner {
    background-color: ${configuration.desktopMenuBgColor};
    display: flex;
    flex-direction: row;
    transition: ease all .5s;
    max-width: 100%;
    align-items: ${configuration.dropzoneAlignItems};
    gap: ${configuration.dropzoneGap};
  }

  .fragment-root .dropzone .zone-layout > div {
    gap: ${configuration.dropzoneGap};
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
      background-color: ${configuration.tabletMenuBgColor};
      transition: all .5s ease;
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
      min-width: calc(100% / ${dropzoneCount});
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
      background-color: ${configuration.landscapePhoneMenuBgColor};
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
      transition: all .5s ease;
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
      transition: all .5s ease;
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
      white-space: nowrap;
    }

  [/#if]

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
      transition: all .5s ease;
      width: 100%;
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
      transition: all .5s ease;
      min-width: 100%;
    }

    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      position: absolute;
      top: 0;
      right: 0;
      visibility: hidden;
      opacity: 0;
      transition: all .5s ease;
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
      background-color: ${configuration.portraitPhoneMenuBgColor};
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

  body.has-edit-mode-menu .dropzone {
    flex-grow: 1;
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
<div class="fragment-root-${fragmentEntryLinkNamespace} fragment-root">
    [#if dropzoneConfig=='menu-only']
      <div class="dropzone-wrapper dropzone-wrapper-menu-only">
        <div class="${menuHeaderClass}">Responsive Menu</div>
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-menu">
              <div>
                <div class="${menuClasses}">
                  <lfr-drop-zone></lfr-drop-zone>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    [#elseif dropzoneConfig=='menu-left-zone']
      <div class="dropzone-wrapper dropzone-wrapper-left-zone">
        <div class="${menuHeaderClass}">Responsive Menu</div>
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-left">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
            <div class="dropzone dropzone-menu">
              <div>
                <div class="${menuClasses}">
                  <lfr-drop-zone></lfr-drop-zone>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    [#elseif dropzoneConfig=='menu-right-zone']
      <div class="dropzone-wrapper dropzone-wrapper-right-zone">
        <div class="${menuHeaderClass}">Responsive Menu</div>
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-menu">
              <div>
                <div class="${menuClasses}">
                  <lfr-drop-zone></lfr-drop-zone>
                </div>
              </div>
            </div>
            <div class="dropzone dropzone-right">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
          </div>
        </div>
      </div>
    [#elseif dropzoneConfig=='menu-both-zones']
      <div class="dropzone-wrapper dropzone-wrapper-menu-both-zones">
        <div class="${menuHeaderClass}">Responsive Menu</div>
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-left">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
            <div class="dropzone dropzone-menu">
              <div>
                <div class="${menuClasses}">
                  <lfr-drop-zone></lfr-drop-zone>
                </div>
              </div>
            </div>
            <div class="dropzone dropzone-right">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
          </div>
        </div>
      </div>
    [/#if]
    [#if configuration.scrollBackToTop && !isSticky]
      <button class="fragment-scroll-to-top" title="Go to top">
          [@clay["icon"] symbol="${configuration.scrollBackToTopIcon}" /]
      </button>
    [/#if]
</div>