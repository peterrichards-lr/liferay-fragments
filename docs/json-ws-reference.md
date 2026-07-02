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

## 4. System & Version Diagnostics

Verifying the environment state and Liferay version.

### `PortalService.get-version`

Retrieve the literal version string of the portal.

- **Use Case**: Automatically populating the "Tested Against" version in
  documentation.

### `PortalService.get-build-number`

Retrieve the internal build number.

- **Use Case**: Conditional logic in tests that target specific Liferay Fix
  Packs or Updates.

---

## 5. E2E Test Verification (The "E2E Bridge")

While REST/GraphQL are used for data creation, JSON WS is permitted in the E2E
suite for low-level environment verification.

### Scenario A: Confirming Deployment Success

Before creating test pages, use `FragmentEntryService.get-fragment-entries` to
verify that the Auto-Deployer has actually registered the fragments in the
database.

- **Verification**: Ensure the `fragmentEntryKey` exists and the `status` is `0`
  (Approved).

### Scenario B: Confirming Page Integrity

After page creation, use `LayoutService.get-layouts` to audit the technical
layout metadata.

- **Verification**: Confirm that the layout's `typeSettings` contains the
  expected fragment links and no raw placeholder text remains.

---

## 6. Usage & Authentication

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

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
