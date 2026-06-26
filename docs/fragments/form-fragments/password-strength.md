# Password Strength

## Overview

The Password Strength fragment provides an enhanced password input field for forms. It includes real-time feedback on password complexity through a visual strength meter and a checklist of configurable requirements (e.g., length, uppercase, numbers, special characters). It also optionally includes a toggle button to reveal or hide the password text.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Placeholder** (`placeholder`): Text displayed when the input is empty. Default is empty.
- **Minimum Length** (`minLength`): Minimum number of characters required for the password. Default is `8`.
- **Require Uppercase** (`requireUppercase`): Boolean to enforce at least one uppercase letter. Default is `true`.
- **Require Number** (`requireNumber`): Boolean to enforce at least one numeric digit. Default is `true`.
- **Require Special** (`requireSpecial`): Boolean to enforce at least one special character. Default is `true`.
- **Show Strength Meter** (`showStrengthMeter`): Boolean to display the visual progress bar and "Weak/Medium/Strong" label. Default is `true`.
- **Enable Toggle Visibility** (`enableToggleVisibility`): Boolean to display an eye icon button that reveals or hides the password. Default is `true`.

## Usage & Behavior

- **Real-time Validation**: As the user types, the password string is validated against the enabled requirements using regular expressions.
- **Visual Feedback**:
  - **Requirements List**: Each requirement (e.g., "At least 8 characters") is visually marked as met (`met` class) or unmet (`unmet` class).
  - **Strength Bar**: The progress bar fills up proportionally based on the number of met requirements, changing color from red (Weak) to yellow (Medium) to green (Strong).
- **Visibility Toggle**: Clicking the eye icon switches the input type between `password` and `text`, updating the icon respectively.
- **Read-Only Mode**: Input is marked as readonly if configured.
- **Edit Mode**: In the Liferay page editor (`layoutMode === 'edit'`), the input and toggle button are disabled.

## Dependencies

- **JavaScript**: Manages the `input` event to calculate the strength score (`checkRequirements`), updates the visual progress bar (`updateStrengthBar`), handles the visibility toggle logic, and triggers Liferay form change events.
- **FreeMarker**: Conditionally renders the strength meter, requirement checklist, and visibility toggle based on the `configuration` object. Applies Liferay localization strings (e.g., `at-least-x-characters`).
- **CSS**: Uses Bootstrap/Clay classes (`progress`, `progress-bar`, `input-group`) and assumes custom CSS in `index.css` for styling `.met` and `.unmet` requirement states.
