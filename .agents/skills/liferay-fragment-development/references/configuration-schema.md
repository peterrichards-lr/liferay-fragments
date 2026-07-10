# Configuration Schema Data Types

Liferay 2026.Q1+ imposes strict API validation rules on `configuration.json` properties and their usage in programmatic page creation payloads:

- **Checkboxes (Booleans)**: Any configuration field with `"type": "checkbox"` MUST NOT declare `"dataType": "boolean"`. If `dataType: boolean` is explicitly included in the source or injected at build-time, Liferay 2026.Q1+ will throw a `500 Internal Server Error` (`ClassCastException`) when attempting to seed pages containing the fragment via the Headless API.
- **Numeric Fields**: Any configuration field designed to capture numeric values (e.g., using `typeOptions.validation.type: "number"`) MUST use `"dataType": "number"`. Note: Even when `"dataType": "number"` is specified, the `"defaultValue"` inside `configuration.json` AND any override values inside `test-fragment-config.json` MUST remain string representations (e.g. `"defaultValue": "8"`, not `8`). Passing an integer to the API will cause a `500 Internal Server Error`.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-10_ | _Last Reviewed: 2026-07-10_
