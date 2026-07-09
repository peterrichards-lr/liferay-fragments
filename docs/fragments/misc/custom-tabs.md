# Custom Tabs

The **Custom Tabs** fragment provides a flexible, highly interactive tabbed container layout. It allows content creators to organize layout areas under separate tabs to maximize screen real estate and improve page aesthetics.

## Overview

- **Dynamic Number of Tabs**: Supports up to 10 dynamically configurable tabs via the fragment configuration.
- **Embedded Drop Zones**: Each tab exposes a native Liferay layout drop zone (`lfr-drop-zone`) allowing content editors to drag and drop arbitrary fragments (like rich text, images, or widgets) inside them.
- **Accessible Design**: Keyboard accessibility with support for Arrow keys, Home, End, and focus state indicators.
- **State Persistence**: Optionally persists the active tab in `SessionStorage` so that the user's active tab is maintained across page refreshes.

## Configuration

The fragment can be configured using the following configuration options:

- **Number of Tabs** (`numberOfTabs`): The number of active tabs to display (1 to 10). Excess tabs are hidden using FreeMarker conditions. Defaults to `4`.
- **Persist Selected Tab** (`persistSelectedTab`): If checked (true), the selected tab index is stored in the browser session storage. When the user returns to the page, the last selected tab is automatically reopened. Defaults to `true`.

## Usage & Placement

1. Place the **Custom Tabs** fragment onto a content page.
2. In the configuration panel, specify the number of tabs (e.g., `3`).
3. Click directly on each tab header to edit its label text (e.g., "Overview", "Specifications", "Support").
4. Drag and drop any desired fragments or widgets into the corresponding tab panel drop zones (e.g. drop a rich-text block or an image card inside the active panel area).

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
