# Semantic Bootstrapping Specification

## Goal

To replace generic container test implementations (e.g., injecting `stat-card` into every drop zone) with realistic, domain-specific fragment compositions in `test-data.json` manifests.

## Problem Statement

Currently, the automated E2E bootstrapping script injects a generic `stat-card` into any fragment that contains a drop zone (`lfr-drop-zone`). This creates unrealistic screenshots in the gallery (e.g., a `stat-card` inside a `responsive-side-menu` or an `interactive-wizard`) and fails to test the true semantic intent of the fragments.

## Requirements

1.  **Domain Categorization:** Group fragments by their logical domain (Headers, Forms, Dashboards, Content, Layouts).
2.  **Semantic Pairing:** Define specific child fragments that should be injected into specific container fragments for E2E testing.
3.  **Bootstrapping Manifests:** Update the `test-data.json` for each container fragment to reflect the semantic pairing via the `pageLayout` tree.
4.  **Gallery Exclusion:** Maintain the `excludeFromGallery: true` flag for utility/background fragments.

## Domain Mapping

### 1. Headers & Navigation

- **Containers:** `upper-header-layout`, `lower-header-layout`, `responsive-menu`, `responsive-side-menu`, `logo-zone`
- **Intended Children:** `site-name`, `search-bar`, `login-and-user-menu`, `logo`, `navigation`

### 2. Forms & Inputs

- **Containers:** `customer-registration`, `interactive-wizard`, `masthead-call-to-action-form-header`, `meta-object-form`
- **Intended Children:** `user-field`, `date-display`, `listbox-multiselect`, `file-drop-zone`, `submit-button`

### 3. Dashboards & Data Visualization

- **Containers:** `dashboard-container`, `meta-object-table`, `interactive-event-timeline`
- **Intended Children:** `activity-heatmap`, `radial-kpi-gauge`, `animated-metric-counter`, `object-linked-chart`, `stat-card`

### 4. General Content & Layouts

- **Containers:** `zone-layout`, `linear-gradient-container`, `overlay-background`, `modern-parallax-hero`
- **Intended Children:** `primary-card`, `secondary-card`, `hero-video`, `service-card`
