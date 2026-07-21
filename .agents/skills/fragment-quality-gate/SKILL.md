---
name: fragment-quality-gate
description: >
  Activate this skill whenever you are creating, modifying, or committing a
  Liferay fragment. It enforces the three project-level quality rules that
  every fragment must satisfy before it can be committed: localization
  coverage, documentation completeness, and theme fidelity (no hardcoded
  colours).
---

# Fragment Quality Gate Rules

All fragments **must** pass these three checks before being committed. The
`npm run lint` command (`scripts/lint-fragments.js`) enforces them
automatically as part of the pre-commit hook.

> [!CAUTION]
> **ACTIVE CONSTRAINT — Lint Gate Before Any Fragment Commit**
>
> **TRIGGER**: Before committing, staging, or opening a PR that includes any
> change to a fragment file (JS, CSS, FTL, HTML, `configuration.json`,
> `Language_en_US.properties`, or documentation).
>
> **MANDATORY**: Execute the following command NOW:
> ```bash
> npm run lint
> ```
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> running `git commit`, `git push`, or `gh pr create` until the lint output
> is in your context in the next turn and shows **zero errors**. If errors
> are present, fix them before proceeding.

## Rule 1 — Localization Coverage

Every property key and display value defined in a fragment's
`configuration.json` **must** have a corresponding entry in the root
collection `Language_en_US.properties` file.

This includes:
- All `label` values
- All `description` values
- All `validValues[].label` entries within select/radio fields

> [!IMPORTANT]
> Per-fragment `Language_en_US.properties` files are **not** supported.
> Localization keys must live in the collection-level file only (e.g.
> `form-fragments/Language_en_US.properties`).

**Failure mode**: The linter will report `Missing i18n key: <key>` for any
key present in `configuration.json` but absent from the properties file.

## Rule 2 — Documentation Completeness

Every fragment folder **must** have an accompanying Markdown documentation
file at:

```
docs/fragments/<collection-name>/<fragment-name>.md
```

The documentation file must include at minimum:

- **Overview** — what the fragment does and when to use it
- **Configuration** — description of every configurable field
- **Usage** — example placement and any dependencies

> [!NOTE]
> The linter checks for the existence of the documentation file and will
> error if it is missing. It also validates that all relative links and image
> paths within the file resolve correctly.

## Rule 3 — Theme Fidelity (No Hardcoded Colours)

Fragments **must not** contain hardcoded colour values (hex codes, `rgb()`,
`hsl()`, named colours) in their CSS. All colours must reference safe
Meridian design tokens via CSS custom properties.

**Approved token examples**:

| Token | Usage |
|---|---|
| `var(--primary)` | Primary brand colour |
| `var(--body-color)` | Default text colour |
| `var(--border-color)` | Default border colour |
| `var(--light)` | Light background |
| `var(--gray-400)` | Muted grey |

See [`docs/THEMES.md`](../../docs/THEMES.md) for the full list of safe tokens
and their per-theme values (Meridian, Liferay Dialect, Classic).

**Failure mode**: The linter will report `Hardcoded color found: <value>` for
any CSS property value that is not a `var(--...)` reference.

## Running the Quality Gate

```bash
# Run the full linter (runs automatically on pre-commit)
npm run lint

# Check a specific collection only
node scripts/lint-fragments.js --collection form-fragments
```

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
