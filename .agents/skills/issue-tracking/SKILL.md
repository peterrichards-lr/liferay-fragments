---
name: issue-tracking
description: >
  Activate this skill whenever you are planning a new feature, bug fix,
  enhancement, or any tracked piece of work. It mandates issue-first
  development and prescribes the exact workflow for creating, syncing, and
  closing GitHub Issues using the gh-issue-sync.cjs automation tool.
---

# Issue Tracking Rules

## 1. Issue-First Mandate

> [!IMPORTANT]
> Every bug, enhancement, or feature request **MUST** be recorded as a GitHub
> Issue **before** any development work begins. Writing code without a
> corresponding issue is not permitted.

### Mandatory Issue Content

> [!CAUTION]
> **ACTIVE CONSTRAINT — Issue Content Completeness**
>
> **TRIGGER**: Before creating any GitHub Issue (via `gh issue create`,
> `gh-issue-sync.cjs`, or `gh issue edit`).
>
> **MANDATORY**: Confirm the issue body contains ALL three required sections.
> If any section is absent, add it before saving the issue.
>
> **BLOCK**: End your turn after creating or editing the issue. You are
> FORBIDDEN from beginning any implementation work until you have read back
> the issue body (via `gh issue view <number> --json body`) in the next turn
> and confirmed all three sections are present.

Every issue body **MUST** contain the following three sections:

#### 1. Description

What is the problem, change, or request? Provide enough context for any
contributor to understand the scope without needing to ask.

```markdown
## Description

<Clear statement of the problem or desired change. Include relevant
behaviour, error messages, or user-facing impact.>
```

#### 2. Analysis

How does this affect the codebase? What is the root cause (for bugs) or
the technical approach (for features/enhancements)?

```markdown
## Analysis

<Root cause identification, affected files/components, constraints,
or chosen approach with rationale.>
```

#### 3. Implementation Plan

A step-by-step list of the concrete actions required to resolve the issue.
This does not need to be exhaustive, but must be specific enough to act on.

```markdown
## Implementation Plan

1. <First concrete action>
2. <Second concrete action>
3. <...>
```

> [!NOTE]
> For Epic issues created via `gh-issue-sync.cjs`, embed all three sections
> in the `"body"` field of the JSON plan file before running the sync.

## 2. Tool: `gh-issue-sync.cjs`

All issue creation and lifecycle management is handled by the automated
JSON-driven sync tool:

- **Script**: `scripts/gh-issue-sync.cjs`
- **Schema reference**: `scripts/issues.sample.json`

The tool creates Epics and sub-issues on GitHub, automatically links
sub-issues to their parent Epic, and closes completed issues with a reference
to the current git commit hash.

## 3. Issue Tracking Workflow

Follow this three-step process for every feature or fix:

### Step 1 — Plan & Draft

Create a temporary JSON plan file (e.g. `scripts/feature-xyz-plan.json`)
following the schema in `scripts/issues.sample.json`:

```json
{
  "title": "[Epic] Your Epic Title",
  "body": "Detailed epic description.",
  "labels": ["enhancement"],
  "issues": [
    {
      "title": "Sub-Issue #1: Task description",
      "body": "Steps and acceptance criteria.",
      "completed": false,
      "labels": ["enhancement"]
    }
  ]
}
```

### Step 2 — Dry Run

> [!CAUTION]
> **ACTIVE CONSTRAINT — Mandatory Dry Run Before Live Issue Creation**
>
> **TRIGGER**: Before executing `gh-issue-sync.cjs` without the `--dry-run`
> flag.
>
> **MANDATORY**: Execute the dry-run command NOW:
> ```bash
> node scripts/gh-issue-sync.cjs scripts/<plan-file>.json --dry-run
> ```
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> running the live sync until the dry-run output is in your context in the
> next turn and you have confirmed that all issue titles, bodies, and labels
> are correct.

### Step 3 — Apply & Link

Generate the Epic and sub-issues on GitHub:

```bash
node scripts/gh-issue-sync.cjs scripts/feature-xyz-plan.json
```

The script automatically links all sub-issues to the parent Epic.

## 4. Completing and Closing Issues

As you complete individual sub-issues:

1. Update the JSON plan file, changing the sub-issue's `"completed"` property
   to `true`.
2. Execute the sync utility again:

```bash
node scripts/gh-issue-sync.cjs scripts/feature-xyz-plan.json
```

The utility will:
- Post a reference comment on the issue with the current git commit hash.
- Close the issue on GitHub automatically.

## 5. PR Linking Requirement

All Pull Requests **must** link back to their issue using `Closes #<id>` or
`Addresses #<id>` in the PR body. This ensures automatic issue closure when
the PR is merged and maintains a clean audit trail.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
