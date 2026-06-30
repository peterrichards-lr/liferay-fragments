# Unified Project Management & Liferay Fragments Playbook

This consolidated guide serves as a blueprint for AI agents and maintainers to standardize repository management, build pipelines, and E2E verification gates.

## 1. Branch Protection & Integration Workflow

To maintain production stability, the `main` branch is protected against direct pushes. All integration must follow this strict protocol:

- **Branch Isolation**: Create short-lived branches prefixed by scope:
  - `feat/...` for new features or page fragments.
  - `fix/...` for bug fixes or stylesheet adjustments.
  - `docs/...` for documentation updates.
- **Pre-Commit Validation**: Before pushing, local Git pre-commit hooks execute automatically:
  - `gitleaks` to check for hardcoded credentials.
  - `prettier` to format staged HTML/CSS/JS/JSON files.
  - Dependency sync (`scripts/initialize-build-config.js`) to ensure all collections are updated.
  - Fragment Quality Gate (`npm run lint`) to enforce schemas and link validity.
- **Pull Request & Auto-Merge**: Open PRs via the GitHub CLI and immediately enable auto-merge with a squash fallback:
  ```bash
  gh pr create --title "feat: <description>" --body "<details>" --head <branch_name> --base main
  gh pr merge <pr_number> --auto --squash --delete-branch
  ```
- **Local Synchronization**: Once merged, return to the base branch and pull changes:
  ```bash
  git checkout main && git pull origin main
  ```

## 2. Fragment Quality Gate & Linting Rules

All fragments must pass validation before being committed. The linter checks for:

- **Localization Coverage**: Any property key or value defined in `configuration.json` must exist in the root collection `Language_en_US.properties` file.
- **Detailed Documentation**: Every fragment folder must have an accompanying markdown documentation file under `docs/fragments/` including Overview, Configuration, and Usage sections.
- **Theme Fidelity**: Hardcoded colors are prohibited. Fragments must use safe Meridian design tokens (`var(--primary)`, etc.) as specified in `docs/THEMES.md`.

## 3. Backward-Compatibility Build Rules (Three-Target ZIP Build)

The build script `scripts/create-fragment-zips.sh` is responsible for packaging fragments into ZIP collections compatible with three distinct Liferay version profiles:

1. **Latest DXP** (`-collection-min.zip`): Uses modern `"dataType": "number"` and boolean literals for checkboxes (Liferay 2026.Q1+).
2. **pre2026q1 DXP** (`-pre2026q1-min.zip`): Converts checkbox defaults back to string representations.
3. **pre2025q3 DXP** (`-pre2025q3-min.zip`): Converts `"dataType": "number"` fields to `"dataType": "int"` and uses string representations for all default values.

## 4. Automated E2E Verification & Snapshot Baselines

Before merging changes, fragments must be validated against Liferay 2026.Q1+ using the Playwright E2E suite:

- **Local Execution**: Run the test suite on the LDM instance:
  ```bash
  & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k
  ```
- **Targeted Runs**: Use the `-g` (grep) filter to run tests matching a specific fragment or tag:
  ```bash
  & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k -g "meter-reading"
  ```
- **Visual Baselines**: If visual layout changes are intentional, promote the new snapshots to baseline references:
  ```bash
  npm run test:visual:update
  node scripts/generate-gallery.js
  ```
