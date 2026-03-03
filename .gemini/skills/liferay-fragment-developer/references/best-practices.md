# Best Practices for Liferay Fragments

## Configuration & Content
- **File Naming**: Configuration files MUST be named `configuration.json`.
- **Field Nesting**: All fields MUST be nested within a `fieldSets` array.
- **Fieldset Labeling**: Every fieldset in the `fieldSets` array SHOULD include a descriptive `label` attribute. This logically groups fields in the Liferay Page Editor sidebar (e.g., "Layout", "Style", "API Settings").
- **Valid Types**: `text`, `select`, `checkbox`, `colorPicker`, `colorPalette`, `length`, `itemSelector`, `url`, `videoSelector`, `collectionSelector`, `navigationMenuSelector`.
- **Field Dependency**: Use the `dependency` key within `typeOptions` (requires Liferay DXP 2025.Q3+).
- **Editable Content**: Use `data-lfr-editable-type` attributes (e.g., `rich-text`, `image`, `link`) directly in HTML.
- **Image Tags**: Attributes for `data-lfr-editable-type="image"` MUST be placed on an `<img>` tag.

## JavaScript Scoping
- **Default**: Use `fragmentElement.querySelector` for internal elements to prevent "Selector Bleed".
- **Global**: Use `document` or `window` only for page-wide state or cross-fragment interaction.

## JavaScript Browser Compatibility
- Use `Object.prototype.hasOwnProperty.call(obj, prop)` instead of `Object.hasOwn`.
- Prefer `URLSearchParams` for robust query string parsing.
