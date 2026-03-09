# Submit Button (Modified)

A specialized submit button designed to work in tandem with the **Confirmation Field** fragment. It ensures all client-side validation rules are met before allowing the form to be submitted to its configured API endpoint.

## Key Features

- **Coordinated Validation**: Specifically triggers and respects the validation state of **Confirmation Fields** on the same page.
- **REST Integration**: Submits the parent form's data as a JSON payload to a configurable REST endpoint.
- **Visual Feedback**: Provides immediate feedback via alerts upon successful or failed submission.

## Configuration

| Field           | Description                                                       | Default |
| :-------------- | :---------------------------------------------------------------- | :------ |
| **API Path**    | The REST endpoint URL where the form data will be POSTed.         | (Empty) |
| **Button Type** | The Meridian/Bootstrap button variant (primary, secondary, etc.). | primary |
| **Button Size** | The sizing of the button component.                               | (Empty) |

## Usage

1.  **Placement**: Place this button inside a Liferay Form containing one or more **Confirmation Fields**.
2.  **Endpoint**: Configure the `API Path` to point to your target Liferay Object or external API.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`validation.js`**: Uses `isValidIdentifier` to ensure the API Path is correctly configured before attempting submission.
