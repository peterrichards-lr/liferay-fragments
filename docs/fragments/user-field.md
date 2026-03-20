# User Field

The **User Field** fragment automatically populates a form field with
information from the currently logged-in user (e.g., User ID, Email, or Full
Name).

## Key Features

- **User Context Integration**: Direct access to the `Liferay.ThemeDisplay` and
  User Objects.
- **Support for Custom Fields**: Can be extended to fetch custom user attributes
  via Headless APIs.
- **Privacy-First**: Operates on the client-side using existing session tokens.

## Configuration

- **User Attribute**: Choose which user property to map (e.g., `userId`,
  `emailAddress`, `screenName`).
- **Target Field ID**: The ID of the form field to populate.
