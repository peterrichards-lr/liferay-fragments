# Fragment Recipes & Workflows

This guide provides common "recipes" for combining individual fragments into powerful, end-to-end user journeys within Liferay DXP.

---

## 1. The "Smart Form" Journey
**Goal**: Track a user across multiple forms, pre-populate their data, and redirect them upon completion.

### Fragments Required:
*   `Generate Form Session ID` (on the first page/form)
*   `Form Populator` (on subsequent pages/forms)
*   `Refresh Page` or `Redirect Page` (on the final submission page)

### The Recipe:
1.  **Initialize**: Place the `Generate Form Session ID` fragment on your landing page. It will create a unique UUID and store it in a cookie.
2.  **Capture**: Map the `formSessionId` to a hidden field in your Liferay Form.
3.  **Handoff**: On the next page, use the `Form Populator` to pull data from previous steps (using URL parameters or session lookups) and inject it into the new form.
4.  **Complete**: After the final form is submitted, use the `Redirect Page` fragment to send the user to a "Thank You" dashboard or a checkout success page.

---

## 2. Full-Funnel Campaign Tracking
**Goal**: Attribute user actions to a specific marketing campaign and send conversion data to Analytics Cloud.

### Fragments Required:
*   `Pulse Campaign Initialiser`
*   `Custom Event Listener`
*   `Pulse Button` (Optional)

### The Recipe:
1.  **Identify**: Place the `Pulse Campaign Initialiser` on your landing page. It will automatically parse UTM parameters and create a "Campaign" Object entry in Liferay.
2.  **Monitor**: Add the `Custom Event Listener` to any page where you want to track "Micro-Conversions" (e.g., clicking a 'Download PDF' button or a 'Play Video' button).
3.  **Sync**: Configure the listener to target specific CSS selectors. Every time a user clicks those elements, the fragment will:
    *   Create a "Campaign Interaction" Object entry.
    *   Send a custom event to **Liferay Analytics Cloud** with the campaign ID attached.

---

## 3. Dynamic Data Dashboards
**Goal**: Create an interactive dashboard where users can filter and visualize Object data.

### Fragments Required:
*   `Dashboard Filter`
*   `Object-Linked Chart` (from Gemini Generated collection)
*   `Meta-Object Table`

### The Recipe:
1.  **Layout**: Use the `Dashboard Container` to define your workspace.
2.  **Control**: Add the `Dashboard Filter` to the top of the page. Configure it to trigger a "Refresh" event when dates or targets are changed.
3.  **Visualize**: Place an `Object-Linked Chart` below the filter. Use JavaScript events to listen for the filter's "Refresh" signal and update its data query dynamically.
4.  **Detail**: Add a `Meta-Object Table` to provide a granular view of the filtered records, enabling CSV exports for deep analysis.
