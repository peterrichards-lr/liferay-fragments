# Form Session ID

A specialized utility fragment that links a form submission to an existing `applicant` record by matching a session ID stored in a cookie.

## Features

- **Automatic Linking**: Searches for an applicant record with a matching `sessionID`.
- **Relationship Injection**: If a match is found, it automatically populates a hidden relationship field in the form.
- **Site-Scoped Discovery**: Automatically resolves the correct API path for the `applicants` Object.

## Configuration

- **Cookie Name**: The name of the cookie containing the session ID.
- **Applicant Relationship ID**: The name of the relationship field in the form to populate.
- **Enable Debug**: Toggle console logging for troubleshooting.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`discovery.js`**: Uses `resolveObjectPath` to dynamically discover the REST endpoint.
- **`validation.js`**: Uses `isValidIdentifier` for robust session ID checking.
