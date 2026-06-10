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

## E2E Testing Philosophy

### 1. Playwright-First Strategy

Playwright is the primary engine for all functional and visual E2E verification.
Tests must focus on:

- **Responsive Rendering**: Ensuring fragments scale across viewports.
- **Visual Regression**: Capturing snapshots to detect unintended UI drift.
- **Client-Side Logic**: Verifying Event Bus, Discovery, and API interactions.

### 2. The "Clean Data" Principle

Following Liferay's core engineering standards, every test run MUST clean up
after itself.

- **Automated Teardown**: All programmatically created test pages must be
  deleted via the Headless Delivery API in the `global-teardown.js` phase.
- **Clutter Prevention**: This ensures CI environments remain stable and
  accessible without thousands of orphaned test pages.

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
- [x] Hide generated test pages from Liferay navigation menu using
      pageSettings.hiddenFromNavigation via a two-phase API flow
      (headless-delivery POST + headless-admin-site PATCH).
- [x] Provision custom object definitions (batch client extensions) for missing
      object dependencies (comments, auditentries, campaigns,
      campaigninteractions) to avoid networkidle timeouts in E2E.
- [x] Resolve REST API path discrepancies
      (web-content-structures/web-content-articles to
      content-structures/structured-contents) and implement JSON WS fallback for
      Collections (Content Sets) seeding in global-setup/teardown.
- [x] Update Dynamic Collection Slider fragment to fetch items via the correct
      /o/headless-delivery/v1.0/content-sets/{id}/content-set-elements endpoint.
- [x] Create unified query-liferay.js script for non-interactive diagnostics of
      site structures, articles, and collections.
- [x] Optimize duplicate page detection (handling
      LayoutFriendlyURLException/LayoutFriendlyURLsException) in global-setup.js
      to prevent long retry delays.
- [x] Finalize missing visuals for Dashboard, Gemini, and User Account
      fragments.
- [ ] Restore missing configuration fields and localizations across all
      fragments.
- [ ] Integrate new `ldm --feature` switch into `test-runner.sh` once LDM is
      updated.
- [ ] Investigate Liferay Auto-Deploy bug (Empty Collections vs Manual UI
      Import).
- [x] Optimize fragment selector in Playwright to match Liferay 2026.Q1
      structure items (using div[id^="fragment-"]), resolving 15s timeouts and
      speeding up tests.
- [x] Define E2E test-data manifests (test-data.json) for other gemini-generated
      fragments (dynamic-object-gallery, activity-heatmap, radial-kpi-gauge,
      object-linked-chart, etc.).
- [x] Research and test JSON WS ddm.ddmstructure/add-structure and
      fetch-structure-by-external-reference-code endpoints with proper
      fieldReference and defaultLocale mappings.
- [x] Integrate programmatic DDM Structure creation in global-setup.js using
      JSON WS fallback.
- [x] Integrate programmatic DDM Structure deletion in global-teardown.js using
      JSON WS fallback.

- [x] In `global-setup.js`, add `fieldReference` to `contentFields` payload for
      structured contents.
- [x] In `test-data.json`, change image field type from `image` to `text` to
      bind path strings correctly.
- [x] Update `test-data.json` structure key to `SLIDER-SLIDE-STRUCT-V3` to force
      recreation.
- [x] Use `Liferay.Util.fetch` instead of `fetch` in
      `dynamic-collection-slider/index.js` to avoid 403 Forbidden CSRF issues
      during E2E page rendering.
- [x] Automate adding
      `com.liferay.headless.delivery.internal.resource.v1_0.ContentSetElementResourceImpl#*`
      to `SYSTEM_DEFAULT` SAP policy via Playwright in the setup phase to allow
      Guest access.
- [x] Configure guest view permissions for seeded Collections in
      `global-setup.js` using `addGuestPermissions: true` in `serviceContext`.
- [x] Configure guest view permissions (viewableBy: 'Anyone') for seeded Web
      Content Articles in `global-setup.js`.
- [x] Add network response logging to `fragments.spec.js` to inspect the exact
      JSON payload returned to the browser for the collection elements endpoint.
- [x] Run the E2E test and inspect the network response logs to verify guest
      access payload.
- [x] Delete pre-existing duplicate pages in global-setup.js and recreate them
      fresh to ensure configuration overrides are always up to date.
- [x] Query layouts via JSON WS instead of site-pages REST endpoint in
      global-setup.js to find and delete hidden pages.
- [x] Use JSON WS delete-layout instead of Headless REST delete page in
      global-setup.js to bypass 404 Not Found issues on pre-existing layouts.
- [x] Use JSON WS delete-layout instead of Headless REST delete page in
      global-teardown.js to bypass 404 Not Found issues.
- [x] Override Playwright emulated projects userAgent to prevent Liferay 403
      session mismatch.
- [x] Upload mock images to Documents and Media and map them dynamically in
      global-setup.js.
- [x] Override storageState to empty/Guest session in fragments.spec.js to
      capture clean screenshots without admin control menu overlays.

- [x] Set up project-local secret detection using a custom Node.js pre-commit
      hook and scanner to use project/repo dependencies only.

- [x] Add .gitleaksignore file support to scripts/detect-secrets.js to filter out common mock tokens/hashes.

- [x] Fix configuration validation issues in otp-input, signature-pad, color-swatches, file-drop-zone, password-strength, custom-tabs, and meter-reading fragments.
- [x] Fix dataType default value mismatches (converting string default values to numbers/booleans where dataType is number/boolean) across all fragment configuration.json files.


- [x] Modify `scripts/generate-gallery.js` to support Desktop, Tablet, and Mobile viewports side-by-side in HTML tables.
- [x] Replace `"dataType": "int"` with `"dataType": "number"` across all fragment `configuration.json` files to resolve page creation 500 errors.
- [x] Optimize duplicate page detection in `global-setup.js` by fetching all layouts once before the main loop to speed up E2E page setup.


### Active Fix (In Progress)

- [x] Update `~/.ldm/registry.json` to properly map `liferay-ai-commerce-accelerator` and `aica` projects.
- [ ] Run automated E2E tests using `./scripts/test-runner.sh -p liferay-ai-commerce-accelerator` or equivalent command.
- [x] Regenerate `docs/gallery.md` using `npm run docs:gallery` and verify output layout.


### Backward-Compatibility Rule (dataType number -> int)
- **Requirement**: For legacy pre-2025q3 ZIP generation, the build script `create-fragment-zips.sh` must dynamically transform `"dataType": "number"` to `"dataType": "int"` in configuration files to prevent importing failures on older Liferay versions.

