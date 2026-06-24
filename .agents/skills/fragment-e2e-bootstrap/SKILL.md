---
name: fragment-e2e-bootstrap
description: Instructions for zipping, seeding, E2E testing, and capturing visual snapshots of fragments in Liferay DXP using the workspace's custom bootstrap framework.
---

# Fragment E2E Seeding & Visual Capture Skill

This skill provides instructions on how to leverage the project's custom visual testing bootstrap framework to build, test, and capture screenshots of Liferay DXP fragments.

## 1. Page Layout Schema (`test-data.json`)

Every fragment must have a `test-data.json` file in its root directory defining a test page layout. This layout is read by `global-setup.js` to dynamically seed a content page for browser E2E testing.

### Key Guidelines

- **Grid Responsiveness**: Define column layout sizes across breakpoints using `columnViewports` within the Column definitions:
  ```json
  "columnViewports": [
    { "columnViewportDefinition": { "size": 6 }, "id": "tablet" },
    { "columnViewportDefinition": { "size": 12 }, "id": "portraitMobile" },
    { "columnViewportDefinition": { "size": 12 }, "id": "landscapeMobile" }
  ]
  ```
- **Commerce Product Mappings**: Link mapped fields to commerce products using placeholders in `fragmentFields`:
  - `"COMMERCE_PRODUCT_1"`, `"COMMERCE_PRODUCT_2"`, `"COMMERCE_PRODUCT_3"`, `"COMMERCE_PRODUCT_4"`
    These are dynamically replaced by `global-setup.js` with the real auto-generated product ID integers from Liferay's active catalog.

### Content Seeding Protocols

The E2E bootstrap framework automatically provisions the following resources on the target Liferay instance if they are not already present:

1. **Commerce Products Seeding**:
   - The framework queries the active Liferay Commerce channels and catalog.
   - If empty, it programmatically seeds up to 4 mock commerce products (assigning SKUs, names, descriptions, and configuring prices and promotional discount differentials) via Liferay's Headless Commerce Admin API.
   - It replaces `"COMMERCE_PRODUCT_1"` through `"COMMERCE_PRODUCT_4"` placeholders in the page configuration JSON with the real generated ID numbers.

2. **Documents & Media Assets**:
   - You can declare local files (like images, icons, or PDF brochures) in the top-level `"documents"` array of `test-data.json`.
   - The framework uploads these files to Liferay's Document Library using the Headless Delivery API and assigns them the specified `externalReferenceCode` (ERC).
   - In page layout configurations (e.g. image URLs), the ERC placeholder is automatically resolved to the real published URL of the uploaded asset.
   - Guest view permissions are automatically granted to these files so that E2E visual capture executes cleanly.

3. **Structured Content (Web Content Articles)**:
   - Web Content structures and article content sets can be declared inside `test-data.json`.
   - The framework creates these resources and marks them with guest view permissions (`viewableBy: 'Anyone'`) to prevent 403 Forbidden pages for unauthenticated visitors.

4. **Object Definitions & Permissions**:
   - Custom object definitions (e.g. `WATER_READING`, `TICKET`) are verified on startup.
   - To bypass Liferay DXP's strict guest access boundaries, the framework registers API fallback pathways in `Liferay.Fragment.Commons.resolveObjectPathByERC` so unauthenticated visitors can fetch mock object schema structures.

5. **Guest Access & Permissions**:
   - **Service Access Policy (SAP)**: The setup scripts automatically configure Liferay's `SYSTEM_DEFAULT` SAP policy to authorize Guest users to view headless collection elements (specifically `com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl#*`).
   - **Guest View Permissions**: Programmatically created test layouts, content structures, and articles are granted Guest view permissions (`viewableBy: 'Anyone'` or `addGuestPermissions: true` in the setup service context) to prevent 403 Forbidden errors.

- **FormContainer Rest Schema Constraints & Input Seeding**:
  - In Liferay 2026.Q1+ REST payloads, a `FormContainer` pageElement's `pageElements` array must contain `FormFragment` elements _directly_ (no layout sections, rows, or columns are allowed directly inside `FormContainer`). Nested layout structures inside `FormContainer` pageElements are rejected with validation errors like `Unable to map JSON path: pageDefinition.pageElement.pageElements.null.type`.
  - Input fragments (having `"type": "input"` in `fragment.json`) **must** be placed inside a `FormContainer` as `FormFragment` elements. Placed directly inside standard layout structures as standard `Fragment` elements, Liferay DXP's layout service will reject them and leave their column/row empty, causing Playwright assertion failures (e.g., `Fragment was not found on the page!`).
  - By default, if `test-data.json` does not specify a `pageLayout`, `global-setup.js` attempts to place the fragment directly inside a standard Section/Row/Column as type `Fragment`. For input fragments, you should either define a custom `pageLayout` in `test-data.json` wrapper conforming to `FormContainer` -> `FormFragment`, or configure the fallback mechanism to handle input types.

### 1.2 Shared Build Dependencies (`fragment-build.json`)

If the fragment utilizes shared helper utilities (such as `discovery.js` for site-scoped dynamic object discovery or `dom.js` for utility functions), it must define them inside a `fragment-build.json` file in its root:

```json
{
  "sharedResources": ["discovery.js"]
}
```

The workspace build process will automatically bundle these scripts. If you omit this declaration for a fragment that calls `Liferay.Fragment.Commons.resolveObjectPath`, the browser console will raise a `TypeError` (e.g., `resolveObjectPath is not a function`) during E2E testing, causing the verification suite to fail.

## 2. E2E Framework & Visual Verification

Run the test suite using `scripts/test-runner.sh`. In Windows environments, invoke it using `bash.exe`:

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k -f "<Fragment Name>"
```

### Visual Capture Features

- **Drop Zone Collision Prevention**: The framework's `buildPageElementTree` generates unique random IDs for all `FragmentDropZone` element definitions. This prevents Liferay's server-side page layout importer from clashing on clashing ID attributes when rendering multiple instances of the same fragment.
- **Row-Level Screenshotting**: The Playwright spec `fragments.spec.js` checks the page. If there are multiple instances of the fragment on the test page (e.g. 4 side-by-side cards), it automatically screenshots the parent row/container (`.lfr-layout-structure-item-row, .row, #wrapper`) instead of only capturing the first single instance. This guarantees that all products are captured side-by-side across desktop, tablet, and mobile viewports in the visual gallery.
