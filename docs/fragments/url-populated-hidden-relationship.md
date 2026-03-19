# URL Populated Hidden Relationship

The **URL Populated Hidden Relationship** fragment automatically maps a record ID from the browser's URL query string to a hidden relationship field.

## Key Features

- **URL Context Extraction**: Reads parameters like `?entryId=123` or `?erc=XYZ` and injects them into the form.
- **Support for Multiple Identifiers**: Compatible with both internal IDs and External Reference Codes (ERCs).
- **Dynamic Linking**: Essential for "Contact Us about this Item" or "Submit Review" workflows.

## Configuration

- **URL Parameter**: The name of the query parameter to monitor (e.g., `id`).
- **Relationship Name**: The Object relationship field to populate.
