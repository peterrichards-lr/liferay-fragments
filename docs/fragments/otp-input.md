# OTP - Verification Code

## Overview

The OTP (One-Time Password) - Verification Code fragment provides a multi-box input interface typically used for two-factor authentication (2FA) or verification codes. It separates the input into distinct boxes for each character, enhancing readability and user experience.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Number of Boxes** (`numberOfBoxes`): The number of character boxes to generate. Default is `6`.
- **Box Size** (`boxSize`): The width and height of each individual input box (e.g., `3rem`).
- **OTP Type** (`otpType`): Restricts input to either numeric (`number`) or alphanumeric (`text`). Default is `number`.
- **Auto Focus** (`autoFocus`): If true, automatically focuses the first input box on page load. Default is `true`.

## Usage & Behavior

- **Multi-Box Interface**: Characters are entered individually into separate boxes.
- **Auto-Advance**: Typing a character automatically moves focus to the next box.
- **Keyboard Navigation**: Users can use the `ArrowLeft`, `ArrowRight`, and `Backspace` keys to navigate seamlessly between boxes.
- **Paste Support**: Pasting a string (e.g., a copied code) will automatically distribute the characters across the boxes.
- **Hidden Form Input**: A hidden input field aggregates the value from all boxes and submits it with the form data.
- **Hydration**: Re-populates the boxes if a value already exists in the hidden input (e.g., after a validation error reload).
- **Edit Mode**: In the Liferay page editor (`layoutMode === 'edit'`), inputs are disabled to prevent accidental interaction.

## Dependencies

- **JavaScript**: Manages auto-advance on input, keyboard navigation (left/right/backspace), paste event interception and distribution, and synchronizes the individual box values into the hidden input.
- **FreeMarker**: Dynamically iterates over the `boxCount` to generate the correct number of input elements. Applies CSS variables (`--box-size`) dynamically.
- **CSS**: Uses standard Bootstrap/Clay classes (`d-flex gap-2`, `form-control`) alongside custom styling (assumed in `index.css`) for the box sizes and alignment.
