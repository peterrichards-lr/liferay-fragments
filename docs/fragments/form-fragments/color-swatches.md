# Color Swatches

## Overview

The `color-swatches` fragment provides a visual selection of colors within form layouts. It displays a defined list of colors as selectable swatches (circles or squares) rather than a traditional dropdown or radio list.

## Configuration

Options available in `configuration.json`:

- **swatchesJSON** (text): A comma-separated list of colors (e.g., `#000000,#FFFFFF,#0B5FFF,#FFD500,#DA1414,#28A745`).
- **swatchShape** (select): The shape of the swatches (`circle` or `square`).
- **swatchSize** (select): The size of the swatches (`sm`, `nm`, `lg`).
- **showValue** (checkbox): Toggle whether the value of the selected color should be shown.

## Usage & Behavior

The colors are derived from the `swatchesJSON` configuration field. Selecting a swatch visually highlights it and stores the corresponding value so it can be passed through Liferay's form submission workflow. (Ensures boolean checkboxes define a `dataType: "boolean"` as per Mandatory Rules).

## Dependencies

- Native Liferay form APIs and standard Clay component styling.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
