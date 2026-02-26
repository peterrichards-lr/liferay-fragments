# Liferay Fragments Repository Analysis

## Overview
This repository contains a collection of Liferay Fragments, organized into collections (e.g., `commerce`, `form-fragments`, `finance`) or as standalone fragments. Each fragment typically consists of:
- `fragment.json`: Metadata defining paths to HTML, CSS, JS, and configuration.
- `configuration.json`: Defines user-configurable fields available in the Liferay UI.
- `index.html`: The markup, utilizing Freemarker (square bracket syntax `[# ... ]`) and Liferay-specific tags.
- `index.css`: Styles, scoped using `${fragmentEntryLinkNamespace}`.
- `index.js`: Client-side logic, leveraging global objects like `Liferay`, `fragmentElement`, `configuration`, and `input`.

## Key Learnings

### Liferay Fragment Lifecycle & Environment
- **Global Objects**: Liferay injects several global variables into the fragment's context:
    - `fragmentElement`: The root DOM element of the fragment instance.
    - `configuration`: An object containing values set by the user in the configuration panel.
    - `fragmentEntryLinkNamespace`: A unique identifier for the fragment instance on the page, useful for scoping IDs and classes.
    - `layoutMode`: Indicates if the page is in `view`, `edit`, or `preview` mode.
    - `input`: (In Form Fragments) Provides metadata about the form field the fragment is bound to.
- **Initialization**: JS logic often waits for `Liferay.on('allPortletsReady', ...)` to ensure the environment is fully initialized.
- **Freemarker**: The HTML is processed as a Freemarker template, allowing for conditional rendering and looping based on configuration or Liferay context.

### Development Workflow
- **Packaging**: The repository uses `create-fragment-zips.sh` to bundle fragments into ZIP files.
- **Internationalization**: Some fragments include `Language_en_US.properties` for localized strings.

## Global vs. Fragment Scoping (JavaScript)
Proper scoping is critical in a portal environment where multiple fragments co-exist.

### Fragment-Level Scoping (Default)
Always prefer `fragmentElement.querySelector` for any element contained within the fragment's own template. 
- **Goal**: Prevent "Selector Bleed" between fragment instances.
- **Example**: `const btn = fragmentElement.querySelector('.my-button');`

### Global/Page-Level Scoping (Contextual)
Use `document` or `window` only for broader page environment awareness.
- **Page State**: Checking `document.body.classList` for edit mode or permissions.
- **Cross-Fragment Interaction**: Design-intended monitoring or modification of external elements.
- **Global Events**: Listeners for `window` or `document` (e.g., `resize`, `scroll`, `Liferay.on`).

## Best Practices

### Configuration & Editable Content
- **File Naming**: Configuration files MUST be named `configuration.json`.
- **Field Nesting**: All fields in `configuration.json` MUST be nested within a `fieldSets` array.
- **Valid Configuration Types**:
    - `text`: Standard text input. Supports `validation` (email, number, url, pattern) in `typeOptions`.
    - `select`: Dropdown menu. Requires `validValues` in `typeOptions`.
    - `checkbox`: Boolean toggle.
    - `colorPicker`: Flexible color selector.
    - `colorPalette`: Selector for predefined brand colors.
    - `length`: Numeric values with units (px, %, rem).
    - `itemSelector`: Dialog for selecting Liferay assets (images, documents, etc.).
    - `url`: Specialized field for URL input/selection.
    - `videoSelector`: Returns a JSON string with embed code (see *Advanced Logic*).
    - `collectionSelector`: For selecting a Collection of items. 
        - **FreeMarker Pattern**: Access items via `${fieldName}ObjectList`.
        - **Headless Note**: This type is primarily for server-side listing. If a fragment requires a Collection ID for client-side AJAX/Headless fetching, a standard `text` field may be more reliable for user input.
    - `navigationMenuSelector`: For choosing a Navigation Menu.
- **Field Dependencies**: Use the `dependencies` key within `typeOptions` to control field visibility based on other configuration values (supported for `text`, `select`, and `checkbox`).
- **Invalid Config Types**: Do NOT use `image`, `link`, or `rich-text` as types in `configuration.json`. These must be defined as editable in the HTML.
- **Editable Content**: Use `data-lfr-editable-type` (e.g., `text`, `rich-text`, `image`, `link`, `date-time`, `action`) directly in the HTML. Avoid redundant configuration fields for these types.
    - **Image Requirement**: For `data-lfr-editable-type="image"`, the attribute MUST be placed on an `<img>` tag. Using it on a `<div>` or other element will cause import warnings in Liferay.
- **Freemarker Safety**: Always provide default values using the `!default` syntax: `${configuration.title!'Default'}`.

### Dynamic Styling & CSS Variables
- **CSS Scoping**: Use `${fragmentEntryLinkNamespace}` for all IDs and custom CSS class prefixes.
- **Variable Bridging**: Map `configuration` values to CSS variables in the `index.html` (either on the root element's `style` attribute or in a scoped `<style>` block).
- **Clean Separation**: Move all static CSS rules to `index.css` and reference dynamic values via `var(--my-variable, default-value)`.

### Asset Management
- **Resources**: Store static assets (images, SVGs) in the `resources/` directory at the root of the fragment collection.
- **Syntax**: Reference assets using `[resources:filename.ext]` syntax in `index.html`. Never use relative paths like `../../resources/`.

### Advanced Logic
- **Video Selector**: This configuration type returns a JSON string. Parse it in JS: `const data = JSON.parse(configuration.video);` then inject `data.html`.
- **Singleton Enforcement**: For singleton fragments, use a global registry on the `window` object to detect and display a "Duplicate Instance" warning if multiple instances are added to the page.

### Theme Integration & Tokens (Meridian)
Fragments should be designed to inherit styles from the Meridian theme to ensure brand consistency and reduce configuration overhead.
- **Prefer Theme Tokens**: Always prefer theme-provided CSS tokens over hardcoded hex codes, pixel values, or manual configuration overrides.
- **Color Tokens**: Use `--primary`, `--secondary`, `--body-color`, `--body-background-color`, and their variants (e.g., `--primary-d1`, `--primary-l3`).
- **Spacing Tokens**: Use `--spacer-0` through `--spacer-10` for margins and padding to maintain consistent layout rhythms.
- **Typography Tokens**: Use `--font-family-base`, `--font-size-base`, and heading tokens (e.g., `--h1-font-size`).
- **Conditional Configuration**: If a fragment needs custom colors, provide them in `configuration.json` but set their default values to the corresponding theme token (e.g., `var(--primary)`).

### AI Assistant Integration Interface
Fragments providing AI Chat capabilities expect a backend (typically a Liferay Client Extension) that adheres to the following JSON interface:

**Endpoint Configuration**: The fragment should have a `backendUrl` configuration field pointing to the Client Extension endpoint.

**Request Structure (POST)**:
```json
{
  "query": "The user message",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "userContext": {
    "userId": "123",
    "groupId": "456",
    "languageId": "en_US"
  }
}
```

**Response Structure (JSON)**:
```json
{
  "answer": "The plain text or markdown response from the AI",
  "status": "success",
  "metadata": {
    "sources": [
      {"title": "Liferay Docs", "url": "https://..."}
    ]
  }
}
```

### Object Metadata Integration
For truly dynamic fragments (e.g., auto-generated forms or tables), fragments should leverage the Liferay Object Admin API to discover schema information at runtime:
1. **Definition Fetch**: Use `/o/object-admin/v1.0/object-definitions/by-external-reference-code/{erc}` to get the field list.
2. **Field Rendering**: Iterate through `objectFields` and use the `type` property (e.g., `String`, `Integer`, `CPLongText`, `DateTime`) to decide which UI component to render.
3. **Validation**: Use the `required` property from the metadata to enforce client-side validation.

### Layout & UI
- Check `layoutMode` to disable interactive or intrusive logic during page editing.
- Use `Liferay.Util.fetch` for API calls to handle authentication automatically.
- Prefer hardcoded inline SVG icons for performance, unless they must be editable.
