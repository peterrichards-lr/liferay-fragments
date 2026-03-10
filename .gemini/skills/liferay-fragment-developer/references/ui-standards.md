# UI and Interaction Standards

## Edit Mode Hygiene

Fragments MUST provide a high-quality WYSIWYG experience in Edit mode:

- **Configuration Warnings**: Display an `alert-info` container in Edit mode when critical configuration (e.g., Object ERC) is missing. Use `Liferay.Fragment.Commons.renderConfigWarning()`.
- **Error Reporting**: Display an `alert-danger` container in Edit mode for fetch failures.
- **Static WYSIWYG**: Render a visual representation that matches production, but disable complex handlers and limit dynamic items (e.g., 3-5 rows in a table).

## Standardized Empty States

When a data-driven fragment returns zero results, it MUST NOT simply disappear.

- **Requirement**: Use `Liferay.Fragment.Commons.renderEmptyState()`.
- **Visuals**: Utilizes native Liferay `c-empty-state` classes and standard search/empty SVGs from `/o/admin-theme/`.
- **Context**: Apply to tables, charts, sliders, and galleries.

## CSS Utility and Style Standards

- **Inline Style Avoidance**: Never use `style="display: none"` in HTML. Use the standard Liferay `d-none` utility class.
- **Dynamic Backgrounds/Colors**: Do not set complex styles directly via `element.style`. Use CSS variables:
  - **JS**: `element.style.setProperty('--my-dynamic-bg', 'url(...)')`
  - **CSS**: `background-image: var(--my-dynamic-bg, none);`
- **Utility Priority**: Leverage Clay/Bootstrap utility classes (`mb-3`, `text-center`, `d-flex`) instead of custom inline styles for layout adjustments.

## Mappable Field Ergonomics

...

Non-title mappable fields (`data-lfr-editable`) MUST be wrapped in a specific container to provide a clean interface for Page Editors.

- **Container**: `.meta-editor-mappable-fields`
- **Children**: `.mappable-field-item` containing a `<label>` and the editable element.
- **Styling**:
  ```css
  .meta-editor-mappable-fields {
    display: none; /* Hidden at runtime */
  }
  [data-layout-mode="edit"] .meta-editor-mappable-fields {
    display: flex; /* Visible during editing */
  }
  ```

## Accessibility (A11y)

- **Semantic HTML**: Use `<fieldset>` and `<legend>` for related inputs (e.g., Star Rating, Meter Reading).
- **Labels**: Ensure every input has a corresponding `<label>` or `aria-label`.
- **Keyboard Support**: All interactive elements (Tabs, Buttons, Sliders) MUST be fully navigable via `Tab`, `Enter`, and `Space`.
- **Live Regions**: Use `aria-live="polite"` for dynamic status updates (e.g., "Submission Successful").

## User Interaction

- **Pointer Events**: Use the **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`) for all custom drag/swipe interactions.
- **Functional Pagination**: Pagination in data-driven fragments MUST be functional in `view` mode, re-fetching data via AJAX.
