# TODO: Identified Issues and Improvements

This list contains bugs, potential issues, and suggested improvements identified
during the initial repository review.

## Fragment Readiness Audit

This table summarizes the status of documentation, language properties, visual
thumbnails, gallery inclusion, and functional validation for each fragment.

| Collection / Fragment             | Docs | i18n | Thumb | Visual | Gallery | Func. Validated |
| :-------------------------------- | :--- | :--- | :---- | :----- | :------ | :-------------- |
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

## Fragments Requiring Visuals & Thumbnails

The following fragments still require a high-quality screenshot (`docs/images/`)
and a corresponding `thumbnail.png` in their root directory.

- **Dashboard**: `dashboard-filter`
- **Form Fragments**: `submit-button`, `user-field`
- **Gemini**: `ai-chat-ui`, `interactive-wizard`, `search-overlay`
- **Miscellaneous**: `modify-my-profile-link`, `my-dashboard-link`
- **User Account**: `who-am-i`, `my-rights`, `ping`

## High Priority (Bugs & Security)

- [x] **Brittle Query String Parsing**:
      `forms/fragments/form-populator/index.js` uses a manual string
      replacement/JSON.parse hack for query strings. This is insecure and will
      fail on many valid query strings. Should use `URLSearchParams`.
- [x] **Singleton Enforcement**: Add collision detection to fragments intended
      as singletons. Display a clear UI warning if multiple instances are added
      to the page.
  - `finance/fragments/loan-calculator/`
  - `meter-reading/fragments/meter-reading/`
- [x] **Standardize Configuration Filenames**: Rename `index.json` to
      `configuration.json` and update `fragment.json` references for better
      clarity.
  - `header-components/fragments/navigation/`
  - `header-components/fragments/linear-gradient-container/`
  - `header-components/fragments/linear-gradient-container-(custom)/`
- [x] **Mismatched Label/Input IDs**: In
      `meter-reading/fragments/meter-reading/index.html`, the label
      `for="meter-reading-date-date-input"` does not match the input
      `id="meter-reading-date-input"`.
- [x] **Hardcoded Object Paths**:
      `meter-reading/fragments/meter-reading/index.js` has a hardcoded API path
      `/o/c/waterreadings/`. This should ideally be configurable.
- [x] **Freemarker Safety**: Audit all fragments and add default values (`!`)
      for all configuration variables in `index.html` to prevent
      `NullPointerException` errors.

## Medium Priority (Logic & Compatibility)

- [x] **Incorrect Attribute Access**: In
      `form-fragments/fragments/star-rating/index.js`,
      `inputElement.attributes?.readOnly` is used. `attributes` is a
      `NamedNodeMap`, and `readOnly` is not a property of it. Should use
      `inputElement.readOnly` or `inputElement.hasAttribute('readonly')`.
- [x] **Deprecated APIs**: Use of `event.keyCode` and `event.charCode` in
      `meter-reading/fragments/meter-reading/index.js`. Should migrate to
      `event.key`.
- [x] **Accidental Global Scoping in JS**: Refactor JS logic to use
      `fragmentElement` for internal element selectors. Explicitly preserve
      `document/window` usage for page-level state or intentional cross-fragment
      interaction.
  - `form-fragments/fragments/autocomplete-(object)/index.js`:
    `document.getElementsByClassName('autocomplete-items')` is intentional for
    closing all lists.
  - `forms/fragments/form-populator/index.js`: `document.querySelector` is
    intentional for targeting external form fields.
  - `form-fragments/fragments/user-field/index.js`: Refactored internal
    selectors to `fragmentElement`.
  - `populated-form-fields/fragments/text-derived-value/index.js`: Refactored
    internal selectors to `fragmentElement`.
- [x] **Browser Compatibility**:
      `form-fragments/fragments/autocomplete-(object)/index.js` uses
      `Object.hasOwn`. Use `Object.prototype.hasOwnProperty.call()` for better
      compatibility.

## Best Practices & Safety

- [x] **ID Scoping**: Even for fragments intended as singletons, it is a best
      practice to prefix IDs with `${fragmentEntryLinkNamespace}` to prevent
      accidental collisions.
  - `finance/fragments/loan-calculator/index.html`
  - `meter-reading/fragments/meter-reading/index.html`
- [x] **Standardize Icons & Thumbnails**: Updated all `fragment.json` files to
      use valid Meridian theme icons and added `thumbnailPath` configuration.
- [x] **Add Thumbnails**: Generated and resized thumbnails for fragments with
      existing visual assets. (Completed for 20+ fragments)

## Theme Integration (Meridian)

Standardize fragments to use Meridian CSS tokens for colors, spacing, and
typography.

- [x] **Adopt Theme Tokens**: Replace hardcoded values with Meridian CSS
      variables.
  - [x] **Colors**: Use `var(--primary)`, `var(--secondary)`,
        `var(--body-color)`, `var(--body-background-color)`, etc.
    - [x] `finance/fragments/loan-calculator/index.css`
    - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
    - [x] `header-components/fragments/navigation/index.css`
    - [x] `layout-components/fragments/primary-card/index.css`
    - [x] `layout-components/fragments/secondary-card/index.css`
  - [x] **Spacers**: Use `var(--spacer-1)` through `var(--spacer-10)` instead of
        absolute `rem` or `px` values.
    - [x] `finance/fragments/loan-calculator/index.css`
    - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
    - [x] `header-components/fragments/navigation/index.css`
  - [x] **Typography**: Use `var(--font-size-base)`, `var(--h1-font-size)`,
        `var(--font-weight-semi-bold)`, etc.
    - [x] `finance/fragments/loan-calculator/index.css`
    - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
- [x] **Review Redundant Configuration**: Perform a case-by-case review of
      color/style fields in `configuration.json` that may now be redundant due
      to Meridian tokens.
  - [x] `form-fragments/fragments/star-rating/`: Updated default colors to use
        Meridian tokens (`--warning`, `--gray-300`).
  - [x] `meter-reading/fragments/meter-reading/`: Updated default colors to use
        Meridian tokens (`--white`, `--black`, `--danger`, `--primary`).
- [x] **Audit Component Tokens**: Align with Meridian component variables.
  - [x] `layout-components/`: Updated cards to use theme tokens and
        fragment-level scoping.
  - [x] `form-fragments/`: Updated `toggle-switch` to use theme tokens
        (`--primary`, `--gray-300`).

## Low Priority (Consistency & Cleanup)

- [x] **Empty Fragment**: `header-components/fragments/navigation/index.html`
      contains only `&nbsp;`. Replaced with a Freemarker comment
      `[#-- empty --]` to avoid rendering visible whitespace.
- [x] **Assumed Globals**: Fragments like `meter-reading` assume `PubSub` and
      `Liferay.CommerceContext` are globally available without checks.
- [x] **Refactor Dynamic Styling**: Separate dynamic CSS variable assignments
      from static CSS rules. Move static rules to `index.css` and define
      variables in the `index.html`.
  - [x] `form-fragments/fragments/star-rating/index.html` (Refactored to
        separate static/dynamic CSS)

## New Fragment Ideas (Wishlist)

High-impact, visually appealing components to extend the repository's
capabilities.

### Data Visualization (Object Linked)

- [x] **Dynamic Bar/Line Charts**: Fragments that integrate a library like
      Chart.js. Configuration should allow users to select a Liferay Object and
      map specific fields to the X and Y axes. (Implemented in
      `gemini-generated` collection)
- [x] **Radial KPI Gauge**: A high-fidelity radial progress indicator for
      showing single metrics (e.g., \"Savings Goal Progress\") derived from
      Object data. (Implemented in `gemini-generated` collection)
- [x] **Dynamic Collection Slider**: A high-performance slider that utilizes
      Liferay collections, dynamically rendering items with built-in caching and
      Meridian theme integration. (Implemented in `gemini-generated` collection)
- [x] **GitHub-style Activity Heatmap**: A visualization grid showing data
      density (e.g. check-ins, readings) over time from Object data.
      (Implemented in `gemini-generated` collection)
- [x] **Meta-Object Table**: A table that dynamically discovers fields using the
      Object Admin API and renders data with sorting/filtering. (Implemented
      with CSV Export in `gemini-generated` collection)
- [x] **Meta-Object Form**: A form that auto-generates inputs based on an Object
      definition, supporting create and edit modes. (Implemented in
      `gemini-generated` collection)
- [x] **Meta-Object Record View**: A single-entry detail view that dynamically
      discovers fields and provides a high-fidelity PDF export feature.
      (Implemented in `gemini-generated` collection)
- [x] **Dynamic Object Gallery**: A grid/masonry view that maps Object fields to
      image, title, and description slots dynamically. (Implemented in
      `gemini-generated` collection)

### High-Fidelity UI Components

- [x] **Modern Parallax Hero**: A hero fragment with multi-layer parallax
      effects and configurable scroll-triggered text animations. (Implemented in
      `gemini-generated` collection)
- [x] **Object-Based Comparison Table**: A visually rich comparison grid (e.g.,
      for service plans) that can dynamically pull features and pricing from
      Liferay Objects. (Implemented in `gemini-generated` collection)
- [x] **Step-by-Step Interactive Wizard**: A self-contained fragment set for
      managing multi-stage user journeys with Meridian-styled transition
      animations. (Implemented in `gemini-generated` collection)
- [x] **Animated Metric Counters**: Simple but effective cards that animate
      numeric totals (e.g., \"Total Users\") when they enter the viewport.
      (Implemented in `gemini-generated` collection)
- [x] **Interactive Event Timeline**: A vertical/horizontal timeline that
      dynamically renders milestones from a Liferay Object. (Implemented in
      `gemini-generated` collection)
- [x] **AI Assistant Chat UI**: A polished messaging interface for integrating
      with AI backend extensions. (Implemented in `gemini-driven` collection)
- [x] **Modern Search Overlay**: A specialized search component that expands
      into a full-screen categorical navigation/search interface. (Implemented
      in `gemini-generated` collection)

## Responsiveness Improvements

Tasks to ensure a high-quality experience across all device sizes
(Mobile-First).

### Priority Refactors

- [x] **Meter Reading**: Convert from fixed-width inline-block layout to a
      responsive Grid/Flexbox design. Ensure digits wrap or scale on small
      screens (e.g., iPhone SE). (Implemented)
- [x] **Meta-Object Table**: Implement a stacked mobile view. Use CSS `:before`
      content or `data-label` to display column headers alongside cell data when
      the table collapses. (Implemented)
- [x] **Loan Calculator**: Remove hardcoded `max-width: 400px`. Use relative
      widths and responsive padding to better adapt to parent grid columns.
      (Implemented)
- [x] **Navigation Fragment**: Audit for mobile wrapping. Ensure long menus
      don't overflow horizontally or overlap with other header elements.
      (Implemented)

### Visual Polish

- [x] **Dynamic Collection Slider**: Add mobile-specific configuration or logic
      to adjust `slidesPerView` based on screen width (e.g., 1 slide on mobile,
      3 on desktop). (Implemented)
- [x] **Pricing Comparison Grid**: Ensure cards transition from a multi-column
      desktop layout to a single-column stacked layout on mobile. (Implemented)
- [x] **Card Components**: Review `primary-card` and `secondary-card` for
      font-size scaling and padding adjustments on small viewports. (Implemented
      for both primary and secondary cards)
- [x] **Parallax Hero**: Ensure text doesn't overlap or become unreadable on
      small screens when the background image scales. (Implemented)

## Accessibility Improvements (A11y)

Tasks to ensure compliance with WCAG standards and a better experience for
assistive technology users.

### High Priority (Navigation & Forms)

- [x] **Star Rating**: Add `<fieldset>` and `<legend>` for grouping radio
      inputs. Replace `aria-selected` with `aria-checked`. Add
      `aria-label="Clear rating"` to the reset button. (Implemented)
- [x] **Meter Reading**: Group digit inputs within a `<fieldset>` with a
      descriptive `<legend>`. Add `aria-label` to each digit input (e.g.,
      \"Digit 1 of 6\"). (Implemented)
- [x] **Collection Slider**: Convert pagination `div` dots to `<button>`
      elements. Add `aria-roledescription=\"carousel\"` to the container and
      `aria-live=\"polite\"` to the status area. (Implemented)
- [x] **AI Assistant**: Add `aria-live=\"polite\"` to the message container so
      new messages are announced. Ensure bubbles are semantically labeled as
      \"Assistant\" or \"You\". (Implemented)

### Interactive Elements

- [x] **Loan Calculator**: Add `aria-live=\"polite\"` to the summary paragraph
      so updates to total payments are announced as the user slides.
      (Implemented)
- [x] **Object-Linked Chart**: Provide an `aria-label` or a visually hidden
      fallback table that summarizes the chart data for screen readers.
      (Implemented)
- [x] **All Icon-Only Buttons**: Audit all fragments (e.g., `back-button`,
      `icon-button`, `slider-btn`) to ensure they have an explicit `aria-label`.
      (Implemented)
- [x] **Meta-Object Table**: Implemented modal focus management, semantic
      headers (`scope="col"`), and aria-labels for pagination.
- [x] **Pricing Grid**: Enhanced toggle with `role="switch"`, `aria-checked`,
      and improved semantic structure using `<article>` and headings.
- [x] **Event Timeline**: Converted to an ordered list (`<ol>`) with proper
      `<time>` elements and region labeling.

### Low Priority (Visual & Structural)

- [x] **CSS Variable & Fallback Audit**: Ensure all fragments use Meridian theme
      tokens for default colors and provide accessible fallbacks. (Completed
      repository-wide refactor)
- [x] **Focus Management**: Ensure a visible focus ring is present for all
      interactive elements, especially in fragments with custom-styled inputs
      like `toggle-switch`. (Implemented for toggle-switch)
- [x] **Missing Alt Text/Labels**: Retrofitted profile summaries, public
      comments, and user bars with descriptive alt text and aria-labels for
      non-textual elements.

## Future Roadmap & Architecture Improvements

These tasks focus on long-term stability, modern API adoption, and
cross-fragment consistency.

### 1. Modern Data Fetching & Performance

- [x] **Eliminate Synchronous Requests**: Replace `XMLHttpRequest` with `fetch`
      in `dashboard-filter`.
  - **Plan**: Refactor `getSync` to an async `getAsync` function using `fetch`
    and update all callers to `await` the results.
  - **Benefits**: Prevents browser UI freezes; follows modern JS best practices.
  - **Rank**: Ease: 1/5 | Impact: 4/5 (High UX impact).
- [x] **Implement Debouncing**: Add a debounce helper to all autocomplete and
      search fragments.
  - **Plan**: Create a shared `debounce` utility and wrap `input` listeners in
    `autocomplete-(object)`, `autocomplete-(picklist)`, and `dashboard-filter`.
  - **Benefits**: Significantly reduces server load and improves responsiveness
    during rapid typing.
  - **Rank**: Ease: 2/5 | Impact: 4/5 (Performance/Scale).
- [x] **Fragment Instance Isolation**: Audit all fragments for
      `document.querySelector` usage.
  - **Plan**: Systematically replace `document` with `fragmentElement` for
    internal element targeting, especially in `purchased-products` and
    `dashboard-filter`.
  - **Benefits**: Ensures multiple instances of the same fragment can coexist on
    a page without state collision.
  - **Rank**: Ease: 2/5 | Impact: 5/5 (Critical for reusability).

### 2. Deep Integration & Site-Scoping

- [x] **Universal Site-Scoping**: Ensure all fragments hitting Object APIs
      support site-scoped data.
  - **Plan**: Implement the "Admin API Discovery" pattern (Requirement 3) in
    `autocomplete-(object)`, `dashboard-filter`, `audit-button`,
    `meter-reading`, `custom-event-listener`, `campaign-initialiser`, and
    `form-session-id`.
  - **Benefits**: Makes fragments compatible with Site-scoped Objects, which are
    common in multi-tenant Liferay environments.
  - **Rank**: Ease: 3/5 | Impact: 5/5 (Mandatory for compliance).
- [x] **Robust Record Identifiers**: Retrofit older fragments with strict
      identifier validation.
  - **Plan**: Add `isValidIdentifier()` helper to `purchased-products`,
    `audit-button`, `comment`, `meter-reading`, `dashboard-filter`,
    `custom-event-listener`, `campaign-initialiser`, `ping`, `submit-button`,
    and `form-session-id`.
  - **Benefits**: Prevents 404/400 errors from uninitialized variables or "null"
    strings reaching the API.
  - **Rank**: Ease: 1/5 | Impact: 3/5 (Stability).

### 3. Advanced UX & Compliance

- [x] **Privacy-First Tracking**: Update `cookie-sniffer` to be consent-aware.
  - **Plan**: Add configuration for "Consent Category" and check
    `Liferay.Consent` (if available) before tracking.
  - **Benefits**: Ensures GDPR/ePrivacy compliance for analytics tracking.
  - **Rank**: Ease: 2/5 | Impact: 4/5 (Legal/Trust).
- [x] **Smart Title Adoption**: Roll out Smart Title logic to all display
      fragments.
  - **Plan**: Implement the configuration-precedence pattern in
    `loan-application-calculator`, `service-card`, and `activity-log`.
  - **Benefits**: Provides "zero-config" labels while allowing Page Editors to
    override them.
  - **Rank**: Ease: 2/5 | Impact: 3/5 (Editor Experience).

### 4. Accessibility (A11y) Refinement

- [x] **Rich Autocomplete ARIA**: Implement full WAI-ARIA patterns for
      autocomplete fragments.
  - **Plan**: Add `role="combobox"`, `aria-autocomplete="list"`,
    `aria-expanded`, and manage `aria-activedescendant` during keyboard
    navigation.
  - **Benefits**: Makes search/selection interfaces usable for screen reader
    users.
  - **Rank**: Ease: 4/5 | Impact: 5/5 (A11y Compliance).
- [x] **Keyboard Navigation Overhaul**: Ensure all interactive fragments (Tabs,
      Menus, Sliders) are fully keyboard-navigable.
  - **Plan**: Audit focus states and implement `Enter`/`Space` handlers where
    missing (e.g. `segmented-numeric` digit focus).
  - **Benefits**: Essential for users with motor impairments.
  - **Rank**: Ease: 3/5 | Impact: 5/5 (A11y).

### 5. Empty State Patterns

- [x] **Standardize Empty States**: Implement consistent "no data" patterns
      across all data-driven fragments.
  - **Plan**: Create a shared CSS/HTML pattern for empty states (e.g. including
    an illustration, title, and "Add New" call to action where appropriate).
  - **Fragments**: `meta-object-table`, `object-linked-chart`,
    `activity-heatmap`, `purchased-products`, `dynamic-collection-slider`,
    `dynamic-object-gallery`, `search-overlay`.
  - **Rank**: Ease: 2/5 | Impact: 4/5 (Visual polish / UX).

## Review Phase III (Architecture & Localization Hardening)

Final refinements to repository standards and build integrity.

### 1. Shared Resources Migration (Rule #12)

- [x] **Formalize Shared Resources**: Migrate `shared-logic/` to root
      `shared-resources/` and update `create-fragment-zips.sh` to bundle
      declared logic via `fragment-build.json`.
- [x] **Absolute Path ZIP Generation**: Hardened the build script to use
      absolute paths, ensuring consistent ZIP creation regardless of current
      working directory.
- [x] **Dependency Audit**: Verified all 106 fragments have correct
      `fragment-build.json` declarations for shared JS utilities (e.g.,
      `dom.js`, `discovery.js`).

### 2. Localization (i18n) Enforcement

- [x] **Prohibit Lazy Keys**: Updated the Fragment Quality Gate
      (`lint-fragments.js`) to fail if any localization key equals its value
      (e.g., `key=key`).
- [x] **100% Meaningful Coverage**: Performed a repository-wide fix to transform
      hundreds of technical keys into polished, human-readable English strings.
- [x] **Dangling Property Audit**: Removed legacy property keys no longer
      referenced by configuration or logic.
