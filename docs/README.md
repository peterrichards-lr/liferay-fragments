# Liferay Fragments Documentation

A collection of robust, accessible, and responsive Liferay fragments for DXP platforms.

## 📋 Table of Contents

- [🚀 Deployment](#-deployment)
- [Core Fragments](#core-fragments)
- [Specialized Collections](#specialized-collections)
- [🖼️ Visual Gallery](./gallery.md)
- [📖 Recipes & Workflows](./recipes.md)
- [⚙️ Prerequisites & Setup](./setup.md)
- [❓ Troubleshooting & FAQ](./troubleshooting.md)

## 🚀 Deployment

### Option 1: Automated Deployment (Recommended)

Use the provided `deploy-fragment-zips.sh` script to automate the deployment of your fragment and Language ZIPs.

#### Usage
```bash
./deploy-fragment-zips.sh [TARGET_PATH] [--all | folder_name1 folder_name2 ...]
```

*   **TARGET_PATH**: The root of a Liferay Workspace or a standalone Liferay bundle.
*   **--all**: Deploys all ZIPs found in the `/zips` directory.
*   **folder_name**: Space-separated list of specific fragment or collection folder names to deploy.

#### Example
```bash
./deploy-fragment-zips.sh ~/liferay-workspace --all
./deploy-fragment-zips.sh /opt/liferay gemini-generated master-page-background-colour
```

### Option 2: Manual Deployment

1.  **Build the assets**: Run `./create-fragment-zips.sh` to generate the ZIP files.
2.  **Deploy Fragments**: Copy the `.zip` files from `./zips/fragments/` to your Liferay instance's `/deploy` folder.
3.  **Deploy Language Overrides**: Copy the `-language-batch-cx.zip` files from `./zips/language/` to your Liferay instance's `/deploy` folder.

Liferay will automatically import the fragments and register the language overrides as Client Extensions.

### Custom Build Options

If you want to target a specific Virtual Instance or Site, set these environment variables before running `./create-fragment-zips.sh`:
- `COMPANY_WEB_ID`: The Web ID of the Virtual Instance (Defaults to `*` / Global).
- `GROUP_KEY`: The Site Friendly URL or Name (Ignored if `COMPANY_WEB_ID` is `*`).

---

## Core Fragments

These fragments provide foundational utility and data display capabilities.

- [Meter Reading](./fragments/meter-reading.md) (DEPRECATED)
- [Date Display](./fragments/date-display.md) (DEPRECATED)
- [Form Utilities](./fragments/forms.md) (Populator, Session ID, Refresh, Redirect)
- [Form Field Enhancements](./fragments/form-fragments.md) (Autocomplete, Star Rating, Toggle)
- [Populated Form Fields](./fragments/populated-form-fields.md) (Persistence, Derived Values)
- [Liferay Iframer](./fragments/liferay-iframer.md)

## Specialized Collections

### Gemini Generated

A suite of high-fidelity, data-driven fragments designed for modern Liferay portals.

- **Data Visualization**
  - [Object-Linked Chart](./fragments/object-linked-chart.md)
  - [Radial KPI Gauge](./fragments/radial-kpi-gauge.md)
  - [Activity Heatmap](./fragments/activity-heatmap.md)
- **Object Integration**
  - [Meta-Object Table](./fragments/meta-object-table.md)
  - [Meta-Object Form](./fragments/meta-object-form.md)
  - [Meta-Object Record View](./fragments/meta-object-record-view.md)
- **High-Fidelity UI**
  - [Dynamic Collection Slider](./fragments/dynamic-collection-slider.md)
  - [Dynamic Object Gallery](./fragments/dynamic-object-gallery.md)
  - [Modern Parallax Hero](./fragments/modern-parallax-hero.md)
  - [Interactive Event Timeline](./fragments/interactive-event-timeline.md)
  - [Animated Metric Counter](./fragments/animated-metric-counter.md)
  - [Pricing Comparison Grid](./fragments/pricing-comparison-grid.md)
  - [AI Assistant Chat UI](./fragments/ai-chat-ui.md)

### Integration & Data

- [Content Fragments](./fragments/content.md) (Content Map, Service Cards)
- [Object Fragments](./fragments/objects.md) (Audit Buttons, Comments)
- [Pulse Integration Fragments](./fragments/pulse.md) (Campaign Tracking)
- [Finance Fragments](./fragments/finance.md) (Loan Calculators)

### Advanced UI & Interactivity

- [Conditional Content](./fragments/conditional-content.md) (Outcome-based Drop Zones)
- [Tracker Fragments](./fragments/tracker.md) (Multi-step Process Indicators)
- [Dashboard Components](./fragments/dashboard-components.md) (Healthcare/Activity Dashboards)
- [Widget Modifiers](./fragments/widget-modifiers.md) (Alerts/Announcements Enhancements)

### Layout & Theme

- [Layout Components](./fragments/layout-components.md)
- [Header Components](./fragments/header-components.md)
- [Responsive Menu Fragments](./fragments/responsive-menus.md) (Mega Menus, Side Menus)
- [Hero Assets](./fragments/hero-assets.md) (Video Backgrounds, Overlays)
- [Master Page Utilities](./fragments/master-page-background-colour.md) (Global BG Control)

### User & Account

- [Profile Fragments](./fragments/profile.md) (DEPRECATED)
- [Commerce Fragments](./fragments/commerce.md)
- [User & Account Fragments](./fragments/user-account.md) (OAuth2, Connectivity Testing)

## 📚 Resources

- [🖼️ Visual Gallery](./gallery.md) - A screenshot-first guide to every fragment.
- [📖 Recipes & Workflows](./recipes.md) - Step-by-step guides for common fragment combinations.
- [⚙️ Prerequisites & Setup](./setup.md) - Mandatory Liferay configurations (SAP, FreeMarker).
- [❓ Troubleshooting & FAQ](./troubleshooting.md) - Common issues and solutions.
- [🎬 Videos](./videos/README.md) - Video tutorials and walkthroughs.
- [Miscellaneous Fragments](./fragments/miscellaneous.md)
