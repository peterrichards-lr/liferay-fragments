# Tracker Fragments

A collection of fragments designed to build visual indicators for multi-step processes or user journeys.

## Tracker Container

A foundational fragment that provides a scoped container (`.tracker`) for organizing multiple tracker steps. It includes a drop zone where individual `Tracker Step` fragments can be placed.

## Tracker Step

A specialized fragment representing a single milestone or stage within a process.

- **Configurable States**: Each step can be assigned a state (e.g., `Complete`, `Active`, `Pending`) which triggers specific visual styling.
- **Directional Indicators**: Supports optional left and right arrow indicators, making it suitable for both linear and branching paths.
- **Editable Content**: Includes an editable text field for the step's label or description.
- **Visual Styles**: Fully integrated with the Meridian theme, providing a modern and accessible look and feel.

### Usage

1. Add the `Tracker Container` to a page.
2. Place multiple `Tracker Step` fragments into the container's drop zone.
3. Configure the state and labels for each step to reflect the current stage of the process.
