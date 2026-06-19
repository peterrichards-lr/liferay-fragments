# AI Commerce Accelerator Sign In

## Overview

The **AI Commerce Accelerator Sign In** fragment is a lightweight utility that provides a streamlined Sign In / Sign Out button logic and displays the user's first name when authenticated.

## Configuration Options

This fragment does not require any custom `configuration.json` properties. It leverages standard Liferay runtime APIs.

## Usage/Behavior

- **Dynamic Authentication Status**: Uses FreeMarker to check if `themeDisplay.isSignedIn()` is true.
- **Signed In View**: Displays "Hello, {FirstName}" text alongside a responsive "Sign Out" button directing to `themeDisplay.getURLSignOut()`.
- **Signed Out View**: Displays a primary "Sign In" button directing to `themeDisplay.getURLSignIn()` or falling back to `/c/portal/login`.
- **Layout**: Horizontally aligned to the right, heavily utilizing Liferay/Bootstrap utility classes (`d-flex`, `align-items-center`, `justify-content-end`).

## Dependencies

### Javascript

- None.

### CSS

- None natively required (`fragment.css`), relies entirely on Liferay standard utility classes like `text-muted`, `font-weight-semi-bold`, `btn`, `btn-primary`, etc.
