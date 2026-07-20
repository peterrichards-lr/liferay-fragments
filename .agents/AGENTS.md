# Liferay Fragments — Agent Skill Router

This file is a **routing index only**. It contains no inline rules.
All operational rules live in dedicated skill modules under `.agents/skills/`.

When beginning any task, identify its domain from the table below and read the
corresponding `SKILL.md` before taking action. This ensures the correct,
complete, and up-to-date rules are always in context — not buried in a
monolithic document.

## Skill Index

| Skill | Activate when… | Path |
|---|---|---|
| **GitHub Workflow** | Creating a branch, opening a PR, merging code, or running any `git` / `gh` CLI operation | [`.agents/skills/github-workflow/SKILL.md`](skills/github-workflow/SKILL.md) |
| **Issue Tracking** | Planning a new feature, bug fix, or any tracked piece of work; creating or closing GitHub Issues | [`.agents/skills/issue-tracking/SKILL.md`](skills/issue-tracking/SKILL.md) |
| **Fragment Quality Gate** | Creating, modifying, or committing any Liferay fragment (configuration, CSS, JS, FTL, or docs) | [`.agents/skills/fragment-quality-gate/SKILL.md`](skills/fragment-quality-gate/SKILL.md) |
| **Backward-Compat Build** | Building, packaging, or releasing fragment ZIP collections for any Liferay version target | [`.agents/skills/backward-compat-build/SKILL.md`](skills/backward-compat-build/SKILL.md) |
| **E2E Verification** | Running E2E tests, capturing screenshots, promoting visual baselines, or interpreting test results | [`.agents/skills/e2e-verification/SKILL.md`](skills/e2e-verification/SKILL.md) |
| **Documentation Maintenance** | After completing any implementation task — review affected docs, update timestamps, and create missing documentation | [`.agents/skills/docs-maintenance/SKILL.md`](skills/docs-maintenance/SKILL.md) |

## Existing Fragment Skills

The following skills pre-date this routing index and cover deeper technical
domains. Load them in addition to the relevant skill above when working on
the corresponding task:

| Skill | Purpose | Path |
|---|---|---|
| **Fragment Orchestrator** | Single entry point that routes to all fragment sub-skills | [`.agents/skills/fragment-orchestrator/SKILL.md`](skills/fragment-orchestrator/SKILL.md) |
| **Fragment Development** | Creating, structuring, and mapping properties for fragments | [`.agents/skills/liferay-fragment-development/SKILL.md`](skills/liferay-fragment-development/SKILL.md) |
| **Fragment Linting** | Running and satisfying the fragment linter quality gate | [`.agents/skills/liferay-fragment-linting/SKILL.md`](skills/liferay-fragment-linting/SKILL.md) |
| **Compat Transform** | Extending the three-target ZIP build transformations | [`.agents/skills/liferay-compat-transform/SKILL.md`](skills/liferay-compat-transform/SKILL.md) |
| **E2E Bootstrap** | Zipping, seeding, and bootstrapping fragments for E2E testing | [`.agents/skills/fragment-e2e-bootstrap/SKILL.md`](skills/fragment-e2e-bootstrap/SKILL.md) |
| **Screenshot Creation** | Capturing, verifying, and committing fragment screenshots | [`.agents/skills/fragment-screenshot-creation/SKILL.md`](skills/fragment-screenshot-creation/SKILL.md) |
| **Visual Gallery** | Generating and updating the fragment visual gallery | [`.agents/skills/liferay-visual-gallery/SKILL.md`](skills/liferay-visual-gallery/SKILL.md) |

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-20* | *Last Reviewed: 2026-07-20*
