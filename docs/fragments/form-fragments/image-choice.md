# Image Choice

## Overview

The Image Choice fragment provides a visual alternative to standard radio buttons or checkboxes. It allows users to select one or multiple options by clicking on images arranged in a grid, making forms more engaging and easier to use on touch devices.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Options JSON** (`optionsJSON`): A JSON array defining the selectable options. Each object should have a `label`, `value`, and `imageUrl`. Default is `[]`.
- **Grid Columns** (`gridColumns`): The number of columns in the image grid. Default is `3`.
- **Image Size** (`imageSize`): Predefined size for the images (`sm`, `nm` for normal, `lg`). Default is `nm`.
- **Selection Type** (`selectionType`): Determines if single (`radio`) or multiple (`checkbox`) selections are allowed. Default is `radio`.

## Usage & Behavior

- **Visual Selection**: Users interact with image cards instead of native inputs. The selected state is visually highlighted via CSS based on the hidden input's `:checked` pseudo-class.
- **Dynamic Grid**: The grid layout adapts based on the `gridColumns` configuration using CSS variables (`--grid-columns`).
- **Fallback**: If no valid options are provided in `optionsJSON`, an informational alert is displayed instructing the user to configure the options.
- **Read-Only Mode**: Inputs are disabled when the form is in read-only mode.
- **Edit Mode**: In the Liferay page editor (`layoutMode === 'edit'`), inputs are disabled.

## Dependencies

- **JavaScript**: Minimal JavaScript is used. It disables inputs in edit mode and attaches a change event listener to ensure Liferay's dynamic form events propagate correctly.
- **FreeMarker**: Processes the `optionsJSON`, maps it to the HTML structure, assigns the appropriate input type (radio or checkbox), and handles error/help text display.
- **CSS**: Custom CSS (assumed in `index.css`) handles the grid layout, image sizing, and visual states for the selected cards.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
