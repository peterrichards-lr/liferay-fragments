# Meta-Object Form

A truly dynamic form that auto-generates inputs based on a Liferay Object's definition.

## Features

- **Self-Discovering**: Fetches field metadata (type, required, label) at runtime via Object Admin API.
- **Dynamic Record Selection**: Optional dropdown to select existing records to edit, using the Object's "Entry Title Field".
- **Multiple Modes**: Support for "Add New", "Edit Specific", and "Select to Edit" workflows.
- **External Integration**: Automatically picks up record IDs from URL parameters (`id`, `entryId`) or listens for the `lfr-object-form-select` JavaScript event.
- **Production-Ready**: Supports submitting new entries or updating existing ones directly to the Custom Object API.

## Configuration

- **Object ERC**: The source Object definition (e.g., `COMPANY_MILESTONE`).
- **Enable Add New**: Allow creating new records (shows a blank form by default).
- **Enable Record Selection**: Display a dropdown at runtime to choose which record to edit.
- **Fixed Record ID**: Hardcode a specific record to always edit (overrides URL/Events).
- **Submit Button Color**: Custom theme color for the action button.

## External Selection (JS Event)

You can trigger the form to load a specific record from another fragment (like a table or chart) using a custom event:

```javascript
window.dispatchEvent(
  new CustomEvent("lfr-object-form-select", {
    detail: {
      objectERC: "COMPANY_MILESTONE",
      recordId: "12345",
    },
  }),
);
```
