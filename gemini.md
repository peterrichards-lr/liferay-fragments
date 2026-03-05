# Gemini Project State - Liferay Fragments

## Showcase Data & Liferay CX Conventions

### 1. Object External Reference Code (ERC)
- **Scope**: Repository-specific convention for showcase data.
- **Convention**: The ERC of an Object is its name in uppercase with underscores separating words (e.g., `COMPANY_MILESTONE`).
- **Note**: This is not a Liferay requirement, but a standard followed within this project for consistency across sample datasets.

### 2. `taskItemDelegateName` (Liferay CX Rule)
- **Scope**: Mandatory Liferay Client Extension / Batch Engine rule.
- **Convention**: When importing Object entries via Batch Engine, the `taskItemDelegateName` must be the Object's name with a `C_` prefix (e.g., `"taskItemDelegateName": "C_CompanyMilestone"`).
- **Position**: Must be positioned within the `configuration` object, alongside the `parameters` block.

## Current Tasks
- [x] Update documentation with showcase data conventions (`docs/setup.md` and fragment docs).
- [x] Synchronize project state in `gemini.md`.
