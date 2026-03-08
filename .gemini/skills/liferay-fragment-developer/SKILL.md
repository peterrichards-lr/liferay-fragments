---
name: liferay-fragment-developer
description: Expert guidance for developing Liferay Fragments. Use when creating, modifying, or auditing Liferay Fragments to ensure compliance with architectural, accessibility, responsiveness, and Meridian theme standards.
---

# Liferay Fragment Developer Skill

This skill provides comprehensive procedural knowledge and architectural standards for building robust, modern Liferay Fragments.

## Core Workflows

### 1. New Fragment Creation

- Ensure `fragment.json` correctly points to all assets.
- Create `configuration.json` using standard field sets and types.
- Implement the "Edit Mode Previews & Alerts" pattern in `index.html` and `index.js`.
- Adhere to the Meridian Theme by using CSS tokens.
- **Dynamic Object Discovery**: Never hardcode Object API paths (e.g., `/o/c/waterreadings`). Always use a configuration field for the **Object External Reference Code (ERC)**.
  - Since there is no "by-rest-context-path" endpoint in the Object Admin API, fetch the definition via `/o/object-admin/v1.0/object-definitions/by-external-reference-code/{ERC}`.
  - Use the returned `restContextPath` and `scope` to construct the correct data URL (e.g., append `/scopes/{siteId}` if scope is `site`).
- **Standardized API Interaction**: Always use `Liferay.Util.fetch` for standard Liferay APIs to auto-handle CSRF and authentication. For OAuth2-secured extensions, use `const {fetch} = Liferay.OAuth2Client.fromUserAgent('client-id')`.

### 2. Auditing Fragments

- **Scoped Internal Selectors**: Check for global variable leakage. Always use `fragmentElement.querySelector` for internal state. `document` or `window` should only be used for cross-fragment communication (e.g., PubSub).
- **Modern API Usage**: Verify the use of `layoutMode` instead of the legacy `has-edit-mode-menu` body class check.
- **Robust Identifiers**: Use a strict validation helper (`isValidIdentifier`) to filter out `"undefined"`, `"null"`, `"0"`, and `"[object object]"` strings before any network calls.
- **Freemarker Safety**: Verify null-safety in FreeMarker (`!`). Ensure `.no-transform` files exist if FreeMarker syntax is present in JS or CSS.
- **Accessibility**: Ensure all icon-only buttons have `aria-label`. Validate that interactive components have full keyboard support (`Enter`, `Space`, `Arrow` keys).

### 3. Deprecation Protocol

- **Naming**: Append `(DEPRECATED)` to the `name` in `fragment.json`.
- **Description**: Add a clear description explaining why the fragment is deprecated and what the recommended alternative is.
- **Visual Warning**: Add a conditional alert in `index.html` that is only visible in the Page Editor/Fragment Editor to notify administrators of the deprecation.

## Reference Guides

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects, initialization, and FreeMarker rules.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting, editable types, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene, Pointer Events, and functional pagination.
- **[Object Integration](./references/object-integration.md)**: Metadata discovery and strict field filtering.
- **[Meridian Theme](./references/theme-meridian.md)**: CSS tokens and brand integration rules.
- **[AI Integration](./references/ai-chat-interface.md)**: Standard JSON interface for AI components.
