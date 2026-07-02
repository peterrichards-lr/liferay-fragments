---
name: liferay-fragment-developer
description:
  Expert guidance for developing Liferay Fragments. Use when creating,
  modifying, or auditing Liferay Fragments to ensure compliance with
  architectural, accessibility, responsiveness, and multi-theme (Classic,
  Dialect, Meridian) standards.
---

# Liferay Fragment Developer Skill

This skill provides comprehensive procedural knowledge and architectural
standards for building robust, modern Liferay Fragments.

## Core Workflows

### 1. New Fragment Creation

- Ensure `fragment.json` correctly points to all assets.
- **Template Extension**: Use the correct extension for the primary template:
  - **`.ftl`**: If using FreeMarker tags (`[#if]`), Clay taglibs (`[@clay]`), or
    Liferay variables (`${siteSpritemap}`).
  - **`.html`**: Only for strictly static HTML or basic editable fields.
  - Update `htmlPath` in `fragment.json` accordingly.
- Create `configuration.json` using standard field sets and types.
- **Shared Resources**: Every fragment MUST include a `fragment-build.json` file
  if it requires shared logic from `shared-resources/`.
  - Declare dependencies: `"sharedResources": ["dom.js", "discovery.js"]`.
- **Edit Mode Hygiene**: Implement the "Edit Mode Previews & Alerts" pattern
  using `Liferay.Fragment.Commons` helpers.
  - Use `renderConfigWarning` for missing settings.
  - Use `renderEmptyState` for zero-result scenarios.
- **Theme Awareness**: Fragments MUST be theme-aware.
  - Refer to `docs/THEMES.md` for high-fidelity CSS tokens and icon spritemaps.
  - Support **Classic**, **Dialect**, and **Meridian** by using semantic
    variables (e.g., `var(--primary)`, `var(--card-background-color)`).
- **Dynamic Object Discovery**: Never hardcode Object API paths.
  - Fetch definition via
    `/o/object-admin/v1.0/object-definitions/by-rest-context-path/{path}`.
  - Use the returned `scope` to construct the correct data URL (append
    `/scopes/{siteId}` if scope is `site`).
- **Standardized API Interaction**: Always use `Liferay.Util.fetch` for standard
  Liferay APIs to auto-handle CSRF and authentication.
- **E2E Bootstrap Configuration (`test-data.json`)**: Every fragment must define a `test-data.json` layout file mapping its test layout elements. Use placeholders like `COMMERCE_PRODUCT_1` to `COMMERCE_PRODUCT_4` for dynamic products so they are dynamically seeded by the `global-setup.js` framework. Utilize responsive `columnViewports` to verify side-by-side or stacked layouts across viewports. Refer to the [Fragment E2E Bootstrap Skill](../../.agents/skills/fragment-e2e-bootstrap/SKILL.md) for detailed guidelines.

### 2. Auditing Fragments

- **Explicit Metadata**: Verify that `fragment.json` explicitly defines
  `htmlPath`, `jsPath`, `cssPath`, and `configurationPath`. Defaults are not
  allowed.
- **Field Integrity**: Ensure every `configuration.fieldName` referenced in code
  (JS, HTML, FTL) is defined in `configuration.json`.
- **Localization Hygiene**:
  - Verify that ALL labels and descriptions (including those in `validValues`)
    have corresponding entries in `Language_en_US.properties`.
  - Ensure no "lazy keys" exist (e.g., `key=key`). Values MUST be meaningful
    English.
  - Verify that every field has a `description` attribute.
- **Configuration Dependencies**: Verify that dependent fields and their source
  fields reside within the same field set in `configuration.json`.
- **Scoped Internal Selectors**: Always use `fragmentElement.querySelector` for
  internal state to prevent instance collision.
- **Modern API Usage**: Verify the use of `layoutMode` instead of legacy body
  class checks.
- **Top-Level Logic**: Ensure all JS is encapsulated in an initialization
  function; top-level `return` statements are prohibited.
- **Robust Identifiers**: Use a strict validation helper (`isValidIdentifier`)
  to block `"undefined"`, `"null"`, `"0"`, and `"[object object]"`.
- **CSS Utility Usage**: Verify that `d-none` is used instead of inline
  `style="display: none"`. Ensure dynamic styles use CSS variables via
  `setProperty`.
- **Freemarker Safety**: Verify null-safety in FreeMarker (`!`). Ensure
  `.no-transform` files exist if FreeMarker syntax is present in JS or CSS.
- **Accessibility**: Ensure all icon-only buttons have `aria-label`.

### 3. Deprecation Protocol

- **Metadata**: Append `(Deprecated)` to the `name` in `fragment.json`.
- **Documentation**: Add a warning block at the top of the fragment's `.md` file
  explaining the reason and recommending modern alternatives.
- **Audit**: Mark the fragment as `DEPR` in the `todo.md` readiness audit.

### 4. Verification & Testing (Mandatory Gate)

Every new or significantly modified fragment MUST pass the automated E2E gate
before being considered "Done".

- **Playwright-First Verification**:
  - Run the test suite: `./scripts/test-runner.sh -k`.
  - Ensure the fragment renders its full UI across Desktop, Tablet, and Mobile.
  - Verify that no "Fragment is unavailable" errors appear in the screenshots.
- **Visual Seeding & Capture Bootstrap**:
  - Leverage the `test-data.json` page bootstrapping configuration.
  - Verify row-level screenshots for fragments rendering multiple items side-by-side (Playwright's `fragments.spec.js` automatically captures the parent `.row` or `#wrapper` container if multiple instances of the fragment are present).
- **Headless API Payload Strictness**:
  - When programmatically creating test pages, the `pageDefinition` JSON MUST
    use **Capitalized** element types (`Root`, `Section`, `Row`, `Column`,
    `Fragment`).
  - Fragment references MUST use the nested structure:
    `"fragment": { "key": "fragment-key", "siteKey": "site-erc" }`.
- **JSON WS Registration Check**:
  - Use the `fragment.fragmententry/get-fragment-entries` JSON WS endpoint
    during setup to verify the ZIP was actually registered by the database.
- **Visual Gallery Sync**:
  - After a successful test pass (`Status: Completed`), manually run
    `node scripts/generate-gallery.js` to update the visual documentation with
    the new Playwright snapshots.

## Specialized Skills

- **[Liferay Form Fragment Developer](liferay-form-fragment-developer)**: Use
  this skill for building fragments specifically designed for Form Containers
  and Object field mapping.

## Reference Guides

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects,
  initialization, and FreeMarker rules.
- **[Verification & E2E Strategy](../../../docs/automated-testing.md)**:
  Playwright lifecycle, responsive standards, and automated cleanup.
- **[Headless API & JSON WS](../../../docs/json-ws-reference.md)**: Modern REST
  prioritization and legacy verification endpoints.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting,
  dependencies, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene,
  Mappable Field Ergonomics, and A11y.
- **[Object Integration](./references/object-integration.md)**: Metadata
  discovery, scope handling, and Object definition standards (Batch CX).
- [Theme Standards](./references/themes.md): Multi-theme tokens and brand
  integration rules.
- [AI Integration](./references/ai-chat-interface.md): Standard JSON interface
  for AI components.

## Guest Access, Permissions & Object Batching

To ensure fragments render successfully for anonymous/Guest users in production and E2E test runs:

- **Service Access Policy (SAP)**: Guest queries to headless collections and elements endpoints require that their corresponding implementation classes (e.g., `com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl#*`) are configured inside Liferay's `SYSTEM_DEFAULT` Service Access Policy.
- **Guest Permissions**: Programmatically created test layouts, content structures, and articles must be granted Guest view permissions (`viewableBy: 'Anyone'` or `addGuestPermissions: true` in the setup service context) to prevent 403 Forbidden errors.
- **Custom Objects (Batch Client Extensions)**: Custom object schemas must be seeded as batch client extensions rather than manual UI creation to ensure database-level stability and avoid E2E timing delays.
- **Resolution Registry Fallback**: Ensure that client-side scripts query a fallback registry in `Liferay.Fragment.Commons.resolveObjectPath` when the definition endpoint is inaccessible, preventing JS errors.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
