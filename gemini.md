# Gemini Project State - Liferay Fragments

## Mandatory Rules & Conventions

### 1. Localization Rule

- **Requirement**: Whenever a fragment's `configuration.json` is modified, the corresponding `Language_en_US.properties` file **must** be updated with meaningful English labels and descriptions.
- **Deduplication**: Never use the key as the value (e.g., `lfr.key=lfr.key`). Always provide a human-readable string.

### 2. Documentation Rule

- **Requirement**: Whenever a fragment is updated, its markdown file in `docs/fragments/` must be synchronized.
- **New Fragments**: Any new fragment MUST have a corresponding documentation file including Overview, Configuration, and Usage sections.

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
- **Example**:
  ```json
  "typeOptions": {
    "dependency": {
      "enableFeature": {
        "type": "equal",
        "value": "true"
      }
    }
  }
  ```

### 6. Robust Identifier Validation

- **Requirement**: Use a strict validation helper (`isValidIdentifier()`) before using record IDs or ERCs in API calls.
- **Blocklist**: Explicitly block strings like `"undefined"`, `"null"`, `"0"`, and `"[object Object]"`.

### 7. Mappable Field Ergonomics

- **Requirement**: Non-title mappable fields (`data-lfr-editable`) MUST be wrapped in a `.meta-editor-mappable-fields` container.
- **Visibility**: This container MUST be hidden in runtime (`display: none`) and visible only when `layoutMode == 'edit'`.

### 8. Smart Title Priority

- **Requirement**: Manually configured titles (e.g., `configuration.chartTitle`) MUST take precedence over evaluated values. Logic should check if the field is empty before falling back to dynamic labels.

### 9. Deprecation Protocol

- **Metadata**: Append `(Deprecated)` to the `name` in `fragment.json`.
- **Docs**: Add a warning block at the top of the fragment's documentation file explaining the reason and recommending modern alternatives.
- **Audit**: Update `todo.md` to mark the fragment as `DEPR` for thumbnails and visuals.

## Build & Deployment

- **create-fragment-zips.sh**: Supports `--fragments`, `--language`, and `--showcase` categories. Excludes deprecated fragments by default (use `--include-deprecated` to override).
- **deploy-fragment-zips.sh**: Aligned with category flags for selective deployment to Liferay environments.

## Current Tasks

- [x] Complete Comprehensive Functional Audit.
- [x] Implement Admin API Scope Discovery across all relevant fragments.
- [x] Clean up Localization (i18n) properties and remove literal key duplicates.
- [x] Standardize Build/Deploy scripts with category and cleaning logic.
- [x] Deprecate legacy serviceLocator-based profile fragments.
- [ ] Finalize missing visuals for Dashboard, Gemini, and User Account fragments.
