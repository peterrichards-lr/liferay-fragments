# Best Practices for Liferay Fragments

## Configuration & Content

- **File Naming**: Configuration files MUST be named `configuration.json`.
- **Logical Grouping**: Fields should be grouped by function: `data`,
  `behavior`, and `style`.
- **Style-Specific Groups**: If a style has multiple related fields, they should
  be placed in their own named fieldset rather than a single large "Style"
  group.
- **Mandatory Descriptions**: Every configuration field MUST include a
  `description` attribute to provide context in the Page Editor sidebar.
- **Field Dependency Syntax**: Use an object structure within `typeOptions` to
  create dynamic interfaces.
  - **Scope Rule**: Dependent fields and their source fields MUST reside within
    the same field set. Liferay does not support cross-field-set dependencies.
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
- **Holistic Renaming**: Renaming configuration fields is encouraged if it
  improves clarity (e.g., `expiryInSeconds` -> `cookieExpirySeconds`). However,
  renames MUST be applied holistically across `configuration.json`, `index.js`,
  `index.html`, and `index.ftl`.
- **Localization**: All labels and descriptions MUST reference keys in
  `Language_en_US.properties`.
- **Property Deduplication**: Never use the key as the value (e.g.,
  `lfr.key=lfr.key`). Always provide meaningful English values. "Lazy keys" (key
  equals value) are prohibited and will fail the audit.

## JavaScript & Logic

- **Encapsulation**: Wrap all fragment logic in an initialization function
  (e.g., `initMyFragment()`) and invoke it at the end of the script.
- **No Top-Level Returns**: Functional control flow should use `if/else` within
  the init function rather than guard-clause returns at the script's top level.
- **Scoped Internal Selectors**: Default to `fragmentElement.querySelector` for
  internal elements to prevent "Selector Bleed".
- **Global Objects**: Use `document` or `window` only for page-wide state or
  intentional cross-fragment interaction.

## Browser Compatibility & Build

- Use `Object.prototype.hasOwnProperty.call(obj, prop)` instead of
  `Object.hasOwn`.
- Prefer `URLSearchParams` for robust query string parsing.
- **Build Metadata**: Fragments requiring shared resources MUST include a
  `fragment-build.json` file to declare dependencies on files within the root
  `shared-resources/` directory.
- **Build Integrity**: Ensure `Language_en_US.properties` is excluded from final
  ZIP packages to maintain clean fragment metadata.
