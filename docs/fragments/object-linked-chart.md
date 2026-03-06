# Object-Linked Chart

Data visualization fragment that integrates Chart.js to render Liferay Object data.

## Features

- **Multiple Types**: Support for Bar, Line, Pie, and Doughnut charts.
- **Dynamic Grouping & Aggregation**: Automatically group records by a label field and calculate **Sum**, **Average**, or **Count** for numeric values.
- **Multi-Field Support**: Plot multiple numeric fields (e.g., Revenue vs. Units Sold) in a single chart.
- **Dynamic Mapping**: Map X-axis labels and Y-axis values to specific Object fields.
- **Accessibility**: Automatically generates a visually-hidden HTML table fallback for screen readers.
- **Meridian Integration**: Defaults to theme colors for data series.

## Configuration

- **Object ERC**: The External Reference Code of the source Object.
- **Label Field**: The field used for the X-axis or category labels.
- **Value Fields**: Comma-separated list of numeric fields to plot.
- **Aggregation Type**: Choose how to summarize data (None, Sum, Average, Count).
- **Chart Title**: Heading displayed above the chart.
- **Chart Type**: Select the visualization style.
- **Border Filter**: CSS filter for data series borders (e.g., `brightness(85%)`).

## Showcase Data: Sales Report

The repository includes a `SALES_REPORT` object definition designed specifically to showcase multi-value and aggregation capabilities.

### Recommended Configuration:

- **Object ERC**: `SALES_REPORT`
- **Label Field**: `salesRegion`
- **Value Fields**: `revenue,unitsSold`
- **Aggregation Type**: `Sum` (for total performance) or `Average` (for efficiency)
- **Chart Title**: `Regional Sales Performance`
