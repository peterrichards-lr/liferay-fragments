# JSON Web Services (JSON WS) Reference

> **⚠️ ARCHITECTURAL WARNING**: While these endpoints are useful for debugging
> and legacy integrations, this project prioritizes **Headless REST** and
> **GraphQL** APIs. Use these ONLY if a modern equivalent is unavailable.

This guide documents the most useful JSON WS endpoints for Liferay Fragment
development, Site management, and automated testing infrastructure.

---

## 1. Site & Group Management

Used for resolving technical IDs (`groupId`) from friendly identifiers.

### `GroupService.get-group`

Retrieve full site details (including `siteKey` and `groupId`) by its name or
key.

- **Parameters**: `groupId` (long)
- **Use Case**: Getting the numeric ID needed for other API calls if you only
  have the name.

### `GroupService.get-user-sites-groups`

List all sites the current user has access to.

- **Use Case**: Discovering the target site ID programmatically during test
  setup.

---

## 2. Fragment Management

Direct access to fragment data and collections without using the Layout engine.

### `FragmentEntryService.get-fragment-entries`

Fetch raw fragment data, including HTML, CSS, and JS.

- **Parameters**: `groupId`, `fragmentCollectionId`, `name`, `status`, `start`,
  `end`
- **Use Case**: Verifying that a fragment was successfully registered by the
  Auto-Deployer.

### `FragmentCollectionService.get-fragment-collections`

List all fragment collections in a specific site.

- **Parameters**: `groupId`, `name`, `start`, `end`
- **Use Case**: Identifying the `fragmentCollectionId` required for
  `get-fragment-entries`.

---

## 3. Page & Layout Hierarchy

Checking the status of generated test pages.

### `LayoutService.get-layouts`

Fetch the full page tree for a site.

- **Parameters**: `groupId`, `privateLayout` (boolean)
- **Use Case**: Auditing the `friendlyUrl` paths of all generated test pages to
  ensure no collisions.

---

## 4. User & Auth Diagnostics

Verifying credentials and permissions.

### `UserService.get-user-by-email-address`

Retrieve user metadata via email.

- **Parameters**: `companyId`, `emailAddress`
- **Use Case**: Resolving the technical `userId` for audit logs or permission
  checks.

---

## 5. Usage & Authentication

All JSON WS endpoints are accessible via: `http://localhost:8080/api/jsonws`

### Invocation via CURL

```bash
curl -u test@liferay.com:test \
  -d groupId=20121 \
  "http://localhost:8080/api/jsonws/group/get-group"
```

### Invocation via Playwright (JS)

```javascript
const response = await apiContext.post('/api/jsonws/group/get-group', {
  form: {
    groupId: siteId,
  },
});
```

---

## ❌ Deprecated / Prohibited Patterns

### The "Module" Context

The legacy **"Module"** reference (previously used for referencing OSGi bundles
or certain portal modules) is non-functional in modern Page Definitions and
**must not be used**.

Always use the **`Fragment`** type within `pageDefinition` payloads for Liferay
7.4+ compatibility.
