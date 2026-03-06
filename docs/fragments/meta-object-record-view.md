# Meta-Object Record View

A single-entry detail view that dynamically discovers fields and provides a high-fidelity PDF export feature.

## Features

- **Self-Discovering**: Renders all fields for a specific Object entry via the Object Admin API.
- **Mappable Title**: The record title is fully mappable and editable in the Page Editor. It intelligently defaults to the Object's localized name if not customized.
- **Hybrid Identification**: Supports identifying records by numeric **Record ID** or string **External Reference Code (ERC)**.
- **PDF Export**: Integrated jsPDF and html2canvas support for downloading high-quality reports.
- **Integration**: Automatically picks up record identifiers from URL parameters (`id`, `entryId`, `erc`, `entryERC`) or listens for the `lfr-object-view-select` JavaScript event.
- Clean, label-value pair layout optimized for reports.

## Visuals

![Meta-Object Record View - Running View](../images/meta-object-record-view.png)

![Meta-Object Record View - Configuration](../images/meta-object-record-view-config.png)

## Configuration

- **Object ERC**: The source Object definition (e.g., `COMPANY_MILESTONE`).
- **Fallback Record Identifier**: A specific record value to display if none is found in the page URL or via events.
- **Identifier Type**: Specify if the fallback identifier is a numeric **ID** or a string **ERC**.
- **Colors**: Pick custom colors for field labels and values to match your theme.

## External Selection (JS Event)

You can trigger the record view to load a specific record using a custom event. The fragment intelligently fetches the record based on whether you provide a numeric ID or a string ERC:

```javascript
window.dispatchEvent(
  new CustomEvent("lfr-object-view-select", {
    detail: {
      objectERC: "COMPANY_MILESTONE",
      recordId: "12345", // Or use recordERC: "MY_ERC_VALUE"
    },
  }),
);
```
