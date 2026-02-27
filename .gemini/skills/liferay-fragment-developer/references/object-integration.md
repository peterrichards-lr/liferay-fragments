# Object Metadata Integration

## Metadata Discovery
1. **Fetch Definition**: Use `/o/object-admin/v1.0/object-definitions/by-external-reference-code/{erc}`.
2. **Dynamic Rendering**: Use the `type` property (e.g., `String`, `DateTime`) from metadata to decide UI components.
3. **Validation**: Use the `required` property from metadata for client-side enforcement.

## Strict Field Filtering
If a fragment provides "Selected Fields" configuration:
- Map through the user's input list to select fields from the definition.
- Filter out any fields NOT explicitly requested.
- Maintain the user's specified display order.

## API Permissions
- All fragments making API calls MUST include user-friendly alert messages for 401/403 errors.
- Construct URLs carefully: `restContextPath` from the definition often includes the `/o/c/` prefix.
