# Content Fragments

This collection includes fragments for displaying content from Liferay
structures, with a focus on Service-oriented displays.

## Content Map

This fragment uses the headless API to deliver an enhanced content map similar
to what the Asset Publisher provides.

- You can use the default markers and info window template to get going
  straightaway.
- You can use OpenStreetMap (Leaflet) or Google Maps.
- You can the default Auto Fit Bounds option or specify the zoom and map initial
  centre (latitude and longitude).
- You can use the default Info window trigger of hover or change it to click or
  none. If none is selected, then an info window will not be bound to the
  marker. In the case of hover, you can specify how long the info window should
  remain open after focus is lost.
- You can setup markers to navigate to a custom or the default Display Page,
  with the option to open it in a new tab.
- You can configure taxonomy within DXP to specify the icon and colour used for
  each marker. The fragment uses UNKPG icons. - The priority property can be
  used to control which category icon is used where multiple categories are
  mapped to a web content item.
- You can use a Web Content Template to control the layout of the info window.
  This uses custom placeholders which are substituted when the template is
  rendered in the fragment.

![Content Map](../images/content-map.png)

### Videos

- [Custom Markers](../videos/Content%20Map%20Fragment%20-%20Custom%20Markers.mp4)
- [Basic](../videos/Content%20Map%20Fragment%20-%20Basic.mp4)
- [Advanced](../videos/Content%20Map%20Fragment%20-%20Advanced.mp4)

### Usage

As a minimum a web content structure with a single Geolocation field is needed.
The inherited fields of title and description are used to place the markers on
the map. The Geolocation field can be at the top level or nested within a field
set; the fragment will traverse the structure to find a field of type
Geolocation.

1. Create a new web content structure
2. Add a single GeoLocation field
3. Create a web content item using the structure
4. Create a collection. The collection can be dynamic or manual but needs to be
   configured for the new structure
5. Add the fragment to a page
6. Configure the fragment by providing the id, key, uuid or name of the
   collection

---

## Service Card

A visually appealing card designed to display information from a Service content
structure. It supports dynamic background colors, customizable icons, and
optional debug logging.

## Service Icon

Similar to the Service Card, but focuses on an icon-centric display. It can pull
icon information directly from the mapped content structure or use a default
symbol defined in the configuration.

## Service Link Button

A dynamic button that changes its label and behavior based on the user's
authentication status.

- **Signed In**: Displays "Go to Service" and links to the service URL.
- **Guest**: Displays "Login for Service" and redirects the user to the login
  page.
