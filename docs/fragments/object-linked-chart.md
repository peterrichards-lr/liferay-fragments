# Object-Linked Chart

Data visualization fragment that integrates Chart.js to render Liferay Object data.

## Features

- **Multiple Types**: Support for Bar, Line, Pie, Doughnut, **Radar**, and **Polar Area** charts.
- **Dynamic Grouping & Aggregation**: Automatically group records by a label field and calculate **Sum**, **Average**, or **Count** for numeric values.
- **Dual-Axis Support**: Introducing a secondary Y-axis for comparing two value sets with different scales (e.g., Revenue vs. Units Sold).
- **Theme-Integrated Palettes**: Predefined color themes (**Rainbow**, **Cool**, **Warm**) that dynamically reference Meridian's CSS variables (`var(--red)`, `var(--blue)`, etc.).
- **Advanced Sorting**: Sort categories alphabetically or by value (ascending/descending).
- **Localized Labels**: Automatically uses human-readable labels from the Object field definitions for legends and tooltips.
- **Accessibility**: Automatically generates a visually-hidden HTML table fallback for screen readers.
- **Smart Defaults**: Automatic color mapping based on data structure (category-based for single series, series-based for multiple).
- **Mappable Axis Labels**: Customize X, Y, and Secondary Y axis labels directly in the Page Editor.

## Configuration

- **Object ERC**: The External Reference Code of the source Object.
- **Label Field**: The field used for the X-axis or category labels.
- **Value Fields**: Comma-separated list of numeric fields to plot.
- **Aggregation Type**: Choose how to summarize data (None, Sum, Average, Count).
- **Data Sort Order**: Choose how categories on the X-axis should be sorted.
- **Chart Title**: Heading displayed above the chart (mappable/editable).
- **Chart Type**: Select the visualization style.
- **Show Legend**: Toggle visibility of the data series legend.
- **Enable Secondary Y-Axis**: Map second+ series to a right-hand vertical axis.
- **Color Mapping**: Switch between category-based or series-based coloring.
- **Color Palette**: Select a theme that matches your site's branding.

## Editor Ergonomics

In the Page Editor, the **X-Axis Label**, **Y-Axis Label**, and **Secondary Y-Axis Label** configuration fields are displayed in a styled container (`.meta-editor-mappable-fields`) at the bottom of the fragment. This allows editors to map dynamic text or manually override labels directly within the fragment body.

## Showcase Data: Sales Report

The repository includes a `SALES_REPORT` object definition designed specifically to showcase multi-value and aggregation capabilities.

### Recommended Configuration:

- **Object ERC**: `SALES_REPORT`
- **Label Field**: `salesRegion`
- **Value Fields**: `revenue,unitsSold`
- **Aggregation Type**: `Sum`
- **Enable Secondary Y-Axis**: `Checked`
- **Chart Title**: `Regional Sales Performance`
