# Fragment Recipes & Workflows

This guide provides common "recipes" for combining individual fragments into powerful, end-to-end user journeys within Liferay DXP.

---

## 1. The "Smart Form" Journey

**Goal**: Track a user across multiple forms, pre-populate their data, and redirect them upon completion.

### Fragments Required:

- `Generate Form Session ID` (on the first page/form)
- `Form Populator` (on subsequent pages/forms)
- `Refresh Page` or `Redirect Page` (on the final submission page)

### The Recipe:

1.  **Initialize**: Place the `Generate Form Session ID` fragment on your landing page. It will create a unique UUID and store it in a cookie.
2.  **Capture**: Map the `formSessionId` to a hidden field in your Liferay Form.
3.  **Handoff**: On the next page, use the `Form Populator` to pull data from previous steps (using URL parameters) and inject it into the new form.
4.  **Complete**: After the final form is submitted, use the `Redirect Page` fragment to send the user to a "Thank You" dashboard. Configure the "Trigger Text" to match the Form's success message.

---

## 2. Interactive Multi-Step Onboarding

**Goal**: Create a guided onboarding experience where users provide data in stages, with progress tracking.

### Fragments Required:

- `Interactive Wizard` (from Gemini Generated collection)
- `Meta-Object Form` (multiple instances)
- `Tracker` (Optional, for visual progress)

### The Recipe:

1.  **Guided Navigation**: Place the `Interactive Wizard` at the top of your page. Configure the number of steps (e.g., 3).
2.  **Drop-Zones**: In each wizard step's drop-zone, place a `Meta-Object Form`.
3.  **Step Mapping**: Configure each form to handle a specific slice of the onboarding data (e.g., Step 1: Profile, Step 2: Preferences, Step 3: Confirmation).
4.  **Flow**: The wizard handles the visibility of each form automatically, providing "Next" and "Back" navigation with Meridian-styled animations.

---

## 3. Intelligent E-commerce Product Badging

**Goal**: Automatically highlight products with "New", "Sale", or "Limited Stock" badges without manual editing.

### Fragments Required:

- `Dynamic Badge Overlay`
- `Liferay Commerce` Product Images

### The Recipe:

1.  **Integration**: Add the `Dynamic Badge Overlay` fragment into your product display template or page.
2.  **Smart Detection**: The fragment automatically detects the commerce context. It checks the product's:
    - **Price**: To display "X% Off" badges.
    - **Stock**: To display "Limited Stock" warnings based on a threshold.
    - **Display Date**: To display "New!" badges for recent arrivals.
3.  **Custom Mapping**: Alternatively, map the badge to a custom Object field for manual control (e.g., "Editor's Choice").

---

## 4. Dynamic Data Dashboards

---

## 6. Standardized Empty States & Configuration Warnings

**Goal**: Ensure fragments remain professional and helpful even when data is missing or the fragment isn't yet configured.

### The Pattern:

When building data-driven fragments (Tables, Charts, Lists), always implement the two-tier safety pattern using the `Liferay.Fragment.Commons` shared logic.

#### Mode A: Configuration Warning (For Editors)

Use `renderConfigWarning` when a required setting (like an Object ERC or API Path) is missing. This prevents the fragment from looking "broken" in the Page Editor and guides the user on how to fix it.

```javascript
if (!configuration.objectERC) {
  Liferay.Fragment.Commons.renderConfigWarning(
    container,
    "Please select an Object ERC in the fragment settings.",
    layoutMode,
  );
  return;
}
```

#### Mode B: Standard Empty State (For End-Users)

Use `renderEmptyState` when the configuration is correct, but the data source (API/Object) returns zero results. This uses Liferay's native "No Results" visual style.

```javascript
if (data.items.length === 0) {
  Liferay.Fragment.Commons.renderEmptyState(container, {
    title: "No Data Found",
    description: "Adjust your filters or add a new entry to see results here.",
  });
}
```

### Fragments Implementing this Pattern:

- `Meta-Object Table`
- `Object-Linked Chart`
- `Activity Heatmap`
- `Dynamic Collection Slider`
- `Purchased Products`
