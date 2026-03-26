# Object Metadata Integration

## Object Definition Standards (Batch CX)

When generating or auditing Object definitions for showcase batch client
extensions:

- **Field Naming**: The `name` property MUST be **camelCase**.
- **Reserved Names**: Do NOT use `id`, `externalReferenceCode`, `status`, or
  `userName` for custom fields.
- **Data Limits**:
  - **Integer**: Max 9 digits.
  - **Long / Decimal**: Max 16 digits.
  - **Text**: Max 280 chars.
  - **Long Text**: Max 65,000 chars.
- **Task Delegate**: Ensure `"taskItemDelegateName": "C_ObjectName"` is set in
  the configuration.

## Field Mapping Strategy

- **Input Name**: Map `input.name` to the HTML `name` attribute.
- **CamelCase Compatibility**: Ensure that the `input.name` provided by the Form
  Container matches the camelCase `name` defined in the Object definition.
