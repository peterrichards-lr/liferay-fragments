# My Rights

A diagnostic fragment that displays the current user's roles, sites, and user groups by querying Liferay's Headless User APIs.

## Features

- **Contextual Display**: Automatically shows the current user's name and ID.
- **Permission Overview**: Queries three distinct endpoints to gather Roles, Sites, and User Groups in one view.
- **Diagnostic Logging**: Responses are displayed in textareas for easy verification of API response formats.

## Configuration

- **Roles Endpoint URL**: Endpoint for user roles (e.g., `/o/headless-admin-user/v1.0/my-user-account/roles`).
- **Sites Endpoint URL**: Endpoint for user sites (e.g., `/o/headless-admin-user/v1.0/my-user-account/sites`).
- **User Groups Endpoint URL**: Endpoint for user groups (e.g., `/o/headless-admin-user/v1.0/my-user-account/user-groups`).
- **User Agent Application ERC**: (Optional) The ERC of an OAuth2 User Agent Application to use for the requests.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`validation.js`**: Uses `isValidIdentifier` to ensure all three endpoint URLs are configured before attempting to gather data.
