---
name: no-assumptions
description: >
  This skill is ALWAYS active. It is a foundational behavioural constraint
  that applies to every task, every skill, and every response. It expressly
  forbids making any unverified technical statement about this repository —
  how a system behaves, what a file contains, what an API does, or what a
  value is — without first executing a verification tool and waiting for the
  result.
---

# No Assumptions (Anti-Hallucination Rule)

> [!CAUTION]
> This rule is **always active**. It cannot be waived, overridden, or
> suspended by any other skill, task instruction, or time pressure. It applies
> to every statement, explanation, and conclusion made during any task.

## The Core Constraint

**Any technical statement, explanation, or conclusion MUST be strictly based
on actual, referenceable code or documentation read during the current
session.**

You are expressly forbidden from describing how a system behaves, claiming a
file or value exists, or asserting what an API does based on training-data
memory. Evidence must exist in your current context window — loaded by a tool
call made in this session.

---

## Active Constraint — Verify Before You Speak

> [!CAUTION]
> **ACTIVE CONSTRAINT — Mandatory Verification Before Any Technical Claim**
>
> **TRIGGER**: Before making any technical statement about how code works,
> what a file contains, what an API returns, what a default value is, or what
> a previous change accomplished.
>
> **MANDATORY**: Identify the claim type from the table below and execute the
> corresponding tool call NOW — before writing a single word of your answer.
>
> **BLOCK**: After executing the tool, you MUST end your turn and wait for the
> result. You are FORBIDDEN from formulating or writing your answer until the
> tool output is loaded into your context window in the next turn.

| Claim type | Mandatory tool execution |
|---|---|
| File exists or has specific content | `grep_search` or `view_file` on the exact path |
| API endpoint path or response shape | `view_file` on the relevant skill file or `GEMINI.md` |
| Fragment behaviour or config field | `view_file` on `configuration.json`, the FTL/JS source, or `docs/fragments/` |
| Build script behaviour | `view_file` on `scripts/create-fragment-zips.sh` or the relevant skill |
| Previously implemented change | `run_command`: `git show <hash> --stat` or `git diff HEAD~1` |
| Liferay platform behaviour | `view_file` on `GEMINI.md` or `docs/automated-testing.md` |
| Test result or pass/fail status | `view_file` on the actual log file or test report |

---

## Prohibited Patterns

The following phrasing is **forbidden** because it signals an unverified
assumption. If you find yourself writing any of these, stop, execute the
appropriate tool, end your turn, and answer only after the result is in
context:

| Forbidden pattern | Why it is prohibited |
|---|---|
| *"This should work because…"* | Predicts behaviour without evidence |
| *"That file probably contains…"* | Guesses file contents |
| *"The API likely returns…"* | Assumes API behaviour |
| *"As mentioned earlier…"* (without re-reading) | Relies on unreliable in-context memory |
| *"This is the standard Liferay approach"* | Asserts platform behaviour without a cited source |
| *"I believe the default is…"* | Guesses a configuration value |
| *"The fix worked"* (without reading output) | Claims a result without verification |

---

## Handling Genuine Uncertainty

If the required file cannot be read or the command fails, the correct response
is to **state the uncertainty explicitly** — never guess:

> "I cannot verify this without reading `<file>`. I will not speculate.
> Please confirm, or grant me access so I can verify it directly."

---

## Scope

This constraint applies to every response, in every skill, without exception:

- Code explanations and architecture summaries
- Debugging hypotheses and root-cause analyses
- Configuration recommendations
- Statements about Liferay platform behaviour
- Claims about what a previous change accomplished
- Assertions about test coverage

Reasonable inference *from evidence already in context* is permitted.
Confident assertion *without having consulted any evidence* is forbidden.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
