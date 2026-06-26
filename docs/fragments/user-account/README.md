# User & Account Fragments

A collection of fragments designed to display user-specific information and
facilitate the testing of authentication and authorization flows.

## Identity & Profile

- **Who Am I**: A simple utility fragment that displays the current
  authenticated user's name and Liferay ID. It's useful for verifying that the
  session is correctly established.

## Authentication & Connectivity

- **Ping**: A diagnostic tool used to test connectivity to external APIs or
  endpoints. It displays the raw response or provides clear error messages
  (e.g., "Unauthorized") if the request fails. This is particularly useful for
  verifying cross-origin (CORS) settings or authentication requirements.

## Authorization & Rights

- **My Rights**: A comprehensive fragment that demonstrates how to use
  `Liferay.OAuth2Client` to fetch and display a user's permissions.
  - **Roles**: Lists all Liferay roles assigned to the current user.
  - **Sites**: Displays the list of sites the user is a member of.
  - **User Groups**: Shows any user groups the user belongs to.
  - **OAuth2 Integration**: Uses a configured User Agent Application reference
    code to securely fetch data from protected headless endpoints.

## Key Features

- **OAuth2 Ready**: Demonstrates best practices for using Liferay's built-in
  OAuth2 client for secure data fetching.
- **Diagnostic Utilities**: Provides immediate feedback on authentication status
  and API connectivity.
- **Meridian Theme Integration**: Uses standard Clay components and Meridian
  typography for a consistent administrative UI.
