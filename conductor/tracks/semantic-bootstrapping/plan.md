# Semantic Bootstrapping Implementation Plan

## Phase 1: Establish the Mapping Registry

Create a JavaScript mapping object that defines the specific layout tree for each container category. This will replace the hardcoded `stat-card` injection in our setup scripts.

### Target Layout Trees

**1. Header Layouts (`upper-header-layout`, `logo-zone`, etc.)**

```json
{
  "type": "Fragment",
  "key": "<container-key>",
  "children": [
    { "type": "Fragment", "key": "logo" },
    { "type": "Fragment", "key": "site-name" },
    { "type": "Fragment", "key": "login-and-user-menu" }
  ]
}
```

**2. Form Layouts (`customer-registration`, `interactive-wizard`, etc.)**

```json
{
  "type": "Fragment",
  "key": "<container-key>",
  "children": [
    {
      "type": "Fragment",
      "key": "user-field",
      "fragmentConfig": { "label": "Full Name" }
    },
    {
      "type": "Fragment",
      "key": "user-field",
      "fragmentConfig": { "label": "Email Address" }
    },
    { "type": "Fragment", "key": "submit-button" }
  ]
}
```

**3. Dashboard Layouts (`dashboard-container`, `meta-object-table`, etc.)**

```json
{
  "type": "Fragment",
  "key": "<container-key>",
  "children": [
    { "type": "Fragment", "key": "radial-kpi-gauge" },
    { "type": "Fragment", "key": "activity-heatmap" }
  ]
}
```

**4. General/Marketing Layouts (`zone-layout`, `modern-parallax-hero`, etc.)**

```json
{
  "type": "Fragment",
  "key": "<container-key>",
  "children": [{ "type": "Fragment", "key": "primary-card" }]
}
```

## Phase 2: Update the Configuration Script

Refactor `scripts/configure-test-data.js` to utilize the mapping registry.

- Instead of just checking `isContainer`, the script will match the `fragmentKey` against specific arrays (e.g., `headerContainers`, `formContainers`, `dashboardContainers`, `generalContainers`).
- It will write the corresponding semantic `pageLayout` tree into the `test-data.json` file.
- We will execute the script to rewrite the 36+ generated manifests.

## Phase 3: Validation

- Verify the generated `test-data.json` files have the correct parent-child relationships.
- (Deferred) Execute E2E tests to ensure Playwright correctly resolves the nested fragments and captures accurate gallery screenshots.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
