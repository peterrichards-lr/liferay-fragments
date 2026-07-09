# Welcome Banner

## Overview

The **Welcome Banner** provides a personalized greeting designed for the modern intranet homepage. It features a customizable background image, primary and secondary text, and up to three quick-action buttons.

## Configuration Options

The fragment is grouped into two main fieldsets:

**Data**
| Name | Type | Default | Description |
|-------------------|----------------|---------|----------------------------------------------------------|
| `backgroundImage` | `itemSelector` | (Empty) | The high-resolution image to show behind the welcome text. |
| `title` | `text` | `Welcome back, John` | The personalized main greeting text. |
| `subtext` | `text` | `Here's what's happening in your workspace today.` | Descriptive secondary text shown below the title. |

**Quick Actions**
| Name | Type | Default | Description |
|----------------|----------|---------|----------------------------------------------------------|
| `button1Label` | `text` | (Empty) | Label for the first primary quick action button. |
| `button1URL` | `url` | (Empty) | URL for the first primary quick action. |
| `button2Label` | `text` | (Empty) | Label for the second primary quick action button. |
| `button2URL` | `url` | (Empty) | URL for the second primary quick action. |
| `button3Label` | `text` | (Empty) | Label for the third primary quick action button. |
| `button3URL` | `url` | (Empty) | URL for the third primary quick action. |

## Usage/Behavior

- **Dynamic Background**: The `backgroundImage` configuration is injected via an inline style (`--background-image: url(...)`) which CSS utilizes alongside a linear-gradient dark overlay to ensure text readability.
- **Conditional Actions**: Quick action buttons are dynamically rendered based on the presence of their respective labels. If a label is not configured, the button is omitted from the layout.
- **Responsive Layout**: On desktop screens, text is left-aligned while action buttons are right-aligned. On mobile devices, text is centered, and action buttons span the full width and stack vertically.

## Dependencies

### Javascript

- None

### CSS

- **Theming**: Employs CSS custom properties like `var(--primary)` and `var(--h1-font-size)`.
- **Background Handling**: Uses a clever `linear-gradient` over the mapped `var(--background-image)` directly in the `.welcome-banner` class to ensure white text remains legible regardless of the background image chosen.
- **Responsive Handling**: Includes a media query (`max-width: 767.98px`) to optimize the banner text alignment and button sizing for mobile viewing.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
