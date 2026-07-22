---
name: sequential-workflows
description: >
  Activate this skill when executing any multi-phase fragment development
  task — scaffolding, linting, compatibility build, E2E testing, or
  documentation update — where the output of one phase is the required
  input to the next. It defines the canonical pipeline phases, their
  inputs/outputs, and the active constraints that prevent a downstream
  phase from starting before its upstream gate has passed.
---

# Sequential Workflows

## Purpose

Complex fragment development tasks span multiple phases that have strict
ordering dependencies. Running them out of order (e.g. deploying before
linting passes) propagates errors downstream and wastes time. This skill
formalises the pipeline so each phase is gated on the verified output of
the previous one.

---

## The Fragment Development Pipeline

```
[Scaffold] → [Lint] → [Build ZIPs] → [Deploy & E2E] → [Docs]
```

Each arrow represents a **gate** — the downstream phase MUST NOT start
until the upstream gate is confirmed passed.

---

## Phase Definitions

### Phase 1 — Scaffold

**Skill**: [`liferay-fragment-development/SKILL.md`](../liferay-fragment-development/SKILL.md)

**Inputs**
- Fragment name, collection, type (display / form / section)
- Field definitions (labels, dataTypes, defaultValues)

**Outputs**
- `fragments/<collection>/<name>/main/` directory with `index.html`/`.ftl`,
  `index.css`, `index.js`, `configuration.json`
- Collection-level `Language_en_US.properties` updated with new keys
- Fragment entry in `collection.json`

**Gate**
> [!CAUTION]
> **ACTIVE CONSTRAINT — Scaffold Completeness Gate**
>
> **TRIGGER**: Before advancing to Phase 2 (Lint).
>
> **MANDATORY**: Execute the following NOW:
> ```bash
> ls fragments/<collection>/<name>/main/
> grep "<fragment-key>" fragments/<collection>/Language_en_US.properties
> ```
>
> **BLOCK**: End your turn. You are FORBIDDEN from running the linter until
> all expected scaffold files exist and all i18n keys are present in the
> properties file in the next turn.

---

### Phase 2 — Lint

**Skill**: [`liferay-fragment-linting/SKILL.md`](../liferay-fragment-linting/SKILL.md)

**Inputs**: Completed scaffold output from Phase 1.

**Outputs**: Zero linter errors across schema, localization, field integrity,
and theme fidelity checks.

**Gate**
> [!CAUTION]
> **ACTIVE CONSTRAINT — Lint Gate**
>
> **TRIGGER**: Before advancing to Phase 3 (Build ZIPs).
>
> **MANDATORY**: Execute NOW:
> ```bash
> npm run lint
> ```
>
> **BLOCK**: End your turn. You are FORBIDDEN from running the build until
> the lint output is in context in the next turn and shows **zero errors**.
> Fix all errors before proceeding.

---

### Phase 3 — Build ZIPs

**Skill**: [`backward-compat-build/SKILL.md`](../backward-compat-build/SKILL.md)

**Inputs**: Lint-clean fragment source files.

**Outputs**:
- `dist/<collection>-collection-min.zip` (2026.Q1+)
- `dist/<collection>-pre2026q1-min.zip` (pre-2026.Q1)
- `dist/<collection>-pre2025q3-min.zip` (pre-2025.Q3)

**Gate**
> [!CAUTION]
> **ACTIVE CONSTRAINT — Build Output Gate**
>
> **TRIGGER**: Before advancing to Phase 4 (Deploy & E2E).
>
> **MANDATORY**: Execute NOW:
> ```bash
> ls -lh dist/<collection>-*-min.zip
> ```
>
> **BLOCK**: End your turn. You are FORBIDDEN from deploying or running E2E
> tests until all three ZIPs exist and have non-zero file sizes in the next
> turn.

---

### Phase 4 — Deploy & E2E

**Skill**: [`e2e-verification/SKILL.md`](../e2e-verification/SKILL.md)

**Inputs**: Built ZIP files from Phase 3.

**Outputs**: Playwright test results; updated visual snapshots under
`docs/images/live/`.

**Gate**
> [!CAUTION]
> **ACTIVE CONSTRAINT — E2E Instance Health Gate**
>
> **TRIGGER**: Before running `test-runner.sh`.
>
> **MANDATORY**: Execute NOW:
> ```bash
> ldm list
> ```
>
> **BLOCK**: End your turn. You are FORBIDDEN from launching the test suite
> until the LDM instance is confirmed **running** and **healthy** in the
> next turn.

---

### Phase 5 — Documentation

**Skill**: [`docs-maintenance/SKILL.md`](../docs-maintenance/SKILL.md)

**Inputs**: Passing E2E results; any new or changed fragment behaviour.

**Outputs**: Updated or created `docs/fragments/<collection>/<name>.md`;
timestamp footers updated on all reviewed documents.

**Gate**
> [!CAUTION]
> **ACTIVE CONSTRAINT — Docs Review Gate**
>
> **TRIGGER**: Before opening a PR.
>
> **MANDATORY**: Execute the docs-maintenance Step 1 enumeration constraint
> (list candidate docs) and Step 2 read constraint (view each one) NOW.
>
> **BLOCK**: End your turn after each tool call. You are FORBIDDEN from
> running `gh pr create` until every affected document has been reviewed
> and its timestamp updated.

---

## Skipping Phases

A phase may be skipped **only** if it is provably irrelevant to the change:

| Skip condition | Allowed? |
|---|---|
| Configuration-only change with no JS/CSS — skip E2E | ✅ with explicit note in PR body |
| Docs-only change — skip Lint and Build | ✅ |
| Lint already passed in current session and no files changed since | ✅ cite the tool output |
| Skipping Lint because "it probably passes" | ❌ FORBIDDEN |

---

## Pipeline Error Propagation Rule

If any phase gate fails, you MUST:

1. Fix the error in the current phase.
2. Re-run the gate for that phase until it passes.
3. Only then advance to the next phase.

**NEVER** advance past a failed gate and attempt to fix it retroactively
downstream. Errors compound across phases.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-22* | *Last Reviewed: 2026-07-22*
