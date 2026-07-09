# Automated Fragment Testing - Implementation Plan

## Phase 1: Infrastructure Setup (LDM + Bash)

- [x] Create `scripts/test-runner.sh`.
- [x] Implement dependency validation: check for `ldm`, `jq`, `curl`, `node`,
      `npm`.
- [x] Implement minimum version validation for `ldm` to 2.8.0.
- [x] Accept a Liferay tag argument.
- [x] Implement LDM startup logic with strict memory profile enforcement
      (`LIFERAY_JVM_OPTS`).
- [x] Implement 3-Phase wait-for-startup logic via `ldm wait`.
- [x] Automate the build (`./create-fragment-zips.sh --all`) and deployment via
      bind mounts.
- [x] Implement cleanup logic (trap).

## Phase 2: Playwright Integration

- [x] Add `@playwright/test` to `devDependencies` in `package.json`.
- [x] Initialize `playwright.config.js`.
- [x] Create a global setup script for Playwright to handle login and auth state
      saving.

## Phase 3: Core Test Suite & Page Generation

- [x] Write utility to programmatically create Liferay Content Pages via
      Headless API using GraphQL verification.
- [x] Stagger page creation with 5s delays to prevent Liferay OOM crashes.
- [x] Create the primary Playwright test loop.
- [x] Implement a custom Markdown reporter in `docs/test-results/`.

## Phase 4: Iterative Isolation Strategy (Current Focus)

The strategy shifts from testing everything blindly to an iterative approach. We
will categorize fragments into tiers based on their dependencies.

- [ ] **Task 1:** Add a Fragment Filter argument (`-f <fragment-name>`) to
      `test-runner.sh` and pass it to Playwright to isolate test runs.
- [ ] **Task 2:** Refactor `global-setup.js` to respect the filter (skip
      generating pages for ignored fragments).
- [ ] **Task 3:** Implement the "Fixture Pattern" in
      `e2e-tests/tests/fixtures/`. If a fragment has a `.setup.js` file, execute
      it to inject prerequisites (Objects, Form Containers) before page
      generation.

## Phase 5: Tier 1 - Standalone Fragments

Test fragments that require zero dependencies. They can be safely dropped onto a
blank Content Page. **Targets:**

- `layout-components` (e.g., `primary-card`, `secondary-card`)
- `hero-assets` (e.g., `banner-video`, `overlay-background`)
- `header-components` (e.g., `site-name`, `logo`)
- `misc` (e.g., `back-button`, `icon-button`)
- `modern-intranet` (e.g., `welcome-banner`, `stat-card`)
- [ ] Create tests and assert successful rendering for Tier 1 fragments.

## Phase 6: Tier 2 - Content-Dependent Fragments

Fragments requiring simple content like Web Content Articles or Documents.

- [ ] Create a shared `fixtures/content.setup.js` to seed dummy articles/images.
- [ ] Test `dashboard-components` and basic `content` fragments.

## Phase 7: Tier 3 - Object & Form-Dependent Fragments

The most complex fragments requiring Objects, Form Containers, and mapped
fields.

- [ ] Create dedicated setup fixtures for `form-fragments` and `forms`.
- [ ] Test `populated-form-fields`.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
