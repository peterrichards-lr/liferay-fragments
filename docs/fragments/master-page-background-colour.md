# Master Page Utilities

Specialized fragments designed to modify the global look and feel of Liferay Master Pages.

## Master Page Background Colour

This utility fragment allows administrators to dynamically set the background color of the main content area (`#main-content`) on a Liferay page.

- **Dynamic Coloring**: Supports selecting a color via a color picker or using CSS variables (e.g., `var(--primary)`).
- **Tinting**: Applies a configurable tint factor (30%, 50%, or 70%) to the selected color to ensure appropriate contrast and aesthetics.
- **Layout Adjustment**: Automatically adds standard Liferay container classes (`container-fluid`, `container-fluid-max-xl`) to the main content area if they are missing, ensuring a consistent responsive layout.
- **Debug Mode**: Includes optional debug logging to the browser console for troubleshooting color and property resolutions.

### Usage

This fragment is intended to be placed on a **Master Page**. Once added, it will affect all pages that utilize that master page, providing a consistent background theme across the entire site or section.
