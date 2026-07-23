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
tests. Key indicators in the console:

- **`[SKIP]`** — Fragment has `excludeFromGallery: true` in its
  `test-data.json`. The fragment is still functionally verified; only the
  screenshot is skipped.
- **`✓`** — Fragment rendered correctly and (if applicable) screenshot captured.
- **`✘`** — Fragment failed to render. Check the Playwright HTML report under
  `e2e-tests/playwright-report/`.

### Gallery Status Labels

The visual gallery (`docs/gallery.md`) shows per-fragment, per-viewport status
derived from the Playwright JSON results file (`playwright-results.json`), the
visual pixel analysis (`visual-analysis.json`), and the screenshot file.

Status priority (highest wins):

| Icon | Label | Source | Meaning |
|---|---|---|---|
| 🔴 | **Failed (Test)** | `playwright-results.json` | Playwright test threw an assertion error. The first line of the error message is shown inline. |
| 🔴 | **Failed (404 Page)** | HTML snapshot / file size | Page returned 404 or the file size matches a known Liferay 404 page. |
| ⚠️ | **Blank/Solid Color** | `visual-analysis.json` | Pixel analysis detected a blank or solid-colour image. |
| ❌ | **Diff %** | `visual-analysis.json` | Snapshot differs from baseline by more than 1%. Diff image linked. |
| 🟢 | **Passed** | `playwright-results.json` | Playwright test passed. |
| ⏭️ | **Skipped** | `playwright-results.json` | Test was skipped (`excludeFromGallery: true`). |
| ⚠️ | **Unverified** | Fallback | Results file exists but no entry for this fragment/viewport, or no PNG file found. |

> [!NOTE]
> If `playwright-results.json` is absent (e.g. gallery regenerated manually),
> the gallery falls back to the legacy file-existence check and shows
> `🟢 Passed` for any fragment with a PNG on disk. This is less accurate but
> preserves backward compatibility.

> [!IMPORTANT]
> The gallery is now regenerated on **both pass and fail** runs, so it always
> reflects the latest test outcomes — including fragments that failed.

## 4a. Empty-State False-Positive Detection

> [!IMPORTANT]
> A fragment that shows the shared Liferay **empty state** (`c-empty-state`)
> must be treated as a **FAIL**, not a pass. CSS `min-height` rules on slider
> or gallery containers give the fragment a non-zero bounding box height even
> when no data is loaded, which fools a naive height > 10px check.

`fragments.spec.js` contains an explicit check **before** the bounding box
guard that locates `.c-empty-state` inside the fragment element and throws:

```
Fragment 'X' rendered an empty state instead of content.
Data was not loaded — check collection seeding, API permissions, or fragment
configuration. (Selector: .c-empty-state found N element(s) inside fragment)
```

**Affected fragments** (use `renderEmptyState` internally):
- `dynamic-collection-slider` — "Collection is Empty"
- `activity-heatmap` — empty heatmap grid
- `dynamic-object-gallery` — empty gallery grid
- `meta-object-table` — empty table
- `object-linked-chart` — empty chart

**When a fragment fails with this error**, investigate:
1. Was the collection/object seeded in `global-setup.js`? Check `test-data.json`.
2. Does the collection have Guest view permissions? Check `addGuestPermissions`.
3. Is the SAP policy allowing the content-set-elements endpoint for Guest access?
4. Is `collectionId` mapped correctly via `pageConfig.fragmentConfig`?

## 4b. Unified Failure Accumulator

`fragments.spec.js` uses a single `failures[]` array to collect **all** failure
signals. No signal is silently swallowed. The screenshot is always taken — even
when failures exist — so the gallery captures the broken state as evidence.

| Signal | Previously | Now |
|---|---|---|
| HTTP 4xx/5xx on navigation | `throw` immediately (no screenshot) | `failures.push()` → screenshot taken |
| `console.error` (any) | Only TypeError/ReferenceError failed | ALL console errors accumulate |
| `pageerror` (JS exception) | Only TypeError/ReferenceError failed | ALL JS exceptions accumulate |
| Loading spinner stuck | `throw` → swallowed by catch | `failures.push()` |
| Empty state visible | `throw` → swallowed by catch | `failures.push()` |
| Height ≤ 10px | `throw` → swallowed by catch | `failures.push()` |
| Custom verification block | not checked | `failures.push()` for each failure |

A single `throw` at the end reports the complete list. Playwright marks the
test as `failed` with all failures enumerated, and the gallery shows:
`🔴 Failed (Test): Fragment 'X' failed verification with N issue(s): ...`

## 4c. Per-Fragment Verification Block

Each data-driven fragment can declare custom success criteria in
`test/test-data.json` under a `"verification"` key. These are passed through
to `generated-test-pages.json` by `global-setup.js` and applied by
`fragments.spec.js` in Phase 1b (after generic checks, before screenshot).

> [!NOTE]
> The generic `.c-empty-state` check applies to **all** fragments universally
> and does **not** need to be repeated in the `verification` block.

### Schema

```json
{
  "verification": {
    "requiredSelectors": [
      {
        "selector": ".slider-slide",
        "minCount": 1,
        "description": "At least one slide must render (proves collection items were loaded)"
      }
    ],
    "forbiddenSelectors": [
      {
        "selector": "[id^='error-']:not(.d-none)",
        "description": "Error banner must not be visible (no fetch or API error occurred)"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `requiredSelectors[].selector` | `string` | ✅ | CSS selector scoped to the fragment element |
| `requiredSelectors[].minCount` | `integer` | ❌ (default: 1) | Minimum matching elements required |
| `requiredSelectors[].description` | `string` | ✅ | Shown in failure output and gallery tooltip |
| `forbiddenSelectors[].selector` | `string` | ✅ | CSS selector that must not be visible |
| `forbiddenSelectors[].description` | `string` | ✅ | Shown in failure output and gallery tooltip |

The schema is validated by the linter (`scripts/lint-fragments.js` via
`schemas/test-data.schema.json`) at commit time — malformed `verification`
blocks are caught before the E2E suite runs.

### Fragments with verification blocks

| Fragment | Required | Forbidden |
|---|---|---|
| `dynamic-collection-slider` | `.slider-slide` ≥ 1 | `[id^='error-']:not(.d-none)` |
| `dynamic-object-gallery` | `.gallery-item` ≥ 1 | — |
| `activity-heatmap` | `.heatmap-cell` ≥ 7 | — |
| `meta-object-table` | `tbody tr` ≥ 1 | — |
| `object-linked-chart` | `canvas` ≥ 1 | — |

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
*Last Updated: 2026-07-23* | *Last Reviewed: 2026-07-23*
