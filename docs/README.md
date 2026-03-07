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
- [🛠️ Developer Resources](#-developer-resources)

## 🚀 Deployment

### Option 1: Automated Deployment (Recommended)

Use the provided `deploy-fragment-zips.sh` script to automate the deployment of your fragment and Language ZIPs.

#### Usage

```bash
./deploy-fragment-zips.sh [TARGET_PATH] [--all | folder_name1 folder_name2 ...]
```

- **TARGET_PATH**: The root of a Liferay Workspace or a standalone Liferay bundle.
- **--all**: Deploys all ZIPs found in the `/zips` directory.
- **folder_name**: Space-separated list of specific fragment or collection folder names to deploy.

#### Example

```bash
./deploy-fragment-zips.sh ~/liferay-workspace --all
./deploy-fragment-zips.sh /opt/liferay gemini-generated master-page-background-colour
```

### Option 3: Showcase Data Deployment

To demonstrate the data-driven capabilities of fragments like `Activity Heatmap` or `Object-Linked Chart`, you can deploy the sample showcase datasets.

**Note: Liferay 2025.Q4.10 or later is required for these datasets to function correctly due to site-scoping requirements.**

```bash
./deploy-fragment-zips.sh [TARGET_PATH] --showcase
```

This will deploy all showcase resources found in `other-resources/showcase-data/`.

### Option 4: Manual Deployment

1.  **Build the assets**: Run `./create-fragment-zips.sh` to generate the ZIP files.
2.  **Deploy Fragments**: Copy the `.zip` files from `./zips/fragments/` to your Liferay instance's `/deploy` folder.
3.  **Deploy Language Overrides**: Copy the `-language-batch-cx.zip` files from `./zips/language/` to your Liferay instance's `/osgi/client-extensions/` folder.
4.  **Deploy Special Resources**: Copy any `.zip` files from `/other-resources/*/dist/` to your Liferay instance's `/osgi/client-extensions/` folder.

Liferay will automatically import the fragments and register the language overrides as Client Extensions.

### Custom Build Options

If you want to target a specific Virtual Instance or Site, set these environment variables before running `./create-fragment-zips.sh`:

- `COMPANY_WEB_ID`: The Web ID of the Virtual Instance (Defaults to `*` / Global).
- `GROUP_KEY`: The Site Friendly URL or Name (Ignored if `COMPANY_WEB_ID` is `*`).

---

## Core Fragments

These fragments provide foundational utility and data display capabilities.

- **Commerce**
  - [Dynamic Badge Overlay](./fragments/dynamic-badge-overlay.md)
  - [Purchased Products](./fragments/purchased-products.md)
  - [Collection Summary](./fragments/commerce.md)
- **Content**
  - [Content Map](./fragments/content-map.md)
  - [Service Link Button](./fragments/service-link-button.md)
  - [Collection Summary](./fragments/content.md)
- **Form Utilities**
  - [Form Populator](./fragments/form-populator.md)
  - [Form Session ID](./fragments/form-session-id.md)
  - [Generate Form Session ID](./fragments/generate-form-session-id.md)
  - [Redirect Page](./fragments/redirect-page.md)
  - [Refresh Page](./fragments/refresh-page.md)
  - [Collection Summary](./fragments/forms.md)
- **Form Field Enhancements**
  - [Autocomplete (Object)](<./fragments/autocomplete-(object).md>)
  - [Autocomplete (Picklist)](<./fragments/autocomplete-(picklist).md>)
  - [Confirmation Field](./fragments/confirmation-field.md)
  - [Hidden Relationship](./fragments/hidden-relationship.md)
  - [Listbox Multiselect](./fragments/listbox-multiselect.md)
  - [Range Input](./fragments/range.md)
  - [Segmented Numeric](./fragments/segmented-numeric.md)
  - [Star Rating](./fragments/star-rating.md)
  - [Submit Button (Custom)](./fragments/submit-button.md)
  - [Toggle Switch](./fragments/toggle-switch.md)
  - [URL Populated Hidden Relationship](./fragments/url-populated-hidden-relationship.md)
  - [User Field](./fragments/user-field.md)
  - [Collection Summary](./fragments/form-fragments.md)
- [Populated Form Fields](./fragments/populated-form-fields.md) (Persistence, Derived Values)
- [Liferay Iframer](./fragments/liferay-iframer.md)
- [Meter Reading](./fragments/meter-reading.md) (DEPRECATED)
- [Date Display](./fragments/date-display.md) (DEPRECATED)

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

- **Content Fragments**
  - [Content Map](./fragments/content-map.md)
  - [Service Card](./fragments/service-card.md)
  - [Service Icon](./fragments/service-icon.md)
  - [Service Link Button](./fragments/service-link-button.md)
  - [Collection Summary](./fragments/content.md)
- **Object Fragments**
  - [Audit Button](./fragments/audit-button.md)
  - [Comment](./fragments/comment.md)
  - [Public Comments](./fragments/public-comments.md)
  - [Collection Summary](./fragments/objects.md)
- **Pulse Integration Fragments**
  - [Campaign Initialiser](./fragments/campaign-initialiser.md)
  - [Cookie Sniffer](./fragments/cookie-sniffer.md)
  - [Custom Event Listener](./fragments/custom-event-listener.md)
  - [Pulse Button](./fragments/pulse-button.md)
  - [Collection Summary](./fragments/pulse.md) (Campaign Tracking)
- **Finance Fragments**
  - [Loan Application Calculator](./fragments/loan-application-calculator.md)
  - [Loan Calculator](./fragments/loan-calculator.md)
  - [Collection Summary](./fragments/finance.md)

### Advanced UI & Interactivity

- [Conditional Content](./fragments/conditional-content.md) (Outcome-based Drop Zones)
- **Tracker Fragments**
  - [Tracker (Container)](./fragments/tracker.md)
  - [Tracker Step](./fragments/tracker-step.md)
  - [Collection Summary](./fragments/tracker.md) (Multi-step Process Indicators)
- **Dashboard Components**
  - [Dashboard Container](./fragments/dashboard-container.md)
  - [Dashboard Filter](./fragments/dashboard-filter.md)
  - [Collection Summary](./fragments/dashboard-components.md)
- **Widget Modifiers**
  - [Alerts Modifier](./fragments/alerts-modifier.md)
  - [Collection Summary](./fragments/widget-modifiers.md) (Alerts/Announcements Enhancements)

### Layout & Theme

- **Layout Components**
  - [Primary Card](./fragments/primary-card.md)
  - [Secondary Card](./fragments/secondary-card.md)
  - [Card Content](./fragments/card-content.md)
  - [Collection Summary](./fragments/layout-components.md)
- **Header Components**
  - [Logo](./fragments/logo.md)
  - [Navigation](./fragments/navigation.md)
  - [Login and User Menu](./fragments/login-and-user-menu.md)
  - [Search Bar](./fragments/search-bar.md)
  - [Search Button](./fragments/search-button.md)
  - [Site Name](./fragments/site-name.md)
  - [User Bar](./fragments/user-bar.md)
  - [Vertical Bar](./fragments/vertical-bar.md)
  - [Upper Header Layout](./fragments/upper-header-layout.md)
  - [Lower Header Layout](./fragments/lower-header-layout.md)
  - [Linear Gradient Container](./fragments/linear-gradient-container.md)
  - [Linear Gradient Container (Custom)](<./fragments/linear-gradient-container-(custom).md>)
  - [Collection Summary](./fragments/header-components.md)
- **Responsive Menu Fragments**
  - [Responsive Menu](./fragments/responsive-menu.md)
  - [Responsive Side Menu](./fragments/responsive-side-menu.md)
  - [Logo Zone](./fragments/logo-zone.md)
  - [Zone Layout](./fragments/zone-layout.md)
  - [Collection Summary](./fragments/responsive-menus.md)
- **Hero Assets**
  - [Hero Video](./fragments/hero-video.md)
  - [Overlay Background](./fragments/overlay-background.md)
  - [Collection Summary](./fragments/hero-assets.md)
- [Master Page Utilities](./fragments/master-page-background-colour.md) (Global BG Control)

### User & Account

- **Profile Fragments** (DEPRECATED)
  - [Profile Summary](./fragments/profile-summary.md)
  - [Profile Detail](./fragments/profile-detail.md)
  - [Customer Profile](./fragments/customer-profile.md)
  - [PDF Export](./fragments/pdf-export.md)
  - [Collection Summary](./fragments/profile.md)
- [Commerce Fragments](./fragments/commerce.md)
- **User & Account Fragments**
  - [My Rights](./fragments/my-rights.md)
  - [Ping](./fragments/ping.md)
  - [Who Am I](./fragments/who-am-i.md)
  - [Collection Summary](./fragments/user-account.md)

---

## 🛠️ Developer Resources

For more information on developing Liferay fragments, refer to the following official Liferay Learn guides:

- **[Fragment-Specific Tags and Attributes Reference](https://learn.liferay.com/w/dxp/development/developing-page-fragments/reference/fragment-specific-tags-and-attributes-reference)**: A comprehensive guide to the `data-lfr` attributes and FreeMarker variables available within fragments.
- **[Fragment Configuration Types Reference](https://learn.liferay.com/w/dxp/development/developing-page-fragments/reference/fragment-configuration-types-reference)**: Details on all available configuration field types (text, checkbox, select, etc.) for `configuration.json`.
- **[Page Fragment Editor Interface Reference](https://learn.liferay.com/w/dxp/development/developing-page-fragments/reference/page-fragment-editor-interface-reference)**: An overview of the built-in Page Editor interface and how it interacts with your fragment code.

---

## 📚 Resources

- [🖼️ Visual Gallery](./gallery.md) - A screenshot-first guide to every fragment.
- [📖 Recipes & Workflows](./recipes.md) - Step-by-step guides for common fragment combinations.
- [⚙️ Prerequisites & Setup](./setup.md) - Mandatory Liferay configurations (SAP, FreeMarker).
- [❓ Troubleshooting & FAQ](./troubleshooting.md) - Common issues and solutions.
- [🎬 Videos](./videos/README.md) - Video tutorials and walkthroughs.
- **Miscellaneous Fragments**
  - [Custom Tabs](./fragments/custom-tabs.md)
  - [Icon Button](./fragments/icon-button.md)
  - [Launch Analytics Cloud](./fragments/launch-analytics-cloud.md)
  - [Back Button](./fragments/back-button.md)
  - [Cookie Sniffer](./fragments/cookie-sniffer.md)
  - [Dynamic Copyright](./fragments/dynamic-copyright.md)
  - [Trigger Ray](./fragments/trigger-ray.md)
  - [Hide Control Menu](./fragments/hide-control-menu.md)
  - [Collection Summary](./fragments/miscellaneous.md)
