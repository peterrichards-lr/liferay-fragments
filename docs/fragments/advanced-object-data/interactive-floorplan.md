# Interactive Floorplan

## Overview

The Interactive Floorplan fragment allows you to display a map, diagram, or floorplan image and overlay interactive data points (pins). The pins are retrieved from and saved directly to a Liferay Object definition.

## Configuration

- **Background Image**: The URL of the background image to use for the floorplan.
- **Liferay Object ERC**: The External Reference Code of the Liferay Object where pin data is stored (must contain `title`, `description`, `x_coord`, and `y_coord` fields).
- **Allow Creation**: A toggle to permit users to click the map to drop new pins.

## Usage

Provide the necessary Liferay Object ERC in the configuration. When configured and permissioned correctly, users can click anywhere on the background image to open a modal that captures details and saves a new pin at that specific location.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-10_ | _Last Reviewed: 2026-07-10_
