# Audit Button

The **Audit Button** fragment provides a standard UI component for manual auditing or verification actions on Object records.

## Key Features

- **Visual Status**: Changes appearance based on the current audit state of the record.
- **Workflow Hook**: Can be configured to trigger a transition in a Liferay Workflow.
- **Permission Sensitive**: Automatically hides or disables if the user lacks audit permissions.

## Configuration

- **Status Field**: The field in the Liferay Object that tracks audit status.
- **Success Message**: Localized feedback shown after a successful audit action.
