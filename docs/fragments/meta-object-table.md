# Meta-Object Table

A powerful data table that dynamically discovers fields and renders Object data with functional pagination.

## Features

- **Field Discovery**: Automatically fetches and renders headers based on the Object definition.
- **Column Customization**: Strictly display only the fields you want, in the order you specify.
- **Row Actions**: Built-in support for "View" and "Edit" actions per record.
- **Integration Modes**: Connect to other fragments via:
  - **JS Events**: Trigger other fragments on the same page (e.g., Form or Record View).
  - **Redirect/Tab**: Navigate to detail pages with the record ID in the query string.
- **Functional Pagination**: Real-time server-side paging with Prev/Next controls.
- **CSV Export**: Built-in client-side CSV generation for all loaded data.
- **Responsive**: Stacks into a card-like view on mobile devices using data-labels.

## Visuals

![Meta-Object Table - Running View](../images/meta-object-table.png)

![Meta-Object Table - Configuration](../images/meta-object-table-config.png)

## Configuration

- **Object ERC**: The External Reference Code of the source Object.
- **Columns to Display**: Comma-separated list of field names to show.
- **Enable View/Edit Actions**: Toggle action icons in the table rows.
- **Action Modes**: Choose between "JS Event", "Redirect", or "New Tab".
- **Target URLs**: Specify the destination page for Redirect/Tab modes.
- **Page Size**: Number of entries per page.
- **Enable Pagination**: Toggle visibility of navigation controls.

## Inter-Fragment Events

The table dispatches the following events when configured in "JS Event" mode:

- `lfr-object-view-select`: For viewing record details.
- `lfr-object-form-select`: For editing a record.

Example Event Detail:

```json
{
  "objectERC": "COMPANY_MILESTONE",
  "recordId": "12345"
}
```
