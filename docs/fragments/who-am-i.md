# Who Am I

A diagnostic fragment that displays the current user's name and ID, and optionally queries a REST endpoint to verify authentication and identity.

## Features

- **Standard Display**: Automatically shows `Liferay.ThemeDisplay.getUserName()` and ID on load.
- **REST Validation**: Trigger a fetch to a configurable endpoint to see how the server identifies the session.
- **OAuth2 Support**: Can be configured with a User Agent Application ERC to use specific OAuth2 scopes.

## Configuration

- **Endpoint URL**: The REST API to query (e.g., `/o/headless-admin-user/v1.0/my-user-account`).
- **User Agent Application ERC**: (Optional) The ERC of an OAuth2 User Agent Application to use for the request.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`validation.js`**: Uses `isValidIdentifier` to ensure the endpoint URL is configured before attempting a fetch.
