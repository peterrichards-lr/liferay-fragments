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

### 7. Site-Scoped Batch Data Rule

- **Requirement**: Batch data entries for Site-scoped Objects **must** include the `siteExternalReferenceCode` parameter in the `configuration.parameters` block (e.g., `"siteExternalReferenceCode": "L_GUEST"`).
- **Reason**: The Batch Engine requires a target site identifier to correctly scope the imported entries.

### 8. Dropzone Tagging Convention

- **Requirement**: Always use the hyphenated `<lfr-drop-zone>` tag instead of the non-hyphenated variant.
- **Reason**: Ensures full compatibility with Liferay Page Editor's fragment placement and discovery logic.

### 9. Robust Table Striping

- **Requirement**: When implementing alternate row shading (zebra striping), always apply `background-color: transparent !important` to the nested `td` elements.
- **Reason**: Overrides Liferay's default Clay/Bootstrap table styles which often apply opaque backgrounds to cells, masking row-level styling.

### 10. Editor-Accessible Modals

- **Requirement**: Hidden UI elements (like Modals) containing dropzones MUST be styled to be visible and stackable in the Page Editor (e.g., using `[data-layout-mode="edit"]` or FreeMarker `[#if layoutMode == 'edit']`).
- **Reason**: Allows Page Editors to discover and populate embedded dropzones without needing to trigger the element's runtime visibility.

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
