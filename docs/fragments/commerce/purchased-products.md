# Purchased Products

The **Purchased Products** fragment displays a grid or list of commerce items
previously purchased by the currently logged-in user.

## Key Features

- **Commerce Integration**: Seamlessly connects to Liferay Commerce delivery
  APIs.
- **Context Aware**: Automatically filters by the user's account and channel
  context.
- **Empty State Handling**: Configurable message when no previous purchases are
  found.
- **Responsive Grid**: Displays products in a clean, modern layout using
  Meridian CSS tokens.

## Configuration

- **Empty Message**: Localized text shown if the user has no purchase history.
- **Display Style**: Choose between simple text or rich product cards.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`validation.js`**: Uses `isValidIdentifier` to safely handle account and
  channel identifiers from the commerce context.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
