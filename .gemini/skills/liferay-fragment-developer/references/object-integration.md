# Object Metadata Integration

## Metadata Discovery Pattern

1. **Fetch Definition**: Use
   `/o/object-admin/v1.0/object-definitions/by-rest-context-path/{objectPath}`.
2. **Determine Scope**: If the definition's `scope` is `site`, append
   `/scopes/${siteId}` to the base API path.
3. **Pre-resolution**: Resolve this path during initialization to avoid repeated
   Admin API calls during runtime execution.

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

## Smart Title Priority

For fragments with auto-defaulting titles (e.g., "Sales Reports"):

- **Rule**: Manually configured titles (e.g., `configuration.chartTitle`) MUST
  take precedence.
- **Logic**: Check if the configuration field is non-empty. Only fall back to
  the evaluated object label if the field is empty or set to a system default.

## API Portability

- **No Hardcoded Paths**: Never hardcode `/o/c/...` paths. Use configuration
  fields for **Object REST Context Paths**.
- **Dynamic Endpoints**: Construct batch (`/batch`) or scoped endpoints
  dynamically from the resolved base path.
- **Robust Identifiers**: Always validate record IDs/ERCs using
  `isValidIdentifier()` before making network calls.

## API Permissions

- **User Feedback**: Fragments MUST handle 401/403 errors gracefully by
  displaying a user-friendly alert or toast.
- **Authentication**: Use `Liferay.Util.fetch` to automatically include required
  security tokens.
