[#assign preferences =
freeMarkerPortletPreferences.getPreferences({"portletSetupPortletDecoratorId":
"barebone", "destination": "/search"}) /]
<div class="collapse search-bar-collapse" id="searchBar">
  <div class="search-bar-wrapper">
    <div role="search">
      [#if configuration.useCommerceSearch] [@liferay_commerce_ui["search-bar"] /]
      [#else] [@liferay.search_bar default_preferences="${preferences}" /] [/#if]
    </div>
  </div>
</div>
