# Troubleshooting & FAQ

This guide addresses common issues encountered when deploying or configuring the fragments in this repository.

---

## 1. General Issues

### Fragments not appearing in the page editor
*   **Check Site Deployment**: Ensure you've deployed the fragments to the correct Site or to the Global site. Use `create-fragment-zips.sh` with the correct `COMPANY_WEB_ID` and `GROUP_KEY`.
*   **Check Dependencies**: Some fragments require JavaScript Client Extensions to be active on the page.

### JavaScript errors in the console
*   **Missing API permissions**: Many fragments fetch data via Headless APIs. Check for `401 Unauthorized` or `403 Forbidden` errors. See [Prerequisites & Setup](./setup.md) for details on Service Access Policies.
*   **Global Variables**: Some fragments expect global variables like `Liferay.ThemeDisplay` or `PubSub` to be available. These are standard in Liferay, but may be missing in custom master pages or themes.

---

## 2. Form Fragments

### Form Populator is not populating fields
*   **Check Mapping JSON**: Ensure your `fieldReference` exactly matches the ID or Name in the DOM. Liferay dynamically generates these IDs (e.g., `Text53774731`).
*   **Check URL Parameters**: Verify that the query string key in the URL matches the `parameter` attribute in your mapping.
*   **Retry Delay**: Some forms render slowly. Increase the `Retry Count` or `Retry Interval` in the fragment configuration.

### Autocomplete suggestion list is empty
*   **Check API Path**: Ensure the Object API URL is correct.
*   **Permission Check**: Does the user (including Guests) have permission to read the records of that Object?

---

## 3. Data & Objects

### Object-Linked Charts are blank
*   **Check Field Mapping**: Ensure the internal field names in the configuration match the field names defined in the Liferay Object (case-sensitive).
*   **No Data**: Verify that the Object has records that match the current filtering criteria.

### PDF Export fails to generate
*   **Browser Support**: The PDF export feature relies on modern browser APIs. Test in Chrome or Edge.
*   **Complex Layouts**: Very complex nested layouts may cause rendering timeouts. Try simplifying the Detail View layout.

---

## 4. UI & Layout

### Responsive Menus look broken on mobile
*   **Master Page Wrapper**: These fragments work best when placed inside a Liferay Master Page. Ensure your master page has the standard Liferay wrappers.
*   **CSS Collisions**: Your site's theme may be overriding the menu's CSS. Check the "Style" tab in the fragment for overrides.
