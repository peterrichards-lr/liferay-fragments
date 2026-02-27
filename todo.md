# TODO: Identified Issues and Improvements

This list contains bugs, potential issues, and suggested improvements identified during the initial repository review.

## High Priority (Bugs & Security)

- [x] **Brittle Query String Parsing**: `forms/fragments/form-populator/index.js` uses a manual string replacement/JSON.parse hack for query strings. This is insecure and will fail on many valid query strings. Should use `URLSearchParams`.
- [x] **Singleton Enforcement**: Add collision detection to fragments intended as singletons. Display a clear UI warning if multiple instances are added to the page.
    - `finance/fragments/loan-calculator/`
    - `meter-reading/fragments/meter-reading/`
- [x] **Standardize Configuration Filenames**: Rename `index.json` to `configuration.json` and update `fragment.json` references for better clarity.
    - `header-components/fragments/navigation/`
    - `header-components/fragments/linear-gradient-container/`
    - `header-components/fragments/linear-gradient-container-(custom)/`
- [x] **Mismatched Label/Input IDs**: In `meter-reading/fragments/meter-reading/index.html`, the label `for="meter-reading-date-date-input"` does not match the input `id="meter-reading-date-input"`.
- [x] **Hardcoded Object Paths**: `meter-reading/fragments/meter-reading/index.js` has a hardcoded API path `/o/c/waterreadings/`. This should ideally be configurable.
- [x] **Freemarker Safety**: Audit all fragments and add default values (`!`) for all configuration variables in `index.html` to prevent `NullPointerException` errors.

## Medium Priority (Logic & Compatibility)

- [x] **Incorrect Attribute Access**: In `form-fragments/fragments/star-rating/index.js`, `inputElement.attributes?.readOnly` is used. `attributes` is a `NamedNodeMap`, and `readOnly` is not a property of it. Should use `inputElement.readOnly` or `inputElement.hasAttribute('readonly')`.
- [x] **Deprecated APIs**: Use of `event.keyCode` and `event.charCode` in `meter-reading/fragments/meter-reading/index.js`. Should migrate to `event.key`.
- [x] **Accidental Global Scoping in JS**: Refactor JS logic to use `fragmentElement` for internal element selectors. Explicitly preserve `document/window` usage for page-level state or intentional cross-fragment interaction.
    - `form-fragments/fragments/autocomplete-(object)/index.js`: `document.getElementsByClassName('autocomplete-items')` is intentional for closing all lists.
    - `forms/fragments/form-populator/index.js`: `document.querySelector` is intentional for targeting external form fields.
    - `form-fragments/fragments/user-field/index.js`: Refactored internal selectors to `fragmentElement`.
    - `populated-form-fields/fragments/text-derived-value/index.js`: Refactored internal selectors to `fragmentElement`.
- [x] **Browser Compatibility**: `form-fragments/fragments/autocomplete-(object)/index.js` uses `Object.hasOwn`. Use `Object.prototype.hasOwnProperty.call()` for better compatibility.

## Best Practices & Safety

- [x] **ID Scoping**: Even for fragments intended as singletons, it is a best practice to prefix IDs with `${fragmentEntryLinkNamespace}` to prevent accidental collisions.
    - `finance/fragments/loan-calculator/index.html`
    - `meter-reading/fragments/meter-reading/index.html`
- [ ] **Add Thumbnails**: Generate and add `thumbnail.png` for fragments missing them to improve the Liferay UI experience.

## Theme Integration (Meridian)

Standardize fragments to use Meridian CSS tokens for colors, spacing, and typography.

- [x] **Adopt Theme Tokens**: Replace hardcoded values with Meridian CSS variables.
    - [x] **Colors**: Use `var(--primary)`, `var(--secondary)`, `var(--body-color)`, `var(--body-background-color)`, etc.
        - [x] `finance/fragments/loan-calculator/index.css`
        - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
        - [x] `header-components/fragments/navigation/index.css`
        - [x] `layout-components/fragments/primary-card/index.css`
        - [x] `layout-components/fragments/secondary-card/index.css`
    - [x] **Spacers**: Use `var(--spacer-1)` through `var(--spacer-10)` instead of absolute `rem` or `px` values.
        - [x] `finance/fragments/loan-calculator/index.css`
        - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
        - [x] `header-components/fragments/navigation/index.css`
    - [x] **Typography**: Use `var(--font-size-base)`, `var(--h1-font-size)`, `var(--font-weight-semi-bold)`, etc.
        - [x] `finance/fragments/loan-calculator/index.css`
        - [x] `commerce/fragments/dynamic-badge-overlay/index.css`
- [x] **Review Redundant Configuration**: Perform a case-by-case review of color/style fields in `configuration.json` that may now be redundant due to Meridian tokens.
    - [x] `form-fragments/fragments/star-rating/`: Updated default colors to use Meridian tokens (`--warning`, `--gray-300`).
    - [x] `meter-reading/fragments/meter-reading/`: Updated default colors to use Meridian tokens (`--white`, `--black`, `--danger`, `--primary`).
- [x] **Audit Component Tokens**: Align with Meridian component variables.
    - [x] `layout-components/`: Updated cards to use theme tokens and fragment-level scoping.
    - [x] `form-fragments/`: Updated `toggle-switch` to use theme tokens (`--primary`, `--gray-300`).

## Low Priority (Consistency & Cleanup)

- [x] **Empty Fragment**: `header-components/fragments/navigation/index.html` contains only `&nbsp;`. Replaced with a Freemarker comment `[#-- empty --]` to avoid rendering visible whitespace.
- [x] **Assumed Globals**: Fragments like `meter-reading` assume `PubSub` and `Liferay.CommerceContext` are globally available without checks.
- [x] **Refactor Dynamic Styling**: Separate dynamic CSS variable assignments from static CSS rules. Move static rules to `index.css` and define variables in the `index.html`.
    - [x] `form-fragments/fragments/star-rating/index.html` (Refactored to separate static/dynamic CSS)

## New Fragment Ideas (Wishlist)

High-impact, visually appealing components to extend the repository's capabilities.

### Data Visualization (Object Linked)
- [x] **Dynamic Bar/Line Charts**: Fragments that integrate a library like Chart.js. Configuration should allow users to select a Liferay Object and map specific fields to the X and Y axes. (Implemented in `gemini-generated` collection)
- [x] **Radial KPI Gauge**: A high-fidelity radial progress indicator for showing single metrics (e.g., \"Savings Goal Progress\") derived from Object data. (Implemented in `gemini-generated` collection)
- [x] **Dynamic Collection Slider**: A high-performance slider that utilizes Liferay collections, dynamically rendering items with built-in caching and Meridian theme integration. (Implemented in `gemini-generated` collection)
- [x] **GitHub-style Activity Heatmap**: A visualization grid showing data density (e.g. check-ins, readings) over time from Object data. (Implemented in `gemini-generated` collection)
- [x] **Meta-Object Table**: A table that dynamically discovers fields using the Object Admin API and renders data with sorting/filtering. (Implemented with CSV Export in `gemini-generated` collection)
- [x] **Meta-Object Form**: A form that auto-generates inputs based on an Object definition, supporting create and edit modes. (Implemented in `gemini-generated` collection)
- [x] **Meta-Object Record View**: A single-entry detail view that dynamically discovers fields and provides a high-fidelity PDF export feature. (Implemented in `gemini-generated` collection)
- [x] **Dynamic Object Gallery**: A grid/masonry view that maps Object fields to image, title, and description slots dynamically. (Implemented in `gemini-generated` collection)

### High-Fidelity UI Components
- [x] **Modern Parallax Hero**: A hero fragment with multi-layer parallax effects and configurable scroll-triggered text animations. (Implemented in `gemini-generated` collection)
- [x] **Object-Based Comparison Table**: A visually rich comparison grid (e.g., for service plans) that can dynamically pull features and pricing from Liferay Objects. (Implemented in `gemini-generated` collection)
- [ ] **Step-by-Step Interactive Wizard**: A self-contained fragment set for managing multi-stage user journeys with Meridian-styled transition animations.
- [x] **Animated Metric Counters**: Simple but effective cards that animate numeric totals (e.g., \"Total Users\") when they enter the viewport. (Implemented in `gemini-generated` collection)
- [x] **Interactive Event Timeline**: A vertical/horizontal timeline that dynamically renders milestones from a Liferay Object. (Implemented in `gemini-generated` collection)
- [x] **AI Assistant Chat UI**: A polished messaging interface for integrating with AI backend extensions. (Implemented in `gemini-generated` collection)
- [ ] **Modern Search Overlay**: A specialized search component that expands into a full-screen categorical navigation/search interface.

## Responsiveness Improvements

Tasks to ensure a high-quality experience across all device sizes (Mobile-First).

### Priority Refactors
- [x] **Meter Reading**: Convert from fixed-width inline-block layout to a responsive Grid/Flexbox design. Ensure digits wrap or scale on small screens (e.g., iPhone SE). (Implemented)
- [x] **Meta-Object Table**: Implement a stacked mobile view. Use CSS `:before` content or `data-label` to display column headers alongside cell data when the table collapses. (Implemented)
- [x] **Loan Calculator**: Remove hardcoded `max-width: 400px`. Use relative widths and responsive padding to better adapt to parent grid columns. (Implemented)
- [x] **Navigation Fragment**: Audit for mobile wrapping. Ensure long menus don't overflow horizontally or overlap with other header elements. (Implemented)

### Visual Polish
- [x] **Dynamic Collection Slider**: Add mobile-specific configuration or logic to adjust `slidesPerView` based on screen width (e.g., 1 slide on mobile, 3 on desktop). (Implemented)
- [x] **Pricing Comparison Grid**: Ensure cards transition from a multi-column desktop layout to a single-column stacked layout on mobile. (Implemented)
- [x] **Card Components**: Review `primary-card` and `secondary-card` for font-size scaling and padding adjustments on small viewports. (Implemented for both primary and secondary cards)
- [x] **Parallax Hero**: Ensure text doesn't overlap or become unreadable on small screens when the background image scales. (Implemented)

## Accessibility Improvements (A11y)

Tasks to ensure compliance with WCAG standards and a better experience for assistive technology users.

### High Priority (Navigation & Forms)
- [x] **Star Rating**: Add `<fieldset>` and `<legend>` for grouping radio inputs. Replace `aria-selected` with `aria-checked`. Add `aria-label="Clear rating"` to the reset button. (Implemented)
- [x] **Meter Reading**: Group digit inputs within a `<fieldset>` with a descriptive `<legend>`. Add `aria-label` to each digit input (e.g., \"Digit 1 of 6\"). (Implemented)
- [x] **Collection Slider**: Convert pagination `div` dots to `<button>` elements. Add `aria-roledescription=\"carousel\"` to the container and `aria-live=\"polite\"` to the status area. (Implemented)
- [x] **AI Assistant**: Add `aria-live=\"polite\"` to the message container so new messages are announced. Ensure bubbles are semantically labeled as \"Assistant\" or \"You\". (Implemented)

### Interactive Elements
- [x] **Loan Calculator**: Add `aria-live=\"polite\"` to the summary paragraph so updates to total payments are announced as the user slides. (Implemented)
- [x] **Object-Linked Chart**: Provide an `aria-label` or a visually hidden fallback table that summarizes the chart data for screen readers. (Implemented)
- [x] **All Icon-Only Buttons**: Audit all fragments (e.g., `back-button`, `icon-button`, `slider-btn`) to ensure they have an explicit `aria-label`. (Implemented)

### Low Priority (Visual & Structural)
- [ ] **Color Contrast**: Verify that custom color pickers in `configuration.json` have defaults that meet WCAG AA contrast ratios against their respective backgrounds.
- [x] **Focus Management**: Ensure a visible focus ring is present for all interactive elements, especially in fragments with custom-styled inputs like `toggle-switch`. (Implemented for toggle-switch)
