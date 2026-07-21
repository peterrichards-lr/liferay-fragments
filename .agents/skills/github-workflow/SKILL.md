---
name: github-workflow
description: >
  Activate this skill whenever you are creating a branch, opening a Pull
  Request, merging code, or performing any Git / GitHub CLI operation in the
  liferay-fragments repository. It enforces branch naming conventions,
  pre-commit validation gates, the PR auto-merge protocol, and the code-review
  requirement.
---

# GitHub Workflow Rules

## 1. Branch Naming Conventions

> [!CAUTION]
> **ACTIVE CONSTRAINT — Branch State Verification**
>
> **TRIGGER**: Before creating any new branch.
>
> **MANDATORY**: Execute the following commands NOW:
> ```bash
> git status
> git log --oneline -5
> ```
>
> **BLOCK**: End your turn after the tool calls. You are FORBIDDEN from
> naming or creating a branch until you have confirmed in the next turn that
> you are on `main`, your working tree is clean, and you have read the recent
> commit history.

All work must be done on short-lived branches branched from `main`. Use the
following scope prefixes:

| Prefix | Purpose |
|---|---|
| `feat/...` | New features or page fragments |
| `fix/...` | Bug fixes or stylesheet adjustments |
| `docs/...` | Documentation-only updates |
| `refactor/...` | Code restructuring with no behaviour change |
| `ci/...` | Changes to GitHub Actions or build pipelines |

**Direct pushes to `main` are blocked by branch protection rules.**

## 2. Pre-Commit Validation Gates

The local `.git/hooks/pre-commit` hook runs automatically on every `git commit`
and enforces the following checks in order:

1. **`gitleaks`** — scans staged files for hardcoded credentials or secrets.
2. **`prettier`** — formats staged HTML, CSS, JS, and JSON files in place.
3. **Dependency sync** (`scripts/initialize-build-config.js`) — ensures all
   collection `fragment-build.json` files are up to date.
4. **Fragment Quality Gate** (`npm run lint`) — enforces schema validation,
   localization coverage, field integrity, and theme fidelity.

> [!IMPORTANT]
> Only use `git commit --no-verify` when committing documentation-only changes
> that cannot affect fragment schemas or build configs. Never bypass for code.

## 3. Pull Request Protocol

Open every PR via the GitHub CLI immediately after pushing the branch:

```bash
gh pr create \
  --title "feat: <short description>" \
  --body "<detail>\n\nCloses #<issue-number>" \
  --head <branch_name> \
  --base main
```

Then immediately enable auto-merge with squash strategy:

```bash
gh pr merge <pr_number> --auto --squash --delete-branch
```

> [!IMPORTANT]
> Every PR body **MUST** contain a `Closes #<id>` or `Addresses #<id>` keyword
> linking it to its corresponding GitHub Issue. PRs without an issue link will
> be rejected.

### Pre-PR Gate

> [!CAUTION]
> **ACTIVE CONSTRAINT — Mandatory Pre-PR Verification**
>
> **TRIGGER**: Before executing `gh pr create` for any branch.
>
> **MANDATORY**: Execute ALL of the following steps NOW, in order. Each step
> requires a tool call followed by ending your turn before proceeding.
>
> ---
>
> **Step 1 — Issue Verification (MUST run first)**
>
> Identify every issue number you intend to close with this PR. For **each**
> issue number, execute:
> ```bash
> gh issue view <number> --json number,title,state,body
> ```
>
> **BLOCK**: End your turn after each `gh issue view` call. You are FORBIDDEN
> from proceeding until the issue output is in context and you have confirmed:
>
> - [ ] The issue **exists** (command did not return a 404/error)
> - [ ] The issue **state is `OPEN`** (not already closed by another PR)
> - [ ] The issue body contains a **Description** section
> - [ ] The issue body contains an **Analysis** section (root cause, approach,
>       or how to resolve/implement the change)
> - [ ] The issue body contains an **Implementation Plan** section (step-by-step
>       actions)
>
> If any section is missing, update the issue body before proceeding:
> ```bash
> gh issue edit <number> --body "<updated body with all required sections>"
> ```
>
> > [!NOTE]
> > A single PR may close multiple issues where it makes logical sense — for
> > example, closing the last sub-issue of an epic simultaneously closes the
> > parent epic. List all issue numbers with `Closes #X` / `Closes #Y` in the
> > PR body. Each linked issue must individually pass this verification.
>
> ---
>
> **Step 2 — Branch Sync**
> ```bash
> git fetch origin main
> git status
> git log --oneline origin/main..HEAD   # shows commits ahead of main
> git log --oneline HEAD..origin/main   # shows commits you are BEHIND main
> ```
> If the "behind" output is non-empty, the branch is stale. Execute:
> ```bash
> git rebase origin/main
> ```
> If the rebase reports conflicts, resolve them before proceeding. You are
> FORBIDDEN from opening a PR on a branch that is behind `origin/main`.
>
> **Step 3 — Diff Check**
> ```bash
> git diff --stat main
> ```
> Confirm the diff contains only the intended files.
>
> **Step 4 — Lint**
> ```bash
> npm run lint
> ```
> Confirm lint exits with zero errors.
>
> **Step 5 — Docs Review**
> Read the **Documentation Maintenance** skill and execute its Step 1
> file-enumeration constraint before declaring docs complete.
> → [`docs-maintenance/SKILL.md`](docs-maintenance/SKILL.md)
>
> ---
>
> **BLOCK**: You are FORBIDDEN from running `gh pr create` until ALL five
> steps are complete and show:
> - Every linked issue exists, is open, and has Description + Analysis +
>   Implementation Plan sections
> - Branch is at or ahead of `origin/main` (zero commits behind)
> - Diff contains only the intended files
> - Lint exits with zero errors
> - Every affected document has been reviewed and its timestamp updated

## 4. Post-Merge Local Synchronisation

After a PR is merged, return to `main` and pull:

```bash
git checkout main && git pull origin main
```

Never start new work from a stale local `main`.

## 5. Code Review Gate

Every PR **must** be reviewed and approved by at least one other contributor
(human or agent) before it is merged. Auto-merge will queue the merge but will
not proceed until the required status checks pass:

- `Lint Fragments` workflow
- `Playwright Tests (LDM)` workflow (when applicable)

## 6. Failed CI Check Recovery

> [!CAUTION]
> **ACTIVE CONSTRAINT — Delete Failed Run Records After Fixing a CI Failure**
>
> **TRIGGER**: After pushing a fix commit that addresses a GitHub Actions check
> failure on any PR branch.
>
> **MANDATORY — Step 1: Verify the fix is passing**
>
> Wait for the new run to complete, then confirm it is green:
> ```bash
> gh run list --branch <branch-name> --limit 5
> ```
> End your turn. You are FORBIDDEN from deleting any runs until you have
> confirmed in the next turn that at least one run shows `completed` /
> `success` status for the fix commit.
>
> **MANDATORY — Step 2: Enumerate all failed runs for this branch**
>
> Once the fix is confirmed passing, find every failed run:
> ```bash
> gh run list --branch <branch-name> --status failure --json databaseId,name,conclusion \
>   --jq '.[] | "\(.databaseId)  \(.name)  \(.conclusion)"'
> ```
> End your turn after this command. You are FORBIDDEN from proceeding until
> the failed run IDs are in your context.
>
> **MANDATORY — Step 3: Delete each failed run**
>
> For every run ID returned in Step 2, execute:
> ```bash
> gh run delete <run-id>
> ```
> Run this once per failed run. End your turn after each deletion.
>
> **MANDATORY — Step 4: Confirm clean history**
>
> After all deletions, verify no failed runs remain:
> ```bash
> gh run list --branch <branch-name> --status failure
> ```
>
> **BLOCK**: You are FORBIDDEN from declaring the PR fix complete until this
> command returns an **empty list**. Only runs on the current branch are
> deleted — do not delete runs from `main` or other branches.
>
> > [!NOTE]
> > **Why this matters**: Failed CI runs are our signal that corrective action
> > is needed. Once the fix is merged and verified, retaining failure records
> > creates noise that obscures the true signal. A clean, all-green run history
> > means every visible failure is an active, unresolved issue — not a resolved
> > one that was already addressed.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*



