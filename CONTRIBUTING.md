# Contributing Guidelines

Thank you for contributing to the Liferay Fragments repository! To maintain system quality, E2E test fidelity, and codebase cleanliness, all contributors (both human developers and AI agents) must follow this workflow.

## 1. Issue-Driven Development

- **Recording Requirements:** We use GitHub Issues to record all bugs, enhancements, feature requests (FRs), and technical debt items.
- **Analysis & Planning:** For every issue, the contributor must analyze the issue against the codebase and produce a detailed Implementation Plan before writing any code.
- **Approval Gate:** For AI agents, the Implementation Plan must be reviewed and approved by the repository owner (or a peer contributor) before execution begins.

## 2. Pull Request (PR) Requirements

- **Issue Linking:** All Pull Requests must link back to a corresponding GitHub Issue (e.g., in the PR description, include `Closes #<issue_number>` or `Addresses #<issue_number>`).
- **Review Gate:** All PRs must be reviewed and approved by another contributor (human or agent) before they can be merged.
- **Integration:** Once approved and all CI checks pass, the PR should be merged using squash-and-merge.

## 3. Pre-Commit Verification

Local pre-commit hooks run automatically on every commit. Ensure your branch passes the quality gates:

1.  **Format Check:** Prettier check for code style formatting.
2.  **Fragment Lint Check:** Audit fragments quality gate (`npm run lint`).
3.  **Workspace Cleanliness Check:** Scans the root directory for untracked files/sandboxes (`scripts/check-cleanliness.js`).

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-10_ | _Last Reviewed: 2026-07-10_
