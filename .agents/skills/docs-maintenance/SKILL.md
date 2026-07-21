---
name: docs-maintenance
description: >
  Activate this skill after completing any implementation task — code change,
  configuration update, bug fix, or refactor. It mandates an active
  documentation review pass before the PR is opened, ensuring all affected
  markdown files are kept in sync with the codebase and their timestamps
  accurately reflect when they were last reviewed or changed.
---

# Documentation Maintenance Rules

> [!IMPORTANT]
> This is an **active rule**, not advisory guidance. Every implementation task
> **MUST** include a documentation review pass before opening a Pull Request.
> Skipping this step is not permitted.

## 1. When to Apply This Rule

Apply this rule **after completing any of the following**:

- A code change to a fragment (JS, CSS, FTL, HTML, `configuration.json`)
- A configuration or schema change
- A bug fix that changes observable behaviour
- A refactor that affects architecture, file layout, or APIs
- A new feature or fragment
- An E2E test, build script, or CI pipeline change

## 2. Step-by-Step Documentation Review Process

### Step 1 — Identify Affected Documents

> [!CAUTION]
> **ACTIVE CONSTRAINT — Document Enumeration**
>
> **TRIGGER**: Immediately after completing any implementation task, before
> opening a PR.
>
> **MANDATORY**: Execute the following tool calls NOW to enumerate candidate
> documents — do not rely on memory:
> ```bash
> # List all docs in scope
> ls docs/fragments/
> ls docs/
> # Search for references to the changed file or component name
> grep_search "<changed-component-name>" /Volumes/.../docs/
> ```
> Also check: `GEMINI.md`, `.agents/AGENTS.md`, any skill file whose domain
> was touched, and collection-level `README.md` files.
>
> **BLOCK**: End your turn after the tool calls. You are FORBIDDEN from
> declaring "no docs changes needed" or moving to Step 2 until the file list
> is in your context window in the next turn.

### Step 2 — Review Each Document

> [!CAUTION]
> **ACTIVE CONSTRAINT — Mandatory Document Read**
>
> **TRIGGER**: For each document identified in Step 1.
>
> **MANDATORY**: Execute `view_file` on the document NOW. Do not paraphrase
> or recall its contents from memory.
>
> **BLOCK**: End your turn after the `view_file` call. You are FORBIDDEN from
> applying Outcome A, B, or C until the document's actual content is in your
> context window in the next turn.

For every identified document, read it against the implemented change and
apply one of the three outcomes below.

---

### Outcome A — No Changes Needed, Document Was Reviewed

The document is accurate and complete. No content changes are required.

**Action**: Update the `Last Reviewed` date in the footer only. Do not change
`Last Updated`.

```markdown
<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-06-15* | *Last Reviewed: 2026-07-20*
```

> [!NOTE]
> Updating the Reviewed date is not optional when you have read the document.
> It is the record that a human or agent verified the document was current as
> of that date.

---

### Outcome B — Changes Required

The document is outdated, incomplete, or incorrect relative to the
implemented change.

**Action**: Update the document content, then update **both** `Last Updated`
and `Last Reviewed` to today's date.

```markdown
<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-20* | *Last Reviewed: 2026-07-20*
```

---

### Outcome C — No Document Exists

No markdown file currently covers the implemented change.

**Decision logic**:

1. **Is the change significant enough to warrant its own document?**
   - New fragment → create `docs/fragments/<collection>/<fragment>.md`
     (Overview, Configuration, Usage sections required).
   - New architectural pattern or integration → create a new `docs/<topic>.md`.

2. **Does it fit naturally as a section of an existing document?**
   - A new E2E workaround → add a section to `docs/automated-testing.md`.
   - A new CSS token pattern → add to `docs/THEMES.md`.
   - A resolved bug or active task → update `GEMINI.md`.

3. **Is it too minor or already implicitly covered?**
   - A one-line bug fix with no user-visible impact → no new document needed.
   - A change covered entirely by code comments → no new document needed.

When creating a new document, it **must** include the timestamp footer:

```markdown
<!-- markdownlint-disable MD049 -->
---
*Last Updated: YYYY-MM-DD* | *Last Reviewed: YYYY-MM-DD*
```

## 3. Timestamp Footer Format

All markdown files in this repository must use the following exact footer
format at the very end of the file:

```
<!-- markdownlint-disable MD049 -->
---
*Last Updated: YYYY-MM-DD* | *Last Reviewed: YYYY-MM-DD*
```

- **`Last Updated`**: The date the file content was last meaningfully changed.
- **`Last Reviewed`**: The date an agent or human last verified the content
  was accurate, even if no changes were made.

Both dates use ISO 8601 format: `YYYY-MM-DD`.

## 4. Pre-PR Documentation Checklist

Before opening a Pull Request, confirm:

- [ ] All affected documents identified (see Step 1 table)
- [ ] Each document reviewed and Outcome A, B, or C applied
- [ ] All modified or created documents included in the same commit or PR
- [ ] `Last Reviewed` updated on every document that was read
- [ ] `Last Updated` updated on every document whose content changed
- [ ] `npm run lint` passes (the linter checks for broken markdown links)

## 5. Scope Boundaries

This rule covers documentation **within this repository**. It does not apply
to:

- External wikis or Confluence pages (out of scope for this agent)
- Auto-generated files (e.g. `docs/GALLERY.md` generated by
  `scripts/generate-gallery.js` — update via the script, not manually)
- Code comments inside fragment JS/CSS/FTL files

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
