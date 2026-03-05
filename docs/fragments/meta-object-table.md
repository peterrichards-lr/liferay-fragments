# Meta-Object Table

A powerful data table that dynamically discovers fields and renders Object data with functional pagination.

## Features
- **Field Discovery**: Automatically fetches and renders headers based on the Object definition.
- **Column Customization**: Strictly display only the fields you want, in the order you specify.
- **Functional Pagination**: Real-time server-side paging with Prev/Next controls.
- **CSV Export**: Built-in client-side CSV generation for all loaded data.
- **Responsive**: Stacks into a card-like view on mobile devices using data-labels.

## Configuration
- **Object ERC**: The source Object (e.g., `WATER_READING`). By repository convention for showcase samples, this is the Object name in uppercase with underscores.
- **Columns to Display**: Comma-separated list of field names to show.
- **Page Size**: Number of entries per page.
- **Enable Pagination**: Toggle visibility of navigation controls.
