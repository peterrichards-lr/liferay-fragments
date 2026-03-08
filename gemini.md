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
- **Scope**: Explicitly block the strings `"undefined"`, `"null"`, `"0"`, and `"[object Object]"` from reaching network requests.
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

### 13. Standardized API Interaction

- **Requirement**: Use Liferay-provided utilities for all network requests to ensure consistent authentication and security.
- **Liferay APIs**: For all internal Liferay endpoints and Object APIs, use `Liferay.Util.fetch`. It automatically handles CSRF tokens and `Liferay.authToken`.
- **Client Extensions**: For calling client extensions that utilize User Agent-based OAuth2 authentication, use `Liferay.OAuth2Client`.
- **Implementation**:
  - `Liferay.Util.fetch('/o/c/myobjects')` for standard Liferay APIs.
  - `const {fetch} = Liferay.OAuth2Client.fromUserAgent('client-id'); fetch('/o/ext/api')` for OAuth2-secured extensions.
- **Reason**: Prevents manual token management and ensures compatibility with Liferay's security infrastructure.

### 14. Scoped Internal Selectors

- **Requirement**: Always use `fragmentElement.querySelector` instead of `document.querySelector` for targeting internal elements.
- **Exception**: Global `document` or `window` selectors are only permitted for cross-fragment communication (e.g., PubSub, Liferay.on) or page-level state.
- **Reason**: Prevents selector collision when multiple instances of the same fragment are present on a single page.

## Current Tasks

- [x] Complete Comprehensive Functional Audit: Systematic check of all fragments against git history to restore lost logic.
- [x] Restore "Smart Commerce" Badge Logic: Harmonized automatic and manual badging in `dynamic-badge-overlay`.
- [x] Re-implement Date Range Formatting: Restored start/end day/month logic in Date Display fragments.
- [x] Stabilize Redirection Workflows: Restored retry and trigger logic in Form Populator and Redirection fragments.
- [x] Harmonize Dashboard Events: Implemented global `refreshData` synchronization for charts and tables.
- [x] Finalize `docs/recipes.md`: Added high-fidelity onboarding and commerce badging workflows.
