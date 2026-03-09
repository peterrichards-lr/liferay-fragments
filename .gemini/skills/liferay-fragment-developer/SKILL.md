---
name: liferay-fragment-developer
description: Expert guidance for developing Liferay Fragments. Use when creating, modifying, or auditing Liferay Fragments to ensure compliance with architectural, accessibility, responsiveness, and multi-theme (Classic, Dialect, Meridian) standards.
---

# Liferay Fragment Developer Skill

This skill provides comprehensive procedural knowledge and architectural standards for building robust, modern Liferay Fragments.

## Core Workflows

### 1. New Fragment Creation

- Ensure `fragment.json` correctly points to all assets.
- Create `configuration.json` using standard field sets and types.
- Implement the "Edit Mode Previews & Alerts" pattern in `index.html` and `index.js`.
- **Theme Awareness**: Fragments MUST be theme-aware.
  - Refer to `docs/THEMES.md` for high-fidelity CSS tokens and icon spritemaps.
  - Support **Classic**, **Dialect**, and **Meridian** by using semantic variables (e.g., `var(--primary)`, `var(--card-background-color)`).
- **Dynamic Object Discovery**: Never hardcode Object API paths.
  - Fetch definition via `/o/object-admin/v1.0/object-definitions/by-rest-context-path/{path}`.
  - Use the returned `scope` to construct the correct data URL (append `/scopes/{siteId}` if scope is `site`).
- **Standardized API Interaction**: Always use `Liferay.Util.fetch` for standard Liferay APIs to auto-handle CSRF and authentication.

### 2. Auditing Fragments

- **Scoped Internal Selectors**: Always use `fragmentElement.querySelector` for internal state to prevent instance collision.
- **Modern API Usage**: Verify the use of `layoutMode` instead of legacy body class checks.
- **Top-Level Logic**: Ensure all JS is encapsulated in an initialization function; top-level `return` statements are prohibited.
- **Robust Identifiers**: Use a strict validation helper (`isValidIdentifier`) to block `"undefined"`, `"null"`, `"0"`, and `"[object object]"`.
- **Freemarker Safety**: Verify null-safety in FreeMarker (`!`). Ensure `.no-transform` files exist if FreeMarker syntax is present in JS or CSS.
- **Accessibility**: Ensure all icon-only buttons have `aria-label`.

### 3. Deprecation Protocol

- **Metadata**: Append `(Deprecated)` to the `name` in `fragment.json`.
- **Documentation**: Add a warning block at the top of the fragment's `.md` file explaining the reason and recommending modern alternatives.
- **Audit**: Mark the fragment as `DEPR` in the `todo.md` readiness audit.

## Reference Guides

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects, initialization, and FreeMarker rules.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting, dependencies, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene, Mappable Field Ergonomics, and A11y.
- **[Object Integration](./references/object-integration.md)**: Metadata discovery and scope handling.
- [Theme Standards](./references/themes.md): Multi-theme tokens and brand integration rules.
- [Test-Bed & Visuals](./references/test-bed.md): Automated rendering, mocking, and screenshot/thumbnail generation.
- [AI Integration](./references/ai-chat-interface.md): Standard JSON interface for AI components.
