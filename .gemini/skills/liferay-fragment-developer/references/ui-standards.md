# UI and Interaction Standards

## Edit Mode Previews & Alerts
Fragments MUST provide a high-quality WYSIWYG experience in Edit mode while remaining performant:
- **User Prompts**: Display an `alert-info` container in Edit mode when critical configuration is missing.
- **Error Reporting**: Display an `alert-danger` container in Edit mode for fetch failures or validation errors.
- **Message Hygiene**: If an alert is active, hide the main component body to prevent visual clutter.
- **Static WYSIWYG**: Render a visual representation that matches production look, but:
    - Disable events (form submissions, complex handlers).
    - Disable motion (CSS transitions, animations, autoplay, parallax).
    - Limit items (restrict lists/tables to 3-5 items for performance).

## Required HTML for Alerts
```html
<div class="alert alert-info d-none mb-3" id="info-${fragmentEntryLinkNamespace}"></div>
<div class="alert alert-danger d-none mb-3" id="error-${fragmentEntryLinkNamespace}"></div>
```

## User Interaction
- **Unified Pointer Events**: MUST use the **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`) for all drag or swipe interactions.
- **Functional Pagination**: Pagination in data-driven fragments MUST be functional, re-fetching data via click handlers.
- **Accessibility**:
    - Use semantic elements (`<fieldset>`, `<legend>`).
    - Provide `aria-label` for icon-only buttons.
    - Implement `aria-live` regions for dynamic status updates.
