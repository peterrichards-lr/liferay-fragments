# Liferay Iframer

This may seem like an unnecessary fragment but it can actually be very useful, especially when using the new Dialect theme in Liferay DXP 7.4. In Liferay DXP 7.4 there has been a move to module-less customisations and Dialect is the new theme which is intended to reduce the need for traditional theme modules. This approach makes a greater use of Master Pages in order to define the header, including navigation and footer which would normally be defined within the theme module itself.

The problem comes when you want to navigate to any of the built-in portlets, such as Notifications or Workflow Tasks because they have no knowledge of the Master Page which contains the composite theme components. An earlier approach to this problem was to use a custom Portlet Container fragment to embed the portlet within the page, however, there have been cases where actions within the portlets have resulted in a redirect which then displays the portlet outside the Master Page.

My solution to the problem was to make use of the new Remote Apps feature in Liferay DXP 7.4 and define the portlets as iframe based apps. From my limited testing, I have found that this approach survives the redirect issued seen by the Portlet Container fragment approach. The only issues I found were the fact that users with site or admin permissions saw the control and site menus within the iframe and the slight delay in load time.

The Liferay Iframet fragment solves both of these issues by using a loading animation to hide the iframe before it is ready. Within the same time, the fragment adds CSS styles to the iframe document to hide both the control and site menus. Once everything is ready the load animation is removed, and the portlet can be used as normal.

![Liferay Iframer](../images/liferay-iframer.png)
