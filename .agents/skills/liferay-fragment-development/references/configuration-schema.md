# Configuration Schema Data Types

Liferay 2026.Q1 imposes strict validation rules on `configuration.json` properties:

- **Checkboxes**: Any configuration field with `"type": "checkbox"` MUST explicitly set `"dataType": "boolean"`. Omitting this or using a different data type will cause page creation API calls to fail with 500 errors.
- **Numeric Fields**: Any configuration field designed to capture numeric values (e.g., using `typeOptions.validation.type: "number"`) MUST use `"dataType": "number"`. Note: Even when `"dataType": "number"` is specified, the `"defaultValue"` must remain a string representation (e.g. `"defaultValue": "8"`, not `8`).
