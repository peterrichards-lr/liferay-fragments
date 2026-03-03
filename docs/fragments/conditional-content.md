# Conditional Content

This fragment allows you to define multiple drop zones based on a list of "outcomes" (e.g., approved, declined). It is designed to show or hide content dynamically based on the value of a mapped field.

## Features

- **Dynamic Drop Zones**: Define a comma-separated list of outcomes in the configuration to generate corresponding drop zones.
- **Data-Driven Visibility**: The fragment uses an editable text field (intended to be mapped to a data source, like an Object field) to determine which outcome's drop zone should be visible.
- **Editor Mode**: An option to "Display Drop Zones" in the configuration allows all zones to be visible during page editing for easier content placement.

## Configuration

- **Outcomes**: A comma-separated list of potential values (e.g., `approved,declined,pending`).
- **Display Drop Zones**: A checkbox to force all drop zones to be visible in the page editor.

## Usage

1. Add the fragment to a page.
2. In the configuration, specify the list of outcomes.
3. Map the "outcome-value" editable text field to a data source that will provide the current status/outcome.
4. Place different fragments into the corresponding drop zones for each outcome.
5. In the Page Editor, you may need to check "Display Drop Zones" to see and populate all the zones.
