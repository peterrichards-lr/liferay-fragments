# Data Grid with Inline Editing

## Overview

The Data Grid with Inline Editing fragment utilizes Tabulator to render an interactive table that binds directly to a Liferay Object via Headless REST APIs. It supports viewing records and patching updates seamlessly.

## Configuration

- **Liferay Object ERC**: The External Reference Code of the Liferay Object (e.g., `MAP_PIN`).
- **Columns**: A comma-separated list of the object fields to display in the grid (e.g., `id,title,description`).
- **Enable Inline Editing**: A toggle to allow users to click into cells and modify their values. Edited values are automatically saved to the Liferay Object.

## Usage

Simply drop the fragment onto a page and configure the target Liferay Object ERC. Ensure the viewing user has the necessary permissions to read and update the specified object definition.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-10_ | _Last Reviewed: 2026-07-10_
