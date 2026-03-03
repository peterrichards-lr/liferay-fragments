# Liferay Fragments Documentation

A collection of robust, accessible, and responsive Liferay fragments for DXP platforms.

## 🚀 Deployment

### Option 1: Using Pre-built Releases (Quick Start)

The ZIP files provided in the GitHub Releases are pre-configured for Global deployment.

Download the desired .zip file.

Drop it into your Liferay instance's /deploy folder.

Liferay will automatically import the fragments into the Global site, making them available to all sites in that instance.

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
- [Form Populator](./fragments/form-populator.md)
- [Refresh Page](./fragments/refresh-page.md)
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

### Layout & Theme

- [Layout Components](./fragments/layout-components.md)
- [Header Components](./fragments/header-components.md)

### User & Account

- [Profile Fragments](./fragments/profile.md)
- [Commerce Fragments](./fragments/commerce.md)

## Resources

- [Videos](./videos/README.md)
- [Miscellaneous Fragments](./fragments/miscellaneous.md)
