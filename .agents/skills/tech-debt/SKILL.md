---
name: tech-debt
description: >
  Activate this skill whenever you encounter code smells, excessive complexity,
  duplication, or any other technical debt signal during your work — regardless
  of what your primary task is. It mandates recording tech debt as a labelled
  GitHub Issue and defines a clear threshold for whether to fix it inline or
  defer it.
---

# Tech Debt Detection & Recording Rules

> [!IMPORTANT]
> This is an **active rule**, not advisory guidance. Whenever you encounter a
> tech debt signal during any task, you **MUST** raise a GitHub Issue labelled
> `tech debt` before moving on. Recording the debt is mandatory. Fixing it
> immediately is optional and subject to the inline-fix threshold below.

## 1. What Qualifies as Tech Debt

Raise an issue for any of the following signals encountered during your work:

| Category | Examples |
|---|---|
| **Code smells** | Functions >50 lines, deeply nested conditionals (>3 levels), magic numbers/strings, boolean parameter flags |
| **Duplication** | The same logic copied across two or more fragments, scripts, or modules |
| **Over-complexity** | A solution that is significantly harder to understand than the problem it solves; unnecessary abstraction layers |
| **Fragile coupling** | A fragment or script that relies on undocumented internal behaviour of another component |
| **Missing safety guards** | A `?number` FreeMarker conversion without a `?has_content` guard; an API call without error handling |
| **Missing tests** | Logic that has no corresponding E2E or unit test coverage |
| **Security hygiene** | A token, credential, or secret that is hardcoded or committed (even if benign-looking) |
| **Deprecated patterns** | Usage of `/api/jsonws`, the legacy `Module` reference type, or any API flagged as prohibited in `GEMINI.md` |
| **Configuration drift** | A `configuration.json` field whose `dataType` or `defaultValue` does not match the canonical schema |
| **Documentation debt** | A fragment, script, or architectural pattern with no documentation at all |

## 2. Inline-Fix Threshold

Before deciding whether to fix or defer, apply this decision:

```
Is the fix:
  ✅ Low effort (≤ ~10 lines of targeted change)?
  ✅ Zero risk of introducing a regression in the primary task?
  ✅ Fully self-contained (no cascading changes required)?

→ ALL THREE YES: Fix inline, then still raise a closed issue referencing the fix commit.
→ ANY ONE NO:    Record the issue and continue with the primary task.
```

> [!WARNING]
> Do **not** let tech debt remediation divert you from the primary task when
> any one of the three conditions above is not met. Record it and move on.

## 3. Mandatory Issue Format

Every tech debt issue **must** follow this format:

### Title

```
tech-debt(<scope>): <one-line description of the smell>
```

**Examples**:
- `tech-debt(meter-reading): magic number 60 hardcoded in scroll threshold`
- `tech-debt(global-setup): duplicated retry loop in three separate functions`
- `tech-debt(create-fragment-zips.sh): jq transform for pre2025q3 exceeds 80 lines — split into function`

### Body Template

```markdown
## Location

File(s): `<relative path(s)>`
Lines: `<line range or function name>`

## Smell / Problem

<One paragraph describing what the issue is and why it is a problem.>

## Suggested Remedy

<Brief description of the preferred fix. Does not need to be exhaustive.>

## Impact if Left Unresolved

<What breaks, degrades, or becomes harder to maintain over time.>

## Detected During

Task: <brief description of the primary task being performed when this was spotted>
```

### Labels

Always apply **both**:
- `tech debt`
- The most appropriate secondary label from: `bug`, `enhancement`, `investigation`

### CLI Command

```bash
gh issue create \
  --title "tech-debt(<scope>): <description>" \
  --label "tech debt" \
  --label "<secondary-label>" \
  --body "<body using template above>"
```

## 4. Inline Fix — Closing the Issue

If you apply the inline fix:

1. Make the fix as part of the current branch/commit.
2. Raise the issue using the format above.
3. Close it immediately with a comment referencing the commit:

```bash
gh issue close <number> \
  --comment "Fixed inline in commit $(git rev-parse --short HEAD) as part of <primary task description>."
```

## 5. When NOT to Raise an Issue

Do **not** raise a tech debt issue for:

- A style preference that has no impact on correctness or maintainability.
- Something already tracked in an open GitHub Issue (check first with
  `gh issue list --label "tech debt"`).
- Auto-generated files (e.g. `docs/GALLERY.md`, `dist/*.zip`) — debt in
  these is tracked via the generator script.

## 6. Batch Deduplication Check

> [!CAUTION]
> **ACTIVE CONSTRAINT — Deduplication Search Before Raising Any Issue**
>
> **TRIGGER**: Before executing `gh issue create` for any tech debt item.
>
> **MANDATORY**: Execute the following command NOW:
> ```bash
> gh issue list --label "tech debt" --state open --search "<fragment-name or filename>"
> ```
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> running `gh issue create` until the search results are in your context
> in the next turn. If an existing open issue covers the same smell, add a
> comment to that issue instead of creating a duplicate.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
