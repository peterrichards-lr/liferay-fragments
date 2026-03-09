# Fragment Test-Bed & Visual Assets

The test-bed is a Playwright-based environment for rendering fragments outside of Liferay DXP. It is used for behavioral verification and automatic generation of visual assets.

## 1. Test Directory Structure

Every fragment should ideally include a `test/` directory to facilitate automated testing:

- `test/metadata.json`: Configuration for the test runner.
- `test/configuration.json`: Mock configuration values (overrides `configuration.json` defaults).
- `test/data.json`: Mock data for API calls AND Liferay editable fields.
- `test/index.css`: Extra CSS used only during testing (e.g., to force visibility of certain elements).

### metadata.json schema

```json
{
  "theme": "meridian",
  "thumbnailSelector": ".my-feature-container",
  "screenshotSelector": "body"
}
```

## 2. Mocking Data

The test-bed provides a robust mocking system via `test-bed/mocks.js`:

- **ThemeDisplay**: Mocks common methods like `getLanguageId`, `getUserId`, `getThemeId`, `getThemeName`, etc.
- **Liferay.Util.fetch**: Intercepts requests and returns data from `test/data.json`.
- **Liferay Editable Fields**: Any element with `data-lfr-editable-id="my-id"` will have its inner content replaced by the value of `"my-id"` in `test/data.json`.

### Example `test/data.json`

```json
{
  "service-title": "Magical Service",
  "service-description": "This text replaces the editable description.",
  "/o/c/myobjects": { "items": [...] }
}
```

## 3. Visual Assets: Screenshot vs. Thumbnail

We distinguish between two types of visual assets:

### Screenshot (`screenshot.png`)

- **Purpose**: Documentation and full-context preview.
- **Scope**: Usually the entire body (`screenshotSelector: "body"`).
- **Location**: Fragment root directory.

### Thumbnail (`thumbnail.png`)

- **Purpose**: Selection preview in the Liferay Fragment UI.
- **Scope**: **Focused.** It should highlight the core feature or aesthetic of the fragment.
- **Note**: It does NOT need to be a resized version of the screenshot. Use `thumbnailSelector` in `metadata.json` to zoom in on a specific part of the fragment.
- **Location**: Fragment root directory.

## 4. Environment Fidelity

The runner automatically:

- Supports both `index.html` and `index.ftl`.
- Injects the selected theme's CSS.
- Adds theme-specific classes to `<body>` (e.g., `.meridian-theme`).
- Mocks `localStorage`, `sessionStorage`, and `document.cookie`.
- Waits for JS initialization and animations (1 second default).

## 5. Running the Test-Bed

### Single Fragment

```bash
node test-bed/runner.js [fragment-path] [mode] [theme]
```

### Bulk Render

```bash
node test-bed/bulk-render.js [theme]
```
