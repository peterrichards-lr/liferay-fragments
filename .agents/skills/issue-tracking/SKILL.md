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

For each issue, the contributor must:

1. Analyse the requirements against the current codebase.
2. Write a step-by-step **Implementation Plan** as part of the issue body or as
   a linked comment before the first commit.

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
