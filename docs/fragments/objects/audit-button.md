# Audit Button

The **Audit Button** fragment provides a standard UI component for manual
auditing or verification actions on Object records.

## Key Features

- **Visual Status**: Changes appearance based on the current audit state of the
  record.
- **Workflow Hook**: Can be configured to trigger a transition in a Liferay
  Workflow.
- **Permission Sensitive**: Automatically hides or disables if the user lacks
  audit permissions.
- **Site-Scoped Discovery**: Automatically resolves the correct API path for
  both Company and Site-scoped Objects.

## Configuration

- **Object ERC**: The External Reference Code of the target Object definition
  (defaults to `AUDIT_ENTRY`).
- **Status Field**: The field in the Liferay Object that tracks audit status.
- **Success Message**: Localized feedback shown after a successful audit action.
- **Audit Action Prefix/Suffix**: Configurable text to wrap around the button
  label for the audit log.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`discovery.js`**: Uses `resolveObjectPathByERC` to dynamically discover the
  REST endpoint.
- **`validation.js`**: Uses `isValidIdentifier` for robust configuration
  checking.
