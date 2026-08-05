# Template Reference

This repo's AI-agent governance files (`.agents/AGENTS.md`, `gemini.md`, `CONTRIBUTING.md`) were established independently and have no automated relationship to any other repo. `ai-agent-template` (https://github.com/peterrichards-lr/ai-agent-template) is maintained as the shared "lessons learned" reference for AI-agent rules across the Liferay tooling repos, but nothing here pulls updates from it automatically. This file is a manual checkpoint so drift gets tracked deliberately instead of silently.

**Reference repo**: <https://github.com/peterrichards-lr/ai-agent-template>
**Reference version at last check**: `v1.2.0` (origin/main @ `83b1cf2`, 2026-08-01)
**Last checked**: 2026-08-05

## Known drift as of this check

- [#203](https://github.com/peterrichards-lr/liferay-fragments/issues/203) — `.agents/skills/github-workflow/SKILL.md` misdescribes the real pre-commit hook (wrong secret-scan tool name, wrong step order, missing steps), traced to a stale refactor spec copied in verbatim; separately, 7 of 17 skill files were never retrofitted with the `Last Updated`/`Last Reviewed` footer.

## Skills available in the reference repo (for comparison; not all apply here)

`coding-standards`, `documentation`, `github-workflow`, `human-in-the-loop`, `multi-agent-orchestration`, `reflection-and-planning`, `release-management`, `rule-adherence`, `tool-use-react`, `unit-testing`

## How to use this file

Before writing a new agent rule here, check whether `ai-agent-template` already documents a corrected/newer version of the same rule. If you find and fix a real process bug in this repo, consider whether the same lesson belongs in `ai-agent-template` too, so future repos don't inherit the same bug.

Update the "Last checked" date and the drift list above whenever this comparison is repeated.

---

_Last Updated: 2026-08-05_ | _Last Reviewed: 2026-08-05_
