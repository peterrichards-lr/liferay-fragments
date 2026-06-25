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
  - **FormContainer Rest schema constraints**: In Liferay 2026.Q1 REST payloads, a `FormContainer` pageElement's `pageElements` array must contain `FormFragment` elements _directly_ (e.g. no layout sections, rows, or columns are allowed directly inside `FormContainer`). Nested layout structures inside `FormContainer` pageElements are rejected with validation errors such as `Unable to map JSON path: pageDefinition.pageElement.pageElements.null.type`.

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

### 12. Asynchronous E2E State Coordinator

- **Requirement**: The E2E test runner must manage a workspace-level, plain-text status file named `.progress-signal` as a shared IPC mailbox for state coordination.
- **Allowed States**: Must write exactly one of the case-sensitive, single-line status labels during phase boundaries:
  1. `BUILDING`: At start of compilation/build.
  2. `WAITING_HEALTHY`: Staged when build artifacts are hot-deployed, servers are starting, or container health-checks are warming up.
  3. `TESTING`: Staged when the browser E2E test runner (Playwright) launches.
  4. `SUCCESS`: Exited/written if test runner exits cleanly with Exit Code 0.
  5. `FAILED`: Exited/written if any phase fails/times out (Exit Code > 0).
- **Robust Signal Trapping**: A unified signal trap catcher must capture script aborts (`SIGINT`), terminations (`SIGTERM`), unexpected errors (`ERR`), and regular exits (`EXIT`) to write `FAILED` and propagate the non-zero exit code.
- **Git Shield**: `.progress-signal` (and any related SQLite `.db` or local environment logs) must be gitignored.
- **Windows Command Execution**: In Windows environments, any `.sh` scripts (e.g. `scripts/test-runner.sh`, `create-fragment-zips.sh`) must be invoked using `bash.exe` (e.g. Git Bash, WSL, or absolute path `& "C:\Program Files\Git\bin\bash.exe" <script>`).

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

- [x] Implement Zero-Dependency Asynchronous E2E State Coordinator (.progress-signal lifecycle and traps).
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
- [x] Restore missing configuration fields and localizations across all
      fragments. Consolidated all per-fragment Language_en_US.properties files
      into a single root-level file for form-fragments. Fixed dataType mismatches
      (boolean/number) across color-swatches, file-drop-zone, listbox-multiselect,
      password-strength, signature-pad, custom-tabs, otp-input, and meter-reading.
- [x] Integrate new `ldm --feature` switch into `test-runner.sh` once LDM is
      updated.
- [x] Investigate Liferay Auto-Deploy bug (Empty Collections vs Manual UI
      Import).
- [x] Roadmap: Enhance `.process-signal` state coordinator to write estimated completion times/percentages, allowing calling agents to schedule check reminders dynamically.
- [x] Roadmap: Investigate extending fragment bootstrapping to include provisioning Liferay Object definitions and mapping them dynamically inside Form Containers for input fragments (type: input) E2E verification.
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
- [x] **E2E Semantic Bootstrapping Framework (Hand-off Checkpoint)**
  - Configured `e2e-tests/tests/global-setup.js` to dynamically aggregate `requiredObjects` dependencies across all fragments to prevent missing object errors.
  - Implemented `excludeFromGallery` flag downstream into Playwright `fragments.spec.js` to bypass screenshots for utility/background components.
  - Created Conductor Track `semantic-bootstrapping` defining proper parent-child relationships for E2E layouts.
  - Automated generation of semantic `test-data.json` manifests for 36+ containers via `scripts/configure-test-data.js` to prevent generic/empty screenshots.
  - **NEXT ACTION (Secondary Machine):** Run the E2E test suite `./scripts/test-runner.sh` to generate the updated visual gallery.

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

- [x] Add .gitleaksignore file support to scripts/detect-secrets.js to filter
      out common mock tokens/hashes.

- [x] Fix configuration validation issues in otp-input, signature-pad,
      color-swatches, file-drop-zone, password-strength, custom-tabs, and
      meter-reading fragments.
- [x] Fix dataType default value mismatches (converting string default values to
      numbers/booleans where dataType is number/boolean) across all fragment
      configuration.json files.

- [x] Modify `scripts/generate-gallery.js` to support Desktop, Tablet, and
      Mobile viewports side-by-side in HTML tables.
- [x] Replace `"dataType": "int"` with `"dataType": "number"` across all
      fragment `configuration.json` files to resolve page creation 500 errors.
- [x] Optimize duplicate page detection in `global-setup.js` by fetching all
      layouts once before the main loop to speed up E2E page setup.

### Active Fix (In Progress)

- [x] Run automated E2E tests using `./scripts/test-runner.sh` (or using existing project via `-p`).
- [x] Standardize `form-fragments/fragments/toggle-switch` to use the standard Clay HTML structure, resolving the outstanding task in `todo.md`.

### Backward-Compatibility Rules (Three-Target ZIP Build)

- **Requirement**: The build script `create-fragment-zips.sh` must generate
  three versions of each collection ZIP to accommodate different target Liferay
  versions:
  1. **Latest** (`-collection-min.zip`): Uses `"dataType": "number"` and boolean
     literals for checkbox default values, while default values for numeric fields
     (using UI type `text` or `length`) remain string representations (required for Liferay 2026.Q1+).
  2. **pre2026q1** (`-pre2026q1-min.zip`): Uses `"dataType": "number"` but converts
     checkbox boolean default values back to string representations (required for intermediate
     Liferay versions before 2026.Q1).
  3. **pre2025q3** (`-pre2025q3-min.zip`): Uses `"dataType": "int"`
     (converting from `"number"`) and string representations for all default values
     (required for legacy Liferay versions before 2025.Q3).

## E2E Stability & Quality Gate Enhancements (June 2026)

### 1. GitHub E2E Run Failure Fixes

- **Default Credentials**: Defaulted `LIFERAY_USER` and `LIFERAY_PASSWORD` to `test@liferay.com` / `test` inside `test-runner.sh` to allow querying Liferay's version via REST/JSON WS APIs in clean environments. Added E2E credentials to `.gitleaksignore`.
- **Robust LDM Parsing**: Updated `test-runner.sh` fallback LDM list parser with a regex `awk -F'[|?│]'` to robustly extract container versions across varying terminal locales (where Unicode boundaries may output as `│`, `|`, or `?`).
- **Global Scoping Check**: In `global-setup.js`, mapped the JSON WS fragment verification to lookup collections under the `Global` site ID rather than the test `Guest` site ID. Since auto-deploy imports fragments globally, querying Guest returned 0 fragments and aborted setup with "No tests found".

### 2. Gallery Screenshot & Link Fixes

- **Git Ignore Override**: Added `!/docs/images/live/**/*.png` to `.gitignore` to override global `*.png` exclusions, enabling desktop/tablet snapshots to be correctly tracked and committed alongside mobile screenshots.
- **Auto-Sync Dependencies**: Ran the dependency sync script to update all `fragment-build.json` files, successfully injecting missing `"discovery.js"` declarations for `dynamic-object-gallery` and other fragments (fixing the `resolveObjectPathByERC is not a function` JS errors).
- **Object Discovery Retries**: Added a retry loop (5 attempts, 3s stagger) to retrieve custom object definitions (e.g. `WATER_READING`) in `global-setup.js`. This prevents race conditions where Guest permissions were skipped because Liferay had not finished deploying the object definitions, resolving the loading spinner issues.
- **Markdown Link Checker**: Implemented a comprehensive relative link, HTML image tag, and HTML anchor checker inside `lint-fragments.js`. This scans all markdown files, resolving path anchors and skipping template tags (like `{{...}}`). Failed snapshots are logged as warnings so local setups don't block, while actual broken links raise errors. Created missing `vertical-bar.md` and corrected search-overlay / interactive-wizard visuals.

### 3. Local Automation & Timing Gates

- **Quality Hook**: Integrated the auto-dependency sync script (`scripts/initialize-build-config.js`) and the fragment linter (`npm run lint`) into the local `.git/hooks/pre-commit` script. It includes safety checks for missing `node_modules` and helpful instructions for using `git commit --no-verify` to bypass the hook for WIP.
- **CI Timeout Tuning**: Scaled Playwright `networkidle` state timeout to 15 seconds in CI (`process.env.CI`) to ensure slower GitHub Actions runners wait for dynamic layout rendering before capturing screenshots.

### 4. Configuration Hardening & i18n Consolidation (June 2026)

- **i18n Consolidation**: Removed 16 per-fragment `Language_en_US.properties` files in `form-fragments/fragments/` and merged all keys into a single `form-fragments/Language_en_US.properties` root file. This matches Liferay's collection-level localization pattern and eliminates duplication.
- **dataType Boolean Fixes**: Added missing `"dataType": "boolean"` to all checkbox fields across `color-swatches`, `file-drop-zone`, `listbox-multiselect`, `password-strength`, `signature-pad`, `custom-tabs`, `otp-input`, and `meter-reading`. Without this, Liferay 2026.Q1 interprets boolean defaults as strings.
- **dataType Number Fixes**: Corrected `"dataType": "string"` → `"dataType": "number"` for numeric text fields in `listbox-multiselect`, `password-strength`, `signature-pad`, and `meter-reading` (integer/decimal digit counts).
- **meter-reading FTL Fix**: Updated `index.ftl` to use `?number` conversion for `integerDigitCount`/`decimalDigitCount` and calculate `totalDigits` dynamically from the two values rather than hardcoding `6`.
- **otp-input FTL Guard**: Hardened the `?number` conversion to guard against empty strings, preventing FreeMarker rendering errors.
- **otp-input Fragment Name**: Renamed from `OTP / Verification Code` to `OTP - Verification Code` to avoid path separator issues.
- **global-setup.js Simplification**: Simplified the input fragment page layout by placing the fragment directly inside a Column (no Form wrapper), and switched Column `size` → `width: '100%'` to match the validated Headless Delivery API schema.
- **Dashboard Container CSS**: Added base CSS to `dashboard-container/index.css` so the component renders with a visible frame in E2E screenshots.
- **Linter Exclusions**: Added `temp_extract/**` and `temp_inspect/**` to the lint-fragments.js ignore list to prevent false positives from diagnostic extraction folders.
- **search-button CSS Tokens**: Replaced hardcoded hex colors (`#30313f`, `#e2e8f0`, `#f8fafc`, `#0053a0`, `#cbd5e1`) with Meridian CSS variable tokens (`var(--body-color)`, `var(--border-color)`, `var(--light)`, `var(--primary)`, `var(--gray-400)`). Resolves the final linter warning — project now passes `npm run lint` with **0 errors, 0 warnings**.

### Repository Protection Setup (June 2026)

- [x] Implement GitHub Repository Rulesets for `liferay-fragments`:
  - `Protect Main Branch` ruleset (requiring squash merges, linear history, and status checks `Lint Fragments` + `Playwright Tests (LDM)`).
  - `Protect Version Tags` ruleset (preventing deletion and modification of version tags).
- [x] Add `.github/dependabot.yml` for auto-upgrades of GitHub Action dependencies.
- [x] Add `.github/PULL_REQUEST_TEMPLATE.md` to guide contributions and checklist validation.
