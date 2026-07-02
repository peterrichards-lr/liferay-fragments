# Stat Card

## Overview

The **Stat Card** fragment is a numeric metric display used within the modern intranet. It presents a key metric along with its title and a trend indicator to show growth or decline.

## Configuration Options

The fragment can be configured via standard Liferay fragment configuration properties:

| Name    | Type   | Default          | Description                                               |
| ------- | ------ | ---------------- | --------------------------------------------------------- |
| `title` | `text` | `Open Positions` | The label describing this specific metric.                |
| `value` | `text` | `22`             | The main numerical value to display.                      |
| `trend` | `text` | (Empty)          | A short indicator showing growth or decline (e.g. +5.2%). |

## Usage/Behavior

- **Layout**: Displays a simple, elevated card format. The title appears at the top (in uppercase), followed by the main value and an optional trend indicator displayed side-by-side.
- **Conditional Trend**: The trend indicator (e.g., `+5%` or `-2%`) is only rendered if the `trend` configuration field is populated.

## Dependencies

### Javascript

- None

### CSS

- **Design Tokens**: Relies on modern CSS variables like `var(--white)`, `var(--gray-200)`, `var(--secondary)`, and `var(--success)` for styling.
- **Flexbox Layout**: Uses Flexbox to align the value and trend indicator appropriately across varying container widths.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
