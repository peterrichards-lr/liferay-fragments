# Liferay Fragments Library

A professional-grade collection of **robust, accessible, and responsive Liferay
fragments** designed for Liferay DXP. This repository provides ready-to-use,
low-code UI components that leverage the latest Liferay features like Objects,
Headless APIs, and the Meridian theme.

[![Liferay DXP](https://img.shields.io/badge/Liferay-DXP-blue.svg)](https://www.liferay.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Why Use This Library?

If you are building modern portals with **Liferay DXP**, this library solves
common development challenges out-of-the-box:

- **Object-Driven UI**: Visualize and manage Liferay Object data without writing
  custom portlets.
- **Headless Integration**: Advanced components using Headless APIs for faster
  data delivery.
- **Auto-Deployable Localization**: Every collection includes Batch Language
  Client Extensions for automatic deployment of localized strings.
- **Theme Consistency**: **Meridian-ready**, utilizing standard CSS tokens for
  colors, spacing, and typography.
- **Accessibility & Responsiveness**: Mobile-first design principles.

---

## 🛠️ Developer Experience (DX)

This repository includes a suite of tools to ensure high-quality, consistent
development.

### 1. The Fragment Scaffolder

Create a new fragment with all project standards (Rule #4, Rule #9) in seconds:

```bash
npm run create-fragment "[Collection Name]" "[Fragment Name]"
# Example: npm run create-fragment finance "Tax Estimator"
```

### 2. Quality Gate (Linter)

Validate your changes against JSON schemas, localization rules, and theme
fidelity before committing:

```bash
npm run lint
```

_Note: This check is enforced via GitHub Actions on every push._

### 3. Commons Library

Leverage shared logic for Object discovery and identifier validation by linking
to the shared resource: `misc/resources/commons.js`

### 4. Secret Detection

This repository enforces **zero-dependency, project-local secret detection** to
prevent credentials, API keys, private keys, or private tokens from ever being
committed to Git.

The hook runs automatically on every `git commit` by scanning staged changes and
blocking the commit if new secrets are detected.

- **Automatic Setup**: Running `npm install` automatically registers the
  pre-commit hook via the `"prepare"` script.
- **Manual Hook Install**: Re-install git hooks manually at any time:
  ```bash
  node scripts/install-git-hooks.js
  ```
- **Updating the Baseline**: If you introduce mock variables/test hashes that
  are safe to commit, regenerate the baseline exception file:
  ```bash
  npm run detect-secrets scan
  ```
  This updates `.secrets.baseline` containing SHA-1 hashes of approved
  exceptions.
- **Ignoring Mock Tokens**: You can add plain text mock tokens or hashes to
  `.gitleaksignore` in the project root to ignore them project-wide.
- **Inline Exceptions**: Add `// pragma: allowlist secret` to the line
  containing a false positive to bypass the scanner locally.

---

## 📖 Documentation & Resources

Explore our comprehensive documentation to get started:

- **[🖼️ Visual Gallery](./docs/gallery.md)**: Browse screenshots of every
  fragment in action.
- **[🚀 Deployment Guide](./docs/README.md#🚀-deployment)**: Detailed deployment
  instructions for fragments and language assets.
- **[📖 Common Recipes](./docs/recipes.md)**: Step-by-step workflows for
  combining fragments.
- **[🎨 Theme Standards](./docs/THEMES.md)**: Reference for cross-theme safe CSS
  tokens.
- **[⚙️ Setup & Prerequisites](./docs/setup.md)**: Mandatory Liferay
  configurations.
- **[🔌 JSON WS Reference](./docs/json-ws-reference.md)**: Useful legacy API
  endpoints for diagnostics.
- **[❓ Troubleshooting & FAQ](./docs/troubleshooting.md)**: Solutions to common
  configuration issues.

---

## 📦 Quick Start Workflow

### 1. Build

Generate standard fragment ZIPs and Batch Language Client Extensions:

```bash
./create-fragment-zips.sh
```

### 2. Deploy

Use the automated deployment script to push assets to your Liferay instance:

```bash
# Deploy everything to a Liferay bundle
./deploy-fragment-zips.sh /path/to/liferay/root --all

# Deploy specific fragments/collections
./deploy-fragment-zips.sh /path/to/liferay/root gemini-generated loan-calculator
```

> **⚠️ WARNING FOR LIFERAY 2026.Q1 LTS USERS** There is a known bug in Liferay
> 2026.Q1 LTS that causes system-wide auto-deployment (`--global`) to fail or
> silently drop fragments. If you require these fragments to be available
> system-wide (on the **Global Site**) in version 2026.Q1, **do not use the
> auto-deploy scripts**. You must navigate to the Global Site in the Liferay UI
> and use the **Manual Import** feature to upload the ZIP files.

_For more details, see the [Full Documentation](./docs/README.md)._

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
