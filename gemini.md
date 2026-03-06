# Gemini Project State - Liferay Fragments

## Mandatory Rules & Conventions

### 1. Localization Rule

- **Requirement**: Whenever a fragment's `configuration.json` is modified (e.g., adding/changing fields), the corresponding `Language_en_US.properties` file **must** be updated with the new labels and descriptions.

### 2. Documentation Rule

- **Requirement**: Whenever a fragment's features, configurations, or logic are updated, the corresponding markdown file in `docs/fragments/` (or `docs/setup.md`) **must** be synchronized to reflect these changes.

### 3. Site-Scoping Compliance

- **Requirement**: Fragments interacting with Liferay Objects **must** support Site-scoped data. This involves fetching the object definition via the Admin API to determine its scope and conditionally appending `/scopes/${siteId}` to API endpoints.

### 4. Showcase Data ERC Convention

- **Scope**: Repository-specific convention for showcase data.
- **Convention**: The ERC of an Object is its name in uppercase with underscores separating words (e.g., `COMPANY_MILESTONE`).
- **Note**: This is for internal consistency across sample datasets.

### 5. `taskItemDelegateName` (Liferay CX Rule)

- **Scope**: Mandatory Liferay Client Extension / Batch Engine rule.
- **Convention**: The `taskItemDelegateName` must be the Object's name with a `C_` prefix (e.g., `"taskItemDelegateName": "C_CompanyMilestone"`).
- **Position**: Must be positioned within the `configuration` object, alongside the `parameters` block.

### 6. Pre-commit Hook (Formatting)

- **Requirement**: A git pre-commit hook is active to automatically format changed files:
  - **JSON**: Formatted using `jq`.
  - **Markdown & JavaScript**: Formatted using `npx prettier`.
  - **Exclusions**: HTML (Freemarker) and CSS files are strictly excluded from automated formatting.

### 7. Mappable Field Formatting

- **Requirement**: Any non-title mappable field (`data-lfr-editable`) MUST be wrapped in a `.meta-editor-mappable-fields` container with `.mappable-field-item` children containing a `<label>`.
- **Styling**: This container MUST be hidden in runtime (`display: none`) and forced to `display: flex` only when `layoutMode == 'edit'` (or older `body.has-edit-mode-menu`) is present.
- **Reason**: Provides a clean, organized, and labeled interface for Page Editors to map dynamic fields without cluttering the runtime UI.

### 8. Top-Level Return Prohibited & Logic Encapsulation

- **Requirement**: JavaScript logic in fragments MUST NOT use top-level `return` statements.
- **Implementation**: Encapsulate all logic within an initialization function (e.g., `initMyFragment()`) and invoke it at the end of the script.
- **Control Flow**: Use `if/else` blocks within the function to handle different modes instead of guard-clause returns at the top level.
- **Reason**: Modern Liferay Fragment execution environments may not wrap scripts in a function scope, causing top-level returns to trigger "Illegal return statement" errors.

### 9. Transformation Opt-out (`.no-transform`)

- **Requirement**: If a fragment's JS or CSS contains FreeMarker syntax (`${...}`) that is NOT a JavaScript template literal, a `.no-transform` file MUST be placed in the fragment's root directory.
- **Reason**: Prevents the automated build script (`create-fragment-zips.sh`) from corrupting FreeMarker logic during minification and obfuscation.

### 10. Robust Identifier Validation

- **Requirement**: Always use a strict validation helper (like `isValidIdentifier()`) before using record IDs or ERCs in API calls.
- **Scope**: Explicitly block the strings `"undefined"`, `"null"`, and `"[object Object]"` from reaching network requests.
- **Reason**: Prevents 404/400 errors caused by uninitialized data or corrupted event payloads.

### 11. Liferay Fragment API Evolution & Compatibility

- **Legacy Patterns**:
  - Mode Check: `document.body.classList.contains('has-edit-mode-menu')` (Legacy Edit Mode).
  - Runtime Check: `if (!fragmentNamespace) return;` (Used to detect non-live environments).
- **Modern Patterns**:
  - API: Use the `layoutMode` variable directly (`'view'`, `'edit'`, or `'preview'`).
- **Conversion Rules**:
  - **Edit Mode**: `has-edit-mode-menu` -> `layoutMode === 'edit'`.
  - **Live/View Mode**: `if (fragmentNamespace)` -> `layoutMode === 'view'`.
  - **Non-Preview**: `if (fragmentNamespace)` -> `layoutMode !== 'preview'`.
- **Cross-Version Handling**: When building fragments for unknown Liferay versions, prefer `layoutMode` but consider providing fallback checks for `has-edit-mode-menu` if supporting very old environments (pre-layoutMode API).

### 12. Smart Title Priority

- **Requirement**: For fragments with auto-defaulting titles (Smart Titles), the manually configured title (e.g., `configuration.chartTitle`) MUST take precedence over the evaluated value (e.g., `Sales Reports (sum)`).
- **Implementation**: JS logic should check if the current title matches a system default string; if it does, it should update to the `configuration` title if present, falling back to the evaluated Object label only if the configuration is empty.
- **Reason**: Ensures Page Editors retain control over fragment headings while providing helpful "zero-config" defaults.

## Current Tasks

- [x] Update documentation with showcase data conventions (`docs/setup.md` and fragment docs).
- [x] Synchronize project state in `gemini.md`.
- [x] Enhance Activity Heatmap with configurable `daysToDisplay` and improved legend styling.
- [x] Standardize all fragment `objectERC` defaults to reflect actual showcase data.
- [x] Implement runtime size selector for Activity Heatmap with full localization and documentation.
- [x] Update Animated Metric Counter to support decimal numbers and configurable precision.
- [x] Enhance Meta-Object Form with "Add New", record selection dropdown, and external URL/Event integration.
- [x] Fix Meta-Object Form field display (string-based 'readOnly' and 'businessType' refactoring).
- [x] Upgrade Object-Linked Chart with dynamic data grouping, aggregation, dual-axis support, and theme palettes.
- [x] Refactor Meta-Object Table with triple-modal architecture, robust striping, and embedded dropzones.
- [x] Implement mappable and smart-defaulting titles across all Meta-Object fragments.
- [x] Improve fragment ergonomics with labeled mappable field containers in the Page Editor.
- [x] Refactor fragments to eliminate top-level returns for modern Liferay compatibility.
- [x] Implement automated build optimization (JS obfuscation, CSS/JSON minification) with `.no-transform` support.
- [x] Finalize `layoutMode` modernization across all legacy fragments.
- [x] Refine Smart Title precedence to prioritize configuration values over evaluated data.
