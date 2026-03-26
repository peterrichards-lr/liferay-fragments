# Gemini Project State - Liferay Fragments

## Mandatory Rules & Conventions

### 1. Localization Rule

- **Requirement**: Whenever a fragment's `configuration.json` is modified, the
  corresponding `Language_en_US.properties` file **must** be updated with
  meaningful English labels and descriptions.
- **Deduplication**: Never use the key as the value (e.g., `lfr.key=lfr.key`).
  Always provide a human-readable string.
- **Coverage**: ALL labels and descriptions in `configuration.json`, including
  those within `validValues` arrays, MUST have a corresponding entry in the
  property file.

### 2. Documentation Rule

- **Requirement**: Whenever a fragment is updated, its markdown file in
  `docs/fragments/` must be synchronized.
- **New Fragments**: Any new fragment MUST have a corresponding documentation
  file including Overview, Configuration, and Usage sections.

### 3. Site-Scoping Compliance (Discovery Pattern)

- **Requirement**: Fragments interacting with Liferay Objects must support
  Site-scoped data via dynamic discovery.
- **Pattern**:
  1. Primary: Fetch the object definition via its External Reference Code (ERC)
     using
     `/o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}`.
  2. Fallback: Search for the object definition by its REST Context Path via
     `/o/object-admin/v1.0/object-definitions?search=${path}` and filter
     results.
  3. If `definition.scope === 'site'`, append `/scopes/${siteId}` to the base
     API path.
  4. Pre-resolve this path during fragment initialization to ensure performant
     runtime execution.

### 4. Fragment Logic & Compatibility

- **Top-Level Returns**: JavaScript logic MUST NOT use top-level `return`
  statements. Encapsulate all logic within an initialization function (e.g.,
  `initMyFragment()`).
- **LayoutMode API**: Always use the `layoutMode` variable (`'view'`, `'edit'`,
  or `'preview'`) for environment-specific logic.
- **Internal Selectors**: Always use `fragmentElement.querySelector` for
  internal elements to prevent state collision between multiple instances.

### 5. Configuration Integrity & Validation

- **Dependencies**: Use the object-based dependency structure within
  `typeOptions.dependency` to create dynamic interfaces.
- **Numeric Limits**: `min` and `max` properties MUST NOT be placed directly
  within `typeOptions`. They MUST be nested within a `validation` object (e.g.,
  `typeOptions.validation.min`).
- **Quoted Defaults**: ALL `defaultValue` entries for fields with
  `"dataType": "int"` or `float` MUST be provided as quoted strings (e.g.,
  `"defaultValue": "10"`). Raw integers/floats are not permitted and will
  trigger import warnings.
- **Scope**: Dependent fields and their source fields MUST reside within the
  same field set. Liferay does not support cross-field-set dependencies.

### 6. Robust Identifier Validation

- **Requirement**: Use a strict validation helper (`isValidIdentifier()`) before
  using record IDs or ERCs in API calls.
- **Blocklist**: Explicitly block strings like `"undefined"`, `"null"`, `"0"`,
  and `"[object Object]"`.

### 7. Mappable Field Ergonomics

- **Requirement**: Non-title mappable fields (`data-lfr-editable`) MUST be
  wrapped in a `.meta-editor-mappable-fields` container.
- **Visibility**: This container MUST be hidden in runtime (`display: none`) and
  visible only when `layoutMode == 'edit'`.

### 8. Smart Title Priority

- **Requirement**: Manually configured titles (e.g., `configuration.chartTitle`)
  MUST take precedence over evaluated values. Logic should check if the field is
  empty before falling back to dynamic labels.

### 9. Theme Fidelity (Safe Tokens)

- **Theme Awareness**: Fragments MUST be theme-aware and use CSS tokens defined
  in `docs/THEMES.md`.
- **Safe Intersect**: Prioritize variables that exist across Classic, Dialect,
  and Meridian (e.g., `--primary`, `--body-bg`, `--body-color`, `--secondary`).
- **Theme Scoping**: Use theme-specific body classes (`.meridian-theme`,
  `.liferay-dialect-theme`, `.classic-theme`) for targeted overrides if safe
  tokens are insufficient.

### 10. Holistic Renaming Rule

- **Requirement**: Renaming configuration fields is permitted and encouraged for
  clarity. However, renames MUST be applied holistically across
  `configuration.json`, `index.js`, `index.html`, and `index.ftl`. Mismatches
  will be flagged as errors by the linter.

### 11. Template Extension Rule (FTL vs HTML)

- **Requirement**: Fragments MUST use the correct file extension for their
  primary template file.
- **`.ftl` (FreeMarker)**: Use if the fragment contains ANY FreeMarker logic
  (`[#if]`, `[#list]`), taglibs (`[@clay]`), or Liferay variables
  (`${siteSpritemap}`).
- **`.html` (HTML)**: Use ONLY if the fragment is strictly static HTML or basic
  `data-lfr-editable` fields with no FreeMarker logic.
- **Metadata**: The `htmlPath` in `fragment.json` MUST accurately reflect this
  extension.
- **Defensive FreeMarker**: Templates SHOULD perform data type checks before
  using numeric or boolean configuration values (e.g., `?is_number`). Always use
  the `?c` built-in when outputting numeric or boolean values into non-display
  contexts (like CSS or JavaScript) to ensure computer-readable formatting
  regardless of locale.

### 12. Fragment Quality Gate (Linter)

- **Requirement**: All fragments MUST pass the local audit script
  (`npm run lint`) before being committed.
- **Validation Criteria**:
  - **Schema**: `fragment.json` and `configuration.json` must match the internal
    project schemas.
  - **Explicit Paths**: `fragment.json` MUST explicitly define `htmlPath`,
    `jsPath`, `cssPath`, and `configurationPath`. Defaults are not permitted.
  - **Localization**: Every label/description key used in `configuration.json`
    (including `validValues`) MUST exist in `Language_en_US.properties`. No
    "lazy keys" (where key equals value) are permitted.
  - **Field Integrity**: All `configuration.fieldName` references in code (JS,
    HTML, FTL) MUST exist as defined fields in `configuration.json`.
  - **Theme Fidelity**: CSS should avoid hardcoded colors (e.g., `#ffffff`) and
    prioritize safe tokens defined in `docs/THEMES.md`.
  - **JS Safety**: No top-level `return` statements.
  - **Dependencies**: Field dependencies MUST NOT cross field set boundaries.
  - **Descriptions**: Every field in `configuration.json` MUST have a
    `description` property.
- **CI Enforcement**: The Quality Gate is enforced via GitHub Actions on every
  push and PR.

### 12. Shared Resources Architecture

- **Build Injection**: The `create-fragment-zips.sh` script automatically
  bundles declared resources into the fragment ZIP during build time. This
  allows for DRY code while keeping fragments self-contained for Liferay. The
  `fragment-build.json` file is excluded from the final ZIP.

### 13. Standardized Empty States & Configuration Warnings

- **Empty State**: Use `renderEmptyState` in View mode when the data source
  returns zero results, utilizing native Liferay `c-empty-state` classes.

### 14. Inline Style Avoidance (Utility Class Priority)

- **Requirement**: Do NOT use inline `style="display: none"` in HTML. Use the
  standard Liferay utility class `d-none`.
- **Dynamic Styles**: For dynamic properties (like background images or colors),
  use CSS variables via `style.setProperty('--my-var', value)` and define the
  property in `index.css`. This keeps the visual logic in the stylesheet and
  prevents linting warnings.

### 15. Standardized Inter-Fragment Messaging (Event Bus)

- **Requirement**: Use the shared `EventBus` utility for all
  fragment-to-fragment communication. Direct use of `window.dispatchEvent` or
  `Liferay.fire` for custom cross-fragment logic is discouraged.
- **Pattern**:
  - **Publishing**: Use
    `EventBus.publish('topic-name', { payload }, { sticky: true })`.
  - **Subscribing**: Use
    `EventBus.subscribe('topic-name', callback, { replay: true })`.
- **Hydration Safety**: Always use `{ sticky: true }` for state-broadcasts and
  `{ replay: true }` for subscribers to ensure that fragments initializing late
  still receive the last known state.

### 16. Standardized Logging

- **Requirement**: Use the shared `Logger` utility for all fragment console
  output. Direct use of `console.log`, `console.warn`, etc., is discouraged for
  production-grade logic.
- **Context**: Initialize the logger with a unique context (e.g.,
  `const logger = Logger.create('My Fragment');`).
- **Standardized Levels**: Use `logger.info()`, `logger.warn()`,
  `logger.error()`, and `logger.debug()`.
- **Debug Control**: `logger.debug()` output is suppressed by default and only
  visible when the `?debugFragments` URL parameter is present.

### 17. Showcase Object Standards (Batch CX)

- **Requirement**: Object definitions used in showcase batch client extensions
  MUST follow strict Liferay Object field standards.
- **Field Naming**: The `name` property of an `objectField` MUST use
  **camelCase** (e.g., `authorName`, `likesCount`).
- **Reserved Names**: The following names are RESERVED and MUST NOT be used for
  custom fields: `id`, `externalReferenceCode`, `status`, `userName`.
- **Data Limits**:
  - **Integer**: Maximum 9 digits.
  - **Long / Decimal**: Maximum 16 digits.
  - **Text**: Maximum 280 characters.
  - **Long Text**: Maximum 65,000 characters.
- **`taskItemDelegateName`**: MUST be explicitly defined in the `configuration`
  of the JSON batch file, set to the Object's name with a `C_` prefix (e.g.,
  `"taskItemDelegateName": "C_MyObject"`).
- **Localization**: All `label` properties MUST include at least an `en_US`
  translation.

## Build & Deployment

- **create-fragment-zips.sh**: Supports `--fragments`, `--language`, and
  `--showcase` categories. Handles Shared Resource injection.
- **deploy-fragment-zips.sh**: Aligned with category flags for selective
  deployment.

## Current Tasks

- [x] Implement Admin API Scope Discovery across all relevant fragments.
- [x] Clean up Localization (i18n) properties and remove literal key duplicates.
- [x] Standardize Build/Deploy scripts with category and cleaning logic.
- [x] Extract high-fidelity CSS tokens from theme style guides (Classic,
      Dialect, Meridian).
- [x] Create `docs/THEMES.md` as a central reference for cross-theme safe
      tokens.
- [x] Implement Fragment Quality Gate (Linter).
- [x] Establish Shared Resources Architecture (`shared-resources/` +
      `fragment-build.json`).
- [x] Refactor existing dynamic fragments to use shared resources.
- [x] Harden Linter with explicit path and reference checks.
- [ ] Finalize missing visuals for Dashboard, Gemini, and User Account
      fragments.
- [ ] Restore missing configuration fields and localizations across all
      fragments.
