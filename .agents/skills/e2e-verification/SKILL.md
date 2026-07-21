---
name: e2e-verification
description: >
  Activate this skill whenever you are running E2E tests, capturing
  screenshots, promoting visual baselines, or interpreting E2E test results
  for Liferay fragments. It specifies the exact commands for full-suite runs,
  targeted fragment runs, and visual baseline promotion, and documents the
  current known platform blocker.
---

# E2E Verification Rules

## Prerequisites

- **LDM** (Liferay Docker Manager) must be installed and available on `$PATH`.
- The E2E environment project must be configured at `e2e-test-env/` (default
  project name used by `test-runner.sh`).
- Node dependencies must be installed: `npm ci` in the repo root.

## 1. Full Suite Execution (Local)

> [!CAUTION]
> **ACTIVE CONSTRAINT — Instance Health Verification Before Test Launch**
>
> **TRIGGER**: Before running `test-runner.sh` or any Playwright test command.
>
> **MANDATORY**: Execute the following command NOW:
> ```bash
> ldm list
> ```
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> launching the test suite until the LDM output is in your context in the
> next turn and confirms that the target project (e.g. `e2e-test-env`) is
> listed as **running** and **healthy**. If the instance is not running,
> start it first and wait for health before proceeding.

Run the complete Playwright test suite against a live LDM-provisioned Liferay
instance:

```bash
# macOS / Linux
bash scripts/test-runner.sh -p e2e-test-env -k

# Windows (Git Bash)
& "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k
```

The `-k` flag keeps the LDM instance alive after the run (useful for
inspection). Omit it for fully automated teardown.

Common flags:

| Flag | Description |
|---|---|
| `-p <name>` | LDM project name (default: `e2e-test-env`) |
| `-k` | Keep instance alive after tests |
| `-s` | Skip fragment ZIP deployment (use existing deployed fragments) |
| `-v` | Verbose output |
| `-g <pattern>` | Run only tests matching the grep pattern |

## 2. Targeted Fragment Runs

Use the `-g` flag to run tests for a specific fragment or collection:

```bash
bash scripts/test-runner.sh -p e2e-test-env -k -g "meter-reading"
bash scripts/test-runner.sh -p e2e-test-env -k -g "form-fragments"
```

## 3. Visual Baseline Promotion

If a visual layout change is intentional (e.g. a deliberate UI update), the
new screenshots must be promoted to become the new baseline references:

```bash
# 1. Update Playwright snapshot baselines
npm run test:visual:update

# 2. Regenerate the visual gallery markdown
node scripts/generate-gallery.js
```

Commit the updated snapshots under `docs/images/live/` and the regenerated
`docs/GALLERY.md` as part of the same PR as the UI change.

> [!NOTE]
> The `.gitignore` contains `!/docs/images/live/**/*.png` to allow desktop
> and tablet snapshots to be tracked alongside mobile screenshots.

## 4. Interpreting Results

After a test run, Playwright outputs a summary of passed, failed, and skipped
tests. Key indicators:

- **`[SKIP]`** — Fragment has `excludeFromGallery: true` in its
  `test-data.json`. The fragment is still functionally verified; only the
  screenshot is skipped.
- **`✓`** — Fragment rendered correctly and (if applicable) screenshot
  captured.
- **`✘`** — Fragment failed to render. Check the Playwright HTML report under
  `e2e-tests/playwright-report/`.

## 5. ⚠️ Known Platform Blocker — LPD-91054

> [!WARNING]
> **Liferay DXP 2026.Q1 LTS** has a confirmed platform bug
> ([LPD-91054](https://liferay.atlassian.net/browse/LPD-91054)) that causes
> fragment ZIP collections deployed via the global auto-deploy folder to be
> **silently dropped** by the auto-deploy scanner.
>
> **Symptom**: The `DEPLOY WAIT` loop in `global-setup.js` times out after
> 580 seconds reporting `0/5 collections found`. All fragment test pages
> subsequently render with zero DOM elements, producing ~252 consistent
> failures.
>
> **Status**: Waiting for Liferay to ship the patch. No workaround exists.
> The E2E infrastructure (LDM provisioning, object seeding, page creation) is
> fully operational — only fragment deployment is affected.
>
> **Resumption**: When the patch arrives, run the suite on a **fresh**
> instance (`ldm rm --delete e2e-test-env` first) and confirm the deploy wait
> resolves with ≥5 collections found.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
