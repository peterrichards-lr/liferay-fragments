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
- **Dynamic API Paths**: Never hardcode Object API paths (`/o/c/`). Use configuration fields to allow users to specify the REST context.

### 2. Auditing Fragments
- Check for global variable leakage (use `fragmentElement`).
- Verify null-safety in FreeMarker (`!`).
- Ensure all icon-only buttons have `aria-label`.
- Validate that drag/swipe interactions use Pointer Events.
- **Portability Check**: Flag any hardcoded URLs or environment-specific paths for removal.

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
