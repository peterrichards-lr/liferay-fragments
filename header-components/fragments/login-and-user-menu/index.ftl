[#assign hrefSignIn = themeDisplay.getPortalURL() + "/c/portal/login" /] [#if
!themeDisplay.isSignedIn()]
<div class="component-button text-break">
  <a
    class="btn"
    href="${hrefSignIn}"
    id="fragment-${fragmentEntryLinkNamespace}-link"
  >
    <span style="font-size: ${configuration.iconSize!}">
      [@clay["icon"] symbol="${configuration.iconName!}" /]
      <span data-lfr-editable-id="link-text" data-lfr-editable-type="text">
        Log In
      </span>
    </span>
  </a>
</div>
[#else]
<div class="user-menu">[@liferay.user_personal_bar /]</div>
[/#if]
