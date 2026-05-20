# Gemini Project State - Liferay Fragments

## Mandatory Rules & Conventions

### 1. Localization Rule

- **Requirement**: Whenever a fragment's `configuration.json` is modified, the
  corresponding `Language_en_US.properties` file **must** be updated with
  meaningful English labels and descriptions.
- **Coverage**: ALL labels and descriptions in `configuration.json`, including
  those within `validValues` arrays, MUST have a corresponding entry in the
  property file.

### 2. Documentation Rule

- **Requirement**: Whenever a fragment is updated, its markdown file in
  `docs/fragments/` must be synchronized.
- **New Fragments**: Any new fragment MUST have a corresponding documentation
  file including Overview, Configuration, and Usage sections.

### 3. Site-Scoping Compliance (Discovery Pattern)

- **Requirement**: Fragments interacting with Liferay Objects must support
  Site-scoped data via dynamic discovery.
- **Pattern**:
  1. Primary: Fetch the object definition via its External Reference Code (ERC)
     using
     `/o/object-admin/v1.0/object-definitions/by-external-reference-code/${erc}`.
  2. Fallback: Search for the object definition by its REST Context Path via
     `/o/object-admin/v1.0/object-definitions?search=${path}` and filter
     results.
  3. If `definition.scope === 'site'`, append `/scopes/${siteId}` to the base
     API path.

### 4. Fragment Logic & Compatibility

- **Top-Level Returns**: JavaScript logic MUST NOT use top-level `return`
  statements. Encapsulate all logic within an initialization function (e.g.,
  `initMyFragment()`).
- **LayoutMode API**: Always use the `layoutMode` variable (`'view'`, `'edit'`,
  or `'preview'`) for environment-specific logic.
- **Internal Selectors**: Always use `fragmentElement.querySelector` for
  internal elements to prevent state collision.

### 5. Automated Fragment Testing (E2E)

- **Requirement**: All fragments must be verified against Liferay 2026.Q1+ using
  the automated test suite (`scripts/test-runner.sh`).
- **Infrastructure**: Provisioned via **Liferay Docker Manager (LDM)** using
  PostgreSQL, Sidecar, and Seeded mode.
- **JVM Stability Rule**: To prevent JIT compiler stalls in 2026.Q1, the Liferay
  container MUST be provisioned with at least `-Xmx4g` and
  `-XX:ReservedCodeCacheSize=512m`.
- **Responsive Standard**: Fragments must be tested across Desktop (1920x1080),
  Tablet (768x1024), and Mobile (375x812) viewports.
- **Verification Criteria**: No fatal JS console errors (`TypeError`,
  `ReferenceError`) and successful rendering of the main wrapper.

### 6. Headless API & Scoping (Stability Rules)

- **Payload Strictness**: `pageDefinition` JSON element types (Root, Section,
  Row, Column, Fragment) MUST be **Capitalized**. Case-mismatch triggers a
  `NullPointerException` in Java-side importers.
- **Mandatory Metadata**: Row definitions MUST include `gutters: true` and
  `columnsSpacing: true` to satisfy 2026.Q1 validation requirements.
- **Scoping Rule**: When programmatically creating test pages, always use the
  explicit `siteERC` in the fragment reference `siteKey` property.
- **Race Condition Prevention**:
  - **Sequential Creation**: Programmatic page creation MUST be executed
    sequentially (one-by-one) with a minimum 1s stagger to prevent duplicate key
    violations in the `PortalPreferenceValue` table.
  - **Atomic Deployment**: Fragment ZIPs must be deployed via an atomic staging
    pattern (`cp` to `/tmp` -> `mv` to `/deploy`) to prevent `lchown` metadata
    race conditions in Docker.
- **API Standards**:
  - **JSON WS Prohibited**: Fragments and automation scripts MUST NOT use
    Liferay's legacy `/api/jsonws` endpoints. Prioritize **REST**
    (`/o/v1.0/...`) and **GraphQL** (`/o/graphql`) for all data operations.
  - **Deprecated References**: The **'Module'** reference type (previously used
    for certain layout elements) is non-functional and strictly prohibited. Use
    `Fragment`, `Section`, or `Column` as defined in the modern schema.

### 7. Robust Identifier Validation

- **Requirement**: Use a strict validation helper (`isValidIdentifier()`) before
  using record IDs or ERCs in API calls.
- **Blocklist**: Explicitly block strings like `"undefined"`, `"null"`, `"0"`,
  and `"[object Object]"`.

### 7. Mappable Field Ergonomics

- **Requirement**: Non-title mappable fields (`data-lfr-editable`) MUST be
  wrapped in a `.meta-editor-mappable-fields` container which is hidden in
  runtime.

### 8. Theme Fidelity (Safe Tokens)

- **Theme Awareness**: Fragments MUST be theme-aware and use CSS tokens defined
  in `docs/THEMES.md`. Use theme-specific body classes (`.meridian-theme`,
  `.liferay-dialect-theme`, `.classic-theme`) for targeted overrides.

### 9. Template Extension Rule (FTL vs HTML)

- **Requirement**: Use `.ftl` if the fragment contains ANY FreeMarker logic or
  Liferay variables. Use `.html` ONLY for strictly static HTML or basic
  `data-lfr-editable` fields.

### 10. Fragment Quality Gate (Linter)

- **Requirement**: All fragments MUST pass `npm run lint` before being
  committed. This enforces schema validation, localization coverage, field
  integrity, and theme fidelity.

### 11. Inter-Fragment Messaging (Event Bus)

- **Requirement**: Use the shared `EventBus` utility for all
  fragment-to-fragment communication with `{ sticky: true }` for broadcasts and
  `{ replay: true }` for subscribers.

## Build & Deployment

- **create-fragment-zips.sh**: Automates the generation of flattened,
  Global-scoped fragment ZIPs.
- **test-runner.sh**: Orchestrates LDM, build, deployment, and Playwright
  execution with support for verbose mode (`-v`), keep-alive (`-k`), skip-deploy
  (`-s`), and custom credentials.

## Current Tasks

- [x] Implement End-to-End Automated Testing Suite (Playwright + LDM).
- [x] Implement API-driven responsive page generation (Desktop, Tablet, Mobile).
- [x] Fix Fragment ZIP structure (flattening) for Auto-Deploy compatibility.
- [x] Resolve Auto-Deploy scoping issues (Targeting Global site).
- [x] Document E2E testing architecture in `docs/automated-testing.md`.
- [ ] Finalize missing visuals for Dashboard, Gemini, and User Account
      fragments.
- [ ] Restore missing configuration fields and localizations across all
      fragments.
- [ ] Integrate new `ldm --feature` switch into `test-runner.sh` once LDM is
      updated.
- [ ] Investigate Liferay Auto-Deploy bug (Empty Collections vs Manual UI
      Import).
