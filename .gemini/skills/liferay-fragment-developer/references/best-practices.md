# Best Practices for Liferay Fragments

## Configuration & Content
- **File Naming**: Configuration files MUST be named `configuration.json`.
- **Field Nesting**: All fields MUST be nested within a `fieldSets` array.
- **Fieldset Labeling**: Every fieldset in the `fieldSets` array MUST include a descriptive `label` attribute.
- **Logical Grouping**: Fields should be grouped by function: `data`, `behavior`, and `style`. 
- **Style-Specific Groups**: If a style has multiple related fields (e.g., Overlay settings, Animation controls), they should be placed in their own named fieldset (e.g., `overlay`) rather than a single large "Style" group.
- **Localization**: All labels and descriptions SHOULD reference keys in a collection-level `Language_en_US.properties` file.
- **Mandatory Descriptions**: Every configuration field MUST include a `description` attribute to provide context in the Page Editor sidebar.
- **Valid Types**: `text`, `select`, `checkbox`, `colorPicker`, `colorPalette`, `length`, `itemSelector`, `url`, `videoSelector`, `collectionSelector`, `navigationMenuSelector`.
- **Field Dependency**: Use the `dependency` key within `typeOptions` to hide/show fields based on other selections (e.g., showing `overlayOpacity` only when a specific style is selected).
- **Editable Content**: Use `data-lfr-editable-type` attributes (e.g., `rich-text`, `image`, `link`) directly in HTML.
- **Image Tags**: Attributes for `data-lfr-editable-type="image"` MUST be placed on an `<img>` tag.

## JavaScript Scoping
- **Default**: Use `fragmentElement.querySelector` for internal elements to prevent "Selector Bleed".
- **Global**: Use `document` or `window` only for page-wide state or cross-fragment interaction.

## JavaScript Browser Compatibility
- Use `Object.prototype.hasOwnProperty.call(obj, prop)` instead of `Object.hasOwn`.
- Prefer `URLSearchParams` for robust query string parsing.
- **Build Integrity**: Ensure `Language_en_US.properties` is excluded from final ZIP packages to maintain clean fragment metadata.
