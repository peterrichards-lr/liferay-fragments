# Meta-Object Record View

A single-entry detail view that dynamically discovers fields and provides a high-fidelity PDF export feature.

## Features

- Renders all fields for a specific Object entry.
- **PDF Export**: Integrated jsPDF and html2canvas support for downloading high-quality reports.
- **Integration**: Automatically responds to the `lfr-object-view-select` JavaScript event from other fragments (like the Table).
- **URL Aware**: Automatically picks up `entryId` or `id` from the query string.
- Clean, label-value pair layout optimized for reports.

## Visuals

![Meta-Object Record View - Running View](../images/meta-object-record-view.png)

![Meta-Object Record View - Configuration](../images/meta-object-record-view-config.png)

## Configuration

- **Object ERC**: The source Object definition (e.g., `COMPANY_MILESTONE`).
- **Fallback Record ID**: Used if no ID is found in the page URL or via events.
- **Accent Color**: Custom theme color for labels and headers.

## External Selection (JS Event)

You can trigger the record view to load a specific record using a custom event:

```javascript
window.dispatchEvent(
  new CustomEvent("lfr-object-view-select", {
    detail: {
      objectERC: "COMPANY_MILESTONE",
      recordId: "12345",
    },
  }),
);
```
