[#--noinspection CssUnusedSymbol,CssUnresolvedCustomProperty,CssInvalidPropertyValue--]
[#assign menuClasses="fragment-menu-" + fragmentEntryLinkNamespace + " fragment-menu " + configuration.menuStyle /]
[#if configuration.separator]
    [#assign menuClasses +=" separator" /]
[/#if]
[#assign menuTextAlign="left" /]
[#if configuration.menuStyle?contains('menu-right')]
    [#assign menuTextAlign="right" /]
[/#if]
[#if configuration.menuStyle?contains('sticky')]
  <style>
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

    body.has-control-menu .lfr-layout-structure-item-responsive-side-menu {
      top: var(--control-menu-container-height, 0);
      height: calc(100vh - var(--control-menu-container-height, 0));
    }

    [#if configuration.menuStyle?contains('menu-right')]
    .lfr-layout-structure-item-responsive-side-menu {
      position: fixed;
    }

    body.has-control-menu .master-page .lfr-layout-structure-item-responsive-side-menu,
    body.has-control-menu .page-editor .lfr-layout-structure-item-responsive-side-menu {
      position: relative;
    }

    [/#if]
    body.has-control-menu .master-page .lfr-layout-structure-item-responsive-side-menu,
    body.has-control-menu .page-editor .lfr-layout-structure-item-responsive-side-menu {
      top: 0;
      height: calc(100vh - var(--control-menu-container-height, 0) - 65px - 29px);
    }

    body.has-edit-mode-menu .page-editor {
      flex-grow: 1;
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
        margin-left: calc(${configuration.menuItemLogoMaxWidth} + 4px);
      }

      [#else]#main-content {
        margin-right: calc(${configuration.menuItemLogoMaxWidth} + 4px);
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
        transition: all .5s ease;
      }

      body.has-control-menu .lfr-layout-structure-item-responsive-side-menu {
        height: auto;
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
  </style>
[/#if]
<style scoped>
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
    transition: all .5s ease;
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
    flex-direction: column;
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .dropzone-menu .fragment-menu .navbar-nav {
    justify-content: end;
  }

  [/#if]
  .fragment-root .dropzone-menu .fragment-menu .nav-item .layout-logo {
    max-height: ${configuration.menuItemLogoMaxHeight};
    max-width: ${configuration.menuItemLogoMaxWidth};
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
    background-color: ${configuration.desktopMenuBgColor};
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: ease all .5s;
    max-width: 100%;
    gap: ${configuration.dropzoneGap};
  }

  .fragment-root .dropzone .zone-layout > div {
    gap: ${configuration.dropzoneGap};
  }

  [#if configuration.menuStyle?contains('menu-right')]
  .fragment-root .hamburger-zone-inner {
    justify-content: end;

  }

  [/#if]
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
    border-bottom: 1px solid${configuration.menuItemSeparatorColor};
  }

  .fragment-root .dropzone-menu .fragment-menu.separator .lfr-nav-item:last-child {
    border-bottom: none;
  }

  [/#if]

  [#if configuration.enableTabletBreakpoint]
  @media only screen and (max-width: ${configuration.tabletBreakpoint}) {
    .fragment-root .hamburger-zone-inner {
      background-color: ${configuration.tabletMenuBgColor};
      max-width: calc(${configuration.menuItemLogoMaxWidth} + 4px);
      overflow: hidden;
      transition: all .5s ease;
    }

    .fragment-root .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      color: transparent;
      opacity: 1;
      transition: all .5s ease;
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
      transition: all .5s ease;
    }

    .fragment-root:hover .hamburger-zone-inner .dropzone-lower,
    .fragment-root:hover .hamburger-zone-inner .dropzone-upper {
      visibility: visible;
      overflow: visible;
      opacity: 1;
      transition: all .5s ease;
    }

    .fragment-root:hover .hamburger-zone-inner {
      max-width: 100%;
      overflow: hidden;
    }

    .fragment-root:hover .hamburger-zone-inner .fragment-menu .lfr-nav-item .text-truncate {
      text-overflow: inherit;
      color: inherit;
      opacity: 1;
      transition: all .5s ease;
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
      background-color: ${configuration.landscapePhoneMenuBgColor};
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
      transition: all .5s ease;
      width: 100%;
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
      transition: all .5s ease;
      min-width: 100%;
    }

    .fragment-root .dropzone .logo-zone.reduce-logo,
    .fragment-root .dropzone .logo-zone.increase-hamburger {
      position: absolute;
      top: 0;
      visibility: hidden;
      opacity: 0;
      transition: all .5s ease;
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
      background-color: ${configuration.portraitPhoneMenuBgColor};
    }
  }

  [/#if]

  body.has-edit-mode-menu .dropzone .page-editor__no-fragments-state {
    min-width: 100px;
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
</style>
<div class="fragment-root-${fragmentEntryLinkNamespace} fragment-root">
    [#if configuration.dropzoneConfig=='menu-only']
      <div class="dropzone-wrapper dropzone-wrapper-menu-only">
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
    [#elseif configuration.dropzoneConfig=='menu-upper-zone']
      <div class="dropzone-wrapper dropzone-wrapper-upper">
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-upper">
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
    [#elseif configuration.dropzoneConfig=='menu-lower-zone']
      <div class="dropzone-wrapper dropzone-wrapper-lower">
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
            <div class="dropzone dropzone-lower">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
          </div>
        </div>
      </div>
    [#elseif configuration.dropzoneConfig=='menu-both-zones']
      <div class="dropzone-wrapper dropzone-wrapper-both">
        <div class="hamburger">
          <a href="javascript:void(0);" class="fragment-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="hamburger-zone-wrapper">
          <div class="hamburger-zone-inner">
            <div class="dropzone dropzone-upper">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
            <div class="dropzone dropzone-menu">
              <div>
                <div class="${menuClasses}">
                  <lfr-drop-zone></lfr-drop-zone>
                </div>
              </div>
            </div>
            <div class="dropzone dropzone-lower">
              <lfr-drop-zone></lfr-drop-zone>
            </div>
          </div>
        </div>
      </div>
    [/#if]
</div>