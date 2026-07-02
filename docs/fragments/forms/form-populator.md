# Form Populator

The **Form Populator** fragment provides a powerful way to pre-populate Liferay
Form fields using URL query parameters and JSON mapping.

## Key Features

- **URL Mapping**: Automatically extracts values from the query string and
  injects them into form fields.
- **JSON Configuration**: Define complex mappings between URL keys and form
  field IDs.
- **Robust Parsing**: Uses `URLSearchParams` for safe and reliable parameter
  handling.

## Configuration

- **Mapping JSON**: A JSON object defining the relationship between URL
  parameters and form fields.
- **Debug Mode**: Logs mapping attempts to the console for easier
  troubleshooting.
