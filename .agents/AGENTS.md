# Liferay Fragments — Agent Skill Router

This file is a **routing index only**. It contains no inline rules.
All operational rules live in dedicated skill modules under `.agents/skills/`.

When beginning any task, identify its domain from the table below and read the
corresponding `SKILL.md` before taking action. This ensures the correct,
complete, and up-to-date rules are always in context — not buried in a
monolithic document.

---

> [!CAUTION]
> **No Assumptions (Anti-Hallucination Rule) — Always Active**
>
> **TRIGGER**: Before making any technical statement about how code, a file,
> an API, a configuration value, or a previous change behaves in this
> repository.
>
> **MANDATORY**: Execute `view_file`, `grep_search`, or `run_command` to load
> the relevant source into your context window NOW — before writing any answer.
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> formulating or writing your answer until the tool output is in context.
> → Full rule: [`.agents/skills/no-assumptions/SKILL.md`](skills/no-assumptions/SKILL.md)

---

## Skill Index

| Skill | Activate when… | Path |
|---|---|---|
| **GitHub Workflow** | Creating a branch, opening a PR, merging code, or running any `git` / `gh` CLI operation | [`.agents/skills/github-workflow/SKILL.md`](skills/github-workflow/SKILL.md) |
| **Issue Tracking** | Planning a new feature, bug fix, or any tracked piece of work; creating or closing GitHub Issues | [`.agents/skills/issue-tracking/SKILL.md`](skills/issue-tracking/SKILL.md) |
| **Fragment Quality Gate** | Creating, modifying, or committing any Liferay fragment (configuration, CSS, JS, FTL, or docs) | [`.agents/skills/fragment-quality-gate/SKILL.md`](skills/fragment-quality-gate/SKILL.md) |
| **Backward-Compat Build** | Building, packaging, or releasing fragment ZIP collections for any Liferay version target | [`.agents/skills/backward-compat-build/SKILL.md`](skills/backward-compat-build/SKILL.md) |
| **E2E Verification** | Running E2E tests, capturing screenshots, promoting visual baselines, or interpreting test results | [`.agents/skills/e2e-verification/SKILL.md`](skills/e2e-verification/SKILL.md) |
| **Documentation Maintenance** | After completing any implementation task — review affected docs, update timestamps, and create missing documentation | [`.agents/skills/docs-maintenance/SKILL.md`](skills/docs-maintenance/SKILL.md) |
| **Tech Debt** | Whenever a code smell, duplication, over-complexity, or other debt signal is spotted during any task | [`.agents/skills/tech-debt/SKILL.md`](skills/tech-debt/SKILL.md) |
| **Sequential Workflows** | Executing any multi-phase task (scaffold → lint → build → E2E → docs) where phase ordering and gate passing must be enforced | [`.agents/skills/sequential-workflows/SKILL.md`](skills/sequential-workflows/SKILL.md) |
| **Multi-Agent Collaboration** | Splitting a task across concurrent or hierarchical subagents — research workers, parallel builders, or delegated pipelines | [`.agents/skills/multi-agent-collaboration/SKILL.md`](skills/multi-agent-collaboration/SKILL.md) |
| **No Assumptions** | Always active — before making any technical statement, verify it against actual code or documentation | [`.agents/skills/no-assumptions/SKILL.md`](skills/no-assumptions/SKILL.md) |

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
*Last Updated: 2026-07-22* | *Last Reviewed: 2026-07-22*
