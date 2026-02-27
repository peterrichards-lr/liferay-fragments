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

### 2. Auditing Fragments
- Check for global variable leakage (use `fragmentElement`).
- Verify null-safety in FreeMarker (`!`).
- Ensure all icon-only buttons have `aria-label`.
- Validate that drag/swipe interactions use Pointer Events.

## Reference Guides

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects, initialization, and FreeMarker rules.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting, editable types, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene, Pointer Events, and functional pagination.
- **[Object Integration](./references/object-integration.md)**: Metadata discovery and strict field filtering.
- **[Meridian Theme](./references/theme-meridian.md)**: CSS tokens and brand integration rules.
- **[AI Integration](./references/ai-chat-interface.md)**: Standard JSON interface for AI components.
