# Liferay Fragments Library (DXP & 7.4+)

A professional-grade collection of **robust, accessible, and responsive Liferay fragments** designed for Liferay DXP and Liferay 7.4+. This repository provides ready-to-use, low-code UI components that leverage the latest Liferay features like Objects, Headless APIs, and the Meridian theme.

[![Liferay DXP](https://img.shields.io/badge/Liferay-DXP%207.4%2B-blue.svg)](https://www.liferay.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Why Use This Library?

If you are building modern portals with **Liferay DXP**, this library solves common development challenges out-of-the-box:

- **Object-Driven UI**: Visualize and manage Liferay Object data without writing custom portlets.
- **Headless Integration**: Advanced components using Headless APIs for faster data delivery.
- **Auto-Deployable Localization**: Every collection includes Batch Language Client Extensions for automatic deployment of localized strings.
- **Theme Consistency**: **Meridian-ready**, utilizing standard CSS tokens for colors, spacing, and typography.
- **Accessibility & Responsiveness**: Mobile-first design principles.

---

## 🛠️ Developer Experience (DX)

This repository includes a suite of tools to ensure high-quality, consistent development.

### 1. The Fragment Scaffolder

Create a new fragment with all project standards (Rule #4, Rule #9) in seconds:

```bash
npm run create-fragment "[Collection Name]" "[Fragment Name]"
# Example: npm run create-fragment finance "Tax Estimator"
```

### 2. Quality Gate (Linter)

Validate your changes against JSON schemas, localization rules, and theme fidelity before committing:

```bash
npm run lint
```

_Note: This check is enforced via GitHub Actions on every push._

### 3. Commons Library

Leverage shared logic for Object discovery and identifier validation by linking to the shared resource:
`misc/resources/commons.js`

---

## 📖 Documentation & Resources

Explore our comprehensive documentation to get started:

- **[🖼️ Visual Gallery](./docs/gallery.md)**: Browse screenshots of every fragment in action.
- **[🚀 Deployment Guide](./docs/README.md#🚀-deployment)**: Detailed deployment instructions for fragments and language assets.
- **[📖 Common Recipes](./docs/recipes.md)**: Step-by-step workflows for combining fragments.
- **[🎨 Theme Standards](./docs/THEMES.md)**: Reference for cross-theme safe CSS tokens.
- **[⚙️ Setup & Prerequisites](./docs/setup.md)**: Mandatory Liferay configurations.
- **[❓ Troubleshooting & FAQ](./docs/troubleshooting.md)**: Solutions to common configuration issues.

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

_For more details, see the [Full Documentation](./docs/README.md)._
