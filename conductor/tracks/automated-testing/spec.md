# Automated Fragment Testing - Specification

## Objective

Automate the testing and visual verification of all 126+ Liferay Fragments
within a target Liferay instance using Liferay Docker Manager (LDM) and
Playwright. The process must be highly reusable across different Liferay
versions, fail fast on missing dependencies, and generate a comprehensive
Markdown report per tested tag.

## Background & Feasibility

Currently, the repository contains 126 fragments across various categories.
Manually verifying them in a new LTS release is unscalable.

**Feasibility Analysis:**

1. **Liferay Docker Manager (LDM):** Highly feasible. LDM supports
   non-interactive startup. It easily provides the clean environment needed.
2. **Playwright:** Highly feasible. Playwright can reliably automate the browser
   to log in, navigate the Liferay UI, add fragments to a page, and perform
   visual/functional assertions.
3. **Deployment:** The existing scripts can be utilized to push the compiled
   `zips/` directly to the `deploy` folder of the LDM-managed container.

## Requirements

1. **Dependency Validation (Fail Fast):** The orchestration script must check
   for the presence of required tools (`ldm`, `jq`, `curl`, `node`) and ensure
   `ldm` meets a minimum required version. It must exit immediately with an
   error if prerequisites are missing.
2. **Environment Provisioning Script:** A bash/zsh script that takes a Liferay
   tag as an argument (defaulting to `2026.q1.0`). It uses LDM to spin up a
   clean instance and waits for it to be ready.
3. **Deployment Step:** The script runs `./create-fragment-zips.sh` and deploys
   them to the LDM instance.
4. **Test Suite (Playwright):**
   - Automate login to Liferay (Omni Admin).
   - Create/navigate to test pages, render fragments via Headless APIs or UI.
   - Assert for JS console errors, empty states, and functional correctness. _No
     modifications to fragments will be made by the script._
5. **Reporting:** Generate a distinct Markdown file for each test run (e.g.,
   `results-2026.q1.0.md`). The report must detail the outcome of each fragment
   test, highlighting reasons for failure and offering optional resolution
   hints.
6. **Teardown Step:** Cleanly stop/remove the LDM instance after tests complete.

## Challenges to Address in Implementation

- **Dependencies:** Some fragments require Showcase Data. The test orchestrator
  must ensure `--showcase` batch client extensions are deployed and processed
  before testing those specific fragments.
- **Reporting:** Designing a custom Playwright reporter or post-processing step
  to generate the markdown file with the specific failure details and hints.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
