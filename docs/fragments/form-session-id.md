# Form Session ID

The **Form Session ID** fragment allows for tracking and linking form submissions across a user's session using a persistent identifier.

## Key Features

- **Session Persistence**: Stores and retrieves a unique session ID from session storage.
- **Hidden Input**: Injects the ID into a hidden form field for submission.
- **Cross-Fragment Support**: Works in tandem with the "Generate Form Session ID" fragment.

## Configuration

- **Field ID**: The ID of the form field where the session ID should be injected.
- **Storage Key**: Custom key for session storage persistence.
