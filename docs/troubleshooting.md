# Troubleshooting & FAQ

This guide addresses common issues encountered when deploying or configuring the
fragments in this repository.

---

## 1. General Issues

### Fragments not appearing in the page editor

- **Check Site Deployment**: Ensure you've deployed the fragments to the correct
  Site or to the Global site. Use `create-fragment-zips.sh` with the correct
  `COMPANY_WEB_ID` and `GROUP_KEY`.
- **Check Dependencies**: Some fragments require JavaScript Client Extensions to
  be active on the page.

### JavaScript errors in the console

- **Missing API permissions**: Many fragments fetch data via Headless APIs.
  Check for `401 Unauthorized` or `403 Forbidden` errors. See
  [Prerequisites & Setup](./setup.md) for details on Service Access Policies.
- **Global Variables**: Some fragments expect global variables like
  `Liferay.ThemeDisplay` or `PubSub` to be available. These are standard in
  Liferay, but may be missing in custom master pages or themes.
- **Illegal return statement**: If you encounter this error, ensure the
  fragment's JavaScript logic is encapsulated in a function and not using
  top-level `return` statements. Modern Liferay Fragment execution standards
  prohibit top-level returns.

---

## 2. Build System & Transformation Errors

### CSS Minification Errors

If you see errors like `Ignoring local @import of ... as resource is missing`
during the build process, it is often due to a bug in the minification tool
(`clean-css`) when handling paths with parentheses or special characters.

**Solution**: Add an empty file named `.no-transform` to the fragment's root
directory to skip automated transformations for that fragment.

### JS Obfuscation Errors

If the build fails with a "Parse error" during JS obfuscation, it is usually due
to FreeMarker syntax (`${...}`) being present in the `.js` file without being
correctly escaped or wrapped in a JavaScript template literal (backticks).

**Solution**:

1. Prefer using JavaScript template literals (backticks) for strings containing
   `${}` interpolation.
2. If FreeMarker processing is strictly required in the script, add a
   `.no-transform` file to the fragment's root.

---

## 3. Configuration & Metadata Errors

### Dependent fields not showing/hiding as expected

If you've configured a dependency in `configuration.json` (e.g., `fieldA`
depends on `fieldB`), but the UI in the Page Editor doesn't update when you
change the source field:

- **Check Field Sets**: Ensure both fields are in the **same field set**.
  Liferay does not support cross-field-set dependencies. If you need a field to
  depend on another, move them into the same group.
- **Check Field Names**: Verify that the key in the `dependency` object exactly
  matches the `name` of the source field.

### "Lazy keys" in Page Editor

If the labels or descriptions in the Page Editor look like
`lfr.gemini-generated.my-key` instead of human-readable text:

- **Check Localization**: Ensure the key exists in `Language_en_US.properties`.
- **Deduplication Error**: The linter will fail if the key and value are
  identical (e.g., `lfr.key=lfr.key`). Always provide a descriptive English
  value.

---

## 4. Form Fragments

### Form Populator is not populating fields

- **Check Mapping JSON**: Ensure your `fieldReference` exactly matches the ID or
  Name in the DOM. Liferay dynamically generates these IDs (e.g.,
  `Text53774731`).
- **Check URL Parameters**: Verify that the query string key in the URL matches
  the `parameter` attribute in your mapping.
- **Retry Delay**: Some forms render slowly. Increase the `Retry Count` or
  `Retry Interval` in the fragment configuration.

### Autocomplete suggestion list is empty

- **Check API Path**: Ensure the Object API URL is correct.
- **Permission Check**: Does the user (including Guests) have permission to read
  the records of that Object?

---

## 4. Data & Objects

### Meta-Object fragments fail with 403 Forbidden

If your Table, Form, or Record View fragments are blank or show "Forbidden"
errors in the console, it is likely due to missing permissions for the **Object
Definition** API.

**Solution**:

1.  Navigate to **Control Panel -> Security -> Service Access Policy**.
2.  Edit your Guest access policy (e.g., `GUEST_READ`).
3.  Add the following signature to allow metadata discovery:
    `com.liferay.object.admin.rest.internal.resource.v1_0.ObjectDefinitionResourceImpl#getObjectDefinitionByExternalReferenceCode`
4.  Ensure that the specific Liferay Object's REST API is also permitted for the
    Guest role in the Object's **Permissions** tab.

### Object-Linked Charts are blank

- **Check Field Mapping**: Ensure the internal field names in the configuration
  match the field names defined in the Liferay Object (case-sensitive).
- **No Data**: Verify that the Object has records that match the current
  filtering criteria.

### PDF Export fails to generate

- **Browser Support**: The PDF export feature relies on modern browser APIs.
  Test in Chrome or Edge.
- **Complex Layouts**: Very complex nested layouts may cause rendering timeouts.
  Try simplifying the Detail View layout.

---

## 5. UI & Layout

### Responsive Menus look broken on mobile

- **Master Page Wrapper**: These fragments work best when placed inside a
  Liferay Master Page. Ensure your master page has the standard Liferay
  wrappers.
- **CSS Collisions**: Your site's theme may be overriding the menu's CSS. Check
  the "Style" tab in the fragment for overrides.
