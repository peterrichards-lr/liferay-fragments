---
name: no-assumptions
description: >
  This skill is ALWAYS active. It is a foundational behavioural constraint
  that applies to every task, every skill, and every response. It expressly
  forbids making any unverified technical statement about this repository —
  how a system behaves, what a file contains, what an API does, or what a
  value is — without first reading the actual code or documentation.
---

# No Assumptions (Anti-Hallucination Rule)

> [!CAUTION]
> This rule is **always active**. It cannot be waived, overridden, or
> suspended by any other skill, task instruction, or time pressure. It applies
> to every statement, explanation, and conclusion made during any task.

## The Rule

**Any technical statement, explanation, or conclusion MUST be strictly based
on actual, referenceable code or documentation read during the current
session.**

You are expressly forbidden from:

- Describing how a system, function, or fragment behaves without reading its
  source code.
- Claiming that a file, path, variable, API endpoint, or configuration key
  exists without verifying it with a search or file read.
- Asserting what a default value, data type, or schema field is without
  reading `configuration.json`, `GEMINI.md`, or the relevant skill file.
- Summarising what a previous change did without reading the actual diff or
  commit.
- Stating that a fix worked without verifying the result via test output, a
  file read, or a command run.

## Prohibited Patterns

The following phrasing patterns are **red flags** indicating an unverified
assumption. Do not use them without evidence:

| Prohibited pattern | Why it is dangerous |
|---|---|
| *"This should work because…"* | Predicts behaviour without verification |
| *"That file probably contains…"* | Guesses file contents |
| *"The API likely returns…"* | Assumes API behaviour |
| *"As mentioned earlier…"* (without re-reading) | Relies on unreliable memory |
| *"This is the standard Liferay approach"* | Asserts platform behaviour without a source |
| *"I believe the default is…"* | Guesses a configuration value |

## Mandatory Verification Actions

Before making any technical claim, use one of these verification methods:

| Claim type | Verification action |
|---|---|
| File exists / has specific content | `view_file` or `grep_search` |
| API endpoint path or response shape | Read the relevant skill file or `GEMINI.md` |
| Fragment behaviour or config field | Read `configuration.json`, the FTL/JS source, or `docs/fragments/` |
| Build script behaviour | Read `scripts/create-fragment-zips.sh` or the relevant skill |
| Previously implemented change | Read the git diff or commit message |
| Liferay platform behaviour | Read `GEMINI.md`, `docs/automated-testing.md`, or a cited issue (e.g. LPD-XXXXX) |
| Test result | Read the actual test output from the terminal or log file |

## Handling Genuine Uncertainty

If verification resources are unavailable (e.g. a file cannot be read, a
command fails, or the information is not in this repository), the correct
response is to **state the uncertainty explicitly** rather than guess:

> "I cannot verify this without reading `<file>`. Based on the pattern I can
> see in `<related-file>`, I expect `X` — but please confirm before acting on
> this."

This is always preferable to a confident but unverified statement.

## Scope

This rule applies to:

- All code explanations and summaries
- All debugging hypotheses and root-cause analyses
- All configuration recommendations
- All statements about Liferay platform behaviour
- All claims about what a previous change accomplished
- All assertions about what tests do or do not cover

It does **not** prohibit reasonable inference when evidence is present — it
prohibits confident statements when no evidence has been consulted.

## Reference

This rule exists because hallucinated statements in a codebase context cause
real harm: incorrect fixes, wasted debugging time, and false confidence in
broken implementations. Read first. Speak second.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-20* | *Last Reviewed: 2026-07-20*
