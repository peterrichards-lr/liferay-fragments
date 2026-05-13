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
- **Responsive Standard**: Fragments must be tested across Desktop (1920x1080),
  Tablet (768x1024), and Mobile (375x812) viewports.
- **Verification Criteria**: No fatal JS console errors (`TypeError`,
  `ReferenceError`) and successful rendering of the main wrapper.
- **Auto-Deploy Scoping**: ZIPs must be auto-deployed specifically to the
  **Guest** site (`companyWebId: liferay.com`, `groupKey: Guest`) and must use a
  **flattened** directory structure (fragments as siblings to `collection.json`)
  to be correctly registered by Liferay.
- **API-Driven Scaffolding**: Test pages must be programmatically generated via
  the **Headless Delivery API** (Page Management API) using
  `pageType: 'content'` and `pageDefinition` payloads.

### 6. Robust Identifier Validation

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
  Guest-scoped fragment ZIPs.
- **test-runner.sh**: Orchestrates LDM, build, deployment, and Playwright
  execution with support for verbose mode (`-v`), keep-alive (`-k`), skip-deploy
  (`-s`), and custom credentials.

## Current Tasks

- [x] Implement End-to-End Automated Testing Suite (Playwright + LDM).
- [x] Implement API-driven responsive page generation (Desktop, Tablet, Mobile).
- [x] Fix Fragment ZIP structure (flattening) for Auto-Deploy compatibility.
- [x] Resolve Auto-Deploy scoping issues (Targeting Guest site).
- [x] Document E2E testing architecture in `docs/automated-testing.md`.
- [ ] Finalize missing visuals for Dashboard, Gemini, and User Account
      fragments.
- [ ] Restore missing configuration fields and localizations across all
      fragments.
- [ ] Integrate new `ldm --feature` switch into `test-runner.sh` once LDM is
      updated.
- [ ] Investigate Liferay Auto-Deploy bug (Empty Collections vs Manual UI
      Import).
