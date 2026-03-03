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

### Option 1: Using Pre-built Releases (Quick Start)

The assets provided in the GitHub Releases include both Fragment Collections and Language Client Extensions.

1.  **Download** the desired `.zip` files.
2.  **Deploy Fragments**: Drop the collection ZIPs (e.g., `gemini-generated-collection.zip`) from the `./zips/` directory into your Liferay instance's `/deploy` folder.
3.  **Deploy Language Overrides**: Drop the corresponding Language Batch ZIPs (e.g., `gemini-generated-language-batch-cx.zip`) from the `./cx/` directory into the same `/deploy` folder.

Liferay will automatically import the fragments into the Global site and register the language overrides as Client Extensions.

### Option 2: Custom Deployment using create-fragment-zips.sh

If you want to target a specific Virtual Instance or a specific Site (instead of Global), you can use the provided build script. This script automatically generates a liferay-deploy-fragments.json descriptor during the build process and cleans it up afterward.

#### Prerequisites

- bash
- jq (required for JSON processing)

#### Steps

1. Open a terminal in the project root.
2. Set the environment variables for your target:
   - COMPANY_WEB_ID: The Web ID of the Virtual Instance (e.g., liferay.com). Defaults to \* (Global).
   - GROUP_KEY: The Site Friendly URL or Name (e.g., Guest). This is ignored if COMPANY_WEB_ID is \*.

3. Run the script:

```bash
# Example: Deploy to a specific site on a specific instance
COMPANY_WEB_ID="mycompany.com" GROUP_KEY="Marketing" ./create-fragment-zips.sh

# Example: Deploy globally (default)
./create-fragment-zips.sh
```

The generated ZIPs will be located in the ./zips/ directory. Each ZIP will contain the necessary liferay-deploy-fragments.json configured with your provided variables.

## Core Fragments

These fragments provide foundational utility and data display capabilities.

- [Meter Reading](./fragments/meter-reading.md)
- [Date Display](./fragments/date-display.md)
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

- [Profile Fragments](./fragments/profile.md)
- [Commerce Fragments](./fragments/commerce.md)
- [User & Account Fragments](./fragments/user-account.md) (OAuth2, Connectivity Testing)

## 📚 Resources

- [🖼️ Visual Gallery](./gallery.md) - A screenshot-first guide to every fragment.
- [📖 Recipes & Workflows](./recipes.md) - Step-by-step guides for common fragment combinations.
- [⚙️ Prerequisites & Setup](./setup.md) - Mandatory Liferay configurations (SAP, FreeMarker).
- [❓ Troubleshooting & FAQ](./troubleshooting.md) - Common issues and solutions.
- [🎬 Videos](./videos/README.md) - Video tutorials and walkthroughs.
- [Miscellaneous Fragments](./fragments/miscellaneous.md)
