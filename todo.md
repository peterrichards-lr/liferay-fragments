# TODO: Identified Issues and Improvements

This list contains bugs, potential issues, and suggested improvements identified
during the initial repository review.

## Fragment Readiness Audit

This table summarizes the status of documentation, language properties, visual
thumbnails, gallery inclusion, and functional validation for each fragment.

| Collection / Fragment             | Docs | i18n | Thumb | Visual | Gallery | Func. Validated |
| :-------------------------------- | :--- | :--- | :---- | :----- | :------ | :-------------- |
| **Advanced Object Data**          | YES  | YES  | NO    | NO     | NO      | YES             |
| - data-grid-inline-editing        | YES  | YES  | NO    | NO     | NO      | YES             |
| - interactive-floorplan           | YES  | YES  | NO    | NO     | NO      | YES             |
| **Aura Design System**            | YES  | YES  | YES   | YES    | PART    | YES             |
| - aura-final-cta                  | YES  | YES  | YES   | YES    | PART    | YES             |
| - aura-lookbook                   | YES  | YES  | YES   | YES    | PART    | YES             |
| - aura-product-gallery            | YES  | YES  | YES   | YES    | PART    | YES             |
| - aura-scoped-container           | YES  | YES  | YES   | YES    | YES     | YES             |
| - aura-usp-grid                   | YES  | YES  | YES   | YES    | PART    | YES             |
| **Commerce**                      | YES  | YES  | YES   | YES    | YES     | YES             |
| - dynamic-badge-overlay           | YES  | YES  | YES   | YES    | YES     | YES             |
| - purchased-products              | YES  | YES  | YES   | YES    | YES     | YES             |
| **Conditional Content**           | YES  | YES  | YES   | YES    | YES     | YES             |
| **Content**                       | YES  | YES  | PART  | PART   | PART    | YES             |
| - content-map                     | YES  | YES  | YES   | YES    | YES     | YES             |
| - service-card                    | YES  | YES  | YES   | NO     | NO      | YES             |
| - service-icon                    | YES  | YES  | YES   | NO     | NO      | YES             |
| - service-link-button             | YES  | YES  | NO    | NO     | NO      | YES             |
| **Dashboard Components**          | YES  | YES  | PART  | PART   | NO      | YES             |
| - dashboard-container             | YES  | YES  | -     | -      | NO      | YES             |
| - dashboard-filter                | YES  | YES  | NO    | NO     | NO      | YES             |
| **Date Display**                  | YES  | YES  | YES   | YES    | YES     | YES             |
| - date-display-collection-display | YES  | YES  | YES   | YES    | YES     | YES             |
| - date-display-static             | YES  | YES  | YES   | YES    | YES     | YES             |
| **Finance**                       | YES  | YES  | YES   | YES    | YES     | YES             |
| - loan-application-calculator     | YES  | YES  | YES   | YES    | YES     | YES             |
| - loan-calculator                 | YES  | YES  | YES   | YES    | YES     | YES             |
| **Form Fragments**                | YES  | YES  | PART  | PART   | NO      | YES             |
| - autocomplete-(object)           | YES  | YES  | YES   | YES    | NO      | YES             |
| - autocomplete-(picklist)         | YES  | YES  | YES   | YES    | NO      | YES             |
| - confirmation-field              | YES  | YES  | YES   | YES    | NO      | YES             |
| - hidden-relationship             | YES  | YES  | YES   | YES    | NO      | YES             |
| - listbox-multiselect             | YES  | YES  | YES   | YES    | NO      | YES             |
| - range                           | YES  | YES  | YES   | YES    | NO      | YES             |
| - segmented-numeric               | YES  | YES  | YES   | YES    | NO      | YES             |
| - star-rating                     | YES  | YES  | YES   | YES    | NO      | YES             |
| - submit-button                   | YES  | YES  | NO    | NO     | NO      | YES             |
| - toggle-switch                   | YES  | YES  | YES   | YES    | NO      | YES             |
| - url-populated-hidden-rel        | YES  | YES  | -     | -      | NO      | YES             |
| - user-field                      | YES  | YES  | NO    | NO     | NO      | YES             |
| **Forms**                         | YES  | YES  | PART  | PART   | PART    | YES             |
| - form-populator                  | YES  | YES  | YES   | YES    | YES     | YES             |
| - form-session-id                 | YES  | YES  | -     | -      | NO      | YES             |
| - generate-form-session-id        | YES  | YES  | -     | -      | NO      | YES             |
| - masthead-cta-form-header        | YES  | YES  | -     | -      | NO      | YES             |
| - redirect-page                   | YES  | YES  | -     | -      | NO      | YES             |
| - refresh-page                    | YES  | YES  | YES   | YES    | YES     | YES             |
| **Gemini Generated**              | YES  | YES  | PART  | PART   | PART    | YES             |
| - activity-heatmap                | YES  | YES  | YES   | YES    | YES     | YES             |
| - ai-chat-ui                      | YES  | YES  | NO    | NO     | NO      | YES             |
| - animated-metric-counter         | YES  | YES  | YES   | YES    | YES     | YES             |
| - dynamic-collection-slider       | YES  | YES  | YES   | YES    | YES     | YES             |
| - dynamic-object-gallery          | YES  | YES  | YES   | YES    | YES     | YES             |
| - interactive-event-timeline      | YES  | YES  | YES   | YES    | YES     | YES             |
| - interactive-wizard              | YES  | YES  | NO    | NO     | NO      | YES             |
| - meta-object-form                | YES  | YES  | YES   | YES    | YES     | YES             |
| - meta-object-record-view         | YES  | YES  | YES   | YES    | YES     | YES             |
| - meta-object-table               | YES  | YES  | YES   | YES    | YES     | YES             |
| - modern-parallax-hero            | YES  | YES  | YES   | YES    | YES     | YES             |
| - pricing-comparison-grid         | YES  | YES  | YES   | YES    | YES     | YES             |
| - radial-kpi-gauge                | YES  | YES  | YES   | YES    | YES     | YES             |
| - search-overlay                  | YES  | YES  | NO    | NO     | NO      | YES             |
| - object-linked-chart             | YES  | YES  | YES   | YES    | YES     | YES             |
| **Header Components**             | YES  | YES  | PART  | PART   | YES     | YES             |
| - customer-registration           | YES  | YES  | DEPR  | DEPR   | NO      | YES             |
| - linear-gradient-container       | YES  | YES  | DEPR  | DEPR   | NO      | YES             |
| - linear-gradient-custom          | YES  | YES  | YES   | YES    | NO      | YES             |
| - login-and-user-menu             | YES  | YES  | YES   | YES    | YES     | YES             |
| - login-card                      | YES  | YES  | DEPR  | DEPR   | NO      | YES             |
| - logo                            | YES  | YES  | YES   | YES    | YES     | YES             |
| - lower-header-layout             | YES  | YES  | YES   | YES    | NO      | YES             |
| - navigation                      | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - search-bar                      | YES  | YES  | YES   | YES    | YES     | YES             |
| - search-button                   | YES  | YES  | YES   | YES    | NO      | YES             |
| - site-name                       | YES  | YES  | YES   | YES    | YES     | YES             |
| - upper-header-layout             | YES  | YES  | YES   | YES    | NO      | YES             |
| - user-bar                        | YES  | YES  | YES   | YES    | YES     | YES             |
| **Hero Assets**                   | YES  | YES  | YES   | YES    | YES     | YES             |
| - hero-video                      | YES  | YES  | YES   | YES    | YES     | YES             |
| - overlay-background              | YES  | YES  | YES   | YES    | YES     | YES             |
| **Interactive Media**             | YES  | YES  | NO    | NO     | NO      | YES             |
| - scratch-off-promo-card          | YES  | YES  | NO    | NO     | NO      | YES             |
| - video-hotspots                  | YES  | YES  | NO    | NO     | NO      | YES             |
| **Layout Components**             | YES  | YES  | PART  | PART   | YES     | YES             |
| - card-content                    | YES  | YES  | NO    | YES    | YES     | YES             |
| - grid-column                     | YES  | YES  | -     | -      | YES     | YES             |
| - primary-card                    | YES  | YES  | YES   | YES    | YES     | YES             |
| - secondary-card                  | YES  | YES  | YES   | YES    | YES     | YES             |
| **Master Page Bg Colour**         | YES  | YES  | -     | -      | NO      | YES             |
| **Meter Reading**                 | YES  | YES  | YES   | YES    | NO      | YES             |
| **Miscellaneous**                 | YES  | YES  | PART  | PART   | NO      | YES             |
| - back-button                     | YES  | YES  | YES   | NO     | NO      | YES             |
| - custom-tabs                     | YES  | YES  | YES   | NO     | NO      | YES             |
| - customer-registration           | YES  | YES  | DEPR  | DEPR   | NO      | YES             |
| - dynamic-copyright               | YES  | YES  | YES   | YES    | NO      | YES             |
| - hide-control-menu               | YES  | YES  | -     | -      | NO      | YES             |
| - icon-button                     | YES  | YES  | YES   | YES    | NO      | YES             |
| - launch-analytics-cloud          | YES  | YES  | YES   | NO     | NO      | YES             |
| - modify-my-profile-link          | YES  | YES  | NO    | NO     | NO      | YES             |
| - my-dashboard-link               | YES  | YES  | NO    | NO     | NO      | YES             |
| - trigger-ray                     | YES  | YES  | -     | -      | NO      | YES             |
| **Objects**                       | YES  | YES  | PART  | PART   | NO      | YES             |
| - audit-button                    | YES  | YES  | YES   | NO     | NO      | YES             |
| - comment                         | YES  | YES  | YES   | YES    | NO      | YES             |
| - public-comments                 | YES  | YES  | YES   | YES    | NO      | YES             |
| **Populated Form Fields**         | YES  | YES  | PART  | YES    | YES     | YES             |
| - populate-select                 | YES  | YES  | YES   | YES    | YES     | YES             |
| - populated-range                 | YES  | YES  | YES   | YES    | YES     | YES             |
| - store-default-value             | YES  | YES  | YES   | YES    | YES     | YES             |
| - store-form-field-values         | YES  | YES  | NO    | NO     | NO      | YES             |
| - text-derived-value              | YES  | YES  | NO    | NO     | NO      | YES             |
| **Profile**                       | YES  | YES  | PART  | YES    | YES     | YES             |
| - customer-profile                | YES  | YES  | YES   | YES    | YES     | YES             |
| - pdf-export                      | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - pdf-export-(dashboard)          | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - profile-detail                  | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - profile-detail-(dashboard)      | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - profile-summary                 | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| - profile-summary-(dashboard)     | YES  | YES  | DEPR  | DEPR   | YES     | YES             |
| **Pulse**                         | YES  | YES  | PART  | PART   | NO      | YES             |
| - campaign-initialiser            | YES  | YES  | -     | -      | NO      | YES             |
| - cookie-sniffer                  | YES  | YES  | -     | -      | NO      | YES             |
| - custom-event-listener           | YES  | YES  | -     | -      | NO      | YES             |
| - pulse-button                    | YES  | YES  | YES   | NO     | NO      | YES             |
| **Remote App Utilities**          | YES  | YES  | YES   | YES    | YES     | YES             |
| - liferay-iframer                 | YES  | YES  | YES   | YES    | YES     | YES             |
| **Responsive Menus**              | YES  | YES  | PART  | PART   | YES     | YES             |
| - logo-zone                       | YES  | YES  | -     | -      | NO      | YES             |
| - responsive-menu                 | YES  | YES  | YES   | NO     | NO      | YES             |
| - responsive-side-menu            | YES  | YES  | YES   | NO     | NO      | YES             |
| - zone-layout                     | YES  | YES  | -     | -      | NO      | YES             |
| **Tracker**                       | YES  | YES  | YES   | YES    | YES     | YES             |
| - tracker                         | YES  | YES  | YES   | YES    | YES     | YES             |
| - tracker-step                    | YES  | YES  | YES   | YES    | YES     | YES             |
| **User Account**                  | YES  | YES  | NO    | NO     | NO      | YES             |
| - my-rights                       | YES  | YES  | NO    | NO     | NO      | YES             |
| - ping                            | YES  | YES  | NO    | NO     | NO      | YES             |
| - who-am-i                        | YES  | YES  | NO    | NO     | NO      | YES             |
| **Widget Modifiers**              | YES  | YES  | YES   | NO     | NO      | YES             |
| - alerts-modifier                 | YES  | YES  | YES   | NO     | NO      | YES             |
| **Modern Intranet**               | YES  | YES  | PART  | PART   | NO      | YES             |
| - welcome-banner                  | YES  | YES  | NO    | NO     | NO      | YES             |
| - app-launcher                    | YES  | YES  | NO    | NO     | NO      | YES             |
| - stat-card                       | YES  | YES  | NO    | NO     | NO      | YES             |
| - news-hero                       | YES  | YES  | NO    | NO     | NO      | YES             |
| - intranet-feed                   | YES  | YES  | NO    | NO     | NO      | YES             |
| - file-repository-list            | YES  | YES  | NO    | NO     | NO      | YES             |
| - course-progress-card            | YES  | YES  | NO    | NO     | NO      | YES             |

## Active Work & Issue Tracking

All historical migration, schema normalization, singleton enforcement, and thumbnail generation tasks have been completed. Active issues, features, and technical debt items are tracked live via GitHub Issues:

- **Active GitHub Issues**: Run `gh issue list` or see [Issues](https://github.com/peterrichards-lr/liferay-fragments/issues).
- **Session Scratchpad**: Active in-flight objectives are recorded in `.agent-state.md`.

<!-- markdownlint-disable MD049 -->

---

_Last Updated: 2026-08-14_ | _Last Reviewed: 2026-08-14_
