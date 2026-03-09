# Public Comments

A specialized comment display fragment designed to show public-facing comments associated with a specific record (e.g., a Support Ticket).

## Key Features

- **Contextual Filtering**: Automatically filters comments based on a parent record ID (Ticket ID) retrieved from the URL or configuration.
- **Rich Meta-Data**: Displays commenter images, names, and formatted timestamps.
- **Site-Scoped Discovery**: Automatically resolves the correct API path for both Company and Site-scoped Comment Objects.

## Configuration

- **Object ERC**: The External Reference Code of the target Comment Object.
- **Ticket ID Source**: Choose between path, query string, or a fixed dummy ID for testing.
- **Relationship Field**: The API name of the relationship field linking comments to the ticket.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`discovery.js`**: Uses `resolveObjectPathByERC` to dynamically discover the REST endpoint.
- **`validation.js`**: Uses `isValidIdentifier` for robust Ticket ID and configuration checking.
