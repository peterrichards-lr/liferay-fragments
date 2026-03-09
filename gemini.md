# Gemini Project State - Liferay Fragments

## Mandatory Rules & Conventions

### 1. Localization Rule

- **Requirement**: Whenever a fragment's `configuration.json` is modified, the corresponding `Language_en_US.properties` file **must** be updated with meaningful English labels and descriptions.
- **Deduplication**: Never use the key as the value (e.g., `lfr.key=lfr.key`). Always provide a human-readable string.

### 2. Documentation Rule

- **Requirement**: Whenever a fragment is updated, its markdown file in `docs/fragments/` must be synchronized.
- **New Fragments**: Any new fragment MUST have a corresponding documentation file including Overview, Configuration, and Usage sections.
- **Visuals**: Documentation should include a high-quality `screenshot.png` (full width) and a focused `thumbnail.png`.

### 3. Site-Scoping Compliance (Discovery Pattern)

- **Requirement**: Fragments interacting with Liferay Objects must support Site-scoped data via dynamic discovery.
- **Pattern**:
  1. Fetch the object definition via `/o/object-admin/v1.0/object-definitions/by-rest-context-path/${objectPath}`.
  2. If `definition.scope === 'site'`, append `/scopes/${siteId}` to the base API path.
  3. Pre-resolve this path during fragment initialization to ensure performant runtime execution.

### 4. Fragment Logic & Compatibility

- **Top-Level Returns**: JavaScript logic MUST NOT use top-level `return` statements. Encapsulate all logic within an initialization function (e.g., `initMyFragment()`).
- **LayoutMode API**: Always use the `layoutMode` variable (`'view'`, `'edit'`, or `'preview'`) for environment-specific logic.
- **Internal Selectors**: Always use `fragmentElement.querySelector` for internal elements to prevent state collision between multiple instances.

### 5. Configuration Dependencies

- **Syntax**: Use the object-based dependency structure within `typeOptions` to create dynamic interfaces.

### 6. Robust Identifier Validation

- **Requirement**: Use a strict validation helper (`isValidIdentifier()`) before using record IDs or ERCs in API calls.
- **Blocklist**: Explicitly block strings like `"undefined"`, `"null"`, `"0"`, and `"[object Object]"`.

### 7. Mappable Field Ergonomics

- **Requirement**: Non-title mappable fields (`data-lfr-editable`) MUST be wrapped in a `.meta-editor-mappable-fields` container.
- **Visibility**: This container MUST be hidden in runtime (`display: none`) and visible only when `layoutMode == 'edit'`.

### 8. Smart Title Priority

- **Requirement**: Manually configured titles (e.g., `configuration.chartTitle`) MUST take precedence over evaluated values. Logic should check if the field is empty before falling back to dynamic labels.

### 9. Theme Fidelity & Test-Bed

- **Theme Support**: Fragments MUST be theme-aware and use CSS tokens defined in `docs/THEMES.md`.
- **Testing**: All fragments MUST be verified using the Playwright-based test-bed in `test-bed/`.
- **Mocking**: Supply mock data for API calls in `test/data.json` and test-specific configuration in `test/configuration.json`.
- **Visual Generation**:
  - `screenshot.png`: High-fidelity, full-width capture for documentation.
  - `thumbnail.png`: Focused capture for the Liferay UI. This should highlight the fragment's unique features and does not need to be a simple resize of the screenshot.
  - `test/metadata.json`: Defines the target theme and optional `thumbnailSelector` / `screenshotSelector` to guide the capture. This file MUST be excluded from production ZIPs.

### 10. Deprecation Protocol

- **Metadata**: Append `(Deprecated)` to the `name` in `fragment.json`.
- **Docs**: Add a warning block at the top of the fragment's documentation file explaining the reason and recommending modern alternatives.

## Build & Deployment

- **create-fragment-zips.sh**: Supports `--fragments`, `--language`, and `--showcase` categories. Excludes deprecated fragments and `test/` directories by default.
- **deploy-fragment-zips.sh**: Aligned with category flags for selective deployment.

## Current Tasks

- [ ] Implement `test/metadata.json` across collections to guide visual generation.
- [ ] Audit all fragments for Rule #9 (Theme Fidelity) and missing `screenshot.png`.
- [ ] Finalize missing visuals for Dashboard, Gemini, and User Account fragments.
- [x] Complete Comprehensive Functional Audit.
- [x] Implement Admin API Scope Discovery across all relevant fragments.
- [x] Clean up Localization (i18n) properties and remove literal key duplicates.
- [x] Standardize Build/Deploy scripts with category and cleaning logic.
- [x] Deprecate legacy serviceLocator-based profile fragments.
- [x] Extract high-fidelity CSS tokens from theme style guides (Classic, Dialect, Meridian).
- [x] Create `docs/THEMES.md` as a central reference for AI context and prompting.
- [x] Update `test-bed/runner.js` to support dual visual output and metadata-driven selectors.
