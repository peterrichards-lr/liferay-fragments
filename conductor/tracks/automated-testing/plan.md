# Automated Fragment Testing - Implementation Plan

## Phase 1: Infrastructure Setup (LDM + Bash)

- [ ] Create `scripts/test-runner.sh`.
- [ ] Implement dependency validation: check for `ldm`, `jq`, `curl`, `node`,
      `npm`.
- [ ] Implement minimum version validation for `ldm` (fail fast if not met).
- [ ] Accept a Liferay tag argument (e.g.,
      `./scripts/test-runner.sh 2026.q1.0`).
- [ ] Implement LDM startup logic:
      `ldm run liferay-test --tag <TAG> --non-interactive --no-captcha`.
- [ ] Implement wait-for-startup logic (polling
      `http://localhost:8080/c/portal/login` or checking `ldm logs`).
- [ ] Automate the build (`./create-fragment-zips.sh --all`) and deployment
      (`./deploy-fragment-zips.sh <path-to-ldm-volume> --all`).
- [ ] Implement cleanup logic (trap
      `ldm stop liferay-test && ldm rm liferay-test` on script exit).

## Phase 2: Playwright Integration

- [ ] Add `@playwright/test` to `devDependencies` in `package.json`.
- [ ] Initialize `playwright.config.js` with `baseURL: 'http://localhost:8080'`
      and setup to run against local Chromium.
- [ ] Create a global setup script for Playwright to handle the initial Liferay
      Admin login and save the auth state (bypassing login for each test).

## Phase 3: Core Test Suite & Reporting

- [ ] Write a utility to programmatically create Liferay Content Pages via
      Headless API (faster and more reliable than UI automation).
- [ ] Write a utility to map fragments to these pages via API.
- [ ] Create the primary Playwright test loop: read `fragment.json` files,
      navigate to generated pages, and assert.
- [ ] Implement a custom Playwright reporter or post-run script to generate
      `docs/test-results/results-<TAG>.md` containing pass/fail status, error
      reasons, and hints.

## Phase 4: Data-Dependent Fragments

- [ ] Group fragments that need Showcase data (Objects, Commerce).
- [ ] Ensure the LDM instance waits for Batch CX (Showcase) jobs to complete
      before running tests for these specific fragments.
- [ ] Write targeted Playwright interactions for complex form fragments to test
      functional inputs.

## Phase 5: Responsive API-Driven Testing (Future Enhancement)

- [ ] Utilize the `page-definition.json` structure (`Root` > `Section` >
      `Column` > `Fragment`) via Headless Batch APIs to programmatically
      generate a dedicated Content Page for each fragment.
- [ ] Refactor Playwright tests to navigate to these generated site pages
      instead of the Fragment Editor.
- [ ] Configure Playwright to run the visual rendering tests across multiple
      viewports: Desktop (1920x1080), Tablet (768x1024), and Mobile (375x812).
