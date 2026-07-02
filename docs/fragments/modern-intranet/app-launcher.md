# App Launcher

## Overview

The App Launcher fragment provides a grid of quick links to various applications or tools, resembling a typical "App Drawer" or "My Applications" dashboard widget. It is designed for intranet scenarios to give users immediate access to frequently used external or internal tools.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Title** (`title`): The heading displayed above the application grid. Default is "My Applications".
- **App 1 to App 6**: The fragment supports configuring up to 6 distinct applications. Each application has the following options:
  - **App Name** (`appName[1-6]`): The label displayed below the application icon (e.g., "Slack", "Figma").
  - **App Icon** (`appIcon[1-6]`): The name of the Lexicon/Clay icon to display for the application.
  - **App URL** (`appURL[1-6]`): The URL path the user is navigated to when the application is clicked.

## Usage & Behavior

- **Grid Layout**: Displays a responsive grid of applications configured by the user.
- **Dynamic Rendering**: Iterates through the 6 configured applications. If an `appName` is left blank, that specific app slot is not rendered.
- **Icons**: Uses Liferay's Lexicon SVG spritemap (`${siteSpritemap}`) to render the icons based on the configured `appIcon` string.
- **Edit Link**: A mock "Edit" link is displayed in the header next to the title (localized).

## Dependencies

- **FreeMarker**: Iterates (`[#list 1..6 as i]`) dynamically over the configuration keys (e.g., `configuration["appName${i}"]`) to generate the HTML for each application slot. Resolves the `siteSpritemap` variable for SVG icons.
- **CSS**: Assumes custom CSS (in `index.css`) for the grid layout (`.app-launcher-grid`), icon sizing (`.app-launcher-icon-container`), and typography (`.app-launcher-name`). No custom JavaScript is required for this component.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
