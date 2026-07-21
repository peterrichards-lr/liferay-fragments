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
> **MANDATORY**: Execute ALL of the following tool calls NOW, in order:
> 1. `run_command`: `git diff --stat main` — confirm the exact set of changed files
> 2. `run_command`: `npm run lint` — confirm zero lint errors
> 3. Read the **Documentation Maintenance** skill and execute its Step 1
>    file-enumeration constraint before declaring docs complete
>    → [`docs-maintenance/SKILL.md`](docs-maintenance/SKILL.md)
>
> **BLOCK**: End your turn after each tool call. You are FORBIDDEN from
> running `gh pr create` until ALL three outputs are in context and show:
> - The diff contains only the intended files
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

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
