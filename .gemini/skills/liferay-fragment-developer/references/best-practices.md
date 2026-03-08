# Best Practices for Liferay Fragments

## Configuration & Content

- **File Naming**: Configuration files MUST be named `configuration.json`.
- **Logical Grouping**: Fields should be grouped by function: `data`, `behavior`, and `style`.
- **Style-Specific Groups**: If a style has multiple related fields, they should be placed in their own named fieldset rather than a single large "Style" group.
- **Mandatory Descriptions**: Every configuration field MUST include a `description` attribute to provide context in the Page Editor sidebar.
- **Field Dependency Syntax**: Use an object structure within `typeOptions` to create dynamic interfaces.
  ```json
  "typeOptions": {
    "dependency": {
      "parentFieldName": {
        "type": "equal",
        "value": "someValue"
      }
    }
  }
  ```
- **Localization**: All labels and descriptions MUST reference keys in `Language_en_US.properties`.
- **Property Deduplication**: Never use the key as the value (e.g., `lfr.key=lfr.key`). Always provide meaningful English values.

## JavaScript & Logic

- **Encapsulation**: Wrap all fragment logic in an initialization function (e.g., `initMyFragment()`) and invoke it at the end of the script.
- **No Top-Level Returns**: Functional control flow should use `if/else` within the init function rather than guard-clause returns at the script's top level.
- **Scoped Internal Selectors**: Default to `fragmentElement.querySelector` for internal elements to prevent "Selector Bleed".
- **Global Objects**: Use `document` or `window` only for page-wide state or intentional cross-fragment interaction.

## Browser Compatibility & Build

- Use `Object.prototype.hasOwnProperty.call(obj, prop)` instead of `Object.hasOwn`.
- Prefer `URLSearchParams` for robust query string parsing.
- **Build Integrity**: Ensure `Language_en_US.properties` is excluded from final ZIP packages to maintain clean fragment metadata.
