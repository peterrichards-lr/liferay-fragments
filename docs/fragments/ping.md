# Ping

A diagnostic fragment that verifies connectivity between the client browser and a Liferay REST endpoint.

## Features

- **Connectivity Test**: Trigger a fetch to a configurable endpoint.
- **Log View**: Displays the raw text response from the server in a scrollable textarea.
- **Protocol Awareness**: Automatically prepends `https://` if the endpoint is not absolute or root-relative.

## Configuration

- **Endpoint URL**: The REST API to query.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`validation.js`**: Uses `isValidIdentifier` to ensure the endpoint URL is configured before attempting a fetch.
