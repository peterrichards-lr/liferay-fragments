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

## Specialized Skills

- **[Liferay Form Fragment Developer](liferay-form-fragment-developer)**: Use
  this skill for building fragments specifically designed for Form Containers
  and Object field mapping.

## Reference Guides

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects,
  initialization, and FreeMarker rules.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting,
  dependencies, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene,
  Mappable Field Ergonomics, and A11y.
- **[Object Integration](./references/object-integration.md)**: Metadata
  discovery and scope handling.
- [Theme Standards](./references/themes.md): Multi-theme tokens and brand
  integration rules.
- [AI Integration](./references/ai-chat-interface.md): Standard JSON interface
  for AI components.
