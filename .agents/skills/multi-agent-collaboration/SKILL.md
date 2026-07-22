---
name: multi-agent-collaboration
description: >
  Activate this skill when a task is large enough to benefit from splitting
  work across concurrent or hierarchical subagents — for example, running
  research and implementation in parallel, or delegating lint/test execution
  to a background agent while the coordinator continues planning. It defines
  the collaboration patterns, spawn constraints, output integration rules,
  and conflict resolution protocol.
---

# Multi-Agent Collaboration

## When to Use This Skill

Invoke a subagent when **all three** of the following are true:

1. The task has a clearly separable sub-task that does not depend on the
   coordinator's current in-progress work.
2. The sub-task would clutter the coordinator's context window with output
   that is not immediately needed.
3. The sub-task has a well-defined, verifiable output that can be handed
   back to the coordinator.

Do **not** spawn a subagent for trivial lookups or single-file reads —
these are faster done inline.

---

## Collaboration Patterns

### Pattern A — Coordinator / Research Worker

Use when the coordinator needs broad codebase research before it can plan.

```
Coordinator
  └─► Research Worker (read-only)
        └─► Returns: file contents, grep results, API shape
  ◄── Coordinator resumes planning with research in context
```

**Spawn command (conceptual)**:
```
invoke_subagent(TypeName="research", Role="Codebase Researcher",
  Prompt="Read <files> and return full contents of each...")
```

**Coordinator constraint**:
> [!CAUTION]
> **ACTIVE CONSTRAINT — Research Completion Gate**
>
> **TRIGGER**: After spawning a research subagent.
>
> **MANDATORY**: Do NOT poll. Stop calling tools and end your turn.
> The system will wake you when the subagent reports back.
>
> **BLOCK**: You are FORBIDDEN from making any technical claim about the
> researched code until the subagent's response is in your context.

---

### Pattern B — Coordinator / Parallel Workers

Use when multiple independent sub-tasks can run concurrently (e.g.
linting collection A while scaffolding collection B).

```
Coordinator
  ├─► Worker 1 (e.g. lint form-fragments)
  └─► Worker 2 (e.g. lint gemini-fragments)
       └─► Both report back independently
  ◄── Coordinator integrates results
```

> [!IMPORTANT]
> Parallel workers MUST operate on **non-overlapping file sets**. Two
> workers writing to the same file will cause a merge conflict. Define
> their scope explicitly in the spawn prompt.

**Coordinator constraint**:
> [!CAUTION]
> **ACTIVE CONSTRAINT — Parallel Worker Scope Gate**
>
> **TRIGGER**: Before spawning more than one worker subagent.
>
> **MANDATORY**: List every file each worker will read or write. Confirm
> zero overlap between worker file sets before spawning.
>
> **BLOCK**: End your turn after spawning. Do NOT poll workers. The system
> will notify you when each one reports. Wait for ALL workers to report
> before integrating outputs.

---

### Pattern C — Coordinator / Sequential Delegator

Use when a long pipeline (see `sequential-workflows/SKILL.md`) should be
delegated to a self-contained subagent that manages its own phase gates.

```
Coordinator
  └─► Pipeline Subagent (self-contained)
        Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
        └─► Returns: summary of results, PR number or error
```

**Use case**: "Run the full fragment scaffold-to-PR pipeline for
`meter-reading` in the `form-fragments` collection."

**Coordinator constraint**:
> [!CAUTION]
> **ACTIVE CONSTRAINT — Pipeline Delegation Gate**
>
> **TRIGGER**: Before spawning a pipeline subagent.
>
> **MANDATORY**: Write the full pipeline prompt including:
> - Fragment name, collection, type
> - Field definitions
> - Which phases to include (all five, or a named subset)
> - The target Liferay version for the build
>
> **BLOCK**: End your turn after spawning. Do NOT begin any other work on
> the same fragment or collection until the pipeline subagent reports back.
> Its output (PR number, lint errors, E2E result) determines next actions.

---

## Output Integration Rules

When a subagent reports back, the coordinator MUST:

1. **Read the full response** — do not summarise from memory.
2. **Verify the claimed output** — if the subagent says "lint passed",
   the coordinator must see the lint output in the message, not just
   accept the claim.
3. **Resolve conflicts before merging** — if parallel workers produced
   conflicting edits, the coordinator must read both sets of changes and
   produce a single merged version. Do not silently pick one.

---

## Conflict Resolution Protocol

If two parallel workers edited the same file (a scope violation):

1. Do **not** attempt an automatic merge.
2. Read both versions using `view_file` on the relevant branches.
3. Produce a manually reconciled version and commit it on the coordinator's
   branch.
4. Raise a tech-debt issue noting the scope violation for future prevention.

---

## Subagent Spawn Reference

| Use case | TypeName | Workspace |
|---|---|---|
| Read-only research / file survey | `research` | `inherit` |
| Full pipeline execution (isolated) | `self` | `branch` |
| Parallel lint / build workers | `self` | `branch` |
| Documentation writer | `self` | `inherit` |

> [!NOTE]
> Use `Workspace="branch"` when the subagent will make file edits.
> Use `Workspace="inherit"` for read-only tasks to avoid unnecessary
> workspace cloning overhead.

---

## Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|---|---|
| Spawning a subagent for a single `view_file` call | Slower than inline; wastes context |
| Two workers writing to the same collection | Guaranteed merge conflict |
| Coordinator continues work while waiting for subagent | Creates race conditions on shared files |
| Accepting a subagent's verbal claim without seeing its evidence | Violates the no-assumptions rule |
| Polling subagent status in a loop | Wastes tool calls; system notifies automatically |

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-22* | *Last Reviewed: 2026-07-22*
