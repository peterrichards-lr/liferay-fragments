---
name: fragment-orchestrator
description: Single entry point for all Liferay Fragment skills. Routes requests to specialized skills for scaffolding, linting, compatibility transformation, and E2E testing.
---

# Liferay Fragment Orchestrator

Route user requests to the appropriate specialist skill based on intent.

## Intent Router

| User Intent                                                       | Skill                   | Path                                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Create, scaffold, structure, or map properties for page fragments | Fragment Development    | [../liferay-fragment-development/SKILL.md](../liferay-fragment-development/SKILL.md)                                                 |
| Lint fragments or fix validation issues                           | Fragment Linting        | [../liferay-fragment-linting/SKILL.md](../liferay-fragment-linting/SKILL.md)                                                         |
| Build compatibility transforms via jq (create-fragment-zips.sh)   | Compat Transform        | [../liferay-compat-transform/SKILL.md](../liferay-compat-transform/SKILL.md)                                                         |
| Generate visual gallery/documentation                             | Visual Gallery          | [../liferay-visual-gallery/SKILL.md](../liferay-visual-gallery/SKILL.md)                                                             |
| Create fragment screenshots                                       | Screenshot Creation     | [../fragment-screenshot-creation/SKILL.md](../fragment-screenshot-creation/SKILL.md)                                                 |
| Bootstrap Playwright E2E tests for fragments                      | E2E Bootstrap           | [../fragment-e2e-bootstrap/SKILL.md](../fragment-e2e-bootstrap/SKILL.md)                                                             |
| Create form fragments                                             | Form Fragment Developer | [../../../.gemini/skills/liferay-form-fragment-developer/SKILL.md](../../../.gemini/skills/liferay-form-fragment-developer/SKILL.md) |

## How to Use

1. Match the user's request to one row in the Intent Router table above.
2. Read the linked SKILL.md for that specialist skill.
3. Follow the workflow, references, and output contract defined in that skill.
