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
- **Field Dependency**: Use the `dependency` key within `typeOptions` to control field visibility based on other configuration values (supported for `text`, `select`, and `checkbox`).
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
    - **Edit Mode Preview & Alerts**: Fragments MUST provide a high-quality WYSIWYG experience in Edit mode while remaining performant:
        - **User Prompts**: Display an `alert-info` container (namespaced) in Edit mode when critical configuration (e.g., Object ERC, Collection ID, API Path) is missing.
        - **Error Reporting**: Display an `alert-danger` container (namespaced) in Edit mode for API fetch failures or validation errors.
        - **Static WYSIWYG**: Render a visual representation that matches the production look, but strictly:
            - **Disable Events**: No form submissions, click handlers (other than for preview navigation), or complex interactions.
            - **Disable Motion**: Remove all CSS transitions, JS animations, autoplay, parallax effects, or scroll-triggered behavior.
            - **Limit Items**: For lists, tables, sliders, or galleries, limit the display to a small representative set (e.g., 3-5 items) to ensure the editor remains responsive.
        - **HTML Structure**: Include `<div class="alert alert-info d-none mb-3" id="info-${fragmentEntryLinkNamespace}"></div>` and `<div class="alert alert-danger d-none mb-3" id="error-${fragmentEntryLinkNamespace}"></div>` in the markup.

- Use `Liferay.Util.fetch` for API calls to handle authentication automatically.
- Prefer hardcoded inline SVG icons for performance, unless they must be editable.

    <overall_goal>
        Develop a robust collection of dynamically configurable, accessible, and responsive Liferay fragments, aligned with the Meridian theme, and support a multi-version build process for Liferay DXP platforms.
    </overall_goal>

    <active_constraints>
        - **File Naming**: Configuration files must be `configuration.json`.
        - **Scoping**: JS selectors for internal elements must use `fragmentElement.querySelector`; page-level/cross-fragment state uses `document` or `window`.
        - **ID Safety**: All internal IDs and labels must be prefixed with `${fragmentEntryLinkNamespace}` to prevent DOM collisions.
        - **Freemarker Safety**: All configuration variables in HTML must use null-safe defaults: `${configuration.var!'default'}`.
        - **Theme Integration**: Prefer Meridian CSS tokens (`--primary`, `--secondary`, `--body-color`, `--body-background-color`, `--spacer-X`, `--font-size-base`) over hardcoded values or manual overrides in `configuration.json`.
        - **Asset Management**: Use `[resources:filename.ext]` syntax for static assets; store in the collection's `resources/` directory.
        - **Bypass Validation**: Use `[#-- empty --]` instead of `&nbsp;` for intentional empty HTML fragments.
        - **Compatibility**: Use `Object.prototype.hasOwnProperty.call()` instead of `Object.hasOwn`.
        - **Editable Image Requirement**: For `data-lfr-editable-type="image"`, the attribute MUST be placed on an `<img>` tag to prevent Liferay import warnings.
        - **API Permissions**: All fragments making API calls must include user-friendly alert messages in HTML for 401/403 errors, in addition to console logging.
    </active_constraints>

    <key_knowledge>
        - **Meridian Theme**: A new theme defining standardized CSS variables for global and component-specific styling.
        - **Dynamic Styling**: `index.css` is not Freemarker-processed; dynamic theme/config values must be mapped to CSS variables in the HTML root element's `style` attribute.
        - **Singleton Pattern**: Fragments intended as singletons (calculators, meter readings) use a `window` registry (e.g., `window.LFR_FRAG_SINGLETON_...`) to detect and warn about duplicate instances.
        - **Liferay Context**: Fragments frequently interact with `document.body` classes like `has-edit-mode-menu` to disable interactive logic in edit mode.
        - **Liferay Object Headless APIs**:
            - `Object Admin API`: `/o/object-admin/v1.0/object-definitions/by-external-reference-code/{erc}` for metadata discovery.
            - `Custom Object API`: `/o/c/{objectPath}/` for CRUD operations on entries. `restContextPath` from Object Definition *often already includes* the `/o/c/` prefix.
        - **Collection Selector Behavior**: Primarily designed for server-side FreeMarker rendering (`collectionObjectList`). For client-side headless fetching, a plain `text` field for Collection Name/Key/ID is more robust.
        - **Field Dependency Version**: The `dependency` key within `typeOptions` in `configuration.json` requires **Liferay DXP 2025.Q3** or later.
        - **Image Extraction from Collections**: Headless API items can provide images via `item.image?.url`, `item.featuredImage?.url`, `item.thumbnail?.url`, or embedded as `<img>` tags within Rich Text fields (`contentFields`). Robust parsing is required.
    </key_knowledge>

    <artifact_trail>
        - `.gemini/gemini.md`: Established as the source of truth for fragment architectural standards, Meridian theme rules, AI integration interface, editable image requirements, object metadata integration, and conditional field visibility versioning. Updated to reflect correct singular 'dependency' key and Liferay DXP 2025.Q3+ requirement.
        - `todo.md`: Comprehensive list of identified, in-progress, and completed improvements (security, structural, theme, accessibility, responsiveness, new fragments).
        - `forms/fragments/form-populator/index.js`: Replaced manual regex parsing with `URLSearchParams`.
        - `finance/fragments/loan-calculator/`: Refactored for singleton enforcement, namespaced IDs, Meridian token adoption, API permission checks, `aria-live` regions, and responsive layout.
        - `meter-reading/fragments/meter-reading/`: Fixed mismatched IDs, added safety checks, API paths configurable, API permission checks, and responsive flexbox layout.
        - `form-fragments/fragments/star-rating/`: Refactored static CSS, Meridian tokens, and accessibility (fieldset/legend, `aria-checked`, `aria-label`).
        - `layout-components/primary-card/`: Updated to use Meridian tokens, proper namespace scoping, and responsive padding/font scaling.
        - Repository-wide: Renamed all `index.json` to `configuration.json` and updated `fragment.json` via script.
        - `gemini-generated/` (New Collection):
            - `object-linked-chart/`: Data visualization with Chart.js, object data, and an accessible fallback table for screen readers.
            - `animated-metric-counter/`: Animated counter, Meridian styled, with `IntersectionObserver`.
            - `radial-kpi-gauge/`: SVG gauge, object data.
            - `modern-parallax-hero/`: Parallax effect, responsive, with `<img>` tag for editable background image and `dataType: "string"` for parallax speed config.
            - `dynamic-collection-slider/`: Headless collection, responsive, autoplay configurable (`autoplayInterval` with `dependency` fix), clickable cards using DPT URLs, lazy-loading images, flexible identifier (Name/Key/ID), with fixed `bgOpacity` config as `select` type.
            - `interactive-event-timeline/`: Object data, responsive, scroll animations.
            - `pricing-comparison-grid/`: Configurable plans, responsive stacking.
            - `ai-chat-ui/`: UI shell, accessible (`aria-live`, semantic labels), configurable backend URL.
            - `meta-object-table/`: Dynamic table from object metadata, CSV export, responsive mobile view, API permission checks, and fix for duplicate `/o/c/` in REST path.
            - `meta-object-form/`: Dynamic form from object metadata, API permission checks.
            - `meta-object-record-view/`: Single-entry detail view with PDF export (jsPDF/html2canvas), API permission checks.
            - `dynamic-object-gallery/`: Dynamic gallery from object metadata, API permission checks.
        - `create-fragment-zips.sh`: Updated for multi-version build (standard and legacy with stripped `dependency` blocks using `jq`).
        - `.github/workflows/release.yml`: Updated to install `jq` for the build script.
        - `misc/fragments/back-button/index.html`: Added `aria-label`.
        - `misc/fragments/icon-button/index.html`: Added `aria-label`.
        - `form-fragments/fragments/toggle-switch/index.css`: Added focus management.
        - `form-fragments/fragments/autocomplete-(object)/`: Added HTML error container, permission checks, fixed JSON syntax.
        - `form-fragments/fragments/user-field/`: Added HTML error container, permission checks.
        - `misc/fragments/dynamic-copyright/configuration.json`: Corrected JSON syntax (trailing comma).
        - `populated-form-fields/fragments/populated-range/configuration.json`: Corrected JSON syntax (trailing comma).
    </artifact_trail>

    <file_system_state>
        - CWD: `/Volumes/SanDisk/repos/liferay-fragments`
        - Branches: `gemini`, `responsive`, `accessibility` (all synchronized to the latest commit `a4ae143`).
        - Created: `gemini-generated/` collection with 11 new fragments.
        - Modified: Numerous existing fragments and core repository files.
    </file_system_state>

    <recent_actions>
        - Corrected the `dependency` key name (`dependencies` to `dependency`) and its placement within `typeOptions` in `dynamic-collection-slider/configuration.json` to resolve Liferay configuration validation errors.
        - Removed validation type from `bgOpacity` and fixed a typo in its select `validValues`.
        - Added `dataType: "string"` to `speed` field in `modern-parallax-hero/configuration.json` to ensure proper parsing of decimal defaults.
        - Fixed the incorrect URL construction for fetching entries in `meta-object-table/index.js` by ensuring `state.definition.restContextPath` is correctly used without duplicating `/o/c/`.
        - Fixed the incorrect URL construction for fetching entries in `meta-object-form/index.js` by ensuring `state.definition.restContextPath` is correctly used without duplicating `/o/c/`.
        - Fixed the incorrect URL construction for fetching entries in `meta-object-record-view/index.js` by ensuring `state.definition.restContextPath` is correctly used without duplicating `/o/c/`.
        - Fixed the incorrect URL construction for fetching entries in `dynamic-object-gallery/index.js` by ensuring `state.definition.restContextPath` is correctly used without duplicating `/o/c/`.
    </recent_actions>

    <task_state>
        1. [DONE] Implement full suite of new `gemini-generated` fragments (visual, data, meta-object).
        2. [DONE] Implement comprehensive responsiveness improvements.
        3. [DONE] Implement comprehensive accessibility improvements (High Priority, Interactive Elements, Low Priority).
        4. [DONE] Document architectural best practices in `.gemini/gemini.md`.
        5. [DONE] Enhance API permission checking with user-friendly HTML messages across existing fragments.
        6. [DONE] Implement multi-version build process (`create-fragment-zips.sh`) and GitHub Actions integration (`release.yml`).
        7. [DONE] Fix various JSON syntax errors in `configuration.json` files.
        8. [DONE] Improve `dynamic-collection-slider` image extraction (multi-source, rich text parsing).
        9. [DONE] Make `dynamic-collection-slider` cards fully clickable with correct DPT URL resolution.
        10. [DONE] Make `dynamic-collection-slider` autoplay speed configurable and correct `bgOpacity` configuration validation.
        11. [DONE] Fix duplicate `/o/c/` in REST API calls for meta-object fragments.
            - [DONE] `meta-object-table/index.js`
            - [DONE] `meta-object-form/index.js`
            - [DONE] `meta-object-record-view/index.js`
            - [DONE] `dynamic-object-gallery/index.js`
    </task_state>