# Site-Scoped Object Discovery (Dynamic Discovery Pattern)

If the fragment interacts with Liferay custom objects, it must support Site-scoped data using this dynamic lookup pattern:

1. **Fetch definition via ERC**:
   ```
   /o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}
   ```
2. **Fallback Search**: If the ERC is not found, search by its REST Context Path:
   ```
   /o/object-admin/v1.0/object-definitions?search=${path}
   ```
   Filter the results to locate the exact definition.
3. **Appended Scopes**: If the definition's scope is `'site'`, append `/scopes/${siteId}` to the base API path.
4. **Validation Helper**: Always use a strict validation helper (e.g., `Liferay.Fragment.Commons.isValidIdentifier()`) before using record IDs or ERCs in API calls. Block invalid strings like `"undefined"`, `"null"`, `"0"`, and `"[object Object]"`.
