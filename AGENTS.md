# Liferay Fragments — Agent Context & Skill Router

## Project Identity

- **Name**: Liferay Page & Form Fragments
- **Technology Stack**: HTML, CSS, Vanilla JavaScript (ES6+), FreeMarker (`.ftl`), JSON (`configuration.json`, `collection.json`)
- **Package / Target**: Liferay DXP (2026.Q1+, 2025.Q3+, legacy)
- **Documentation**: [`docs/`](./docs/)

---

## Conventions & Guardrails (Skill Router)

All operational rules live in dedicated skill modules under [`.agents/skills/`](./.agents/skills/).
When beginning any task, read the corresponding `SKILL.md` before taking action:

| Skill | Activate when… | Path |
|---|---|---|
| **Fragment Development** | Creating, structuring, and mapping properties for page & form fragments | [`.agents/skills/liferay-fragment-development/SKILL.md`](./.agents/skills/liferay-fragment-development/SKILL.md) |
| **Fragment Quality Gate** | Creating, modifying, or committing any fragment (localization, themes, docs) | [`.agents/skills/fragment-quality-gate/SKILL.md`](./.agents/skills/fragment-quality-gate/SKILL.md) |
| **Fragment Linting** | Running and satisfying the fragment linter (`npm run lint`) | [`.agents/skills/liferay-fragment-linting/SKILL.md`](./.agents/skills/liferay-fragment-linting/SKILL.md) |
| **Backward-Compat Build** | Packaging fragment ZIP collections across Liferay versions (3-target build) | [`.agents/skills/backward-compat-build/SKILL.md`](./.agents/skills/backward-compat-build/SKILL.md) |
| **Compat Transform** | Extending build-time configuration compatibility transforms using `jq` | [`.agents/skills/liferay-compat-transform/SKILL.md`](./.agents/skills/liferay-compat-transform/SKILL.md) |
| **E2E Verification** | Running Playwright E2E tests, verifying rendering, or checking results | [`.agents/skills/e2e-verification/SKILL.md`](./.agents/skills/e2e-verification/SKILL.md) |
| **E2E Bootstrap** | Zipping, seeding, and bootstrapping fragments and mock data for E2E | [`.agents/skills/fragment-e2e-bootstrap/SKILL.md`](./.agents/skills/fragment-e2e-bootstrap/SKILL.md) |
| **Screenshot Creation** | Capturing, verifying, and committing fragment screenshots | [`.agents/skills/fragment-screenshot-creation/SKILL.md`](./.agents/skills/fragment-screenshot-creation/SKILL.md) |
| **Visual Gallery** | Updating responsive fragment visual gallery markdown | [`.agents/skills/liferay-visual-gallery/SKILL.md`](./.agents/skills/liferay-visual-gallery/SKILL.md) |
| **Fragment Orchestrator** | Multi-phase fragment lifecycle routing | [`.agents/skills/fragment-orchestrator/SKILL.md`](./.agents/skills/fragment-orchestrator/SKILL.md) |
| **GitHub Workflow** | Creating branches, PRs, auto-merge, or running `git` / `gh` CLI commands | [`.agents/skills/github-workflow/SKILL.md`](./.agents/skills/github-workflow/SKILL.md) |
| **Issue Tracking** | Planning work, creating/closing GitHub issues with `gh-issue-sync.cjs` | [`.agents/skills/issue-tracking/SKILL.md`](./.agents/skills/issue-tracking/SKILL.md) |
| **Documentation Maintenance** | Reviewing docs, keeping guides in sync, and updating timestamp footers | [`.agents/skills/docs-maintenance/SKILL.md`](./.agents/skills/docs-maintenance/SKILL.md) |
| **Sequential Workflows** | Executing ordered multi-phase tasks (scaffold → lint → build → test → doc) | [`.agents/skills/sequential-workflows/SKILL.md`](./.agents/skills/sequential-workflows/SKILL.md) |
| **Multi-Agent Collaboration** | Coordinating concurrent or hierarchical subagents | [`.agents/skills/multi-agent-collaboration/SKILL.md`](./.agents/skills/multi-agent-collaboration/SKILL.md) |
| **Tech Debt** | Spotting and recording code smells, duplication, or over-complexity | [`.agents/skills/tech-debt/SKILL.md`](./.agents/skills/tech-debt/SKILL.md) |
| **No Assumptions** | Always active — verifying code and configuration before answering | [`.agents/skills/no-assumptions/SKILL.md`](./.agents/skills/no-assumptions/SKILL.md) |

---

## Global Rules

> [!CAUTION]
> **No Assumptions (Anti-Hallucination Rule) — Always Active**
> Before making any technical statement about how code, a file, an API, or a configuration behaves, execute `view_file`, `grep_search`, or `run_command` to inspect the source. Do not formulate answers on assumption.

- **Mandatory Documentation Timestamps**: Every `.md` file created or modified must end with:
  ```markdown
  <!-- markdownlint-disable MD049 -->
  ---
  *Last Updated: YYYY-MM-DD* | *Last Reviewed: YYYY-MM-DD*
  ```
- **DRY & Tech-Debt Recording**: Check for existing utilities before writing new helpers. If technical debt is identified, log it via the issue tracking workflow.

---

## Current Work State

- **Platform Target**: Liferay DXP `2026.q1.11-lts` (LPD-91054 fixed).
- **In Flight**:
  - Run full E2E suite (`./scripts/test-runner.sh`) using native `--fix-permissions` from LDM `v2.15.22-pre.25`.
  - Inspect Group B fragment rendering and DOM failures (Issue #187).
  - Resolve missing mock assets (`parallax_hero_bg.png` in `e2e-tests/assets/`).

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-08-14* | *Last Reviewed: 2026-08-14*
